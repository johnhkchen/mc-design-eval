// A two-storey Edwardian brick commercial block (c. 1905-1915, the Karangahape / Mt Eden main-street type): brick walls
// on a stone plinth, a shopfront with a recessed door at ground, a white string course, upper sash windows, and a
// stone parapet over a flat roof with two brick flues. The lidar gives every footprint cell a ground of 0 and a roof
// of 7 blocks (about 5.8 m: two storeys of 3 blocks plus the slab), so the massing is one flat tier with no setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020900.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..14

const W = 10, D = 15;
const roofTop = Math.max(...cells.map(([, , , r]) => r));                 // the highest roof, in blocks above y 0
const g = new Voxels([W, roofTop + 3, D]);                                // three layers over the roof for flues and caps

const by = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => by.has(`${x},${z}`);

// the door: the north face, on the cell nearest the middle of the front
const doorX = 3, doorZ = 0;
// two flues on the roof, on interior roof cells (checked below)
const flues = [[4, 8], [3, 5]];

// a cell is on the outside when one of its four neighbours is not in the footprint
const outside = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);

// which exposed face a wall cell shows, and its position along that face (the bay index)
function faceOf(x, z) {
  if (!inFp(x, z - 1)) return { face: "N", t: x };
  if (!inFp(x, z + 1)) return { face: "S", t: x };
  if (!inFp(x - 1, z)) return { face: "W", t: z };
  return { face: "E", t: z };
}

// a glass pane joins its neighbours along the face it sits in
function pane(x, z, face) {
  const along = face === "N" || face === "S";
  return {
    north: "false", south: "false", east: "false", west: "false",
    ...(along ? { east: inFp(x + 1, z) ? "true" : "false", west: inFp(x - 1, z) ? "true" : "false" }
              : { north: inFp(x, z - 1) ? "true" : "false", south: inFp(x, z + 1) ? "true" : "false" }),
  };
}

for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;                                                   // the last solid layer under the roof surface
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // the foundation, only under a slope
  const wall = outside(x, z);
  const { face, t } = wall ? faceOf(x, z) : { face: null, t: 0 };
  for (let y = ground; y <= top; y++) {
    const rel = y - ground, trel = top - ground;
    if (!wall) {                                                          // interior: floor slabs and the roof deck only
      if (rel === 0 || rel === 3 || rel === trel) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // plinth
    if (rel === trel) { g.set(x, y, z, "stone_bricks"); continue; }      // parapet cornice
    if (rel === 3) { g.set(x, y, z, "white_terracotta"); continue; }     // string course between the storeys
    if (rel <= 2) {                                                       // the shopfront
      if (face === "N" && x === doorX && z === doorZ) {
        g.set(x, y, z, "oak_door", { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (t % 2) g.set(x, y, z, "glass");
      else g.set(x, y, z, "dark_oak_planks");
      continue;
    }
    // the upper storey: sash panes in brick piers
    if (t % 2) g.set(x, y, z, "glass_pane", pane(x, z, face));
    else g.set(x, y, z, "bricks");
  }
}

// interior roof deck and flues: a brick stack on the roof deck, capped with a slab
for (const [x, z] of flues) {
  if (!inFp(x, z) || outside(x, z)) throw new Error(`flue at ${x},${z} is not an interior roof cell`);
  const r = by.get(`${x},${z}`).roof;
  g.set(x, r, z, "bricks"); g.set(x, r + 1, z, "bricks");
  g.set(x, r + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind the glass: a glowstone on the floor of an interior cell beside a window, here and there
for (const [x, z, ground, roof] of cells) {
  if (outside(x, z)) continue;
  const floorYs = [ground + 1, ground + 4];                                // floor level of each storey
  for (const fy of floorYs) {
    const beside = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => outside(a, b) && inFp(a, b) && (faceOf(a, b).t % 2));
    if (beside && (x + z) % 3 === (fy === 1 ? 0 : 1)) g.set(x, fy, z, fy === 1 ? "glowstone" : "shroomlight");
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020900.nbt");
console.log(`built ${cells.length} footprint cells, ${info.blocks} blocks, ${info.palette} palette entries`);
