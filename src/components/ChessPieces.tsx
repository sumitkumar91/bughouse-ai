import React from "react";
import { PieceSymbol } from "chess.js";
import { PlayerColor } from "@/engine/types";

interface PieceProps {
  type: PieceSymbol | string;
  color: PlayerColor;
  className?: string;
}

export const ChessPieceIcon: React.FC<PieceProps> = ({ type, color, className = "w-9 h-9" }) => {
  const isWhite = color === "w";
  const stroke = isWhite ? "#1e293b" : "#f8fafc";
  const fill = isWhite ? "#ffffff" : "#1e293b";

  switch (type.toLowerCase()) {
    case "p":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "n":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 20.5,5.5 22,10 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="15" cy="14" r="1.5" fill={stroke} />
        </svg>
      );
    case "b":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,23.5 C 27.5,21 29,18 27.5,14 C 26,10 24,9 22.5,9 C 21,9 19,10 17.5,14 C 16,18 17.5,21 17.5,23.5 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="22.5" cy="7" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 22.5,12 L 22.5,18 M 19.5,15 L 25.5,15" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case "r":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M 9,39 L 36,39 L 36,36 L 9,36 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 12,36 L 12,32 L 33,32 L 33,36 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 14,17 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 14,17 L 14,29.5 L 31,29.5 L 31,17 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 14,29.5 L 11,32 L 34,32 L 31,29.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "q":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M 8 12 A 2 2 0 1 1 8 16 A 2 2 0 1 1 8 12 z M 15 8 A 2 2 0 1 1 15 12 A 2 2 0 1 1 15 8 z M 22.5 6 A 2 2 0 1 1 22.5 10 A 2 2 0 1 1 22.5 6 z M 30 8 A 2 2 0 1 1 30 12 A 2 2 0 1 1 30 8 z M 37 12 A 2 2 0 1 1 37 16 A 2 2 0 1 1 37 12 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38.5 L 35,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "k":
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M 22.5,11.63 L 22.5,6"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 20,8 L 25,8"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 33.5,34 31,31 31,31 C 31,31 34.5,29.5 34.5,26 C 34.5,22.5 31.5,21 31.5,21 C 31.5,21 30.5,19.5 28,20 C 25.5,20.5 22.5,24.5 22.5,24.5 C 22.5,24.5 19.5,20.5 17,20 C 14.5,19.5 13.5,21 13.5,21 C 13.5,21 10.5,22.5 10.5,26 C 10.5,29.5 14,31 14,31 C 14,31 11.5,34 11.5,37 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    default:
      return null;
  }
};
