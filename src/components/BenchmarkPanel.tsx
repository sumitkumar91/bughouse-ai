import React, { useState } from "react";
import { ExperimentComparison } from "@/ai/benchmarks";
import { Play, CheckCircle2, TrendingUp, BarChart3, Loader2 } from "lucide-react";

export const BenchmarkPanel: React.FC = () => {
  const [selectedExp, setSelectedExp] = useState<"rolloutPolicy" | "cParam" | "partnerUncertainty">("rolloutPolicy");
  const [numGames, setNumGames] = useState<number>(6);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ExperimentComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/bughouse/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experiment: selectedExp,
          numGames,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Benchmark run failed");
      }
      setResults(data.comparison);
    } catch (err: any) {
      setError(err.message || "Failed to run experiment");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              MCTS Comparative Experiments (Empirical Findings)
            </h3>
            <p className="text-[11px] text-slate-400">
              Directly benchmark and evaluate design choices across tournament configurations
            </p>
          </div>
        </div>
      </div>

      {/* Experiment Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedExp("rolloutPolicy")}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedExp === "rolloutPolicy"
              ? "border-blue-500 bg-blue-500/10 text-blue-200"
              : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
          }`}
        >
          <div className="font-bold text-xs mb-1 text-slate-200">1. Rollout Policy</div>
          <div className="text-[11px] text-slate-400">Heuristic-Guided vs. Pure Random Rollouts</div>
        </button>

        <button
          onClick={() => setSelectedExp("cParam")}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedExp === "cParam"
              ? "border-blue-500 bg-blue-500/10 text-blue-200"
              : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
          }`}
        >
          <div className="font-bold text-xs mb-1 text-slate-200">2. Exploration (C)</div>
          <div className="text-[11px] text-slate-400">UCB1 Exploration (C=1.414 vs C=0.5)</div>
        </button>

        <button
          onClick={() => setSelectedExp("partnerUncertainty")}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedExp === "partnerUncertainty"
              ? "border-blue-500 bg-blue-500/10 text-blue-200"
              : "border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
          }`}
        >
          <div className="font-bold text-xs mb-1 text-slate-200">3. Uncertainty Model</div>
          <div className="text-[11px] text-slate-400">Stochastic Partner Model vs Static Assumption</div>
        </button>
      </div>

      {/* Control Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>Tournament Games:</span>
          <select
            value={numGames}
            onChange={(e) => setNumGames(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
          >
            <option value={4}>4 games (Fast ~5s)</option>
            <option value={6}>6 games (Recommended ~8s)</option>
            <option value={10}>10 games (Detailed ~15s)</option>
          </select>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-all shadow-md cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Simulating Games...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Comparison</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-2 p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-300">{results.name}</span>
              <p className="text-[11px] text-slate-400">{results.description}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
              Completed {results.results.gamesPlayed} Matches
            </span>
          </div>

          {/* Win Rate Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono font-bold mb-1">
              <span className="text-emerald-400">
                Config A: {results.results.team1Wins} Wins ({((results.results.team1Wins / results.results.gamesPlayed) * 100).toFixed(0)}%)
              </span>
              <span className="text-slate-400">Draws: {results.results.draws}</span>
              <span className="text-rose-400">
                Config B: {results.results.team2Wins} Wins ({((results.results.team2Wins / results.results.gamesPlayed) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(results.results.team1Wins / results.results.gamesPlayed) * 100}%` }}
              />
              <div
                className="h-full bg-slate-600 transition-all duration-500"
                style={{ width: `${(results.results.draws / results.results.gamesPlayed) * 100}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${(results.results.team2Wins / results.results.gamesPlayed) * 100}%` }}
              />
            </div>
          </div>

          {/* Extra Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Avg Moves / Game</div>
              <div className="font-bold text-slate-200">{results.results.avgMoves}</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Avg Search Latency</div>
              <div className="font-bold text-slate-200">{results.results.avgTimeMs} ms</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Avg Tree Depth</div>
              <div className="font-bold text-slate-200">{results.results.avgDepth} ply</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
