import { BughouseGame } from "../engine/bughouseGame";
import { BoardId, BughouseMove, PlayerColor, Team } from "../engine/types";
import { evaluateBughousePosition } from "../engine/evaluation";
import { calculateMovePriors } from "./priors";
import { applyStochasticPartnerEvents } from "./partnerModel";
import { selectHeuristicMove, selectRandomMove } from "./rolloutPolicies";
import { CandidateMoveInfo, DEFAULT_MCTS_CONFIG, MCTSConfig, MCTSResult, MCTSTreeNodeData } from "./types";

/**
 * Sigmoid function converting centipawns to [0, 1] win probability
 * 400 centipawns (~4 pawns) maps to ~0.90 win rate
 */
function sigmoidEval(centipawns: number): number {
  return 1 / (1 + Math.exp(-centipawns / 200.0));
}

export class MCTSNode {
  public game: BughouseGame;
  public parent: MCTSNode | null;
  public moveFromParent: BughouseMove | null;
  public children: MCTSNode[] = [];
  public visits: number = 0;
  public totalRewardTeam1: number = 0; // Cumulative win reward for Team 1 in [0, N]
  public activeBoardId: BoardId;
  public turnColor: PlayerColor;
  public turnTeam: Team;
  public prior: number = 1.0;

  constructor(
    game: BughouseGame,
    activeBoardId: BoardId,
    parent: MCTSNode | null = null,
    moveFromParent: BughouseMove | null = null,
    prior: number = 1.0
  ) {
    this.game = game;
    this.activeBoardId = activeBoardId;
    this.parent = parent;
    this.moveFromParent = moveFromParent;
    this.prior = prior;

    const board = activeBoardId === "A" ? game.boardA : game.boardB;
    this.turnColor = board.turn();

    // Determine which team's turn it is at this node:
    // Team 1: (A_w, B_b). Team 2: (A_b, B_w).
    if (activeBoardId === "A") {
      this.turnTeam = this.turnColor === "w" ? "Team1" : "Team2";
    } else {
      this.turnTeam = this.turnColor === "b" ? "Team1" : "Team2";
    }
  }

  public isTerminal(): boolean {
    return this.game.isGameOver;
  }

  public isExpanded(): boolean {
    return this.children.length > 0;
  }

  /**
   * Polynomial Upper Confidence Trees (PUCT) Selection
   * Supports true zero-sum adversarial minimax:
   * Team 1 maximizes Team 1's win rate, while Team 2 maximizes Team 2's win rate!
   */
  public selectBestChild(cpuct: number, rootTeam: Team): MCTSNode {
    let bestChild = this.children[0];
    let bestScore = -Infinity;
    const isTeam1 = this.turnTeam === "Team1";

    const sqrtParentVisits = Math.sqrt(Math.max(this.visits, 1));

    for (const child of this.children) {
      // Exploitation: Win rate from perspective of the team whose turn it is to move
      let qValue = 0.5;
      if (child.visits > 0) {
        const team1WinRate = child.totalRewardTeam1 / child.visits;
        qValue = isTeam1 ? team1WinRate : 1.0 - team1WinRate;
      }

      // Exploration: PUCT formula with heuristic prior
      const uValue = cpuct * child.prior * (sqrtParentVisits / (1 + child.visits));
      const totalScore = qValue + uValue;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestChild = child;
      }
    }

    return bestChild;
  }
}

export class BughouseMCTS {
  private config: MCTSConfig;

  constructor(config: Partial<MCTSConfig> = {}) {
    this.config = { ...DEFAULT_MCTS_CONFIG, ...config };
  }

  public getRootTeam(boardId: BoardId, color: PlayerColor): Team {
    if (boardId === "A") {
      return color === "w" ? "Team1" : "Team2";
    } else {
      return color === "b" ? "Team1" : "Team2";
    }
  }

