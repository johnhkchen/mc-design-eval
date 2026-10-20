// The National Gallery of Art, West and East Buildings (plan.md): the ground, then the six parts in order, saved to argv[2].
// The ground is laid before runParts so later parts may replace its surface (walks, plaza, lawn); runParts locks each
// part's blocks from the parts after it, reports off-palette ids, and lays roof.json (the two porticos) after the first
// part once it exists.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_ROWS_0, GROUND_ROWS_1, PLOT0, PLOT1 } from "./vocab/base.mjs";

// The sub-grade under the grass (not in palette.json: no part builds with it, it is out of sight).
const SUBGRADE = "dirt";

// Each plot's ground: grass at its mapped height, solid sub-grade below it down to y 0, so nothing floats.
function layGround(g) {
  for (const [rows, plot] of [[GROUND_ROWS_0, PLOT0], [GROUND_ROWS_1, PLOT1]]) {
    rows.forEach((row, dz) => [...row].forEach((ch, dx) => {
      const x = plot.x0 + dx, z = plot.z0 + dz, top = ch === "." ? 0 : Number(ch);
      for (let y = 0; y < top; y++) g.set(x, y, z, SUBGRADE);
      g.set(x, top, z, "grass_block");
    }));
  }
}

// A part whose file is not written yet (its worker is still on it) is a no-op, so make.sh never fails on a missing part.
async function partBuild(module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(url)) return () => {};
  return (await import(url.href)).build ?? (() => {});
}

const PARTS = [
  ["West shell", "./parts/west-shell.mjs"],
  ["West roofs, porticos, dome", "./parts/west-roof.mjs"],
  ["West trim and lights", "./parts/west-trim.mjs"],
  ["East shell and towers", "./parts/east-shell.mjs"],
  ["East roofs and atrium", "./parts/east-roof.mjs"],
  ["Grounds and lighting", "./parts/grounds.mjs"],
];

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);

const list = [];
for (const [name, module] of PARTS) list.push([name, await partBuild(module)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
