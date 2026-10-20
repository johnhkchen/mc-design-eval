import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE91-0324-3F-6: 2002 mid-rise commercial/office block, Xinyi district.
// Three 5-block storeys on a granite base course, white-concrete floor lines
// and mullions, light-blue tinted glazing, smooth-stone cornice, parapet,
// roof plant, warm glowstone in some bays, and a canopied street entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE91-0324-3F-6.cells.json`, "utf8"));

const W = 15, D = 7, H = 28;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(`${x},${z}`, gr);
const has = (x, z) => footprint.has(`${x},${z}`);

// Footprint extents, so mullion rhythm starts from the real edge.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of footprint.keys().map(k => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Storey layout relative to each cell's ground:
//  r0 granite base | r1,6,11 floor lines | r2-4, 7-9, 12-14 glazing
//  r5,10 spandrels | r15 cornice / roof slab | r16 parapet
const WINDOW_ROWS = new Set([2, 3, 4, 7, 8, 9, 12, 13, 14]);
const FLOOR_LINES = new Set([1, 6, 11]);
const SPANDREL = new Set([5, 10]);

// Street-facing entrance: south-most exterior face (no footprint cell at z+1),
// nearest the middle of the frontage.
const midX = (minX + maxX) / 2;
let entrance = null;
for (const [x, z] of footprint.keys().map(k => k.split(",").map(Number))) {
  if (has(x, z + 1)) continue;
  if (!entrance || Math.abs(x - midX) < Math.abs(entrance.x - midX) ||
      (Math.abs(x - midX) === Math.abs(entrance.x - midX) && z > entrance.z)) {
    entrance = { x, z };
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Exterior faces come from neighbouring footprint cells, so irregular
  // outlines get proper walls and no inner holes.
  const openZ = !has(x, z - 1) || !has(x, z + 1);
  const openX = !has(x - 1, z) || !has(x + 1, z);
  const isEdge = openZ || openX;

  // Index along the wall that this cell faces, measured from the frontage start.
  const along = openZ ? x - minX : z - minZ;
  const mullion = along === 0 || (openZ ? x === maxX : z === maxZ) || along % 3 === 0;

  const isEntranceCell = entrance && x === entrance.x && z === entrance.z;

  for (let r = 0; r <= 16; r++) {
    const y = gr + r;

    if (!isEdge) {
      // Interior: floor slabs and roof only, air gap otherwise.
      if (FLOOR_LINES.has(r) || r === 15) put(x, y, z, "white_concrete");
      else if (r === 16 && x >= 5 && x <= 9 && z >= 2 && z <= 4) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (r === 0) {
      put(x, y, z, "polished_granite");
    } else if (r === 15) {
      put(x, y, z, "smooth_stone");
    } else if (r === 16) {
      put(x, y, z, "white_concrete");
    } else if (FLOOR_LINES.has(r)) {
      put(x, y, z, "white_concrete");
    } else if (SPANDREL.has(r)) {
      put(x, y, z, "light_gray_concrete");
    } else if (WINDOW_ROWS.has(r)) {
      if (mullion) {
        put(x, y, z, "white_concrete");
      } else if (r === 8 && along % 4 === 1) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Street entrance: door in the ground-floor glazing, a transom above, and a
  // stone canopy slab across the bays either side of it.
  if (isEntranceCell) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "white_concrete");
  }
}

// Canopy over the entrance: stone-brick slabs on the row above the door,
// on the footprint cells spanning the doorway.
if (entrance) {
  for (const dx of [-1, 0, 1]) {
    const cx = entrance.x + dx;
    const gr = footprint.get(`${cx},${entrance.z}`);
    if (gr === undefined) continue;
    put(cx, gr + 4, entrance.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/TPE91-0324-3F-6.nbt`);
