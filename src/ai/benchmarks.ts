import { BughouseGame } from "../engine/bughouseGame";
import { BughouseMCTS } from "./mcts";
import { MCTSConfig, DEFAULT_MCTS_CONFIG } from "./types";
import { Team } from "../engine/types";
import { evaluateBughousePosition } from "../engine/evaluation";

export interface MatchStats {
  gamesPlayed: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  avgMoves: number;
  avgTimeMs: number;
  avgDepth: number;
  reasons: Record<string, number>;
}

export interface ExperimentComparison {
  name: string;
  description: string;
  configTeam1: Partial<MCTSConfig>;
  configTeam2: Partial<MCTSConfig>;
  results: MatchStats;
}

/**
 * Runs a match between two AI configurations.
 * Team 1 (Board A White, Board B Black) uses config1.
 * Team 2 (Board A Black, Board B White) uses config2.
 */
export function playMatch(
  configTeam1: Partial<MCTSConfig>,
  configTeam2: Partial<MCTSConfig>,
  maxMovesPerGame: number = 80
): { winner: Team | "draw"; moves: number; reason: string; avgTime: number; avgDepth: number } {
  const game = new BughouseGame();
  const mctsTeam1 = new BughouseMCTS(configTeam1);
  const mctsTeam2 = new BughouseMCTS(configTeam2);

  let moveCount = 0;
  let totalTime = 0;
  let totalDepth = 0;

  while (!game.isGameOver && moveCount < maxMovesPerGame) {
    // Alternate between Board A and Board B to simulate concurrent play
    const activeBoard = moveCount % 2 === 0 ? "A" : "B";
    const currentTurn = activeBoard === "A" ? game.boardA.turn() : game.boardB.turn();

    // Determine which team is moving
    // Team 1: (A_w, B_b). Team 2: (A_b, B_w).
    const isTeam1 =
      (activeBoard === "A" && currentTurn === "w") ||
      (activeBoard === "B" && currentTurn === "b");

    const activeMCTS = isTeam1 ? mctsTeam1 : mctsTeam2;
    const searchRes = activeMCTS.search(game, activeBoard);

    totalTime += searchRes.timeMs;
    totalDepth += searchRes.maxTreeDepth;

    const ok = game.makeMove(activeBoard, searchRes.bestMove);
    if (!ok) break;

    moveCount++;
  }

  let winner: Team | "draw" = game.winner || "draw";
  let reason = game.winReason || (moveCount >= maxMovesPerGame ? "Max move cap reached" : "Game ended");

  // Tournament Adjudication: If no checkmate within move cap, adjudicate based on positional score
  if (!game.winner && moveCount >= maxMovesPerGame) {
    const finalScore = evaluateBughousePosition(game);
    if (finalScore > 180) {
      winner = "Team1";
      reason = `Adjudicated: Team 1 ahead by ${(finalScore / 100).toFixed(1)} pawns`;
    } else if (finalScore < -180) {
      winner = "Team2";
      reason = `Adjudicated: Team 2 ahead by ${(-finalScore / 100).toFixed(1)} pawns`;
    } else {
      winner = "draw";
      reason = "Draw by move cap (balanced position)";
    }
  }

  return {
    winner,
    moves: moveCount,
    reason,
    avgTime: moveCount > 0 ? totalTime / moveCount : 0,
    avgDepth: moveCount > 0 ? totalDepth / moveCount : 0,
  };
}

/**
 * Runs multiple games alternating sides (White/Black) to eliminate first-move bias.
 */
export function runTournament(
  name: string,
  description: string,
  configA: Partial<MCTSConfig>,
  configB: Partial<MCTSConfig>,
  numGames: number = 10
): ExperimentComparison {
  const stats: MatchStats = {
    gamesPlayed: numGames,
    team1Wins: 0,
    team2Wins: 0,
    draws: 0,
    avgMoves: 0,
    avgTimeMs: 0,
    avgDepth: 0,
    reasons: {},
  };

  let totalMoves = 0;
  let totalTime = 0;
  let totalDepth = 0;

  for (let i = 0; i < numGames; i++) {
    // Even games: Config A is Team 1. Odd games: Config B is Team 1.
    const isSwapped = i % 2 !== 0;
    const cfg1 = isSwapped ? configB : configA;
    const cfg2 = isSwapped ? configA : configB;

    const result = playMatch(cfg1, cfg2);
    totalMoves += result.moves;
    totalTime += result.avgTime;
    totalDepth += result.avgDepth;

    if (result.winner === "draw") {
      stats.draws++;
    } else if (result.winner === "Team1") {
      if (!isSwapped) stats.team1Wins++;
      else stats.team2Wins++;
    } else {
      if (!isSwapped) stats.team2Wins++;
      else stats.team1Wins++;
    }

    stats.reasons[result.reason] = (stats.reasons[result.reason] || 0) + 1;
  }

  stats.avgMoves = Number((totalMoves / numGames).toFixed(1));
  stats.avgTimeMs = Number((totalTime / numGames).toFixed(1));
  stats.avgDepth = Number((totalDepth / numGames).toFixed(1));

  return {
    name,
    description,
    configTeam1: configA,
    configTeam2: configB,
    results: stats,
  };
}
