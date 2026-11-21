import { BughouseGame } from "./bughouseGame";
import { BoardId, PlayerColor, Reserve, ReservePiece, Team } from "./types";
import { Square, PieceSymbol } from "chess.js";

// Bughouse-adjusted piece weights (in centipawns: 100 = 1 pawn)
export const BUGHOUSE_PIECE_VALUES: Record<ReservePiece, number> = {
  p: 100,
  n: 350, // Deadly drop utility
  b: 330,
  r: 500,
  q: 950,
};

// Standard PeSTO Piece-Square Tables (White perspective, rank 8 down to 1)
// Centered and scaled for positional intelligence (e4/d4, center control, king safety)
const PST_PAWN: number[] = [
    0,   0,   0,   0,   0,   0,   0,   0,
   50,  50,  50,  50,  50,  50,  50,  50,
   10,  10,  20,  35,  35,  20,  10,  10,
    5,   5,  15,  30,  30,  10,   5,   5,
    0,   0,   0,  25,  25,   0,   0,   0,
    5,  -5, -10,   0,   0, -10,  -5,   5,
    5,  10,  10, -25, -25,  10,  10,   5,
    0,   0,   0,   0,   0,   0,   0,   0
];

const PST_KNIGHT: number[] = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,  10,  25,  30,  30,  25,  10, -30,
  -30,  10,  25,  30,  30,  25,  10, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];

const PST_BISHOP: number[] = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -10,  10,  15,  15,  15,  15,  10, -10,
  -10,   5,  15,  20,  20,  15,   5, -10,
  -10,   5,  15,  20,  20,  15,   5, -10,
  -10,  10,  10,  15,  15,  10,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];

const PST_ROOK: number[] = [
    0,   0,   0,   5,   5,   0,   0,   0,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
    5,  10,  10,  10,  10,  10,  10,   5,
    0,   0,   0,   0,   0,   0,   0,   0
];

const PST_QUEEN: number[] = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -10,   5,   5,   5,   5,   5,   0, -10,
    0,   0,   5,   5,   5,   5,   0,  -5,
   -5,   0,   5,   5,   5,   5,   0,  -5,
  -10,   0,   5,   5,   5,   5,   0, -10,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20
];

const PST_KING: number[] = [
   20,  30,  10,   0,   0,  10,  30,  20,
   20,  20,   0,   0,   0,   0,  20,  20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30
];

function getSquareIndex(sq: Square, color: PlayerColor): number {
  const file = sq.charCodeAt(0) - 97; // 0..7
  const rank = parseInt(sq[1], 10) - 1; // 0..7

  // If white: rank 8 is top of array (index 0..7), rank 1 is bottom (index 56..63)
  if (color === "w") {
    return (7 - rank) * 8 + file;
  } else {
    // For black, flip vertically
    return rank * 8 + file;
  }
}

function getPiecePST(type: PieceSymbol, sq: Square, color: PlayerColor): number {
  const idx = getSquareIndex(sq, color);
  switch (type) {
    case "p": return PST_PAWN[idx];
    case "n": return PST_KNIGHT[idx];
    case "b": return PST_BISHOP[idx];
    case "r": return PST_ROOK[idx];
    case "q": return PST_QUEEN[idx];
    case "k": return PST_KING[idx];
    default: return 0;
  }
}

export interface BoardEmbedding {
  materialBalance: number;
  positionalBalance: number;
  reserveBalance: number;
  kingSafetyWhite: number;
  kingSafetyBlack: number;
}

export function evaluateReserve(reserve: Reserve): number {
  return (
    reserve.p * BUGHOUSE_PIECE_VALUES.p +
    reserve.n * BUGHOUSE_PIECE_VALUES.n +
    reserve.b * BUGHOUSE_PIECE_VALUES.b +
    reserve.r * BUGHOUSE_PIECE_VALUES.r +
    reserve.q * BUGHOUSE_PIECE_VALUES.q
  );
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function evaluateSingleBoard(board: BughouseGame["boardA"]): number {
  if (board.isCheckmate()) {
    return board.turn() === "w" ? -10000 : 10000;
  }
  if (board.isDraw()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;
  let kingSqW: Square | null = null;
  let kingSqB: Square | null = null;

  for (const r of RANKS) {
    for (const f of FILES) {
      const sq = `${f}${r}` as Square;
      const piece = board.chess.get(sq);
      if (!piece) continue;

      const baseVal = BUGHOUSE_PIECE_VALUES[piece.type as ReservePiece] || 0;
      const pstVal = getPiecePST(piece.type, sq, piece.color as PlayerColor);

      if (piece.color === "w") {
        whiteScore += baseVal + pstVal;
        if (piece.type === "k") kingSqW = sq;
      } else {
        blackScore += baseVal + pstVal;
        if (piece.type === "k") kingSqB = sq;
      }
    }
  }

  // Bughouse King Safety: open adjacent squares allow enemy drop mates!
  if (kingSqW) {
    let openW = 0;
    const fIdx = kingSqW.charCodeAt(0) - 97;
    const rIdx = parseInt(kingSqW[1], 10);
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const nf = fIdx + df;
        const nr = rIdx + dr;
        if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) {
          if (!board.chess.get(`${FILES[nf]}${nr}` as Square)) openW++;
        }
      }
    }
    whiteScore -= openW * 35; // Significant penalty for open drop squares
  }

  if (kingSqB) {
    let openB = 0;
    const fIdx = kingSqB.charCodeAt(0) - 97;
    const rIdx = parseInt(kingSqB[1], 10);
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const nf = fIdx + df;
        const nr = rIdx + dr;
        if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) {
          if (!board.chess.get(`${FILES[nf]}${nr}` as Square)) openB++;
        }
      }
    }
    blackScore -= openB * 35;
  }

  return whiteScore - blackScore;
}

/**
 * Static evaluation score from the perspective of Team 1 (Aw + Bb) vs Team 2 (Ab + Bw).
 * Positive = Team 1 winning, Negative = Team 2 winning.
 */
export function evaluateBughousePosition(game: BughouseGame): number {
  if (game.isGameOver) {
    if (game.winner === "Team1") return 10000;
    if (game.winner === "Team2") return -10000;
    return 0; // Draw
  }

  const scoreA = evaluateSingleBoard(game.boardA);
  const scoreB = evaluateSingleBoard(game.boardB);

  const reserveAw = evaluateReserve(game.reserves.Aw);
  const reserveAb = evaluateReserve(game.reserves.Ab);
  const reserveBw = evaluateReserve(game.reserves.Bw);
  const reserveBb = evaluateReserve(game.reserves.Bb);

  // Team 1: Board A White (+) + Board B Black (-)
  const team1ScoreA = scoreA + (reserveAw - reserveAb) * 1.25;
  const team1ScoreB = -scoreB + (reserveBb - reserveBw) * 1.25;

  return team1ScoreA + team1ScoreB;
}
