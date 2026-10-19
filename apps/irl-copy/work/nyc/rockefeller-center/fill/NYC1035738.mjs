// 681 Fifth Avenue, a 1913 commercial and office building: a 19-storey Beaux-Arts office block with a granite and
// shopfront base, a limestone body of calcite piers and glass panes set on stone spandrels, and a granite cornice.
// The lidar roof is smoothed (3x3 mean) into two tiers: a 60-block tower over most of the footprint and a 56-block wing
// along the west and the rear. A mechanical bulkhead stands on the tower roof. Every storey line sits at y = 2 + 3k,
// shared by all cells, so the bands run level over the lidar's steps and a 1-block ground difference only shows in the
// foundation. The facade ring is one block thick, with air behind each window and a floor slab (spandrel) per storey.
// Warm glowstone sits behind some windows. The entrance is recessed on the north front, with an iron door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035738.cells.json`, "utf8"));
const X = 34, Y = 72, Z = 11;
const FLOOR0 = 2;                                                       // first storey line; storey lines at 2 + 3k
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));

// Distance in cells from outside the footprint: 1 is the facade ring, 2 is the layer behind it.
const dist = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !inFoot(x + dx, z + dz))) { dist.set(key(x, z), 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) {
    if (inFoot(x + dx, z + dz) && !dist.has(key(x + dx, z + dz))) { dist.set(key(x + dx, z + dz), d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
const dOf = (x, z) => dist.get(key(x, z));

// Smoothed lidar roof: the mean of the 3x3 footprint cells, then two tiers.
const roofMean = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) { s += cell.get(key(x + dx, z + dz)).roof; n++; }
  return s / n;
};
const topOf = (x, z) => (roofMean(x, z) >= 57.5 ? 60 : 56);

// The face a facade ring cell looks out of: z-facing (north or south outside) runs along x, else along z.
const zFaceOf = (x, z) => !inFoot(x, z - 1) || !inFoot(x, z + 1);
const PANE_X = { east: "true", west: "true", north: "false", south: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false" };
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The block of a solid cell (y at or above its ground), by its place in the facade.
function skin(x, z, y, R, d, zFace) {
  if (d !== 1) return { block: y === R - 1 ? "smooth_stone" : "stone_bricks" };
  if (y === R - 1) return { block: "polished_granite" };                 // cornice
  if (y < FLOOR0) return { block: "polished_granite" };                  // plinth
  const rel = y - FLOOR0, k = Math.floor(rel / 3), p = rel % 3;
  const u = zFace ? x : z;
  if (p === 0) return { block: k <= 1 || k % 5 === 4 ? "polished_granite" : "stone_bricks" };  // spandrel, string course
  if (u % 4 === 0 || u % 4 === 3) return { block: k <= 1 ? "polished_granite" : "calcite" };    // pier
  if (k === 0) return { block: "glass" };                                 // shopfront
  return { block: "glass_pane", state: zFace ? PANE_X : PANE_Z };
}

const g = new Voxels([X, Y, Z]);

// Pass 1: foundation to each cell's ground, then the building up to its roof.
for (const [x, z, ground] of cells) {
  const R = topOf(x, z), d = dOf(x, z), zFace = zFaceOf(x, z);
  for (let y = 0; y < R; y++) {
    if (y < ground) { g.set(x, y, z, "stone"); continue; }
    const s = skin(x, z, y, R, d, zFace);
    g.set(x, y, z, s.block, s.state);
  }
}

// Pass 2: air behind each window (glass sits on the facade ring, the room is one block back), with some glowstone.
for (const [x, z] of cells) {
  if (dOf(x, z) !== 1) continue;
  const R = topOf(x, z), zFace = zFaceOf(x, z), u = zFace ? x : z;
  const [dx, dz] = zFace ? (!inFoot(x, z - 1) ? [0, 1] : [0, -1]) : (!inFoot(x - 1, z) ? [1, 0] : [-1, 0]);
  if (dOf(x + dx, z + dz) !== 2) continue;
  for (let y = FLOOR0; y < R - 1; y++) {
    const rel = y - FLOOR0, k = Math.floor(rel / 3), p = rel % 3;
    if (p === 0) continue;
    const { block } = skin(x, z, y, R, 1, zFace);
    if (block !== "glass" && block !== "glass_pane") continue;
    const glow = k >= 1 && p === 1 && (k * 7 + u) % 13 === 0;
    g.set(x + dx, y, z + dz, glow ? "glowstone" : "air");
  }
}

// Pass 3: recessed entrance on the north front (x 11-13), glass either side, the door, and the lintel.
for (let x = 11; x <= 13; x++) for (let y = 2; y <= 4; y++) g.set(x, y, 0, "air");
for (const y of [2, 3, 4]) { g.set(11, y, 1, "glass"); g.set(13, y, 1, "glass"); }
g.set(12, 4, 1, "polished_granite");
g.set(12, 2, 1, "iron_door", { ...DOOR, half: "lower" });
g.set(12, 3, 1, "iron_door", { ...DOOR, half: "upper" });

// Pass 4: mechanical bulkhead on the tower roof (roof equipment above the lidar roof, on footprint cells only).
for (const [x, z] of cells) {
  if (x >= 15 && x <= 20 && z >= 3 && z <= 7 && topOf(x, z) === 60) {
    g.set(x, 60, z, "stone_bricks");
    g.set(x, 61, z, "polished_granite");
  }
}

const out = `${DIR}/NYC1035738.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}`);
