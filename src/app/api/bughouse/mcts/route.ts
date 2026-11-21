import { NextRequest, NextResponse } from "next/server";
import { BughouseGame } from "@/engine/bughouseGame";
import { BughouseMCTS } from "@/ai/mcts";
import { BoardId, BughouseReserves } from "@/engine/types";
import { MCTSConfig } from "@/ai/types";

export const maxDuration = 10; // Vercel hobby tier timeout safeguard

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fenA,
      fenB,
      reserves,
      activeBoard = "A",
      config = {},
    }: {
      fenA?: string;
      fenB?: string;
      reserves?: BughouseReserves;
      activeBoard?: BoardId;
      config?: Partial<MCTSConfig>;
    } = body;

    const game = new BughouseGame(fenA, fenB, reserves);
    const mcts = new BughouseMCTS({
      maxTimeMs: 800, // Safe buffer for Vercel serverless latency
      iterations: 200,
      ...config,
    });

    const searchResult = mcts.search(game, activeBoard);

    return NextResponse.json({
      success: true,
      result: searchResult,
      state: game.toState(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run MCTS search" },
      { status: 400 }
    );
  }
}
