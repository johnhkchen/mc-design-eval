import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980393";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 27;
const ROOF = 11;          // roof top sits at y = 11 above lowest ground (y 0)
const STOREY = 5;         // storey line height
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground (clamped so the building keeps its storeys)
const foot = new Map();
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(ROOF - 4, Math.round(gr)));
  foot.set(`${x},${z}`, ground);
}
const has = (x, z) => foot.has(`${x},${z}`);
const groundAt = (x, z) => foot.get(`${x},${z}`);

// centre column for the entrance (street-side face on the low-z edge)
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const mid = Math.floor((minX + maxX) / 2);

const SLAB_TOP = { type: "top", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const missingW = !has(x - 1, z), missingE = !has(x + 1, z);
  const missingN = !has(x, z - 1), missingS = !has(x, z + 1);
  const edge = missingW || missingE || missingN || missingS;
  const corner = (missingW || missingE) && (missingN || missingS);

  // inward direction for this edge cell
  let dx = 0, dz = 0;
  if (missingW) dx = 1; else if (missingE) dx = -1;
  if (missingN) dz = 1; else if (missingS) dz = -1;

  // base course / floor at ground level
  if (edge) g.set(x, gr, z, "polished_andesite");
  else g.set(x, gr, z, "smooth_stone");

  if (edge) {
    const pier = corner || (x + z) % 3 === 0;
    for (let y = gr + 1; y <= ROOF - 1; y++) {
      let block;
      if (y === STOREY) {
        block = "light_gray_concrete";              // storey line band
      } else if (y === ROOF - 1) {
        block = "smooth_stone";                     // parapet cap
      } else if (y < STOREY) {
        // ground storey shopfront
        block = pier ? "quartz_block" : "light_blue_stained_glass";
      } else {
        // upper storey windows
        block = pier ? "white_concrete" : "light_blue_stained_glass";
      }
      g.set(x, y, z, block);
    }

    // warm lamps behind some upper-storey windows (air gap kept at the inward cell's other side)
    if (!pier && (x + z) % 6 === 1) {
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && groundAt(ix, iz) < 7) g.set(ix, 7, iz, "glowstone");
    }

    // entrance on the low-z street face
    if (missingN && x === mid) {
      g.set(x, gr + 1, z, "dark_oak_door", DOOR_LOWER);
      g.set(x, gr + 2, z, "dark_oak_door", DOOR_UPPER);
      g.set(x, gr + 3, z, "stone_brick_slab", SLAB_TOP);   // lintel over door
    }
  } else {
    // interior: storey floor slab and roof deck, otherwise open air
    if (STOREY > gr) g.set(x, STOREY, z, "light_gray_concrete");
    if (ROOF - 1 > gr) g.set(x, ROOF - 1, z, "gray_concrete");
  }

  // roof equipment: small plant boxes on the roof deck
  if (!edge && (x % 5 === 2) && (z % 6 === 3) && gr < ROOF - 1) {
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// canopy band across the entrance bay so the shopfront reads from the street
for (let x = mid - 2; x <= mid + 2; x++) {
  const zEdge = minZ;
  if (!has(x, zEdge)) continue;
  const gr = groundAt(x, zEdge);
  if (gr + 3 <= STOREY) g.set(x, gr + 4 <= STOREY ? gr + 4 : STOREY, zEdge, "stone_brick_slab", SLAB_TOP);
}

g.save(`${DIR}/${ID}.nbt`);
