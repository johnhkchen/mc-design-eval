// FR245184476: a residential Haussmann block, built 1800. Seven storeys: a rusticated stone ground floor, five
// residential floors of pale limestone with a window grid, and a slate mansard with dormers and chimney stacks.
// The lidar roof is 29 blocks on every cell but a few noisy ones (22-27), smoothed to the one flat tier.
// Interior: the footprint's own ring is the wall shell; everything inside is air except floor slabs per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184476.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const S = new Set(cells.map(([x, z]) => key(x, z)));
const inS = (x, z) => S.has(key(x, z));
const NB = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// d: 4-neighbour distance from outside (ring = 1, next ring = 2, ...)
const d = new Map();
let frontier = [];
for (const [x, z] of cells) if (NB.some(([dx, dz]) => !inS(x + dx, z + dz))) { d.set(key(x, z), 1); frontier.push([x, z]); }
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) {
    const k = key(x + dx, z + dz);
    if (inS(x + dx, z + dz) && !d.has(k)) { d.set(k, d.get(key(x, z)) + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
const D = (x, z) => d.get(key(x, z)) ?? 0;
const isRing = (x, z) => D(x, z) === 1;

// The exterior faces of a ring cell: which of the four neighbours is outside
const outsideDirs = (x, z) => NB.filter(([dx, dz]) => !inS(x + dx, z + dz));

const v = new Voxels([18, 45, 16]);

// Storeys (absolute y): ground 1-4, upper floors 5-8, 9-12, 13-16, 17-20, 21-24; attic ceiling 25; mansard 26-28
const FLOORS = [1, 4, 5, 9, 13, 17, 21, 25];
const STRINGS = [5, 9, 13, 17, 21];   // storey bases (string course over a window band)

// 1. Foundation: a plinth course under every footprint cell
for (const [x, z] of cells) v.set(x, 0, z, "stone_bricks");

// 2. Floor slabs: full footprint at each storey line (the interior air sits between them)
for (const y of FLOORS) for (const [x, z] of cells) v.set(x, y, z, y === 1 ? "stone_bricks" : "smooth_stone");

// 3. Wall shell: the ring from the plinth up to the cornice
const winRow = (y) => STRINGS.some((b) => y === b + 1 || y === b + 2) || y === 2 || y === 3;
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  const ext = outsideDirs(x, z);
  const zFace = ext.some(([, dz]) => dz !== 0);
  const xFace = ext.some(([dx]) => dx !== 0);
  const along = zFace && !xFace ? x : xFace && !zFace ? z : null;   // corners have no along-axis
  const isPier = along === null || along % 3 === 0;
  for (let y = 1; y <= 25; y++) {
    if (y === 1) { v.set(x, y, z, "stone_bricks"); continue; }                 // base course
    if (y === 25) { v.set(x, y, z, "smooth_stone"); continue; }                 // cornice ledge
    if (y === 4 || y === 5 || y === 9 || y === 13 || y === 17 || y === 21) { v.set(x, y, z, "smooth_stone"); continue; }   // string courses
    if (y === 8 || y === 12 || y === 16 || y === 20 || y === 24) { v.set(x, y, z, "calcite"); continue; }                      // lintels
    if (!winRow(y)) { v.set(x, y, z, "calcite"); continue; }
    if (isPier) { v.set(x, y, z, "calcite"); continue; }
    // a pane: connected to its neighbours along the face
    const state = zFace && !xFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    v.set(x, y, z, "glass_pane", state);
  }
}

// 4. The residential entrance on the north face (ground floor, pane bay at x=4)
const DOOR_X = 4;
v.set(DOOR_X, 2, 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(DOOR_X, 3, 1, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// 5. Warm lights standing on the floor behind some panes (a lantern on the slab below, air around it)
const LIGHT_ROWS = [2, ...STRINGS.map((b) => b + 1)];           // first window row of each storey
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  const ext = outsideDirs(x, z);
  if (ext.length !== 1) continue;                               // a straight face, not a corner
  const [edx, edz] = ext[0];
  const along = edz !== 0 ? x : z;
  if (along % 3 === 0) continue;                                // a pier, not a pane
  const [ix, iz] = [x - edx, z - edz];                          // inward neighbour
  if (!inS(ix, iz) || D(ix, iz) < 2) continue;
  for (const y of LIGHT_ROWS) {
    if (x === DOOR_X && z === 1 && y <= 3) continue;
    if (((x * 7 + z * 3 + y) % 5) === 0) v.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 6. Mansard: one stepped slope, 1 block in per course (d >= 2, 3, 4 at y 26, 27, 28), slate tiles
for (const [x, z] of cells) {
  for (let y = 26; y <= 28; y++) if (D(x, z) >= y - 24) v.set(x, y, z, "deepslate_tiles");
}

// 7. Attic dormers: glass set into the first slope course on the long faces, with a stone cap above
for (const [x, z] of cells) {
  if (D(x, z) !== 2 || x % 4 !== 2) continue;
  const front = NB.find(([dx, dz]) => D(x + dx, z + dz) === 1 && inS(x + dx, z + dz));
  if (!front || front[0] !== 0) continue;                       // long (north/south) faces only
  v.set(x, 26, z, "glass");
  v.set(x, 27, z, "calcite");
}

// 8. Chimney stacks on the flat top (d >= 5), rising from the roof at y 29
const chimneyAt = [[6, 7], [12, 8], [9, 11]];
for (const [x, z] of chimneyAt) {
  if (D(x, z) < 5) continue;
  v.set(x, 29, z, "bricks"); v.set(x, 30, z, "bricks");
  v.set(x, 31, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184476.nbt");
console.log(JSON.stringify(info));
