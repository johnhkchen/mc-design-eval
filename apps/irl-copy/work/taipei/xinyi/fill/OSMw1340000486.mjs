import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340000486";
const W = 8, D = 33, H = 24, TOP = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => Math.min(6, Math.max(0, Math.round(gmap.get(`${x},${z}`) - minG)));

// Facade classification: which outward face a perimeter cell belongs to, and its position along it.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { f: "W", t: z, L: D };
  if (!has(x + 1, z)) return { f: "E", t: z, L: D };
  if (!has(x, z - 1)) return { f: "N", t: x, L: W };
  if (!has(x, z + 1)) return { f: "S", t: x, L: W };
  return null;
}
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Window bays are two blocks wide; piers (one block) and corners stay solid.
const isWinSlot = (t, L) => t !== 0 && t !== L - 1 && t % 3 !== 0;
// Interior cell directly behind a facade cell.
const inward = (f, x, z) => {
  if (f === "W") return [x + 1, z];
  if (f === "E") return [x - 1, z];
  if (f === "N") return [x, z + 1];
  return [x, z - 1];
};

const g = new Voxels([W, H, D]);

for (const [x, z] of gmap.keys().map(k => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  const per = isPerim(x, z);
  const fo = per ? faceOf(x, z) : null;

  // Foundation under everything, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP + 1; y++) {
    let block = null;
    let props;

    if (y === gr) {
      block = per ? "stone_bricks" : "smooth_stone";            // base course / ground floor slab
    } else if (y === 5 || y === 11) {
      block = per ? "light_gray_concrete" : "smooth_stone";     // storey lines / roof slab, cornice
    } else if (y === TOP) {
      block = per ? "light_gray_concrete" : null;               // parapet
    } else if (y === TOP + 1) {
      if (per) { block = "stone_brick_slab"; props = { type: "bottom", waterlogged: "false" }; }
    } else if (per && ((y > gr && y <= 4) || (y >= 6 && y <= 10))) {
      const { f, t, L } = fo;
      const win = isWinSlot(t, L);
      if (f === "N" && (t === 3 || t === 4) && (y === gr + 1 || y === gr + 2)) {
        // Double entrance doors on the north end.
        const hinge = t === 3 ? "left" : "right";
        g.set(x, y, z, "iron_door", {
          facing: "north", half: y === gr + 1 ? "lower" : "upper",
          hinge, open: "false", powered: "false",
        });
        continue;
      }
      if (f === "N" && t >= 2 && t <= 5 && y === gr + 3) {
        block = "stone_bricks";                                 // entrance lintel
      } else if (win) {
        block = "light_blue_stained_glass_pane";                // glazing
      } else {
        block = "white_concrete";                               // piers
      }
    }

    if (block) g.set(x, y, z, block, props);
  }

  // Warm lights behind some windows, in the interior air gap.
  if (per && fo) {
    const { f, t, L } = fo;
    if (isWinSlot(t, L)) {
      const [ix, iz] = inward(f, x, z);
      if (has(ix, iz) && !isPerim(ix, iz)) {
        if (t % 6 === 2) g.set(ix, 8, iz, "shroomlight");       // upper storey
        if (t % 6 === 5 && f !== "N") g.set(ix, 2, iz, "glowstone"); // ground storey
      }
    }
  }
}

// Rooftop plant room on the roof slab.
for (let x = 2; x <= 5; x++) {
  for (let z = 12; z <= 18; z++) {
    if (!has(x, z)) continue;
    const base = groundOf(x, z);
    if (base > 11) continue;
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
