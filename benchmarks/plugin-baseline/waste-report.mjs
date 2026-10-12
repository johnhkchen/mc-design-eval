// What the Haiku workers say was wasteful: every waste[] entry in lean runs' build-report.json, grouped by the tool
// they asked for, most-asked first. The input for deciding which deterministic tool to build next.
//   node benchmarks/plugin-baseline/waste-report.mjs runs/build-1/<run> [...]   (default: every lean run in runs/build-1)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const runs = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(join(HERE, "runs", "build-1")).map((d) => join(HERE, "runs", "build-1", d)).filter((d) => existsSync(join(d, "plan.json")));
const all = [];
for (const run of runs) {
  const f = join(run, "build-report.json");
  if (!existsSync(f)) continue;
  for (const r of JSON.parse(readFileSync(f, "utf8"))) for (const w of r.waste ?? []) all.push({ run: run.split("/").pop(), part: r.summary.split(":")[0], ...w });
}
if (!all.length) { console.log("no waste[] entries yet (runs before minecraft-design 298741c don't have them)"); process.exit(0); }
const key = (t) => t.toLowerCase().replace(/[`"']/g, "").replace(/\s+/g, " ").slice(0, 70);
const groups = new Map();
for (const w of all) { const k = key(w.tool); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(w); }
console.log(`${all.length} waste reports from ${new Set(all.map((w) => w.run)).size} runs\n`);
for (const [k, ws] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`## ${ws.length}x  ${ws[0].tool}`);
  for (const w of ws.slice(0, 4)) console.log(`   - [${w.run} / ${w.part}] ${w.what} (${w.cost})`);
}
