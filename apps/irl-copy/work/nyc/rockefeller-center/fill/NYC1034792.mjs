// 31 West 54th Street, 1920 commercial and office building: a six-storey brick loft block with limestone spandrels and a
// granite-and-glass shopfront on a stone foundation, built to the 1916 zoning's setback idea. Footprint 11 x 20 (x across
// the front, low z = north = the 54th Street frontage). Roof tiers from the lidar, flattened: a 21-block body with a
// limestone cornice and parapet, an 18-block north wing (lidar 17-18), a 9-block annex in the wing's middle, and a
// 2 x 2 mechanical bulkhead on the wing roof. The NW corner (lidar 1, ground 1) is open ground: a paved forecourt at
// grade, with the entrance on the building's west face behind a canopy and a lantern on the paving.
// Ground floor: granite piers, a lintel course at y 3 and glass shopfronts from the sidewalk up. Upper storeys: a
// spandrel course every third block (y 4, 7, 10, 13, 16), brick piers, two rows of glass per storey, quoins at the
// corners. Glass sits on the outer cell with a one-cell air pocket behind it and a solid core; warm glowstone sits in
// some pockets. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034792.cells.json`, "utf8"));
const X = 11, Y = 21, Z = 20;

const cell = new Map(cells.map(([x, z, ground, lidar]) => [`${x},${z}`, { ground, lidar }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tier (block height above y 0) for each footprint cell; 0 = nothing built (the forecourt, lidar 1 on ground 1).
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const { ground: g, lidar } = cell.get(`${x},${z}`);
  if (lidar <= g) return 0;
  if (x === 6 || x === 7) { if (z === 2) return 9; }
  return z <= 3 ? 18 : 21;
};
const open = (x, y, z) => roofAt(x, z) <= y;
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const facesAt = (x, y, z) => DIRS.filter(([, dx, dz]) => open(x + dx, y, z + dz));

// Storey lines: the shopfront is y < 3 (glass up from grade), a lintel course at 3, spandrels at 4, 7, 10, 13, 16 and a
// cornice at 19; window rows fall between them. The forecourt's entrance door is on the west face at (2, 1, 1).
const DOOR = (x, y, z) => x === 2 && z === 1 && (y === 1 || y === 2);
const spandrel = (y) => y >= 4 && (y - 4) % 3 === 0;
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const pane = (dz) => (dz ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });   // arms along the face

const g = new Voxels([X, Y, Z]);
const windows = [];   // exposed glass cells, with their outward normal, to hollow out the air pocket behind each

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const G = ground(x, z), top = roofAt(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                  // foundation: nothing floats on a slope
  if (!top) { g.set(x, G, z, "stone_bricks"); continue; }                        // forecourt paving at grade

  for (let y = G; y < top; y++) {
    const faces = facesAt(x, y, z);
    if (!faces.length) {                                                         // solid core, roof covering on top
      g.set(x, y, z, y === top - 1 ? "gravel" : "stone");
      continue;
    }
    const [, dx, dz] = faces[0];
    const corner = faces.length > 1;
    const t = dz !== 0 ? x : z;                                                  // position along the face
    let block, state;
    if (y === top - 1) { block = "smooth_stone_slab"; state = { type: "bottom", waterlogged: "false" }; }   // parapet cap
    else if (DOOR(x, y, z)) { block = "dark_oak_door"; state = { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
    else if (y === 3) {                                                          // lintel course; canopy over the door
      block = x === 2 && z === 1 ? "black_concrete" : "polished_granite";
    }
    else if (y < 3) {                                                            // shopfront: glass between corner piers
      if (corner) block = "polished_granite";
      else { block = "glass_pane"; state = pane(dz); windows.push({ x, y, z, dx, dz, lit: lit(x, y, z) }); }
    }
    else if (spandrel(y)) block = "smooth_stone";                                // spandrels and the cornice course
    else if (corner) block = "smooth_stone";                                     // quoins
    else if (t % 3 === 0) block = "bricks";                                      // brick piers
    else { block = "glass_pane"; state = pane(dz); windows.push({ x, y, z, dx, dz, lit: lit(x, y, z) }); }
    g.set(x, y, z, block, state);
  }
}

// Air pocket behind each window (one cell inward), a glowstone in some of them; a floor slab is the solid spandrel row.
for (const w of windows) {
  const px = w.x - w.dx, pz = w.z - w.dz;
  if (!inFoot(px, pz) || roofAt(px, pz) <= w.y || facesAt(px, w.y, pz).length) continue;
  if (w.y >= roofAt(px, pz) - 1) continue;
  g.set(px, w.y, pz, w.lit ? "glowstone" : "air");
}

// The entrance: a lantern standing on the forecourt paving, under the canopy.
g.set(1, 2, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof equipment on the north wing: a 2 x 2 mechanical bulkhead, two blocks high.
for (const [x, z] of [[3, 2], [4, 2], [3, 3], [4, 3]]) for (const y of [18, 19]) g.set(x, y, z, "light_gray_concrete");

g.save(`${DIR}/NYC1034792.nbt`);
