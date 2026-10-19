// 424 Madison Avenue, a 1926 commercial and office building: a 16-storey brick office block with limestone belt courses
// and a granite ground storey, on a 19 x 17 footprint (0.9 blocks per metre). The lidar reads a 14-storey street wall
// (42 blocks) round the lot, a 16-storey shaft behind it (48), a 17-storey rear wing (51 on the south-west, z 11 and
// on) and a 3-block bulkhead on the shaft roof. Each storey is 3 blocks: a limestone belt course at its base, then two
// rows of windows in 2-wide bays with 1-wide brick piers. The Madison face is the east side (x 18); its entrance sits
// at z 6-8 with iron doors into a one-cell lobby and a lantern. Shopfronts of clear glass run at y 1-2 on every face.
// Air gaps sit one block behind each window, with a floor slab per storey; no interiors. Warm glowstone sits in some
// gaps. Lidar 0-1 cells are open ground: the notch on the west and the light court at the south-east, paved at y 0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035445.cells.json`, "utf8"));
const X = 19, Y = 63, Z = 17;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const built = (x, z) => inFoot(x, z) && cell.get(`${x},${z}`).roof > 1;

// Tiers, smoothed from the lidar into flat storeys: the ring of the lot is the 42-block street wall, the interior is
// the 48-block shaft, the rear wing reaches 51 and a 3-block bulkhead stands on the shaft roof.
const ring = (x, z) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !built(x + dx, z + dz));
const topAt = (x, z) => {
  if (!built(x, z)) return 0;
  const { roof } = cell.get(`${x},${z}`);
  if (z >= 11 && roof >= 50) return 51;
  if (ring(x, z)) return 42;
  if (x >= 8 && x <= 10 && z >= 4 && z <= 6) return 51;
  return 48;
};
const T = (x, z) => (built(x, z) ? topAt(x, z) : 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (T(x + dx, z + dz) <= y) return d; }
  return null;
};
// A pane on a face along x connects north and south; one on a face along z connects east and west.
const pane = (d) => (DIRS[d][0] === 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

// Blocks go into a map first, so the air gaps and the entrance can overwrite the fill; missing keys are air.
const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, [block, state]);
const drop = (x, y, z) => out.delete(`${x},${y},${z}`);

// 1. Foundations and paving: granite from y 0 up to each built cell's ground, and paving on the open ground.
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!built(x, z)) { put(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < ground; y++) put(x, y, z, "polished_granite");
}

// 2. The body: solid brick with a floor slab per storey, and the faces dressed by storey. Windows go on the faces;
// the cell behind each one is decided in step 3.
const windows = [];
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!built(x, z)) continue;
  const top = topAt(x, z);
  for (let y = ground; y < top; y++) {
    const d = faceOf(x, y, z);
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }                  // parapet cap and roof covering
    if (!d) { put(x, y, z, y % 3 === 0 ? "smooth_stone" : "bricks"); continue; }     // interior: slab, then brick
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                                      // position along the face
    if (y === 0) put(x, y, z, "polished_granite");
    else if (y < 3) put(x, y, z, u % 3 === 0 ? "polished_granite" : "glass");       // shopfront
    else if (y === top - 2) put(x, y, z, "calcite");                                  // cornice under the parapet
    else if (y % 3 === 0) put(x, y, z, "calcite");                                    // storey belt course
    else if (u % 3 === 0) put(x, y, z, "bricks");                                     // pier
    else { put(x, y, z, "light_blue_stained_glass_pane", pane(d)); windows.push([x, y, z, d]); }
  }
}

// 3. Entrance on the Madison face (x 18, z 6-8): clear glass either side of an iron door, a one-cell lobby behind it
// with a lantern hung from the slab above.
for (let y = 1; y <= 2; y++) {
  put(18, y, 6, "glass"); put(18, y, 8, "glass");
  for (let z = 6; z <= 8; z++) drop(17, y, z);
}
const door = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
put(18, 1, 7, "iron_door", door("lower"));
put(18, 2, 7, "iron_door", door("upper"));
put(17, 2, 7, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Air gap behind each window, with warm glowstone in some. A gap must be interior: one that lands on another exterior
// cell would open that wall (a corner), so such a window stays brick. A window with no built cell behind it is brick.
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d], gx = x - dx, gz = z - dz;
  if (built(gx, gz) && y < T(gx, gz) && !faceOf(gx, y, gz)) {
    if (lit(x, y, z)) put(gx, y, gz, "glowstone"); else drop(gx, y, gz);
  } else put(x, y, z, "bricks");
}

const g = new Voxels([X, Y, Z]);
for (const [key, [block, state]] of out) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(`${DIR}/NYC1035445.nbt`));
