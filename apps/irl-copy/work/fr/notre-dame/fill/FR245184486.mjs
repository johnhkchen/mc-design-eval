import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Indifférencié, Île de la Cité side: a Paris-cream limestone block of three storeys on a stone plinth, a tall
// L-shaped tower at its south-west corner (the lidar's 12 m), lower wings stepping down north and east, slate
// mansard eaves, a chimney on the tower. The lidar's heights are metres: 1.4 blocks a metre (the scale line).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184486.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..3, z 0..7

const S = 1.4;
const blk = (m) => Math.round(m * S);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { G: blk(ground), H: blk(roof) });
const has = (x, z) => cell.has(`${x},${z}`);

const WALL = "calcite", BAND = "smooth_quartz", BASE = "stone_bricks", ROOF = "deepslate_tiles", SLATE = "deepslate_tile_stairs", BRICK = "bricks";
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const OPP = { west: "east", east: "west", north: "south", south: "north" };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
const paneState = (d) => (d === "west" || d === "east"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

const g = new Voxels([4, 28, 8]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// 1. solid massing: foundation, plinth, storey string courses every 5 blocks, calcite between, cornice, roof cap
for (const [x, z] of cols) {
  const { G, H } = cell.get(`${x},${z}`);
  const out = outward(x, z);
  const corner = out.length >= 2;
  for (let y = 0; y < G; y++) g.set(x, y, z, BASE);                       // foundation down to the ground
  for (let y = G; y <= H - 2; y++) {
    let b;
    if (y < G + 2) b = BASE;                                              // base course
    else if (y % 5 === 0) b = BAND;                                       // storey line / floor slab
    else if (corner) b = y % 2 ? WALL : BAND;                             // quoins on the corners
    else b = WALL;
    g.set(x, y, z, b);
  }
  g.set(x, H - 1, z, BAND);                                               // cornice
  if (out.length === 1) g.set(x, H, z, SLATE, { facing: out[0], half: "bottom", shape: "straight", waterlogged: "false" });  // mansard eave, rising inward
  else g.set(x, H, z, ROOF);
}

// 2. the tower's chimney stack on the south edge, and the lower wings' roof stays flat
const chim = cell.get("1,7");
if (chim) { g.set(1, chim.H, 7, BRICK); g.set(1, chim.H + 1, 7, BRICK); g.set(1, chim.H + 2, 7, BAND); }

// 3. windows: glass panes in each non-corner exterior cell, three rows between the storey lines, air behind them
//    (the inward cell is cleared), a glowstone on the sill behind some panes
for (const [x, z] of cols) {
  const { G, H } = cell.get(`${x},${z}`);
  const out = outward(x, z);
  if (out.length !== 1 || (x === 3 && z === 0)) continue;                 // corners and the door cell get no window
  const d = out[0];
  const [dx, dz] = DIRS[d];
  const inward = has(x - dx, z - dz) ? [x - dx, z - dz] : null;
  for (let k = 0; k < 4; k++) {
    for (let r = 5 * k + 1; r <= 5 * k + 3; r++) {
      if (r < G + 2 || r > H - 3) continue;
      g.set(x, r, z, "glass_pane", paneState(d));
      if (inward) g.set(inward[0], r, inward[1], "air");
    }
    if (inward && (x + z + k) % 3 === 0 && 5 * k + 1 >= G + 2 && 5 * k + 1 <= H - 3) {
      g.set(inward[0], 5 * k + 1, inward[1], "glowstone");
    }
  }
}

// 4. entrance: a dark-oak door on the north face of cell (1,1), between solid walls on both sides (a door alone in
//    the corner cell left air either side of it), under the cornice
const dc = cell.get("1,1");
const doorFacing = OPP.north;                                             // a door's facing is the side you stand on
const doorState = (half) => ({ facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
g.set(1, dc.G + 1, 1, "dark_oak_door", doorState("lower"));
g.set(1, dc.G + 2, 1, "dark_oak_door", doorState("upper"));

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184486.nbt");
console.log(JSON.stringify(info));
