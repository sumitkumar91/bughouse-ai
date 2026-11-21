import { SingleBoard } from "../engine/singleBoard";
import { BughouseMove, PlayerColor } from "../engine/types";
import { BUGHOUSE_PIECE_VALUES } from "../engine/evaluation";

/**
 * Baseline 1: Pure Uniform Random Rollout
 */
export function selectRandomMove(legalMoves: BughouseMove[]): BughouseMove {
  const index = Math.floor(Math.random() * legalMoves.length);
  return legalMoves[index];
}

/**
 * Baseline 2: Heuristic-Guided Rollout
 * Evaluates candidate moves with lightweight tactical rules:
 * - Drops near enemy king (safe): +++
 * - Capturing enemy hanging pieces: +++
 * - Refuting enemy checks: +++
 * - Suicide drops into enemy fire: heavily penalized (---)
 * - Random exploration factor (epsilon-greedy) to preserve Monte Carlo diversity
 */
export function selectHeuristicMove(
  board: SingleBoard,
  legalMoves: BughouseMove[],
  epsilon: number = 0.15
): BughouseMove {
  if (legalMoves.length === 0) {
    throw new Error("No legal moves available for rollout");
  }

  // Epsilon chance to pick random move to prevent deterministic collapse
  if (Math.random() < epsilon) {
    return selectRandomMove(legalMoves);
  }

  const currentTurn = board.turn();
  const enemyColor: PlayerColor = currentTurn === "w" ? "b" : "w";
  const inCheck = board.inCheck();

  let bestScore = -Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    let score = 0;
    const san = move.san || "";

    if (move.type === "standard") {
      // 1. Instant checkmate
      if (san.includes("#")) {
        score += 300;
      }

      // 2. Captures
      if (move.captured) {
        const victimValue = BUGHOUSE_PIECE_VALUES[move.captured as keyof typeof BUGHOUSE_PIECE_VALUES] || 100;
        const attackerPiece = board.chess.get(move.from);
        const attackerValue = attackerPiece && attackerPiece.type in BUGHOUSE_PIECE_VALUES
          ? BUGHOUSE_PIECE_VALUES[attackerPiece.type as keyof typeof BUGHOUSE_PIECE_VALUES]
          : 50;

        // Favorable trade or free piece
        score += (victimValue * 2 - attackerValue * 0.4) / 50;

        // If in check and this capture eliminates the checking piece, huge bonus!
        if (inCheck) {
          score += 150;
        }
      }

      // 3. Sound check (only if not hanging)
      if (san.includes("+")) {
        const toAttacked = board.chess.isAttacked(move.to, enemyColor);
        const toDefended = board.chess.isAttacked(move.to, currentTurn);
        if (toAttacked && !toDefended) {
          score -= 30; // Hanging check penalty
        } else {
          score += 6;
        }
      }
    } else {
      // Drop move
      if (san.includes("#")) {
        score += 300; // Checkmate drop
      } else {
        const dropSq = move.to;
        const isAttacked = board.chess.isAttacked(dropSq, enemyColor);
        const isDefended = board.chess.isAttacked(dropSq, currentTurn);

        // Suicide drop check / hanging drop penalty
        if (isAttacked && !isDefended) {
          score -= 80; // Severe penalty for throwing pieces away
        } else if (isAttacked && (move.piece === "q" || move.piece === "r")) {
          score -= 40; // Trading Queen/Rook into enemy fire
        } else {
          // Safe drop
          score += 3.0;

          if (san.includes("+") && !isAttacked) {
            score += 15.0; // Safe, forcing check
          }

          if (move.piece === "n" || move.piece === "p") {
            score += 2.0;
          }

          const file = dropSq[0];
          const rank = parseInt(dropSq[1], 10);
          if (file >= "c" && file <= "f" && rank >= 3 && rank <= 6) {
            score += 2.0;
          }
        }
      }
    }

    // Small jitter to break ties
    score += Math.random() * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
