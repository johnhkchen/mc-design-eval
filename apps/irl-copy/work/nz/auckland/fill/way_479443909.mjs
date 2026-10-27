// Spark City: a late-20th-century office block on a shopfront podium. A concrete grid of piers and spandrels
// frames blue-tinted glass, the massing steps up in 4-block storeys from the lidar roof, and the ground storey
// is a shopfront where the lot is flat. Solid: foundation, the storey slabs, the roof, and the exposed envelope.
// Interior is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_479443909.cells.json", "utf8"));
const N = 115, H = 57, STOREY = 4;
const key = (x, z) => x * N + z;
const G = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { G.set(key(x, z), g); R.set(key(x, z), r); }
const inF = (x, z) => x >= 0 && z >= 0 && x < N && z < N && G.has(key(x, z));
const gr = (x, z) => G.get(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Tiers: the lidar roof, median-smoothed over 7x7 within the footprint, snapped to whole storeys. Each column tops
// out at least one storey above the first storey line over its ground.
const T = new Map();
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inF(x + dx, z + dz)) vals.push(R.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const snapped = STOREY * Math.round(vals[vals.length >> 1] / STOREY);
  T.set(key(x, z), Math.max(snapped, STOREY * (Math.floor(g / STOREY) + 2)));
}
const top = (x, z) => T.get(key(x, z));

// A side of a column faces outside when its neighbour is off the footprint or stands below this height (air above it).
const exposedFaces = (x, y, z) => dirs.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inF(nx, nz) || y >= top(nx, nz); });

const v = new Voxels([N, H, N]);

// The envelope: piers and spandrels in concrete, glass panes between, a plinth and shopfront when the ground is low.
function facade(x, y, z, faces, g, t) {
  const [fx, fz] = faces[0];
  const corner = faces.length > 1;
  const along = fx !== 0 ? z : x;
  const L1 = STOREY * (Math.floor(g / STOREY) + 1);            // first storey line above the ground
  const tint = t >= 40 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
  if (y === t - 1) return ["smooth_stone"];                       // parapet
  if (y < L1) {
    if (L1 === STOREY) {                                          // shopfront storey
      if (y === g) return ["smooth_stone"];                       // threshold
      if (y === L1 - 1) return ["white_concrete"];                // lintel
    } else return ["stone_bricks"];                               // base course over a sloping lot
  } else if (y % STOREY === 0 || y % STOREY === STOREY - 1) return ["white_concrete"];   // slab edge and spandrel
  if (corner || along % 4 === 0) return ["light_gray_concrete"];  // pier
  return [tint, fz !== 0 ? { east: "true", west: "true" } : { north: "true", south: "true" }];
}

// Pass 1: the massing, every footprint column from its foundation to its top.
const glass = [];
for (const [x, z, g] of cells) {
  const t = top(x, z);
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");                     // foundation to the ground
  for (let y = g; y < t; y++) {
    const faces = exposedFaces(x, y, z);
    if (faces.length) {
      const [block, state] = facade(x, y, z, faces, g, t);
      v.set(x, y, z, block, state);
      if (block.endsWith("glass_pane")) glass.push([x, y, z, faces[0]]);
    } else if (y === t - 1) v.set(x, y, z, "gray_concrete");       // roof
    else if (y % STOREY === 0 && y > g) v.set(x, y, z, "light_gray_concrete");   // floor slab
  }
}

// Pass 2: the entrance on the west face, at the ground storey (ground 0), with its lintel and a lantern in the hall.
const door = { x: 1, z: 21, face: [-1, 0] };
const doorG = gr(door.x, door.z), L1 = STOREY;
const facing = DIR_NAME[door.face.join(",")];
for (const half of ["lower", "upper"]) v.set(door.x, doorG + (half === "lower" ? 1 : 2), door.z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
for (const dz of [0, 1, 2]) {
  // the lintel row becomes a wooden awning over the door bay
  v.set(door.x, L1 - 1, door.z + dz, "dark_oak_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
}
v.set(door.x - door.face[0], L1 - 1, door.z, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light: glowstone behind some glass on the second row of a storey, where the air gap is.
for (const [x, y, z, [fx, fz]] of glass) {
  if (y % STOREY !== 1) continue;
  if (((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) % 7 !== 0) continue;
  const ix = x - fx, iz = z - fz;
  if (inF(ix, iz) && y >= gr(ix, iz) && y < top(ix, iz) && v.val(ix, y, iz) === 0) v.set(ix, y, iz, "glowstone");
}

// Roof plant: 3 x 3 x 2 boxes on sparse roof centres, only where the 3 x 3 patch sits level and inside the envelope.
for (const [x, z] of [...G.keys()].map((k) => [Math.floor(k / N), k % N])) {
  if (x % 13 !== 6 || z % 13 !== 6) continue;
  const t = top(x, z);
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) {
    if (!inF(x + dx, z + dz) || top(x + dx, z + dz) !== t || exposedFaces(x + dx, t - 1, z + dz).length) ok = false;
  }
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy < 2; dy++) v.set(x + dx, t + dy, z + dz, dy ? "light_gray_concrete" : "stone_bricks");
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_479443909.nbt");
