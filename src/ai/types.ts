import { BughouseMove, BoardId, PlayerColor } from "../engine/types";

export type RolloutPolicyType = "random" | "heuristic";

export interface MCTSConfig {
  iterations: number;
  maxTimeMs: number;
  cParam: number; // Exploration constant C in UCB1 (default: Math.SQRT2 = 1.414)
  rolloutPolicy: RolloutPolicyType; // 'random' vs 'heuristic'
  maxRolloutDepth: number;
  enablePartnerUncertainty: boolean; // Stochastic piece arrival model
  partnerCaptureRate: number; // Base capture rate per rollout step (e.g., 0.15)
}

export interface CandidateMoveInfo {
  move: BughouseMove;
  san: string;
  visits: number;
  winRate: number;
  qValue: number;
  prior: number;
  uValue: number;
}

export interface MCTSTreeNodeData {
  id: string;
  san: string;
  visits: number;
  winRate: number;
  qValue: number;
  uValue: number;
  puctScore?: number;
  prior: number;
  isDrop: boolean;
  color: PlayerColor;
  isPv?: boolean;
  children: MCTSTreeNodeData[];
}

export interface MCTSResult {
  bestMove: BughouseMove;
  bestSan: string;
  winProbability: number;
  team1WinProbability: number;
  evalCentipawns: number;
  simulations: number;
  maxTreeDepth: number;
  timeMs: number;
  branchingFactor: number;
  topMoves: CandidateMoveInfo[];
  principalVariation: string[];
  treeSnapshot?: MCTSTreeNodeData;
  boardId: BoardId;
  color: PlayerColor;
}

export const DEFAULT_MCTS_CONFIG: MCTSConfig = {
  iterations: 300,
  maxTimeMs: 600,
  cParam: 1.414,
  rolloutPolicy: "heuristic",
  maxRolloutDepth: 12,
  enablePartnerUncertainty: true,
  partnerCaptureRate: 0.18,
};
