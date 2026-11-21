import { BughouseMove, PlayerColor, ReservePiece } from "../engine/types";
import { SingleBoard } from "../engine/singleBoard";
import { BUGHOUSE_PIECE_VALUES } from "../engine/evaluation";
import { Square } from "chess.js";

const GOOD_OPENING_MOVES = new Set([
  // White central & development
  "e4", "d4", "Nf3", "Nc3", "Bc4", "Bb5", "Be2", "d3", "e3", "c4", "O-O",
  // Black central & development
  "e5", "d5", "c5", "e6", "c6", "Nf6", "Nc6", "Bc5", "Bb4", "Be7", "O-O"
]);

const BAD_EDGE_MOVES = new Set([
  "h3", "a3", "h4", "a4", "Nh3", "Na3", "g4", "f3",
  "h6", "a6", "h5", "a5", "Nh6", "Na6", "g5", "f6"
]);

/**
 * Calculates PUCT prior probabilities P(s, a) for all legal actions.
 * Normalized so sum(P) = 1.
 * 
 * Prevents suicide "spite checks" and blunders:
 * - Drops on attacked, undefended squares receive near-zero prior (0.005).
 * - Queen drops into enemy fire receive near-zero prior unless checkmate (#).
 * - Safe, unanswerable checks and central outposts receive high priority.
 */
export function calculateMovePriors(
  board: SingleBoard,
  legalMoves: BughouseMove[]
): Map<BughouseMove, number> {
  const priors = new Map<BughouseMove, number>();
  if (legalMoves.length === 0) return priors;

  let totalWeight = 0;
  const weights: number[] = [];
  const currentTurn = board.turn();
  const opponentColor: PlayerColor = currentTurn === "w" ? "b" : "w";

  for (const move of legalMoves) {
    let weight = 1.0;
    const san = move.san || "";
    const isMate = san.includes("#");
    const isCheck = san.includes("+");

    if (move.type === "standard") {
      // 1. Instant Checkmate
      if (isMate) {
        weight += 100.0;
      }

      // 2. Tactical Captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
      if (move.captured) {
        const victimVal = BUGHOUSE_PIECE_VALUES[move.captured as keyof typeof BUGHOUSE_PIECE_VALUES] || 100;
        const attackerPiece = board.chess.get(move.from);
        const attackerVal = attackerPiece
          ? BUGHOUSE_PIECE_VALUES[attackerPiece.type as keyof typeof BUGHOUSE_PIECE_VALUES] || 100
          : 100;

        // Captures gain huge prior weight
        weight += 3.5 + (victimVal - attackerVal * 0.4) / 100;
      }

      // 3. Sound Opening Development
      if (GOOD_OPENING_MOVES.has(san)) {
        weight += 4.5;
      } else if (BAD_EDGE_MOVES.has(san)) {
        weight *= 0.05; // Heavily suppress edge moves like h3/a3/Nh3
      }

      // 4. Checks (Must NOT hang the checking piece!)
      if (isCheck && !isMate) {
        const toAttacked = board.chess.isAttacked(move.to, opponentColor);
        const toDefended = board.chess.isAttacked(move.to, currentTurn);

        if (toAttacked && !toDefended) {
          // Suicide check: piece moves to attacked undefended square!
          weight *= 0.05;
        } else if (!toAttacked) {
          // Safe, sound check!
          weight += 4.0;
        } else {
          // Attacked and defended check
          weight += 1.5;
        }
      }

      // 5. Castling King Safety
      if (san === "O-O" || san === "O-O-O") {
        weight += 4.0;
      }
    } else {
      // -------------------------------------------------------------
      // PIECE DROP EVALUATION (CRITICAL: PREVENTS SUICIDE DROP CHECKS)
      // -------------------------------------------------------------
      if (isMate) {
        // Drop mate is an instant win!
        weight = 120.0;
      } else {
        const dropSq = move.to;
        const isAttackedByEnemy = board.chess.isAttacked(dropSq, opponentColor);
        const isDefendedByFriendly = board.chess.isAttacked(dropSq, currentTurn);
        const piece = move.piece;

        // Rule A: Suicide Drop Check / Hanging Drop
        // Dropping a major or minor piece on an undefended square that the opponent attacks
        // gives the opponent a free piece on the very next move!
        if (isAttackedByEnemy && !isDefendedByFriendly) {
          if (piece === "q" || piece === "r" || piece === "n" || piece === "b") {
            // Heavily suppress hanging pieces so MCTS will never throw away pieces for spite checks
            weight = 0.005;
          } else {
            // Pawn drop on attacked undefended square
            weight = isCheck ? 0.15 : 0.05;
          }
        }
        // Rule B: Queen or Rook dropped into enemy fire
        // Even if defended, enemy can trade a minor piece or pawn for your Queen/Rook!
        else if (isAttackedByEnemy && (piece === "q" || piece === "r")) {
          weight = 0.05;
        }
        // Rule C: Safe, Unanswerable Drop Check
        // The opponent cannot capture the checking piece!
        else if (isCheck && !isAttackedByEnemy) {
          weight = 8.0; // High priority for true, punishing checks
        }
        // Rule D: Defended Knight / Pawn Drop Check
        else if (isCheck && isDefendedByFriendly) {
          weight = piece === "n" || piece === "p" ? 4.5 : 1.5;
        }
        // Rule E: Safe Outpost & Center Control Drops
        else if (!isAttackedByEnemy) {
          weight = 3.0;
          const file = dropSq[0];
          const rank = parseInt(dropSq[1], 10);
          // Center squares (c3..f6)
          if (file >= "c" && file <= "f" && rank >= 3 && rank <= 6) {
            weight += (piece === "n" || piece === "p") ? 3.5 : 2.0;
          }
        }
        // Rule F: Attacked but defended minor piece
        else {
          weight = 0.4;
        }
      }
    }

    weights.push(Math.max(weight, 0.001));
    totalWeight += Math.max(weight, 0.001);
  }

  // Normalize
  for (let i = 0; i < legalMoves.length; i++) {
    priors.set(legalMoves[i], weights[i] / totalWeight);
  }

  return priors;
}
