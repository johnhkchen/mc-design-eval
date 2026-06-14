// Per-subject thin-routing report runner (T-065-01 / S-065 / E-19) — the thin I/O host over the PURE
// assembler in src/form/form-routing.mjs. Reads the already-collected E-18 spine (e18-remeasure.json)
// and writes the before(universal-thin)/after(routed) form IoU + occupancy comparison ×7.
//
// NO GL, NO model, NO network — routing is a deterministic read of the spine + the subject-keyed routing
// config (the two voxelizers were already measured into the spine). Mirrors e18-scorecard.mjs's runner:
// read JSON spine → call the pure assembler → write {md, json}.
//
//   node benchmarks/sculpture/form-routing.mjs            # default spine + out paths
//   node benchmarks/sculpture/form-routing.mjs <spine.json> <out-prefix>

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assembleRoutingReport } from "../../src/form/form-routing.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

function main() {
  const [, , spineArg, prefixArg] = process.argv;
  const spinePath = spineArg || join(HERE, "e18-remeasure.json");
  const outPrefix = prefixArg || join(HERE, "form-routing");

  const spine = JSON.parse(readFileSync(spinePath, "utf8"));
  const { md, json } = assembleRoutingReport(spine, { generatedFrom: `routed pick over ${spinePath.replace(HERE + "/", "")}` });

  writeFileSync(`${outPrefix}.json`, JSON.stringify(json, null, 2) + "\n");
  writeFileSync(`${outPrefix}.md`, md);

  const a = json.averages.formIoU;
  const o = json.occupancy;
  console.log(`form-routing: ${json.subjects.length} subjects @ scale ${json.scale}`);
  console.log(`  form IoU avg ${a.before}→${a.after} (${a.delta >= 0 ? "+" : ""}${a.delta})`);
  console.log(`  occupancy   ${o.before}→${o.after} (${o.delta} cells; solids dropped ${o.solidsDropped})`);
  console.log(`  recovered: ${json.recovered.join(", ") || "none"} | kept: ${json.kept.join(", ") || "none"} | traded: ${json.traded.join(", ") || "none"}`);
  console.log(`  -> ${outPrefix}.md / ${outPrefix}.json`);
}

main();
