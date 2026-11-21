import { BughouseGame } from "../engine/bughouseGame";
import { BoardId, PlayerColor, ReservePiece } from "../engine/types";

// Empirical capture distribution weights in chess / bughouse games
const PIECE_CAPTURE_WEIGHTS: { piece: ReservePiece; weight: number }[] = [
  { piece: "p", weight: 0.40 }, // Pawns are traded most frequently
  { piece: "n", weight: 0.22 }, // Knights
  { piece: "b", weight: 0.18 }, // Bishops
  { piece: "r", weight: 0.14 }, // Rooks
  { piece: "q", weight: 0.06 }, // Queens (rare trade, devastating drop)
];

/**
 * Samples a random piece type according to tactical capture likelihood.
 */
export function sampleCapturedPiece(): ReservePiece {
  const r = Math.random();
  let cumulative = 0;
  for (const item of PIECE_CAPTURE_WEIGHTS) {
    cumulative += item.weight;
    if (r <= cumulative) return item.piece;
  }
  return "p";
}

/**
 * Partner Uncertainty Simulator:
 * Explicitly samples stochastic piece delivery from the partner's board during MCTS rollouts.
 * This simulates the asynchronous, uncertain nature of teammate and opponent captures.
 */
export function applyStochasticPartnerEvents(
  game: BughouseGame,
  activeBoard: BoardId,
  captureRate: number = 0.18
): void {
  // Check if partner delivers a piece to active board White or Black
  const partnerBoard: BoardId = activeBoard === "A" ? "B" : "A";

  // Check if partner board has high tactical tension (e.g. checks or captures pending)
  const otherBoard = partnerBoard === "A" ? game.boardA : game.boardB;
  let dynamicRate = captureRate;
  if (otherBoard.inCheck()) {
    dynamicRate *= 1.8; // During checks on partner board, captures/blocks occur with higher probability
  }

  // 1. Stochastic capture by our teammate (feeds our reserve)
  if (Math.random() < dynamicRate) {
    const piece = sampleCapturedPiece();
    const who = Math.random() < 0.5 ? "w" : "b";
    const partnerReserveKey = game.getTeammateReserveKey(partnerBoard, who as PlayerColor);
    game.reserves[partnerReserveKey][piece]++;
  }

  // 2. Stochastic capture by opponent (feeds opponent's reserve)
  if (Math.random() < dynamicRate) {
    const piece = sampleCapturedPiece();
    const who = Math.random() < 0.5 ? "w" : "b";
    const oppPartnerKey = game.getTeammateReserveKey(partnerBoard, who as PlayerColor);
    game.reserves[oppPartnerKey][piece]++;
  }
}