  /**
   * Runs PUCT Monte Carlo Tree Search
   */
  public search(game: BughouseGame, activeBoardId: BoardId): MCTSResult {
    const startTime = Date.now();
    const board = activeBoardId === "A" ? game.boardA : game.boardB;
    const activeColor = board.turn();
    const rootTeam = this.getRootTeam(activeBoardId, activeColor);

    const rootLegalMoves = game.getLegalMoves(activeBoardId);
    if (rootLegalMoves.length === 0) {
      throw new Error(`No legal moves available on Board ${activeBoardId}`);
    }

    // Root node
    const root = new MCTSNode(game.clone(), activeBoardId, null, null, 1.0);

    // Expand root node immediately with PUCT priors
    this.expandNode(root);

    let maxDepthReached = 0;
    let iterationCount = 0;

    while (
      iterationCount < this.config.iterations &&
      Date.now() - startTime < this.config.maxTimeMs
    ) {
      let node = root;
      let depth = 0;

      // 1. SELECTION (traverse tree using adversarial PUCT)
      while (!node.isTerminal() && node.isExpanded()) {
        node = node.selectBestChild(this.config.cParam, rootTeam);
        depth++;
      }

      if (depth > maxDepthReached) {
        maxDepthReached = depth;
      }

      // 2. EXPANSION (if unvisited non-terminal leaf)
      if (!node.isTerminal() && node.visits > 0 && !node.isExpanded()) {
        this.expandNode(node);
        if (node.children.length > 0) {
          node = node.selectBestChild(this.config.cParam, rootTeam);
          depth++;
        }
      }

      // 3. SIMULATION / LEAF EVALUATION
      const rewardTeam1 = this.simulateOrEvaluate(node.game, activeBoardId);

      // 4. BACKPROPAGATION
      let curr: MCTSNode | null = node;
      while (curr !== null) {
        curr.visits++;
        curr.totalRewardTeam1 += rewardTeam1;
        curr = curr.parent;
      }

      iterationCount++;
    }

    // Extract Principal Variation (PV line)
    const principalVariation: string[] = [];
    let pvCurr: MCTSNode = root;
    while (pvCurr.children.length > 0 && principalVariation.length < 5) {
      const best = [...pvCurr.children].sort((a, b) => b.visits - a.visits)[0];
      if (!best || best.visits === 0 || !best.moveFromParent) break;
      principalVariation.push(best.moveFromParent.san || "move");
      pvCurr = best;
    }

    // Identify candidate moves with PUCT visit stats
    const isRootTeam1 = rootTeam === "Team1";
    const sqrtRootVisits = Math.sqrt(Math.max(root.visits, 1));
    const candidates: CandidateMoveInfo[] = root.children.map((child) => {
      const team1Rate = child.visits > 0 ? child.totalRewardTeam1 / child.visits : 0.5;
      const winRate = isRootTeam1 ? team1Rate : 1.0 - team1Rate;
      const uValue = this.config.cParam * child.prior * (sqrtRootVisits / (1 + child.visits));
      return {
        move: child.moveFromParent!,
        san: child.moveFromParent!.san || `${child.moveFromParent!.type}`,
        visits: child.visits,
        winRate: Number(winRate.toFixed(3)),
        qValue: Number(winRate.toFixed(3)),
        prior: Number(child.prior.toFixed(3)),
        uValue: Number(uValue.toFixed(3)),
      };
    });

    // Sort by visit count (most robust MCTS selection)
    candidates.sort((a, b) => b.visits - a.visits);

    const best = candidates[0] || {
      move: rootLegalMoves[0],
      san: rootLegalMoves[0].san || "move",
      visits: 1,
      winRate: 0.5,
      qValue: 0.5,
      prior: 0.1,
      uValue: 0.1,
    };

    // Serialize tree snapshot up to depth 3 for the interactive visualizer
    const treeSnapshot = serializeMCTSTree(root, 0, 3, 5, rootTeam, this.config.cParam, principalVariation);

    // Compute consistent Team 1 perspective win probability and static centipawn evaluation
    const team1RootWinRate = root.visits > 0 ? root.totalRewardTeam1 / root.visits : 0.5;
    const evalCentipawns = evaluateBughousePosition(game);

    return {
      bestMove: best.move,
      bestSan: best.san,
      winProbability: Math.min(Math.max(best.winRate, 0.01), 0.99),
      team1WinProbability: Math.min(Math.max(team1RootWinRate, 0.01), 0.99),
      evalCentipawns,
      simulations: iterationCount,
      maxTreeDepth: maxDepthReached,
      timeMs: Date.now() - startTime,
      branchingFactor: rootLegalMoves.length,
      topMoves: candidates.slice(0, 5),
      principalVariation,
      treeSnapshot,
      boardId: activeBoardId,
      color: activeColor,
    };
  }

