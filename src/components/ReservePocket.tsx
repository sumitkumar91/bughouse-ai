import React from "react";
import { PlayerColor, Reserve, ReservePiece } from "@/engine/types";
import { ChessPieceIcon } from "./ChessPieces";

interface ReservePocketProps {
  label: string;
  reserve: Reserve;
  color: PlayerColor;
  isCurrentTurn: boolean;
  selectedDropPiece: ReservePiece | null;
  onSelectDropPiece: (piece: ReservePiece | null) => void;
  isInteractable?: boolean;
}

const PIECE_ORDER: ReservePiece[] = ["q", "r", "b", "n", "p"];

export const ReservePocket: React.FC<ReservePocketProps> = ({
  label,
  reserve,
  color,
  isCurrentTurn,
  selectedDropPiece,
  onSelectDropPiece,
  isInteractable = false,
}) => {
  const totalPieces = Object.values(reserve).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs transition-all ${
        isCurrentTurn
          ? "border-amber-400/80 bg-amber-50/80 shadow-sm shadow-amber-200/50 dark:border-amber-500/50 dark:bg-amber-500/10 dark:shadow-amber-500/20"
          : "border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/80"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs truncate max-w-[130px] sm:max-w-none">
          {label}
        </span>
        <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-bold">
          {totalPieces}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {PIECE_ORDER.map((p) => {
          const count = reserve[p];
          const isSelected = selectedDropPiece === p;
          const canDrop = isInteractable && isCurrentTurn && count > 0;

          return (
            <button
              key={p}
              disabled={!canDrop}
              onClick={() => {
                if (!canDrop) return;
                onSelectDropPiece(isSelected ? null : p);
              }}
              className={`relative flex items-center justify-center w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-md transition-all ${
                isSelected
                  ? "bg-amber-400/30 ring-2 ring-amber-500 scale-105"
                  : count > 0
                  ? canDrop
                    ? "bg-white hover:bg-slate-100 border border-slate-200/90 shadow-xs cursor-pointer hover:scale-105 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700"
                    : "bg-slate-100/90 border border-slate-200/60 opacity-90 dark:bg-slate-800/80 dark:border-slate-700/50"
                  : "bg-slate-100/40 opacity-25 cursor-not-allowed dark:bg-slate-900/40"
              }`}
              title={`${p.toUpperCase()}: ${count} available`}
            >
              <ChessPieceIcon type={p} color={color} className="w-5 h-5" />
              {count > 0 && (
                <span
                  className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[9px] font-bold rounded-full ${
                    isSelected
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
