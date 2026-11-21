import { Color, PieceSymbol, Square } from "chess.js";

export type BoardId = "A" | "B";
export type PlayerColor = "w" | "b";

export type ReservePiece = "p" | "n" | "b" | "r" | "q";

export interface Reserve {
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
}

export type MoveType = "standard" | "drop";

export interface StandardMove {
  type: "standard";
  from: Square;
  to: Square;
  promotion?: ReservePiece;
  san?: string;
  captured?: PieceSymbol;
}

export interface DropMove {
  type: "drop";
  piece: ReservePiece;
  to: Square;
  san?: string;
}

export type BughouseMove = StandardMove | DropMove;

export interface PlayerId {
  board: BoardId;
  color: PlayerColor;
}

export interface BughouseReserves {
  Aw: Reserve; // Board A White
  Ab: Reserve; // Board A Black
  Bw: Reserve; // Board B White
  Bb: Reserve; // Board B Black
}

export type Team = "Team1" | "Team2"; // Team 1: (A_w, B_b), Team 2: (A_b, B_w)

export interface BughouseState {
  fenA: string;
  fenB: string;
  turnA: PlayerColor;
  turnB: PlayerColor;
  reserves: BughouseReserves;
  isGameOver: boolean;
  winner?: Team | "draw";
  winReason?: string;
  moveHistory: {
    board: BoardId;
    color: PlayerColor;
    move: BughouseMove;
    san: string;
    timestamp: number;
  }[];
}
