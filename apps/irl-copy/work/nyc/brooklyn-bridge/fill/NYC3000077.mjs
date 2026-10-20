import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000077.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000077.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 6, H = 24, D = 15;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const key = (x, z) => x + "," + z;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), c);
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const minZ = Math.min(...cells.map(c => c[1]));
const streetXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = streetXs.length ? streetXs[Math.floor(streetXs.length / 2)] : -1;

// Snap each cell's roof to whole storeys above its own ground (clean tiers)
function roofFor(gr, r0) {
  const n = Math.max(2, Math.round((r0 - gr) / STOREY));
  return Math.min(gr + n * STOREY, H - 4);
}

const lights = [];

for (const [x, z, gr0, r0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const r = roofFor(gr, Math.round(r0));
  const hEdge = isEdge(x, z);
  const corner = isCorner(x, z);
  const street = hEdge && z === minZ;

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor base course / slab
  g.set(x, gr, z, hEdge ? "smooth_stone" : "smooth_stone");

  for (let y = gr + 1; y <= r - 1; y++) {
    const rel = y - gr;
    const row = rel % STOREY;
    const k = Math.floor(rel / STOREY);

    // Storey string course (shopfront fascia on the street ground floor)
    if (row === 0) {
      if (hEdge) {
        if (street && k === 0) {
          g.set(x, y, z, "dark_oak_planks");
        } else {
          g.set(x, y, z, "smooth_stone");
        }
      } else {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }
    if (!hEdge) continue; // interior air behind glass

    const pil = corner || (x + z) % 3 === 0;

    // Entrance door on the street face, ground floor
    if (street && x === doorX && k === 0) {
      if (row === 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
      continue;
    }

    if (corner) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (pil) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // Glass window (sill sits on the string course below)
    g.set(x, y, z, "glass");
    if (((x * 7 + z * 5 + k * 3) % 4) === 0 && row === 1) {
      lights.push([x, y, z]);
    }
  }

  // Interior roof deck just below the cornice
  if (!hEdge) g.set(x, r - 1, z, "smooth_stone");

  // Cornice on the perimeter
  if (hEdge) g.set(x, r, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Roof equipment: stair housing on the interior deck
  if (!hEdge && x >= 2 && x <= 3 && z >= 5 && z <= 9 && r + 2 < H) {
    g.set(x, r, z, "bricks");
    g.set(x, r + 1, z, "bricks");
    g.set(x, r + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights just inside lit windows
for (const [x, y, z] of lights) {
  let ix = x, iz = z;
  if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  else if (!has(x, z - 1)) iz = z + 1;
  else iz = z - 1;
  if (has(ix, iz) && !isEdge(ix, iz)) {
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(OUT);
