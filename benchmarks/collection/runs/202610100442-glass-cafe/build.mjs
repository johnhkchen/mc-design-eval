// Generator for build.nbt — design ONE bay as a function, then tile it.
import { Grid, tile, mirrorX, shell, carve, replace, B, face } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([19, 12, 16]);           // x east, y up, z south; front faces north (-z) by convention
const [W, H, D] = g.size;

// 1. palette by role (dominant / supporting / accent) — from your design brief
const P = { main: "stone_bricks", frame: "dark_oak", accent: "polished_andesite" };

// 2. one bay
function bay(x) {
  // e.g. a post, a panel, a light
}

// 3. tile the bays along the rhythm
tile(g, { from: 0, step: 4, to: W - 1 }, (x) => bay(x));

g.save("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100442-glass-cafe/build.nbt");
console.log(JSON.stringify({ saved: "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100442-glass-cafe/build.nbt" }));
