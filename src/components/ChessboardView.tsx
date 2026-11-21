import React, { useState } from "react";
import { Square, PieceSymbol } from "chess.js";
import { BoardId, BughouseMove, PlayerColor, ReservePiece } from "@/engine/types";
import { SingleBoard } from "@/engine/singleBoard";
import { ChessPieceIcon } from "./ChessPieces";

interface ChessboardViewProps {
  boardId: BoardId;
  board: SingleBoard;
  isInteractable: boolean;
  selectedDropPiece: ReservePiece | null;
  onMakeMove: (boardId: BoardId, move: BughouseMove) => void;
  lastMove?: { from?: Square; to?: Square };
  compact?: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  boardId,
  board,
  isInteractable,
  selectedDropPiece,
  onMakeMove,
  lastMove,
  compact = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const currentTurn = board.turn();
  const inCheck = board.inCheck();
  const isCheckmate = board.isCheckmate();

  // Find King square if in check
  let checkKingSquare: Square | null = null;
  if (inCheck) {
    for (const r of RANKS) {
      for (const f of FILES) {
        const sq = `${f}${r}` as Square;
        const p = board.chess.get(sq);
        if (p && p.type === "k" && p.color === currentTurn) {
          checkKingSquare = sq;
          break;
        }
      }
      if (checkKingSquare) break;
    }
  }

  // Calculate legal targets for selected piece
  const legalStandardMoves = isInteractable && selectedSquare
    ? board.chess.moves({ square: selectedSquare, verbose: true })
    : [];
  const targetSquares = new Set(legalStandardMoves.map((m) => m.to));

  // Calculate valid drop squares if a drop piece is selected
  const validDropSquares = new Set<Square>();
  if (isInteractable && selectedDropPiece) {
    for (const r of RANKS) {
      for (const f of FILES) {
        const sq = `${f}${r}` as Square;
        if (!board.chess.get(sq)) {
          // Pawn restrictions
          if (selectedDropPiece === "p" && (sq.endsWith("1") || sq.endsWith("8"))) {
            continue;
          }
          // Legality check: cannot leave king in check
          board.chess.put({ type: selectedDropPiece as PieceSymbol, color: currentTurn }, sq);
          const safe = !board.chess.inCheck();
          board.chess.remove(sq);
          if (safe) {
            validDropSquares.add(sq);
          }
        }
      }
    }
  }

  const handleSquareClick = (sq: Square) => {
    if (!isInteractable) return;

    // 1. If drop mode is active and user clicked a valid drop square
    if (selectedDropPiece && validDropSquares.has(sq)) {
      onMakeMove(boardId, {
        type: "drop",
        piece: selectedDropPiece,
        to: sq,
      });
      return;
    }

    // 2. If a piece was already selected and user clicks a legal target square
    if (selectedSquare && targetSquares.has(sq)) {
      const isPromotion =
        board.chess.get(selectedSquare)?.type === "p" &&
        (sq.endsWith("8") || sq.endsWith("1"));

      onMakeMove(boardId, {
        type: "standard",
        from: selectedSquare,
        to: sq,
        promotion: isPromotion ? "q" : undefined,
      });
      setSelectedSquare(null);
      return;
    }

    // 3. Select own piece
    const piece = board.chess.get(sq);
    if (piece && piece.color === currentTurn) {
      setSelectedSquare(sq === selectedSquare ? null : sq);
    } else {
      setSelectedSquare(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 8x8 Board Container */}
      <div className="relative border-2 sm:border-3 border-slate-700 rounded-lg overflow-hidden shadow-xl bg-slate-900 select-none">
        <div
          className={`grid grid-cols-8 grid-rows-8 transition-all ${
            compact
              ? "w-[264px] h-[264px] sm:w-[288px] h-[288px]"
              : "w-[272px] h-[272px] sm:w-[296px] sm:h-[296px] xl:w-[320px] xl:h-[320px] 2xl:w-[344px] 2xl:h-[344px]"
          }`}
        >
          {RANKS.map((r, rIdx) =>
            FILES.map((f, fIdx) => {
              const sq = `${f}${r}` as Square;
              const isDark = (rIdx + fIdx) % 2 === 1;
              const piece = board.chess.get(sq);

              const isSelected = selectedSquare === sq;
              const isTarget = targetSquares.has(sq);
              const isValidDrop = validDropSquares.has(sq);
              const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
              const isCheckKing = checkKingSquare === sq;

              let squareBg = isDark ? "bg-[#b58863]" : "bg-[#f0d9b5]";
              if (isSelected) squareBg = "bg-[#baca2b]";
              else if (isLastMove) squareBg = isDark ? "bg-[#aaa23a]" : "bg-[#cdd26a]";

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors ${squareBg}`}
                >
                  {/* File & Rank labels */}
                  {f === "a" && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] font-bold ${
                        isDark ? "text-[#f0d9b5]/80" : "text-[#b58863]/80"
                      }`}
                    >
                      {r}
                    </span>
                  )}
                  {r === "1" && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] font-bold ${
                        isDark ? "text-[#f0d9b5]/80" : "text-[#b58863]/80"
                      }`}
                    >
                      {f}
                    </span>
                  )}

                  {/* King Check Red Glow */}
                  {isCheckKing && (
                    <div className="absolute inset-0 bg-red-600/60 rounded-full animate-pulse" />
                  )}

                  {/* Target square indicator dot */}
                  {isTarget && !piece && (
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-900/30 z-10" />
                  )}

                  {/* Target square capture ring */}
                  {isTarget && piece && (
                    <div className="absolute inset-1 rounded-full border-4 border-slate-900/35 z-10" />
                  )}

                  {/* Drop target green ring */}
                  {isValidDrop && (
                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-emerald-600 bg-emerald-500/20 animate-pulse z-10" />
                  )}

                  {/* Piece Graphic */}
                  {piece && (
                    <div className="relative z-10">
                      <ChessPieceIcon
                        type={piece.type}
                        color={piece.color as PlayerColor}
                        className={
                          compact
                            ? "w-6 h-6 sm:w-7 sm:h-7"
                            : "w-7 h-7 sm:w-8 sm:h-8 xl:w-9 xl:h-9"
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
