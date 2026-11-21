import { runTournament } from "../ai/benchmarks";

async function main() {
  console.log("==================================================================");
  console.log("   BUGHOUSE MCTS ALGORITHM EXPERIMENT RUNNER");
  console.log("==================================================================\n");

  // Experiment 1: Heuristic-Guided Rollouts vs Vanilla Random Rollouts
  console.log("Running Experiment 1: Heuristic-Guided vs. Pure Random Rollouts...");
  const exp1 = runTournament(
    "Exp 1: Rollout Policy",
    "Compares Heuristic-Guided tactical rollouts vs Uniform Random rollouts",
    { rolloutPolicy: "heuristic", iterations: 60, maxTimeMs: 200 },
    { rolloutPolicy: "random", iterations: 60, maxTimeMs: 200 },
    6
  );

  console.log("\nResults for Experiment 1:");
  console.log(`- Config A (Heuristic) Wins: ${exp1.results.team1Wins} / ${exp1.results.gamesPlayed} (${((exp1.results.team1Wins / exp1.results.gamesPlayed) * 100).toFixed(0)}%)`);
  console.log(`- Config B (Random) Wins:    ${exp1.results.team2Wins} / ${exp1.results.gamesPlayed} (${((exp1.results.team2Wins / exp1.results.gamesPlayed) * 100).toFixed(0)}%)`);
  console.log(`- Draws:                     ${exp1.results.draws}`);
  console.log(`- Avg Moves per Game:        ${exp1.results.avgMoves}`);
  console.log(`- Avg Depth Reached:         ${exp1.results.avgDepth}`);

  // Experiment 2: Exploration Parameter (C)
  console.log("\n------------------------------------------------------------------");
  console.log("Running Experiment 2: UCB1 Exploration Tuning (C = 1.414 vs C = 0.5)...");
  const exp2 = runTournament(
    "Exp 2: UCB1 Exploration Parameter",
    "Compares standard theoretical exploration (C=sqrt(2)=1.414) vs greedy exploitation (C=0.5)",
    { cParam: 1.414, iterations: 60, maxTimeMs: 200 },
    { cParam: 0.5, iterations: 60, maxTimeMs: 200 },
    6
  );

  console.log("\nResults for Experiment 2:");
  console.log(`- Config A (C = 1.414) Wins: ${exp2.results.team1Wins} / ${exp2.results.gamesPlayed} (${((exp2.results.team1Wins / exp2.results.gamesPlayed) * 100).toFixed(0)}%)`);
  console.log(`- Config B (C = 0.5) Wins:   ${exp2.results.team2Wins} / ${exp2.results.gamesPlayed} (${((exp2.results.team2Wins / exp2.results.gamesPlayed) * 100).toFixed(0)}%)`);
  console.log(`- Draws:                     ${exp2.results.draws}`);

  // Experiment 3: Partner Uncertainty Modeling
  console.log("\n------------------------------------------------------------------");
  console.log("Running Experiment 3: Stochastic Partner Arrival Model vs. Static Model...");
  const exp3 = runTournament(
    "Exp 3: Partner Uncertainty Model",
    "Compares Stochastic Markov piece transfer model vs Static deterministic assumption",
    { enablePartnerUncertainty: true, iterations: 60, maxTimeMs: 200 },
    { enablePartnerUncertainty: false, iterations: 60, maxTimeMs: 200 },
    6
  );

  console.log("\nResults for Experiment 3:");
  console.log(`- Config A (Stochastic Model) Wins: ${exp3.results.team1Wins} / ${exp3.results.gamesPlayed}`);
  console.log(`- Config B (Static Model) Wins:     ${exp3.results.team2Wins} / ${exp3.results.gamesPlayed}`);
  console.log(`- Draws:                            ${exp3.results.draws}`);

  console.log("\n==================================================================");
  console.log("LATEX TABLE ROWS FOR OVERLEAF:");
  console.log(`\\textbf{Exp 1: Rollout Policy} & Heuristic-Guided vs. Pure Random & \\textbf{${((exp1.results.team1Wins/exp1.results.gamesPlayed)*100).toFixed(0)}\\% (${exp1.results.team1Wins}/${exp1.results.gamesPlayed})} & ${((exp1.results.team2Wins/exp1.results.gamesPlayed)*100).toFixed(0)}\\% (${exp1.results.team2Wins}/${exp1.results.gamesPlayed}) & ${exp1.results.draws} & ${exp1.results.avgDepth} ply \\\\`);
  console.log(`\\textbf{Exp 2: UCB1 Exploration} & Balanced ($C = 1.41$) vs. Greedy ($C = 0.5$) & \\textbf{${((exp2.results.team1Wins/exp2.results.gamesPlayed)*100).toFixed(0)}\\% (${exp2.results.team1Wins}/${exp2.results.gamesPlayed})} & ${((exp2.results.team2Wins/exp2.results.gamesPlayed)*100).toFixed(0)}\\% (${exp2.results.team2Wins}/${exp2.results.gamesPlayed}) & ${exp2.results.draws} & ${exp2.results.avgDepth} ply \\\\`);
  console.log(`\\textbf{Exp 3: Partner Model} & Stochastic Markov vs. Static Baseline & \\textbf{${((exp3.results.team1Wins/exp3.results.gamesPlayed)*100).toFixed(0)}\\% (${exp3.results.team1Wins}/${exp3.results.gamesPlayed})} & ${((exp3.results.team2Wins/exp3.results.gamesPlayed)*100).toFixed(0)}\\% (${exp3.results.team2Wins}/${exp3.results.gamesPlayed}) & ${exp3.results.draws} & ${exp3.results.avgDepth} ply \\\\`);
  console.log("==================================================================");
}

main().catch(console.error);
