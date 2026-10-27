// Way 1098153406: a two-storey Edwardian commercial block in red brick on a volcanic-basalt base course, the
// Auckland inner-city type of the 1900s-1920s (Newton / Eden Terrace high street). 20 x 49 footprint; the lidar roof
// is level at y 11 while the ground steps from 0 to 5 under it, so the storeys step with the ground and the top
// stays flat. Walls are one cell thick; behind every window is air, with a floor slab per storey and a roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1098153406.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 20, H = 24, D = 49;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFp = (x, z) => raw.has(key(x, z));

// Roof: the median of the 3x3 neighbourhood, so lidar noise (the odd 8-10 cell) becomes the flat tier around it.
const info = new Map();
for (const [x, z, g] of cells) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(key(x + dx, z + dz)); if (c) rs.push(c.r); }
  rs.sort((a, b) => a - b);
  info.set(key(x, z), { g, r: rs[Math.floor(rs.length / 2)] });
}

const STEP = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };     // N is -z, E is +x
const exposed = (x, z) => Object.keys(STEP).filter((d) => !inFp(x + STEP[d][0], z + STEP[d][1]));
// Piers two blocks wide, windows two wide: a brick wall with glazed bays, not a glass wall with brick stripes.
const pier = (a) => a % 4 === 0 || a % 4 === 3;
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Panes connect along the face they sit in (vanilla pane states), so the grid reads as one set of frames.
const pane = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Entrances: two doors on the long east (+x) face, away from the corners, where the ground is at least 2 blocks
// below the parapet, so the lantern above the door hangs from the string course.
const eFace = [];
for (const [x, z] of cells) {
  const ex = exposed(x, z), c = info.get(key(x, z));
  if (ex.length === 1 && ex[0] === "E" && c.r - c.g >= 7) eFace.push([x, z]);
}
const doors = new Set();
for (const t of [20, 36]) {
  const best = [...eFace].sort((a, b) => Math.abs(a[1] - t) - Math.abs(b[1] - t))[0];
  if (best) doors.add(key(best[0], best[1]));
}

const v = new Voxels([W, H, D]);
let lights = 0, unitsOnRoof = 0;

for (const [x, z] of cells) {
  const { g, r } = info.get(key(x, z));

  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  if (ex.length === 0) {
    // interior: floor slab per storey, ceiling under the roof deck, air between (no interior)
    v.set(x, g, z, "stone_bricks");
    if (g + 4 < r - 2) v.set(x, g + 4, z, "stone_bricks");
    v.set(x, r - 2, z, "stone_bricks");
    v.set(x, r - 1, z, "stone");
    // rooftop plant: 2-tall light-grey boxes, sparse and deterministic
    if (x >= 3 && x <= 16 && z >= 8 && z <= 40 && (x * 5 + z * 3) % 61 === 0) {
      v.set(x, r, z, "light_gray_concrete"); v.set(x, r + 1, z, "light_gray_concrete"); unitsOnRoof++;
    }
    continue;
  }

  const corner = ex.length > 1;
  const face = ex[0];
  const along = face === "N" || face === "S" ? x : z;     // the coordinate that runs along the wall
  const ground = (y) => y >= g + 1 && y <= Math.min(g + 3, r - 4);
  const upper = (y) => y >= g + 5 && y <= r - 4;

  for (let y = g; y < r; y++) {
    let b = "bricks", s = null;
    if (y === g) b = "polished_andesite";                       // base course
    else if (y === r - 1) b = "smooth_stone";                   // parapet cap
    else if (y === r - 2) b = "stone_bricks";                   // cornice
    else if (y === r - 3 || y === g + 4) b = "smooth_stone";    // storey string courses
    else if (corner) b = "smooth_stone";                        // quoins
    else if (ground(y)) {
      if (doors.has(key(x, z)) && y <= g + 2) { b = "dark_oak_door"; s = { facing: face === "E" ? "east" : "north", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (doors.has(key(x, z)) && y === g + 3) { b = "lantern"; s = { hanging: "true", waterlogged: "false" }; }
      else if (pier(along)) b = "bricks";                   // piers between the bays
      else { b = "glass_pane"; s = pane(face); }
    }
    else if (upper(y)) {
      if (y === g + 5) b = "smooth_stone";                      // sill
      else if (pier(along)) b = "bricks";
      else { b = "glass_pane"; s = pane(face); }
    }
    v.set(x, y, z, b, s);
  }

  // warm light behind a ground-floor pane, standing on the interior floor (same ground as this cell)
  if (!corner && !doors.has(key(x, z)) && !pier(along) && along % 8 === 1) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && exposed(ix, iz).length === 0 && info.get(key(ix, iz)).g === g) {
      v.set(ix, g + 1, iz, "glowstone"); lights++;
    }
  }
}

v.save(`${DIR}/way_1098153406.nbt`);
console.log(`way_1098153406: ${cells.length} cells, ${lights} lights, ${unitsOnRoof} roof units, ${v.count()} blocks, ${v.palette.length - 1} palette entries`);
