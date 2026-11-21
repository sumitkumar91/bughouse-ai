import React from "react";
import { MCTSResult } from "@/ai/types";
import {
  Cpu,
  Zap,
  GitBranch,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface MCTSVisualizerProps {
  lastResult: MCTSResult | null;
  isSearching: boolean;
  activeBoard: "A" | "B";
  selectedBoardTab?: "A" | "B";
  onSelectBoardTab?: (board: "A" | "B") => void;
}

export const MCTSVisualizer: React.FC<MCTSVisualizerProps> = ({
  lastResult,
  isSearching,
  activeBoard,
  selectedBoardTab,
  onSelectBoardTab,
}) => {
  const currentBoard = selectedBoardTab || activeBoard;

  // Max visits among candidates to render relative progress bars
  const maxVisits =
    lastResult && lastResult.topMoves.length > 0
      ? Math.max(...lastResult.topMoves.map((m) => m.visits), 1)
      : 1;

  const chosenMove = lastResult?.topMoves[0];

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs dark:shadow-lg flex flex-col gap-2 transition-colors">
      {/* Header: Board Selector Tabs & AI Status */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Cpu className={`w-3.5 h-3.5 ${isSearching ? "text-amber-500 animate-spin" : "text-emerald-500"}`} />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            MCTS Engine
          </span>
          {isSearching && (
            <span className="text-[10px] text-amber-500 font-mono animate-pulse">
              (Thinking...)
            </span>
          )}
        </div>

        {/* Board Switcher (Board A vs Board B) */}
        {onSelectBoardTab && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onSelectBoardTab("A")}
              className={`py-0.5 px-2.5 rounded font-semibold transition-all text-[11px] ${
                currentBoard === "A"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Board A
            </button>
            <button
              onClick={() => onSelectBoardTab("B")}
              className={`py-0.5 px-2.5 rounded font-semibold transition-all text-[11px] ${
                currentBoard === "B"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Board B
            </button>
          </div>
        )}
      </div>

      {/* Chosen Move Banner & Diagnostic Metrics Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {chosenMove ? (
          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">Selected:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
              {lastResult?.bestSan}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ({chosenMove.visits} visits &bull; {(chosenMove.winRate * 100).toFixed(0)}% win)
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            Waiting for search...
          </span>
        )}

        {/* Minimal Metric Chips */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/40">
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            {lastResult ? `${lastResult.simulations} sims` : "-"}
          </span>
          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/40">
            <GitBranch className="w-2.5 h-2.5 text-purple-500" />
            {lastResult ? `${lastResult.maxTreeDepth} ply` : "-"}
          </span>
          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/40">
            <ShieldAlert className="w-2.5 h-2.5 text-emerald-500" />
            b={lastResult ? lastResult.branchingFactor : "-"}
          </span>
          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/40">
            <Clock className="w-2.5 h-2.5 text-sky-500" />
            {lastResult ? `${lastResult.timeMs}ms` : "-"}
          </span>
        </div>
      </div>

      {/* Top Candidate Moves Row */}
      {lastResult && lastResult.topMoves.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/70">
          {lastResult.topMoves.slice(0, 3).map((cand, idx) => {
            const isChosen = idx === 0;
            const visitPercent = Math.round((cand.visits / maxVisits) * 100);

            return (
              <div
                key={idx}
                className={`px-2 py-1 rounded-lg border text-xs flex flex-col gap-0.5 transition-all ${
                  isChosen
                    ? "bg-amber-50 border-amber-300 dark:bg-amber-950/25 dark:border-amber-500/60"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 font-normal">#{idx + 1}</span>
                    <span>{cand.san}</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="text-slate-600 dark:text-slate-300">{cand.visits}N</span>
                    <span className={cand.winRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400"}>
                      {(cand.winRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Relative Visit Count Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-950 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isChosen ? "bg-amber-500" : "bg-indigo-500/70"
                    }`}
                    style={{ width: `${visitPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
