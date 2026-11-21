import { Chess, Square, PieceSymbol } from "chess.js";
import { BughouseMove, DropMove, PlayerColor, Reserve, ReservePiece, StandardMove } from "./types";

const ALL_SQUARES: Square[] = [];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];
for (const r of RANKS) {
  for (const f of FILES) {
    ALL_SQUARES.push(`${f}${r}` as Square);
  }
}

function checkDropGivesCheck(chess: Chess, piece: ReservePiece, dropSq: Square, color: PlayerColor): boolean {
  const oppColor = color === "w" ? "b" : "w";
  let kingSq: Square | null = null;
  for (const sq of ALL_SQUARES) {
    const p = chess.get(sq);
    if (p && p.type === "k" && p.color === oppColor) {
      kingSq = sq;
      break;
    }
  }
  if (!kingSq) return false;

  const kf = kingSq.charCodeAt(0) - 97;
  const kr = parseInt(kingSq[1], 10);
  const df = dropSq.charCodeAt(0) - 97;
  const dr = parseInt(dropSq[1], 10);

  const deltaF = Math.abs(kf - df);
  const deltaR = Math.abs(kr - dr);

  if (piece === "n") {
    return (deltaF === 1 && deltaR === 2) || (deltaF === 2 && deltaR === 1);
  }
  if (piece === "p") {
    return color === "w" ? deltaF === 1 && kr - dr === 1 : deltaF === 1 && dr - kr === 1;
  }

  const isOrthogonal = (deltaF === 0 && deltaR > 0) || (deltaR === 0 && deltaF > 0);
  const isDiagonal = deltaF === deltaR && deltaF > 0;

  if (piece === "r" && !isOrthogonal) return false;
  if (piece === "b" && !isDiagonal) return false;
  if (piece === "q" && !isOrthogonal && !isDiagonal) return false;

  const stepF = deltaF === 0 ? 0 : kf > df ? 1 : -1;
  const stepR = deltaR === 0 ? 0 : kr > dr ? 1 : -1;
  let curF = df + stepF;
  let curR = dr + stepR;
  while (curF !== kf || curR !== kr) {
    if (chess.get(`${FILES[curF]}${curR}` as Square)) return false;
    curF += stepF;
    curR += stepR;
  }
  return true;
}

export class SingleBoard {
  public chess: Chess;
  public promotedSquares: Set<Square>;

  constructor(fen?: string, promotedSquares?: Set<Square>) {
    this.chess = new Chess(fen);
    this.promotedSquares = new Set(promotedSquares || []);
  }

  public clone(): SingleBoard {
    return new SingleBoard(this.chess.fen(), new Set(this.promotedSquares));
  }

  public turn(): PlayerColor {
    return this.chess.turn() as PlayerColor;
  }

  public fen(): string {
    return this.chess.fen();
  }

