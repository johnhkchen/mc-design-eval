import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const X0 = 208, Z0 = 486, W = 9, D = 18, HMAX = 22;
const man = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = man.buildings.find((b) => b.id === "SEA1270140187");
const S = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && S.has(`${x},${z}`);
const isStore = (x, z) => inF(x, z) && z >= 7;
const isCanopy = (x, z) => inF(x, z) && z <= 6;
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const edgeOf = (fn, x, z) => nb.some(([dx, dz]) => !fn(x + dx, z + dz));

const g = new Voxels([W, HMAX, D]);
const set = (x, y, z, id, st) => { if (inF(x, z)) g.set(x, y, z, id, st); };

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  // foundation
  set(x, 0, z, "stone_bricks"); set(x, 1, z, "stone_bricks");
  if (isStore(x, z)) {
    set(x, 2, z, "smooth_stone");                       // store floor
    if (edgeOf(isStore, x, z)) {
      const storefront = !isStore(x - 1, z) || !isStore(x, z + 1);
      set(x, 2, z, "gray_concrete");                     // base course
      if (storefront) {
        const mull = (x + z) % 3 === 0;
        for (const y of [3, 4]) set(x, y, z, mull ? "white_concrete" : "glass_pane", mull ? undefined : PANE);
      } else {
        const pier = (x + z) % 4 === 0;
        for (const y of [3, 4]) set(x, y, z, pier ? "light_gray_concrete" : "white_concrete");
      }
      set(x, 5, z, ((x + z) >> 1) % 2 === 0 ? "orange_concrete" : "blue_concrete"); // fascia stripe
      set(x, 6, z, "white_concrete");                    // parapet
    } else {
      set(x, 6, z, "smooth_stone");                      // roof deck
    }
  } else {
    // forecourt under canopy
    set(x, 2, z, "light_gray_concrete");
    set(x, 5, z, edgeOf(isCanopy, x, z) ? "orange_concrete" : "white_concrete"); // canopy slab
  }
}

// fuel canopy pillars
for (const [x, z] of [[6, 2], [8, 2], [3, 6], [8, 6]]) for (const y of [2, 3, 4]) set(x, y, z, "white_concrete");

// pump islands and pump bodies
for (const [x, z] of [[3, 5], [4, 5], [7, 5], [8, 5]]) set(x, 2, z, "gray_concrete");
for (const y of [3, 4]) { set(4, y, 5, "red_concrete"); set(8, y, 5, "blue_concrete"); }

// front door (west face of the store)
set(0, 2, 10, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
set(0, 3, 10, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// rooftop AC units
for (let y = 7; y <= 8; y++) {
  for (const [x, z] of [[4, 10], [5, 10], [4, 11], [5, 11], [6, 15], [7, 15], [6, 16], [7, 16]]) set(x, y, z, "light_gray_concrete");
}

// 76 pylon: slim column at (6,4) with round sign face centred at y 13
for (let y = 2; y <= 12; y++) set(6, y, 4, y % 4 === 0 ? "gray_concrete" : "black_concrete");
const cy = 13, cx = 6;
for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
  const d = dx * dx + dy * dy;
  if (d > 5) continue;
  set(cx + dx, cy + dy, 4, d <= 1 ? "blue_concrete" : "orange_concrete");
}
// glowstone behind the sign face
for (let dx = -1; dx <= 1; dx++) for (const y of [12, 13, 14]) set(cx + dx, y, 5, "glowstone");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270140187.nbt");
console.log("saved", [W, HMAX, D]);
