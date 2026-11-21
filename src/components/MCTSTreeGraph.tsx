import React, { useState } from "react";
import { MCTSTreeNodeData } from "@/ai/types";
import {
  GitBranch,
  Sparkles,
  Maximize2,
  X,
  Info,
  ArrowRight,
  Eye,
  Calculator,
} from "lucide-react";

interface MCTSTreeGraphProps {
  tree: MCTSTreeNodeData | null;
  principalVariation: string[];
  boardId: "A" | "B";
  isSearching: boolean;
}

export const MCTSTreeGraph: React.FC<MCTSTreeGraphProps> = ({
  tree,
  principalVariation,
  boardId,
  isSearching,
}) => {
  const [selectedNode, setSelectedNode] = useState<MCTSTreeNodeData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"visual" | "puct" | "pv">("visual");

  const rootNode = tree;
  const ply1Nodes = rootNode?.children || [];
  const activePly1 = selectedNode
    ? (ply1Nodes.find((c) => c.id === selectedNode.id) ||
       ply1Nodes.find((c) => selectedNode.id.startsWith(c.id)) ||
       ply1Nodes[0])
    : ply1Nodes[0];
  const ply2Nodes = activePly1?.children || [];

  const inspectedNode = selectedNode || activePly1 || rootNode;

  const content = (
    <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
      {/* Header: Title, View Tabs & Fullscreen */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch className={`w-3.5 h-3.5 text-indigo-500 ${isSearching ? "animate-spin text-amber-500" : ""}`} />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Search Tree Explorer
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
            Board {boardId}
          </span>
        </div>

        {/* View Mode Tabs & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("visual")}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all flex items-center gap-1 text-[11px] ${
                activeTab === "visual"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Tree Graph</span>
            </button>
            <button
              onClick={() => setActiveTab("puct")}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all flex items-center gap-1 text-[11px] ${
                activeTab === "puct"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Calculator className="w-3 h-3" />
              <span>PUCT Math</span>
            </button>
            <button
              onClick={() => setActiveTab("pv")}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all flex items-center gap-1 text-[11px] ${
                activeTab === "pv"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Best Line</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Tree Explorer"}
          >
            {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!tree ? (
        <div className="flex-1 min-h-[140px] bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
          <GitBranch className="w-5 h-5 text-slate-400 dark:text-slate-600" />
          <span>Make a move to explore the MCTS decision tree.</span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* ========================================================= */}
          {/* TAB 1: VISUAL NODE-LINK TREE GRAPH                        */}
          {/* ========================================================= */}
          {activeTab === "visual" && (
            <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
              <div className="flex-1 min-h-0 bg-slate-50/80 dark:bg-slate-950/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 overflow-y-auto overflow-x-auto">
                {/* Level 0: Root Position */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    onClick={() => setSelectedNode(tree)}
                    className={`cursor-pointer px-3 py-1 rounded-lg border transition-all text-center flex flex-col items-center gap-0.5 hover:scale-105 ${
                      selectedNode?.id === tree.id
                        ? "ring-2 ring-indigo-500 bg-indigo-50 border-indigo-300 dark:ring-indigo-400 dark:bg-indigo-950/60 dark:border-indigo-500"
                        : "bg-white border-slate-200 text-slate-800 shadow-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                    }`}
                  >
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                      Root State (Board {boardId})
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                      <span>{tree.san}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700">
                        {tree.visits} Sims
                      </span>
                    </div>
                  </div>

                  {/* Connector line */}
                  <div className="w-0.5 h-2.5 bg-gradient-to-b from-indigo-500 to-slate-400 dark:to-slate-700 my-0.5" />
                </div>

                {/* Level 1: Candidate Actions Explored */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Ply 1: Candidate Moves Evaluated
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      Click to inspect counter-moves
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                    {ply1Nodes.map((child, idx) => {
                      const isChosen = idx === 0;
                      const isSelected = selectedNode?.id === child.id || (!selectedNode && isChosen);

                      return (
                        <div
                          key={child.id}
                          onClick={() => setSelectedNode(child)}
                          className={`cursor-pointer p-1.5 rounded-lg border text-xs flex flex-col gap-1 transition-all hover:scale-[1.01] ${
                            isSelected
                              ? "ring-2 ring-blue-500 bg-blue-50/90 border-blue-300 shadow-xs dark:ring-blue-400 dark:bg-slate-900 dark:border-blue-500"
                              : isChosen
                              ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-500/60"
                              : "bg-white border-slate-200 text-slate-800 shadow-xs dark:bg-slate-900/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isChosen
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {child.san}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {child.isDrop && (
                                <span className="text-[8px] px-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-bold">
                                  DROP
                                </span>
                              )}
                              {isChosen && (
                                <span className="text-[8px] px-1 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/40 font-bold">
                                  PLAYED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Node Stats: Visits, Win Rate, Prior */}
                          <div className="grid grid-cols-3 gap-0.5 text-[9px] font-mono text-center pt-0.5 border-t border-slate-200 dark:border-slate-800/80">
                            <div className="bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded">
                              <span className="text-slate-500 dark:text-slate-400 block text-[8px]">N</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{child.visits}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded">
                              <span className="text-slate-500 dark:text-slate-400 block text-[8px]">Q</span>
                              <span className={`font-bold ${child.winRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {(child.winRate * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded">
                              <span className="text-slate-500 dark:text-slate-400 block text-[8px]">P</span>
                              <span className="font-bold text-purple-600 dark:text-purple-300">
                                {(child.prior * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Level 2: Opponent Responses */}
                {activePly1 && ply2Nodes.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-purple-500" />
                        <span>Ply 2: Opponent Replies to <strong>{activePly1.san}</strong></span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Adversarial Turn
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-0.5">
                      {ply2Nodes.map((reply) => {
                        const isReplySelected = selectedNode?.id === reply.id;
                        return (
                          <div
                            key={reply.id}
                            onClick={() => setSelectedNode(reply)}
                            className={`cursor-pointer p-1.5 rounded-lg border text-xs flex flex-col gap-0.5 transition-all ${
                              isReplySelected
                                ? "ring-2 ring-purple-500 bg-purple-50/90 border-purple-300 dark:ring-purple-400 dark:bg-purple-950/30 dark:border-purple-500"
                                : "bg-white border-slate-200 text-slate-800 shadow-xs dark:bg-slate-900/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {reply.san}
                              </span>
                              {reply.isDrop && (
                                <span className="text-[8px] px-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-bold">
                                  DROP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
                              <span>N:{reply.visits}</span>
                              <span className={reply.winRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400"}>
                                Q:{(reply.winRate * 100).toFixed(0)}%
                              </span>
                              <span>P:{(reply.prior * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Live Formula Strip */}
              {inspectedNode && (
                <div className="px-2 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 font-mono">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-amber-600 dark:text-amber-300 font-bold">{inspectedNode.san}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Q: {inspectedNode.qValue.toFixed(3)}</span>
                    <span className="text-slate-400">+</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">U: {inspectedNode.uValue.toFixed(3)}</span>
                    <span className="text-slate-400">=</span>
                    <span className="text-amber-700 dark:text-amber-200 font-bold">
                      {(inspectedNode.qValue + inspectedNode.uValue).toFixed(3)}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab("puct")}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline font-sans"
                  >
                    Formula Details &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PUCT FORMULA BREAKDOWN                             */}
          {/* ========================================================= */}
          {activeTab === "puct" && (
            <div className="flex-1 min-h-0 bg-slate-50/80 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span>PUCT Mathematical Selection Breakdown</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">AlphaZero PUCT</span>
              </div>

              {inspectedNode ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block">Move Inspected</span>
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-300">{inspectedNode.san}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block">Visits (N)</span>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">{inspectedNode.visits}</span>
                    </div>
                  </div>

                  {/* Formula Box */}
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex flex-col gap-1 shadow-xs">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800 pb-1">
                      Score = Q(s,a) + c_puct * P(s,a) * (sqrt(N_parent) / (1 + n_child))
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Q (Exploitation / Win Rate):</span>
                      <span>{inspectedNode.qValue.toFixed(3)} ({(inspectedNode.winRate * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between text-purple-600 dark:text-purple-400 font-semibold">
                      <span>U (Exploration Bonus):</span>
                      <span>+{inspectedNode.uValue.toFixed(3)}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-amber-600 dark:text-amber-300">
                      <span>Total Priority Score:</span>
                      <span>{(inspectedNode.qValue + inspectedNode.uValue).toFixed(3)}</span>
                    </div>
                  </div>

                  {/* Balance Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Q Exploitation</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">U Exploration</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden border border-slate-300 dark:border-slate-700/50">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(inspectedNode.qValue / (inspectedNode.qValue + inspectedNode.uValue || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{
                          width: `${(inspectedNode.uValue / (inspectedNode.qValue + inspectedNode.uValue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500">Select any node in Tree Graph to inspect.</div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PRINCIPAL VARIATION (BEST LINE)                    */}
          {/* ========================================================= */}
          {activeTab === "pv" && (
            <div className="flex-1 min-h-0 bg-slate-50/80 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 overflow-y-auto">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Principal Variation (Predicted Game Continuation)
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {principalVariation.length > 0 ? (
                  principalVariation.map((san, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-xs"
                    >
                      <span className="text-[10px] text-amber-500 font-normal">Ply {idx + 1}:</span>
                      <span>{san}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Run a search to view continuation.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs dark:shadow-lg overflow-hidden transition-colors">
      {content}
    </div>
  );
};
