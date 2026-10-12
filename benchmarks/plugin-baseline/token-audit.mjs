// Token audit of lean runs: how much generator code each part's workers wrote per block placed, and how small the same
// blocks could be written (fill boxes, as Litematica-style palette + layer maps). Finds "block-by-block token spam".
//   node benchmarks/plugin-baseline/token-audit.mjs runs/build-1/<run> [...]
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// fewest boxes of one block each (greedy: grow x, then z, then y) -- what a fill-based writer would need
function boxes(cells) {
  const at = new Map(cells), done = new Set();
  const keys = [...at.keys()].map((k) => k.split(",").map(Number)).sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
  let n = 0;
  const same = (x, y, z, b) => { const k = `${x},${y},${z}`; return at.get(k) === b && !done.has(k); };
  for (const [x, y, z] of keys) {
    const k0 = `${x},${y},${z}`; if (done.has(k0)) continue;
    const b = at.get(k0);
    let x1 = x; while (same(x1 + 1, y, z, b)) x1++;
    let z1 = z; while ([...Array(x1 - x + 1).keys()].every((i) => same(x + i, y, z1 + 1, b))) z1++;
    let y1 = y; while ([...Array(x1 - x + 1).keys()].every((i) => [...Array(z1 - z + 1).keys()].every((j) => same(x + i, y1 + 1, z + j, b)))) y1++;
    for (let i = x; i <= x1; i++) for (let j = z; j <= z1; j++) for (let h = y; h <= y1; h++) done.add(`${i},${h},${j}`);
    n++;
  }
  return n;
}

for (const runArg of process.argv.slice(2)) {
  const run = resolve(runArg);
  const out = join("/tmp", `cells-${Date.now()}.json`);
  const r = spawnSync("node", ["build.mjs", "/tmp/audit-build.nbt"], { cwd: run, env: { ...process.env, MCD_PARTS_CELLS: out }, encoding: "utf8" });
  if (!existsSync(out)) { console.log(run, "build failed:", (r.stderr || "").slice(-300)); continue; }
  const cells = JSON.parse(readFileSync(out, "utf8"));
  const buildSrc = readFileSync(join(run, "build.mjs"), "utf8");
  const mods = readdirSync(join(run, "parts")).filter((f) => f.endsWith(".mjs"));
  console.log(`\n== ${runArg}`);
  console.log("part".padEnd(34), "blocks", " code chars", " ~tokens", " tok/block", " .set(", " .fill(", " helper()", " boxes", " box/block");
  let T = { blocks: 0, tok: 0, boxes: 0 };
  for (const [name, list] of Object.entries(cells)) {
    // map the part name to its module through build.mjs's runParts list: ["name", alias.build]
    const m = buildSrc.match(new RegExp(`\\["${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*([A-Za-z0-9_$]+)\\.build`));
    const imp = m && buildSrc.match(new RegExp(`import\\s+(?:\\*\\s+as\\s+)?\\{?\\s*[^}]*?\\b${m[1]}\\b[^;]*?from\\s+["']\\./(parts/[^"']+)["']`));
    const file = imp ? imp[1] : mods.find((f) => name.toLowerCase().includes(f.replace(/\.mjs$/, "").replace(/^room-/, "")));
    const src = file && existsSync(join(run, file.startsWith("parts/") ? file : "parts/" + file)) ? readFileSync(join(run, file.startsWith("parts/") ? file : "parts/" + file), "utf8") : "";
    const tok = Math.round(src.length / 3.6), n = list.length, bx = boxes(list.filter(([, b]) => b !== "air"));
    const sets = (src.match(/\.set\(/g) || []).length, fills = (src.match(/\.fill\(/g) || []).length;
    const helpers = (src.match(/\b(?!if|for|while|switch|return|function)[a-z][A-Za-z0-9]*\(/g) || []).length - sets - fills;
    T.blocks += n; T.tok += tok; T.boxes += bx;
    console.log(name.slice(0, 33).padEnd(34), String(n).padStart(6), String(src.length).padStart(11), String(tok).padStart(8), (n ? (tok / n).toFixed(2) : "-").padStart(10),
      String(sets).padStart(6), String(fills).padStart(7), String(helpers).padStart(9), String(bx).padStart(6), (n ? (bx / n).toFixed(2) : "-").padStart(10));
  }
  console.log(`TOTAL ${T.blocks} blocks, ~${T.tok} code tokens (${(T.tok / T.blocks).toFixed(2)}/block), ${T.boxes} boxes would do (${(T.boxes / T.blocks).toFixed(2)}/block)`);
}
