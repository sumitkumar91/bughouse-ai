import { BoardId, BughouseMove, BughouseReserves, BughouseState, PlayerColor, Reserve, ReservePiece, Team } from "./types";
import { SingleBoard } from "./singleBoard";

export function createEmptyReserve(): Reserve {
  return { p: 0, n: 0, b: 0, r: 0, q: 0 };
}

export function createInitialReserves(): BughouseReserves {
  return {
    Aw: createEmptyReserve(),
    Ab: createEmptyReserve(),
    Bw: createEmptyReserve(),
    Bb: createEmptyReserve(),
  };
}

export function cloneReserve(r: Reserve): Reserve {
  return { ...r };
}

export function cloneReserves(r: BughouseReserves): BughouseReserves {
  return {
    Aw: cloneReserve(r.Aw),
    Ab: cloneReserve(r.Ab),
    Bw: cloneReserve(r.Bw),
    Bb: cloneReserve(r.Bb),
  };
}

export class BughouseGame {
  public boardA: SingleBoard;
  public boardB: SingleBoard;
  public reserves: BughouseReserves;
  public isGameOver: boolean = false;
  public winner?: Team | "draw";
  public winReason?: string;
  public history: BughouseState["moveHistory"] = [];

  constructor(
    fenA?: string,
    fenB?: string,
    reserves?: BughouseReserves,
    boardAPromoted?: Set<any>,
    boardBPromoted?: Set<any>
  ) {
    this.boardA = new SingleBoard(fenA, boardAPromoted);
    this.boardB = new SingleBoard(fenB, boardBPromoted);
    this.reserves = reserves ? cloneReserves(reserves) : createInitialReserves();
    this.checkTerminal();
  }

  public clone(): BughouseGame {
    const cloned = new BughouseGame(
      this.boardA.fen(),
      this.boardB.fen(),
      this.reserves,
      this.boardA.promotedSquares,
      this.boardB.promotedSquares
    );
    cloned.isGameOver = this.isGameOver;
    cloned.winner = this.winner;
    cloned.winReason = this.winReason;
    cloned.history = [...this.history];
    return cloned;
  }

  public getReserve(board: BoardId, color: PlayerColor): Reserve {
    const key = `${board}${color}` as keyof BughouseReserves;
    return this.reserves[key];
  }

  public getTeammateReserveKey(board: BoardId, color: PlayerColor): keyof BughouseReserves {
    // Teammates in Bughouse:
    // Board A White (Aw) is teammates with Board B Black (Bb) -> Team 1
    // Board A Black (Ab) is teammates with Board B White (Bw) -> Team 2
    // If Aw captures a Black piece, it goes to Aw's partner!
    // Aw's partner is Board B Black, BUT Board B Black drops pieces of THEIR color (Black).
    // In standard Bughouse rules:
    // A player captures an opponent's piece -> piece changes to YOUR team's color -> your teammate gets it!
    // Example: Board A White captures a Black Knight -> Knight turns White -> given to Board B White!
    // Wait! Let's verify standard Bughouse pairing:
    // Team 1: Player A_White and Player B_Black.
    // When Player A_White captures a black piece, Player B_Black receives it to drop as BLACK!
    // When Player B_Black captures a white piece, Player A_White receives it to drop as WHITE!
    if (board === "A") {
      return color === "w" ? "Bb" : "Bw";
    } else {
      return color === "w" ? "Ab" : "Aw";
    }
  }

  /**
   * Returns legal moves for a specific board and current turn.
   */
  public getLegalMoves(boardId: BoardId): BughouseMove[] {
    if (this.isGameOver) return [];
    const board = boardId === "A" ? this.boardA : this.boardB;
    const color = board.turn();
    const reserve = this.getReserve(boardId, color);
    return board.getLegalMoves(reserve);
  }

  /**
   * Executes a move on the specified board.
   */
  public makeMove(boardId: BoardId, move: BughouseMove): boolean {
    if (this.isGameOver) return false;

    const board = boardId === "A" ? this.boardA : this.boardB;
    const movingColor = board.turn();

    // If it's a drop move, decrement from moving player's reserve
    if (move.type === "drop") {
      const myReserveKey = `${boardId}${movingColor}` as keyof BughouseReserves;
      if (this.reserves[myReserveKey][move.piece] <= 0) {
        return false; // piece not in reserve
      }
      this.reserves[myReserveKey][move.piece]--;
    }

    const { capturedPiece, san } = board.makeMove(move);

    // If a piece was captured, transfer it to teammate's reserve!
    if (capturedPiece) {
      const partnerKey = this.getTeammateReserveKey(boardId, movingColor);
      this.reserves[partnerKey][capturedPiece]++;
    }

    this.history.push({
      board: boardId,
      color: movingColor,
      move,
      san,
      timestamp: Date.now(),
    });

    this.checkTerminal();
    return true;
  }

  /**
   * Evaluates terminal conditions across both boards.
   */
  public checkTerminal(): void {
    // Check Board A
    if (this.boardA.isCheckmate()) {
      this.isGameOver = true;
      // If Board A White is checkmated, Team 2 wins. If Black is checkmated, Team 1 wins.
      if (this.boardA.turn() === "w") {
        this.winner = "Team2";
        this.winReason = "Board A White was checkmated";
      } else {
        this.winner = "Team1";
        this.winReason = "Board A Black was checkmated";
      }
      return;
    }

    // Check Board B
    if (this.boardB.isCheckmate()) {
      this.isGameOver = true;
      // In Bughouse: Team 1 has Board B Black. Team 2 has Board B White.
      // If Board B White is checkmated, Team 1 wins. If Black is checkmated, Team 2 wins.
      if (this.boardB.turn() === "w") {
        this.winner = "Team1";
        this.winReason = "Board B White was checkmated";
      } else {
        this.winner = "Team2";
        this.winReason = "Board B Black was checkmated";
      }
      return;
    }

    // Stalemate checks
    if (this.boardA.isDraw() || this.boardB.isDraw()) {
      // If either board has no legal moves and is not in check
      const movesA = this.getLegalMoves("A");
      const movesB = this.getLegalMoves("B");
      if (movesA.length === 0 && !this.boardA.inCheck()) {
        this.isGameOver = true;
        this.winner = "draw";
        this.winReason = "Stalemate on Board A";
      } else if (movesB.length === 0 && !this.boardB.inCheck()) {
        this.isGameOver = true;
        this.winner = "draw";
        this.winReason = "Stalemate on Board B";
      }
    }
  }

  public toState(): BughouseState {
    return {
      fenA: this.boardA.fen(),
      fenB: this.boardB.fen(),
      turnA: this.boardA.turn(),
      turnB: this.boardB.turn(),
      reserves: cloneReserves(this.reserves),
      isGameOver: this.isGameOver,
      winner: this.winner,
      winReason: this.winReason,
      moveHistory: [...this.history],
    };
  }
}
