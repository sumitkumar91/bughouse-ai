import React from "react";
import { Team } from "@/engine/types";

interface EvalBarProps {
  evalCentipawns: number;
  isGameOver: boolean;
  winner?: Team | "draw" | null;
  winProbability?: number; // In [0, 1] from Team 1's perspective
  className?: string;
  orientation?: "vertical" | "horizontal";
}

/**
 * Professional Chess Evaluation Bar (Lichess / Chess.com standard)
 * 
 * - Strictly from Team 1 perspective (White on Board A, Black on Board B).
 * - Uses standard FIDE / Elo logistic formula: P(Win) = 1 / (1 + 10^(-eval / 400)).
 * - Shows exact centipawns (+1.5, -2.1, 0.0) or Mate (M1, M2).
 * - Smooth CSS transitions and high-contrast typography.
 */
export const EvalBar: React.FC<EvalBarProps> = ({
  evalCentipawns,
  isGameOver,
  winner,
  winProbability,
  className = "",
  orientation = "vertical",
}) => {
  // 1. Calculate Team 1 win percentage
  let team1Percent = 50;
  let scoreText = "0.0";

  if (isGameOver) {
    if (winner === "Team1") {
      team1Percent = 100;
      scoreText = "M0";
    } else if (winner === "Team2") {
      team1Percent = 0;
      scoreText = "-M0";
    } else {
      team1Percent = 50;
      scoreText = "0.0";
    }
  } else if (Math.abs(evalCentipawns) >= 9000) {
    // Forced mate detected
    const isTeam1Mate = evalCentipawns > 0;
    team1Percent = isTeam1Mate ? 99 : 1;
    scoreText = isTeam1Mate ? "+M" : "-M";
  } else {
    // Standard logistic curve: 400 centipawns = 90.9% win chance
    // If MCTS provided empirical winProbability, blend it:
    const logisticPercent = 1 / (1 + Math.pow(10, -evalCentipawns / 400.0));
    const blended = winProbability !== undefined
      ? winProbability * 0.5 + logisticPercent * 0.5
      : logisticPercent;

    team1Percent = Math.min(Math.max(Math.round(blended * 100), 3), 97);

    const pawns = evalCentipawns / 100;
    if (Math.abs(pawns) < 0.05) {
      scoreText = "0.0";
    } else if (pawns > 0) {
      scoreText = `+${pawns.toFixed(1)}`;
    } else {
      scoreText = pawns.toFixed(1);
    }
  }

  const isTeam1Leading = evalCentipawns >= 0;

  if (orientation === "horizontal") {
    return (
      <div className={`flex flex-col gap-1 w-full select-none ${className}`}>
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-blue-400 flex items-center gap-1">
            <span>Team 1 (You)</span>
            <span className="font-mono text-white text-xs bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
              {scoreText}
            </span>
          </span>
          <span className="text-rose-400 font-mono text-[11px]">
            Team 2: {100 - team1Percent}%
          </span>
        </div>

        {/* Dual Color Evaluation Bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700 shadow-inner relative">
          {/* Team 1 Side (Left - Blue/White) */}
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: `${team1Percent}%` }}
          />

          {/* Team 2 Side (Right - Rose/Dark) */}
          <div
            className="h-full bg-gradient-to-r from-rose-900 to-rose-700 transition-all duration-500 ease-out"
            style={{ width: `${100 - team1Percent}%` }}
          />

          {/* Center 50% Marker Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400/50 z-10" />
        </div>
      </div>
    );
  }

  // Vertical Eval Bar (Standard Chess Layout next to board)
  return (
    <div
      className={`relative w-6 sm:w-7 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-xl flex flex-col justify-end select-none ${className}`}
      title={`Evaluation: ${scoreText} (Team 1 Win: ${team1Percent}%)`}
    >
      {/* Top Half / Team 2 (Black / Red) */}
      <div
        className="w-full bg-slate-950 transition-all duration-500 ease-out flex items-start justify-center pt-1"
        style={{ height: `${100 - team1Percent}%` }}
      >
        {!isTeam1Leading && (
          <span className="font-mono font-black text-[10px] text-slate-300 drop-shadow-md">
            {scoreText}
          </span>
        )}
      </div>

      {/* Center 50% Divider Notch */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-600/60 z-20" />

      {/* Bottom Half / Team 1 (White / Light Blue) */}
      <div
        className="w-full bg-slate-100 transition-all duration-500 ease-out flex items-end justify-center pb-1"
        style={{ height: `${team1Percent}%` }}
      >
        {isTeam1Leading && (
          <span className="font-mono font-black text-[10px] text-slate-950 drop-shadow-md">
            {scoreText}
          </span>
        )}
      </div>
    </div>
  );
};
