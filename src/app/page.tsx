"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { BughouseGame } from "@/engine/bughouseGame";
import { BughouseMCTS } from "@/ai/mcts";
import { BoardId, BughouseMove, ReservePiece } from "@/engine/types";
import { evaluateBughousePosition } from "@/engine/evaluation";
import { MCTSResult } from "@/ai/types";
import { ChessboardView } from "@/components/ChessboardView";
import { ReservePocket } from "@/components/ReservePocket";
import { EvalBar } from "@/components/EvalBar";
import { MCTSVisualizer } from "@/components/MCTSVisualizer";
import { MCTSTreeGraph } from "@/components/MCTSTreeGraph";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  Trophy,
  History,
  Sun,
  Moon,
} from "lucide-react";

export default function BughouseApp() {
  const [game, setGame] = useState<BughouseGame>(() => new BughouseGame());
  const [gameMode, setGameMode] = useState<"human" | "bot_vs_bot">("human");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(900);

  // MCTS search results isolated per board (Board A never overwritten by Board B)
  const [mctsResults, setMctsResults] = useState<{ A: MCTSResult | null; B: MCTSResult | null }>({
    A: null,
    B: null,
  });
  const [selectedVisualizerBoard, setSelectedVisualizerBoard] = useState<BoardId>("A");

  // Active drop piece selection for Board A White (Human)
  const [selectedDropPieceA, setSelectedDropPieceA] = useState<ReservePiece | null>(null);

  // Track currently thinking board
  const [currentActiveBoard, setCurrentActiveBoard] = useState<BoardId>("A");

  // Theme switcher: Default to "chill" light mode, with option to switch to dark
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("bughouse_theme") as "light" | "dark" | null;
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("bughouse_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Ref to prevent overlapping search loops
  const isSearchActiveRef = useRef(false);

  const resetGame = () => {
    setIsPlaying(false);
    setSelectedDropPieceA(null);
    setMctsResults({ A: null, B: null });
    setGame(new BughouseGame());
  };

  /**
   * Triggers high-speed MCTS search for the specified board
   */
  const triggerAIMove = useCallback(
    async (boardId: BoardId): Promise<boolean> => {
      if (game.isGameOver || isSearchActiveRef.current) return false;

      isSearchActiveRef.current = true;
      setIsSearching(true);
      setCurrentActiveBoard(boardId);
      setSelectedVisualizerBoard(boardId);

      try {
        // Fast local MCTS execution (zero network lag, 60fps)
        const mcts = new BughouseMCTS({ iterations: 300, maxTimeMs: 600 });
        const result = mcts.search(game, boardId);

        setMctsResults((prev) => ({
          ...prev,
          [boardId]: result,
        }));

        // Apply best move to game
        const updated = game.clone();
        updated.makeMove(boardId, result.bestMove);
        setGame(updated);

        return true;
      } catch (err) {
        console.error("AI Move error:", err);
        return false;
      } finally {
        isSearchActiveRef.current = false;
        setIsSearching(false);
      }
    },
    [game]
  );

  /**
   * Human moves on Board A
   */
  const handleHumanMove = (boardId: BoardId, move: BughouseMove) => {
    if (game.isGameOver || isSearching) return;

    const updated = game.clone();
    const ok = updated.makeMove(boardId, move);
    if (ok) {
      setSelectedDropPieceA(null);
      setGame(updated);
    }
  };

  /**
   * Game coordinator loop for lockstep synchronization
   */
  useEffect(() => {
    if (game.isGameOver) {
      setIsPlaying(false);
      return;
    }

    if (isSearching) return;

    // Human mode: Board B only plays when Board A plays (1:1 lockstep)
    if (gameMode === "human") {
      const movesCountA = game.history.filter((h) => h.board === "A").length;
      const movesCountB = game.history.filter((h) => h.board === "B").length;

      const timer = setTimeout(() => {
        // 1. If Board B is behind Board A in move count, Board B plays
        if (movesCountB < movesCountA) {
          triggerAIMove("B");
        }
        // 2. If Board B is in sync and Board A Black (AI opponent) needs to move
        else if (game.boardA.turn() === "b") {
          triggerAIMove("A");
        }
      }, simSpeedMs);
      return () => clearTimeout(timer);
    }

    // Bot vs Bot mode with auto-play
    if (gameMode === "bot_vs_bot" && isPlaying) {
      const timer = setTimeout(() => {
        const nextBoard: BoardId = currentActiveBoard === "A" ? "B" : "A";
        triggerAIMove(nextBoard);
      }, simSpeedMs);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, isPlaying, isSearching, simSpeedMs, currentActiveBoard, triggerAIMove]);

  // Extract last move squares for highlighting
  const lastHistoryA = game.history.filter((h) => h.board === "A").slice(-1)[0];
  const lastHistoryB = game.history.filter((h) => h.board === "B").slice(-1)[0];

  const lastMoveA =
    lastHistoryA && lastHistoryA.move.type === "standard"
      ? { from: lastHistoryA.move.from, to: lastHistoryA.move.to }
      : lastHistoryA && lastHistoryA.move.type === "drop"
      ? { to: lastHistoryA.move.to }
      : undefined;

  const lastMoveB =
    lastHistoryB && lastHistoryB.move.type === "standard"
      ? { from: lastHistoryB.move.from, to: lastHistoryB.move.to }
      : lastHistoryB && lastHistoryB.move.type === "drop"
      ? { to: lastHistoryB.move.to }
      : undefined;

  const currentMCTSResult = mctsResults[selectedVisualizerBoard];
  const globalEvalCentipawns = evaluateBughousePosition(game);

  return (
    <main
      className={`h-screen max-h-screen flex flex-col ${
        theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-[#f8fafc] text-slate-800"
      } overflow-hidden select-none p-2 sm:p-2.5 gap-2 transition-colors`}
    >
      {/* ========================================================= */}
      {/* 1. TOP MINIMAL NAVIGATION BAR                             */}
      {/* ========================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-lg shrink-0 transition-colors">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-xs ring-1 ring-slate-900/10 dark:ring-white/15 shrink-0 bg-black">
              <Image
                src="/logo.png"
                alt="Bughouse AI Logo"
                fill
                sizes="28px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">BUGHOUSE AI</span>
            </div>
          </div>

          {/* Turn / Round Status Badge */}
          {game.isGameOver ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              {game.winner === "Team1" ? "Team 1 Victory!" : game.winner === "Team2" ? "Team 2 Victory!" : "Draw!"}
            </span>
          ) : gameMode === "human" ? (
            game.boardA.turn() === "w" && game.history.filter((h) => h.board === "B").length >= game.history.filter((h) => h.board === "A").length ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 animate-pulse">
                Your Turn (White)
              </span>
            ) : isSearching ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 animate-pulse">
                AI Thinking (Board {currentActiveBoard})...
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                Partner Responding...
              </span>
            )
          ) : isSearching ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 animate-pulse">
              Simulating Board {currentActiveBoard}...
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
              Spectator Mode
            </span>
          )}
        </div>

        {/* Center Controls: Game Mode & Auto-Play */}
        <div className="flex items-center gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setGameMode("human");
                setIsPlaying(false);
              }}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all cursor-pointer text-[11px] ${
                gameMode === "human"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              You vs AI
            </button>
            <button
              onClick={() => setGameMode("bot_vs_bot")}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all cursor-pointer text-[11px] ${
                gameMode === "bot_vs_bot"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Spectate AI
            </button>
          </div>

          {/* Controls visible only during Spectate AI */}
          {gameMode === "bot_vs_bot" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-white transition-all cursor-pointer text-[11px] ${
                  isPlaying ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={() => triggerAIMove(currentActiveBoard === "A" ? "B" : "A")}
                disabled={isPlaying || isSearching}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer text-[11px] border border-slate-200 dark:border-slate-700"
                title="Single step move"
              >
                <FastForward className="w-3 h-3" />
                <span>Step</span>
              </button>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSimSpeedMs(900)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    simSpeedMs === 900 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  0.9s
                </button>
                <button
                  onClick={() => setSimSpeedMs(400)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    simSpeedMs === 400 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  0.4s
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Buttons: Theme Switcher, Rules & New Game */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Chill Light Mode"}
          >
            {theme === "light" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-700 hover:text-rose-700 dark:text-slate-200 dark:hover:text-rose-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 transition-colors cursor-pointer shadow-xs"
            title="Start New Game"
          >
            <RotateCcw className="w-3 h-3" />
            <span>New Game</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN COCKPIT: DUAL BOARDS (LEFT) + MCTS TREE (RIGHT)   */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* --------------------------------------------------------- */}
        {/* LEFT COLUMN: THE GAME ARENA (BOARD A & BOARD B)           */}
        {/* --------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col min-h-0 gap-2 overflow-hidden">
          {/* Dual Boards Container (Side-by-Side) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden">
            {/* Board A Card */}
            <div className="bg-white/90 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-lg flex flex-col justify-between items-center gap-1 overflow-hidden transition-colors">
              {/* Board A Header */}
              <div className="w-full flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Board A</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {gameMode === "human" ? "(You: White vs AI)" : "(Team 1 vs Team 2)"}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    game.boardA.turn() === "w"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent"
                  }`}
                >
                  Turn: {game.boardA.turn() === "w" ? "White" : "Black"}
                </span>
              </div>

              {/* Board A Black Reserve (Top) */}
              <div className="w-full shrink-0">
                <ReservePocket
                  label="Black Reserve (Opponent)"
                  reserve={game.reserves.Ab}
                  color="b"
                  isCurrentTurn={game.boardA.turn() === "b"}
                  selectedDropPiece={null}
                  onSelectDropPiece={() => {}}
                  isInteractable={false}
                />
              </div>

              {/* Board A Chessboard with Vertical Eval Bar */}
              <div className="flex-1 min-h-0 flex items-center justify-center gap-1.5">
                <EvalBar
                  evalCentipawns={globalEvalCentipawns}
                  isGameOver={game.isGameOver}
                  winner={game.winner}
                  winProbability={currentMCTSResult?.team1WinProbability}
                  className="h-[264px] sm:h-[288px]"
                  orientation="vertical"
                />
                <ChessboardView
                  boardId="A"
                  board={game.boardA}
                  isInteractable={gameMode === "human" ? game.boardA.turn() === "w" : false}
                  selectedDropPiece={selectedDropPieceA}
                  onMakeMove={handleHumanMove}
                  lastMove={lastMoveA}
                  compact={true}
                />
              </div>

              {/* Board A White Reserve (Bottom - Human Click-to-Drop) */}
              <div className="w-full shrink-0">
                <ReservePocket
                  label="White Reserve (You)"
                  reserve={game.reserves.Aw}
                  color="w"
                  isCurrentTurn={game.boardA.turn() === "w"}
                  selectedDropPiece={selectedDropPieceA}
                  onSelectDropPiece={setSelectedDropPieceA}
                  isInteractable={gameMode === "human"}
                />
              </div>
            </div>

            {/* Board B Card */}
            <div className="bg-white/90 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-lg flex flex-col justify-between items-center gap-1 overflow-hidden transition-colors">
              {/* Board B Header */}
              <div className="w-full flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Board B</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (Partner AI vs Team 2)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      game.boardB.turn() === "w"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent"
                    }`}
                  >
                    Turn: {game.boardB.turn() === "w" ? "White" : "Black"}
                  </span>
                </div>
              </div>

              {/* Board B Black Reserve (Top - Partner Pieces) */}
              <div className="w-full shrink-0">
                <ReservePocket
                  label="Black Reserve (Partner)"
                  reserve={game.reserves.Bb}
                  color="b"
                  isCurrentTurn={game.boardB.turn() === "b"}
                  selectedDropPiece={null}
                  onSelectDropPiece={() => {}}
                  isInteractable={false}
                />
              </div>

              {/* Board B Chessboard */}
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <ChessboardView
                  boardId="B"
                  board={game.boardB}
                  isInteractable={false}
                  selectedDropPiece={null}
                  onMakeMove={handleHumanMove}
                  lastMove={lastMoveB}
                  compact={true}
                />
              </div>

              {/* Board B White Reserve (Bottom) */}
              <div className="w-full shrink-0">
                <ReservePocket
                  label="White Reserve (Opponent)"
                  reserve={game.reserves.Bw}
                  color="w"
                  isCurrentTurn={game.boardB.turn() === "w"}
                  selectedDropPiece={null}
                  onSelectDropPiece={() => {}}
                  isInteractable={false}
                />
              </div>
            </div>
          </div>

          {/* Bottom Move History Ribbon */}
          <div className="bg-white/90 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 font-mono shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] shrink-0 font-sans">
              <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Move Log:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pr-1 text-[11px]">
              {game.history.length === 0 ? (
                <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">Click a piece or reserve piece on Board A to play</span>
              ) : (
                game.history.slice(-8).map((h, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold shrink-0 text-[10px]"
                  >
                    B{h.board}:{h.san}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT COLUMN: MCTS DECISION ENGINE & LIVE SEARCH TREE     */}
        {/* --------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col min-h-0 gap-2 overflow-hidden">
          {/* Upper Section: MCTS Cognitive Metrics & Decision Banner */}
          <div className="shrink-0">
            <MCTSVisualizer
              lastResult={currentMCTSResult}
              isSearching={isSearching}
              activeBoard={currentActiveBoard}
              selectedBoardTab={selectedVisualizerBoard}
              onSelectBoardTab={setSelectedVisualizerBoard}
            />
          </div>

          {/* Lower Section: The Interactive MCTS Search Tree Explorer (ALWAYS VISIBLE!) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <MCTSTreeGraph
              tree={currentMCTSResult?.treeSnapshot || null}
              principalVariation={currentMCTSResult?.principalVariation || []}
              boardId={selectedVisualizerBoard}
              isSearching={isSearching}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
