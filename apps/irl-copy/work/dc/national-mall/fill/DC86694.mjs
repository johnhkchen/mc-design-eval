// 1177 15th St NW: a Beaux-Arts hotel of about 1920, buff brick-and-stone on a stone plinth, six storeys on a 17-block body,
// a 19-block tower on its west half, a 2-block porch wing at the north-west and a 5-block shopfront wing at the south.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86694.cells.json`, "utf8"));

const W = 23, D = 16, H = 32;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];          // N, E, S, W (z grows south)
const k = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const inFP = (x, z) => lidar.has(k(x, z));

// Lidar roof heights snap to four flat tiers: 2 porch wing, 5 shopfront wing, 17 body, 19 tower. A cell then takes its
// neighbours' tier when 5 or more of its (up to 9) footprint cells agree, so single spikes go and the steps stay put.
const tierOf = (r) => (r <= 2 ? 2 : r <= 11 ? 5 : r <= 18 ? 17 : 19);
const roof = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFP(x + dx, z + dz)) continue;
    const t = tierOf(lidar.get(k(x + dx, z + dz)));
    votes.set(t, (votes.get(t) ?? 0) + 1);
  }
  let best = tierOf(lidar.get(k(x, z))), n = 0;
  for (const [t, c] of votes) if (c > n) { best = t; n = c; }
  roof.set(k(x, z), n >= 5 ? best : tierOf(lidar.get(k(x, z))));
}

// A side is exposed at height y when the cell beyond it is outside the footprint or stands lower than y.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || y >= roof.get(k(nx, nz));
});
// Storey lines every 3 blocks from y 4 (ground floor = y 1..3: base course and shopfront glazing).
const isBand = (y) => y >= 4 && (y - 4) % 3 === 0;

const g = new Voxels([W, H, D]);
const panes = [];                                          // [x, y, z, faceIsNorthSouth]

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = roof.get(k(x, z)) - 1;                         // top block row of this column
  for (let y = 0; y <= T; y++) {
    const dirs = exposed(x, y, z);
    if (y === 0) g.set(x, y, z, "stone_bricks");           // plinth: the foundation on the low side, a base everywhere else
    else if (y === T) g.set(x, y, z, dirs.length ? "cut_sandstone" : "smooth_stone");   // cornice on the edge, roof surface inside
    else if (!dirs.length) { if (isBand(y)) g.set(x, y, z, "smooth_stone"); }          // floor slab; air behind the glass
    else if (y === 1) g.set(x, y, z, "stone_bricks");      // ground-floor base course
    else if (isBand(y)) g.set(x, y, z, "chiseled_sandstone");                          // storey line
    else if (dirs.length > 1) g.set(x, y, z, "smooth_sandstone");                      // corner pier
    else {
      const [dx, dz] = dirs[0];
      const p = dx ? z : x;                                // position along the face
      if (p % 3 === 0) g.set(x, y, z, "smooth_sandstone");  // pier between bays
      else { g.set(x, y, z, "glass_pane"); panes.push([x, y, z, dz !== 0]); }
    }
  }
}

// Entrance on the north face: two-leaf door under a glazed transom, steps on the plinth, pillars either side.
const door = { facing: "north", open: "false", powered: "false" };
for (const x of [11, 12]) {
  const hinge = x === 11 ? "left" : "right";
  g.set(x, 0, 2, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(x, 1, 2, "dark_oak_door", { ...door, half: "lower", hinge });
  g.set(x, 2, 2, "dark_oak_door", { ...door, half: "upper", hinge });
  g.set(x, 3, 2, "glass_pane");
  panes.push([x, 3, 2, true]);
}
for (const x of [10, 13]) for (let y = 1; y <= 3; y++) g.set(x, y, 2, "stone_bricks");

// Warm light behind some glass: a glowstone or shroomlight on the floor inside, on the lower row of each window bay.
const lights = [];
for (const [x, y, z, ns] of panes) {
  if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
  const ly = y === 2 ? 1 : y >= 5 && (y - 4) % 3 === 1 ? y : null;
  if (ly === null || (x * 7 + y * 3 + z * 5) % 6 !== 0) continue;
  const dirs = exposed(x, y, z);
  if (dirs.length !== 1) continue;
  const [dx, dz] = dirs[0];
  const xi = x - dx, zi = z - dz;
  if (!inFP(xi, zi) || exposed(xi, ly, zi).length || g.val(xi, ly, zi) !== 0) continue;
  lights.push([xi, ly, zi, "glowstone"]);
}
for (const [x, y, z, b] of lights) g.set(x, y, z, b);

// Rooftop plant on the wings and the tower roof: a few iron boxes standing on the roof surface.
for (const [x, z] of [[14, 13], [19, 13], [9, 8], [14, 8]]) {
  const R = roof.get(k(x, z));
  if (R && !exposed(x, R - 1, z).length) g.set(x, R, z, "iron_block");
}

// Glass panes join their neighbours in the plane of their wall (never along the normal, which points in or out).
for (const [x, y, z, ns] of panes) {
  if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
  const on = (dx, dz) => g.val(x + dx, y, z + dz) !== 0;
  const conn = ns
    ? { north: false, south: false, east: on(1, 0), west: on(-1, 0) }
    : { north: on(0, -1), south: on(0, 1), east: false, west: false };
  g.set(x, y, z, "glass_pane", { ...Object.fromEntries(Object.entries(conn).map(([s, v]) => [s, String(v)])), waterlogged: "false" });
}

console.log(g.save(`${DIR}/DC86694.nbt`));
