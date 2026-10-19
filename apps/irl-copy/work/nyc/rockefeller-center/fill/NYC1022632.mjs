// NYC1022632: 132 West 45 Street, a 1900 Renaissance Revival hotel (Night Hotel), 9 x 24 blocks, 9 to 11 storeys.
// Brick walls on a granite plinth, smooth quartz storey bands and window lintels, glass bays with air behind them,
// a granite and glass shopfront with a door and a canopy band on the street front (north, low z), and a stone parapet.
// The lidar roof (smoothed by a 3 x 3 median, quantised to 3-block storeys) gives three tiers: a 9-storey north wing,
// a 10-storey south wing and the 11-storey main block, with a mechanical penthouse on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022632.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 9, D = 24;

const key = (x, z) => `${x},${z}`;
const cellOf = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFp = (x, z) => cellOf.has(key(x, z));

// Roof per cell: the median of the credible lidar readings in its 3 x 3 neighbourhood (roof >= 15 drops the 0 and 3 gaps
// on the east edge), quantised to whole storeys of 3 blocks.
const median = (a) => a.sort((p, q) => p - q)[(a.length - 1) >> 1];
const H = new Map();
for (const [x, z, , roof] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cellOf.get(key(x + dx, z + dz)); if (c && c.roof >= 15) vals.push(c.roof);
  }
  const m = vals.length ? median(vals) : roof;
  H.set(key(x, z), Math.min(33, Math.max(27, Math.round(m / 3) * 3)));
}

// Classify each footprint cell: shell (on the outside), ring (the air gap behind the glass), core (solid, never seen).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposedFaces = (x, z) => Object.keys(DIRS).filter((f) => !inFp(x + DIRS[f][0], z + DIRS[f][1]));
const isShell = (x, z) => exposedFaces(x, z).length > 0;
const isRing = (x, z) => !isShell(x, z) && Object.values(DIRS).some(([dx, dz]) => isShell(x + dx, z + dz) && inFp(x + dx, z + dz));

const g = new Voxels([W, 46, D]);
const place = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The street front is the north side (z = 0): the shopfront and the entrance go there.
const DOOR_X = 4;

function shellCell(x, z, top, ground, faces) {
  const corner = faces.length > 1;
  const face = faces[0];
  // Index along the face: x for the 9-block north and south walls, z for the 24-block east and west walls.
  const i = face === "N" || face === "S" ? x : z;
  const len = face === "N" || face === "S" ? W : D;
  const pier = corner || i % 3 === 0 || i === len - 1;
  const front = face === "N" && z === 0;
  for (let y = ground; y < top; y++) {
    const k = Math.floor(y / 3), r = y % 3;
    if (y === top - 1) { place(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }   // parapet
    if (r === 0) {                                                                                             // storey band
      place(x, y, z, k === 0 ? "polished_granite" : "smooth_quartz");
      continue;
    }
    if (front && k === 0) {                                                                                    // shopfront
      if (x === DOOR_X) {
        const half = r === 1 ? "lower" : "upper";
        place(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else place(x, y, z, pier ? "polished_granite" : "glass");
      continue;
    }
    if (r === 1) {                                                                                             // window row
      if (pier) place(x, y, z, "bricks");
      else if ((i + 2 * k) % 7 === 0) place(x, y, z, "glowstone");                                             // a lit room
      else place(x, y, z, "glass");
    } else {                                                                                                   // lintel
      place(x, y, z, pier ? "bricks" : "smooth_quartz");
    }
  }
}

function ringCell(x, z, top, ground) {
  for (let y = ground; y < top; y++) {
    if (y % 3 === 1) continue;                                                       // the air gap behind the window row
    place(x, y, z, "smooth_stone");                                                  // storey floor and ceiling slabs
  }
}

function coreCell(x, z, top, ground) {
  for (let y = ground; y < top; y++) place(x, y, z, y === top - 1 ? "smooth_stone" : "stone");
}

for (const [x, z, ground] of cells) {
  const top = H.get(key(x, z));
  if (isShell(x, z)) shellCell(x, z, top, ground, exposedFaces(x, z));
  else if (isRing(x, z)) ringCell(x, z, top, ground);
  else coreCell(x, z, top, ground);
}

// Warm lights behind the shopfront and the ground-floor ring; a lantern hangs from each ceiling slab.
for (const x of [2, 4, 6]) {
  if (inFp(x, 1)) place(x, 1, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Canopy over the entrance: a dark slab band at the storey line above the door.
for (const x of [DOOR_X - 1, DOOR_X, DOOR_X + 1]) place(x, 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });

// Mechanical penthouse on the tower core: brick walls, glass band, a stone slab cap, two blocks above the roof.
for (let z = 9; z <= 12; z++) for (let x = 3; x <= 5; x++) {
  if (!inFp(x, z)) continue;
  const top = H.get(key(x, z));
  const edge = x === 3 || x === 5 || z === 9 || z === 12;
  place(x, top, z, "bricks");
  place(x, top + 1, z, edge ? "glass" : "bricks");
  place(x, top + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

const stats = g.save(`${dir}/NYC1022632.nbt`);
console.log(JSON.stringify({ footprint: cells.length, storeys: [...new Set([...H.values()])].map((h) => h / 3), ...stats }));