  /**
   * Expands node children using calculated PUCT priors
   */
  private expandNode(node: MCTSNode): void {
    const legalMoves = node.game.getLegalMoves(node.activeBoardId);
    if (legalMoves.length === 0) return;

    const board = node.activeBoardId === "A" ? node.game.boardA : node.game.boardB;
    const priorsMap = calculateMovePriors(board, legalMoves);

    for (const move of legalMoves) {
      const nextGame = node.game.clone();
      nextGame.makeMove(node.activeBoardId, move);
      const prior = priorsMap.get(move) || (1.0 / legalMoves.length);

      const child = new MCTSNode(
        nextGame,
        node.activeBoardId,
        node,
        move,
        prior
      );
      node.children.push(child);
    }
  }

  /**
   * Evaluates or rolls out position, returning Team 1 win probability in [0, 1]
   */
  private simulateOrEvaluate(state: BughouseGame, activeBoardId: BoardId): number {
    if (state.isGameOver) {
      if (state.winner === "Team1") return 1.0;
      if (state.winner === "Team2") return 0.0;
      return 0.5;
    }

    const simGame = state.clone();
    let currentDepth = 0;

    // Fast tactical rollout (3 to 6 moves) to check for instant drop-mates
    while (!simGame.isGameOver && currentDepth < 4) {
      if (this.config.enablePartnerUncertainty) {
        applyStochasticPartnerEvents(simGame, activeBoardId, this.config.partnerCaptureRate);
      }

      const legalMoves = simGame.getLegalMoves(activeBoardId);
      if (legalMoves.length === 0) break;

      const board = activeBoardId === "A" ? simGame.boardA : simGame.boardB;
      const chosenMove = this.config.rolloutPolicy === "heuristic"
        ? selectHeuristicMove(board, legalMoves, 0.15)
        : selectRandomMove(legalMoves);

      simGame.makeMove(activeBoardId, chosenMove);
      currentDepth++;
    }

    if (simGame.isGameOver) {
      if (simGame.winner === "Team1") return 1.0;
      if (simGame.winner === "Team2") return 0.0;
      return 0.5;
    }

    // High-precision Positional Evaluation (PST + Material + King Drop Safety)
    const evalScore = evaluateBughousePosition(simGame);
    return sigmoidEval(evalScore);
  }
}

/**
 * Serializes the MCTS search tree for interactive graph visualization
 */
function serializeMCTSTree(
  node: MCTSNode,
  depth: number,
  maxDepth: number,
  maxChildren: number,
  rootTeam: Team,
  cpuct: number,
  pvMoves: string[] = [],
  path: string = "root"
): MCTSTreeNodeData {
  const isMoverTeam1 = node.parent ? node.parent.turnTeam === "Team1" : rootTeam === "Team1";
  const parentVisits = node.parent ? node.parent.visits : node.visits;
  const sqrtParent = Math.sqrt(Math.max(parentVisits, 1));

  const team1Rate = node.visits > 0 ? node.totalRewardTeam1 / node.visits : 0.5;
  // Exploitation Q from perspective of the team whose turn it was to choose at parent:
  const qValue = isMoverTeam1 ? team1Rate : 1.0 - team1Rate;
  const uValue = cpuct * node.prior * (sqrtParent / (1 + node.visits));

  const moveSan = node.moveFromParent?.san;
  const isPv = depth === 0 || (Boolean(moveSan) && pvMoves[depth - 1] === moveSan);
  const currentPath = `${path}/${moveSan || `root-${node.activeBoardId}`}`;

  const sortedChildren = [...node.children]
    .filter((c) => c.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, maxChildren);

  const childrenData =
    depth < maxDepth
      ? sortedChildren.map((c) =>
          serializeMCTSTree(c, depth + 1, maxDepth, depth === 0 ? 5 : 3, rootTeam, cpuct, pvMoves, currentPath)
        )
      : [];

  return {
    id: currentPath,
    san: node.moveFromParent?.san || `Root (${node.activeBoardId})`,
    visits: node.visits,
    winRate: Number(qValue.toFixed(3)),
    qValue: Number(qValue.toFixed(3)),
    uValue: Number(uValue.toFixed(3)),
    puctScore: Number((qValue + uValue).toFixed(3)),
    prior: Number(node.prior.toFixed(3)),
    isDrop: node.moveFromParent?.type === "drop",
    color: node.turnColor,
    isPv,
    children: childrenData,
  };
}