  public inCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Generates all legal moves for the current player on this board,
   * including both standard chess moves and legal piece drops from the player's reserve.
   */
  public getLegalMoves(reserve: Reserve): BughouseMove[] {
    const legalMoves: BughouseMove[] = [];
    const color = this.turn();

    // 1. Standard chess moves
    const standardMoves = this.chess.moves({ verbose: true });
    for (const m of standardMoves) {
      legalMoves.push({
        type: "standard",
        from: m.from,
        to: m.to,
        promotion: (m.promotion as ReservePiece) || undefined,
        san: m.san,
        captured: m.captured,
      });
    }

    // 2. Piece Drop moves
    // Drops can be made on any EMPTY square, provided:
    // - Pawns cannot be placed on rank 1 or 8.
    // - If player is currently in check, the drop must interpose and block the check.
    // - (If not in check, placing a friendly piece on an empty square can never expose own king).
    const availablePieces: ReservePiece[] = [];
    (Object.keys(reserve) as ReservePiece[]).forEach((p) => {
      if (reserve[p] > 0) availablePieces.push(p);
    });

    if (availablePieces.length === 0) {
      return legalMoves;
    }

    // Find all empty squares
    const emptySquares: Square[] = [];
    for (const sq of ALL_SQUARES) {
      if (!this.chess.get(sq)) {
        emptySquares.push(sq);
      }
    }

    const currentlyInCheck = this.chess.inCheck();
    const originalFen = currentlyInCheck ? this.chess.fen() : null;

    for (const piece of availablePieces) {
      for (const sq of emptySquares) {
        // Pawn restrictions: rank 1 and 8 forbidden
        if (piece === "p" && (sq.endsWith("1") || sq.endsWith("8"))) {
          continue;
        }

        if (currentlyInCheck) {
          // If currently in check, test if the drop blocks the check
          this.chess.put({ type: piece as PieceSymbol, color }, sq);
          const blocksCheck = !this.chess.inCheck();
          this.chess.remove(sq);

          if (blocksCheck) {
            const givesCheck = checkDropGivesCheck(this.chess, piece, sq, color);
            legalMoves.push({
              type: "drop",
              piece,
              to: sq,
              san: `${piece.toUpperCase()}@${sq}${givesCheck ? "+" : ""}`,
            });
          }
        } else {
          // Not in check: any empty square is valid
          const givesCheck = checkDropGivesCheck(this.chess, piece, sq, color);
          legalMoves.push({
            type: "drop",
            piece,
            to: sq,
            san: `${piece.toUpperCase()}@${sq}${givesCheck ? "+" : ""}`,
          });
        }
      }
    }

    // Restore FEN if we did inCheck testing to preserve en passant flags
    if (originalFen) {
      this.chess.load(originalFen);
    }

    return legalMoves;
  }

  /**
   * Applies a Bughouse move to this board.
   * Returns captured piece type (reverting promoted pieces to pawn) if a capture occurred, or null.
   */
  public makeMove(move: BughouseMove): { capturedPiece: ReservePiece | null; san: string } {
    const currentTurn = this.turn();

    if (move.type === "standard") {
      const fromSq = move.from;
      const toSq = move.to;
      const wasPromoted = this.promotedSquares.has(toSq);

      const executed = this.chess.move({
        from: fromSq,
        to: toSq,
        promotion: move.promotion,
      });

      if (!executed) {
        throw new Error(`Illegal standard move attempted: ${fromSq}->${toSq}`);
      }

      // Update promoted squares tracking
      if (this.promotedSquares.has(fromSq)) {
        this.promotedSquares.delete(fromSq);
        this.promotedSquares.add(toSq);
      }
      if (move.promotion) {
        this.promotedSquares.add(toSq);
      }

      let capturedPiece: ReservePiece | null = null;
      if (executed.captured) {
        // In Bughouse rules, promoted pieces revert to pawns when captured!
        if (wasPromoted) {
          capturedPiece = "p";
          this.promotedSquares.delete(toSq);
        } else {
          capturedPiece = executed.captured as ReservePiece;
        }
      }

      return {
        capturedPiece,
        san: executed.san,
      };
    } else {
      // Drop move
      const { piece, to } = move;

      // Place the piece
      const ok = this.chess.put({ type: piece as PieceSymbol, color: currentTurn }, to);
      if (!ok) {
        throw new Error(`Failed to place drop ${piece}@${to}`);
      }

      // Toggle turn and advance clock via FEN
      const tokens = this.chess.fen().split(" ");
      tokens[1] = currentTurn === "w" ? "b" : "w"; // switch turn
      tokens[3] = "-"; // clear en passant on drops
      const halfMoves = parseInt(tokens[4], 10) + 1;
      tokens[4] = halfMoves.toString();
      if (currentTurn === "b") {
        const fullMoves = parseInt(tokens[5], 10) + 1;
        tokens[5] = fullMoves.toString();
      }

      this.chess.load(tokens.join(" "));

      const isMate = this.chess.isCheckmate();
      const inCheck = this.chess.inCheck();
      const san = `${piece.toUpperCase()}@${to}${isMate ? "#" : inCheck ? "+" : ""}`;
      return {
        capturedPiece: null,
        san,
      };
    }
  }
}
