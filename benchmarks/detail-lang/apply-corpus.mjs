// Run the detail-language interpreter (minecraft-design tools/src/detail-lang.mjs) on every corpus sample against its
// build; write applied/<name>-<i>.nbt and applied/<name>-<i>.report.txt, and print per-sample coverage.
//
//   node benchmarks/detail-lang/apply-corpus.mjs [--verbose]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLS = join(HERE, "..", "..", "..", "minecraft-design", "tools", "src");
const { load } = await import(join(TOOLS, "structure.mjs"));
const { Assets } = await import(join(TOOLS, "assets.mjs"));
const { applyDetail } = await import(join(TOOLS, "detail-lang.mjs"));
const RUNS = join(HERE, "..", "gauntlet", "runs");
const BUILDS = {   // as in elicit.mjs (kept here so this script does not need the SDK binding)
  "dance-hall": { run: "202610090515-dance-hall-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass", nbt: "round-2.nbt", faces: "north,west,roof" },
  "grocery": { run: "202610090515-grocery-store-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass", nbt: "round-1.nbt", faces: "north,west,roof" },
  "taj": { run: "202610090214-taj-mahal-sonnet-high-rerun-respec-trace", nbt: "round-2.nbt", faces: "north,roof" },
};
const verbose = process.argv.includes("--verbose");
const out = join(HERE, "applied");
mkdirSync(out, { recursive: true });
const rows = [];
for (const [name, b] of Object.entries(BUILDS)) {
  const g = load(join(RUNS, b.run, b.nbt));
  const assets = await Assets.open(process.env.MCD_VERSION || "latest");
  for (let i = 1; existsSync(join(HERE, "corpus", `${name}-${i}.md`)); i++) {
    const text = readFileSync(join(HERE, "corpus", `${name}-${i}.md`), "utf8");
    const r = applyDetail(g, text, { assets, faces: b.faces.split(",") });
    r.grid.save(join(out, `${name}-${i}.nbt`));
    const rules = r.report.filter((x) => !x.kind || x.kind === "rule");
    const ok = rules.filter((x) => !x.error);
    const lines = r.report.map((x) => `${x.error ? "!" : x.kind ? "#" : x.wrote ? "+" : "·"} L${String(x.line).padEnd(3)} ${x.rule.slice(0, 90).padEnd(90)} ` +
      (x.kind && !x.error ? x.kind : x.error ? `ERROR ${x.error}` : `cells ${x.cells} wrote ${x.wrote}${x.skipped ? ` skipped ${x.skipped}` : ""}`) + (x.note ? `  (${x.note})` : ""));
    writeFileSync(join(out, `${name}-${i}.report.txt`), lines.join("\n") + `\n# shift ${r.shift.join(",")}\n`);
    if (verbose) console.log(`\n=== ${name}-${i}\n` + lines.join("\n"));
    rows.push({ sample: `${name}-${i}`, parsed: ok.length, total: rules.length, wrote: ok.reduce((s, x) => s + x.wrote, 0), shift: r.shift.join(",") });
  }
}
console.log("\nsample          parsed/total  cells written  shift");
for (const x of rows) console.log(`${x.sample.padEnd(15)} ${String(x.parsed).padStart(3)}/${String(x.total).padEnd(9)} ${String(x.wrote).padStart(8)}       ${x.shift}`);
const P = rows.reduce((s, x) => s + x.parsed, 0), T = rows.reduce((s, x) => s + x.total, 0);
console.log(`all             ${P}/${T} (${Math.round((100 * P) / T)}%)`);
