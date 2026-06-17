#!/usr/bin/env node
// T-180-01 — read-only extractor. Replays the committed VOTES=6 crater run and prints the MATCHED-build
// (A-matched, conditions["0"]) Layer-A items per vote, plus the build's block census, so AUDIT.md's table
// is regenerable rather than hand-transcribed. No writes; not wired into any test or pipeline.
//
//   node docs/active/work/T-180-01/extract-audit.mjs
import { readFileSync } from "node:fs";

const RESULTS = "experiments/eval-alignment/results/corpus-referee-faithful-covered.json";
const ARTIFACT = "builds/gatehouse/faithful-covered/artifact.json";

const j = JSON.parse(readFileSync(RESULTS, "utf8"));
const A = j.crater.conditions["0"];
console.log(`# A-matched: key=${A.key} tier=${A.tier} pack=${A.pack}`);
console.log(`# scoreMean=${A.scoreMean} scoreStd=${A.scoreStd} (votes=${A.votes.length})\n`);

const tally = { replace: 0, add: 0, remove: 0, byDept: {} };
A.votes.forEach((v, vi) => {
  console.log(`## vote ${vi + 1}  score=${v.score}  nWrongStyle=${v.nWrongStyle}  capped=${v.wrongStyleCapped}`);
  v.items.forEach((it) => {
    tally[it.kind] = (tally[it.kind] ?? 0) + 1;
    const d = (tally.byDept[it.department] ??= { replace: 0, add: 0, remove: 0 });
    d[it.kind] = (d[it.kind] ?? 0) + 1;
    const short = (s) => (s || "").replace(/\s+/g, " ").slice(0, 70);
    console.log(`  ${it.department.padEnd(8)} ${it.kind.padEnd(7)} ${String(it.styleClass).padEnd(11)} | ${short(it.present)} ⇢ ${short(it.missing)}`);
  });
  console.log("");
});

console.log("## kind totals:", JSON.stringify(tally.byDept));
console.log("## overall:", `replace=${tally.replace} add=${tally.add ?? 0} remove=${tally.remove ?? 0}`);

// Build census (the "present" ground truth).
const a = JSON.parse(readFileSync(ARTIFACT, "utf8"));
const census = {};
for (const p of a.placements) census[p.block] = (census[p.block] ?? 0) + 1;
console.log("\n## build census:", JSON.stringify(Object.fromEntries(
  Object.entries(census).sort((x, y) => y[1] - x[1]))));
