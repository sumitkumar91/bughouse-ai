import { NextRequest, NextResponse } from "next/server";
import { runTournament } from "@/ai/benchmarks";
import { MCTSConfig } from "@/ai/types";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      experiment = "rolloutPolicy",
      numGames = 4,
    }: {
      experiment: "rolloutPolicy" | "cParam" | "partnerUncertainty";
      numGames?: number;
    } = body;

    let configA: Partial<MCTSConfig> = {};
    let configB: Partial<MCTSConfig> = {};
    let expName = "";
    let expDesc = "";

    if (experiment === "rolloutPolicy") {
      expName = "Heuristic-Guided vs. Pure Random Rollout";
      expDesc = "Compares tactical piece weighting vs uniform random move selection in MCTS rollouts";
      configA = { rolloutPolicy: "heuristic", iterations: 60, maxTimeMs: 300 };
      configB = { rolloutPolicy: "random", iterations: 60, maxTimeMs: 300 };
    } else if (experiment === "cParam") {
      expName = "UCB1 Exploration Parameter (C = 1.414 vs C = 0.5)";
      expDesc = "Compares balanced exploration vs greedy exploitation in UCB1";
      configA = { cParam: 1.414, iterations: 60, maxTimeMs: 300 };
      configB = { cParam: 0.5, iterations: 60, maxTimeMs: 300 };
    } else {
      expName = "Stochastic Partner Arrival Model vs. Static Model";
      expDesc = "Compares active uncertainty modeling of incoming partner piece transfers vs static board assumption";
      configA = { enablePartnerUncertainty: true, iterations: 60, maxTimeMs: 300 };
      configB = { enablePartnerUncertainty: false, iterations: 60, maxTimeMs: 300 };
    }

    const comparison = runTournament(expName, expDesc, configA, configB, Math.min(numGames, 10));

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute benchmark" },
      { status: 500 }
    );
  }
}
