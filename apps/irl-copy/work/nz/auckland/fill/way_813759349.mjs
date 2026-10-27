// Way 813759349, Mt Eden (Auckland): a two-storey Edwardian brick shop block with a three-storey corner tower on its
// west side. Lidar roofs are 10 (most of the footprint) and 12-13 (the corner); smoothed to two tiers, 10 and 14 (the
// brief's ~14). Ground is flat at y 0. Shell only: floor decks per storey, air inside, no interior walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_813759349.cells.json`, "utf8"));

const LOW = 10, TALL = 14;                       // clean tiers: two storeys, and the corner tower
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, top: roof >= 12 ? TALL : LOW });
const cell = (x, z) => foot.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// a face of (x, z) is open to the outside at height y when the neighbour across it is outside the footprint or
// has no block that high (its top is lower)
const openFaces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = cell(x + dx, z + dz);
  return !n || y >= n.top;
});

// the street face: the side with most open ground-storey faces; its middle plain cell takes the door
const count = Object.fromEntries(Object.keys(DIRS).map((d) => [d, 0]));
const plain = (x, z) => openFaces(x, z, 2).length === 1;
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) if (plain(x, z)) count[openFaces(x, z, 2)[0]]++;
const entrance = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const frontCells = [...foot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => plain(x, z) && openFaces(x, z, 2)[0] === entrance)
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [doorX, doorZ] = frontCells[Math.floor(frontCells.length / 2)];

// the decks: ground, the floor of storey 2 (y 4), the floor of storey 3 or the roof of the low block (y 9), and for the
// tower a ceiling under its roof (y 12); the roof cap is the top row (y top-1)
const deckYs = (c) => (c.top === TALL ? [0, 4, 9, 12, 13] : [0, 4, 9]);

const g = new Voxels([9, 26, 9]);
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); };

// 1. decks and foundation: every footprint cell, full
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.ground; y++) put(x, y, z, "stone_bricks");
  for (const y of deckYs(c)) put(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
}

// 2. the walls: each open face of each cell at each wall height, with its window grid and corners
const WALL_ROWS = (c) => [1, 2, 3, 5, 6, 7, 8, ...(c.top === TALL ? [10, 11] : [])];
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  const decks = deckYs(c);
  for (const y of WALL_ROWS(c)) {
    if (decks.includes(y)) continue;
    const open = openFaces(x, z, y);
    if (!open.length) continue;
    // quoins at the outer corners only: two open faces whose diagonal lies outside the footprint (not a notch)
    const diag = open.length === 2 ? cell(x + DIRS[open[0]][0] + DIRS[open[1]][0], z + DIRS[open[0]][1] + DIRS[open[1]][1]) : null;
    const corner = open.length > 2 || (open.length === 2 && !diag);
    const win = (x + z) % 2 === 0;                          // alternate plain cells carry windows along each face
    const front = !corner && open.includes(entrance);
    let block, state;
    if (corner) block = "stone_bricks";
    else if (front && y <= 2) {
      if (x === doorX && z === doorZ) { block = "dark_oak_door"; state = { facing: entrance, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (!win) block = "dark_oak_planks";            // shopfront mullions
      else block = "glass_pane";
    }
    else if (front && y === 3) block = "red_terracotta";      // awning band over the shop front
    else if (y === 1) block = "bricks";                      // ground-floor wall (the stone base is y 0)
    else if (y <= 3) block = win ? "glass_pane" : "bricks";
    else if (y === 5) block = win ? "white_concrete" : "bricks";
    else if (y === 6 || y === 7) block = win ? "glass_pane" : "bricks";
    else if (y === 8) block = win ? "white_concrete" : "smooth_stone";  // lintel course / cornice
    else if (y === 10) block = win ? "white_concrete" : "bricks";
    else if (y === 11) block = win ? "glass_pane" : "smooth_stone";
    if (!block) continue;
    put(x, y, z, block, state);
  }
}

// 3. the roof caps: top row of each cell (the low block's cap is its y 9 deck; the tower's is y 13)
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (c.top === TALL) put(x, 13, z, "smooth_stone");
}

// 4. warm lights: lanterns on the floor behind some windows, shroomlight in the tower's upper room
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  const open = openFaces(x, z, 5);
  if (open.length !== 1 || (x + z) % 2 !== 0) continue;
  const [dx, dz] = DIRS[open[0]];
  const ix = x - dx, iz = z - dz;
  if (!cell(ix, iz)) continue;
  if (g.get(ix, 5, iz)) continue;
  if ((x * 3 + z) % 3 === 0) put(ix, 5, iz, "lantern", { hanging: "false" });
}
for (const [k, c] of foot) {
  if (c.top !== TALL) continue;
  const [x, z] = k.split(",").map(Number);
  const open = openFaces(x, z, 10);
  if (open.length !== 1) continue;
  const [dx, dz] = DIRS[open[0]];
  const ix = x - dx, iz = z - dz;
  if (!cell(ix, iz) || g.get(ix, 10, iz)) continue;
  put(ix, 10, iz, "shroomlight");
}
for (const [x, z] of [[doorX, doorZ]]) {
  const [dx, dz] = DIRS[entrance];
  const ix = x - dx, iz = z - dz;
  if (cell(ix, iz) && !g.get(ix, 1, iz)) put(ix, 1, iz, "lantern", { hanging: "false" });   // lamp inside the door
}

// 5. a brick chimney on the tower's roof, on the most enclosed tall cell
let best = null;
for (const [k, c] of foot) {
  if (c.top !== TALL) continue;
  const [x, z] = k.split(",").map(Number);
  const n = 4 - openFaces(x, z, 13).length;
  if (!best || n > best.n) best = { x, z, n };
}
if (best) {
  put(best.x, 14, best.z, "bricks");
  put(best.x, 15, best.z, "bricks");
  put(best.x, 16, best.z, "brick_slab", { type: "top" });
}

// 6. glass panes connect to the solid neighbours on each side (the wall they sit in)
const solid = (x, y, z) => { const b = g.get(x, y, z); return !!b && b.block !== "minecraft:glass_pane"; };
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (const y of [1, 2, 3, 5, 6, 7, 10, 11]) {
    const b = g.get(x, y, z);
    if (!b || b.block !== "minecraft:glass_pane") continue;
    const st = {};
    for (const d of Object.keys(DIRS)) {
      const [dx, dz] = DIRS[d];
      st[d] = solid(x + dx, y, z + dz) || (g.get(x + dx, y, z + dz)?.block === "minecraft:glass_pane") ? "true" : "false";
    }
    put(x, y, z, "glass_pane", st);
  }
}

const out = `${DIR}/way_813759349.nbt`;
const res = g.save(out);
console.log(`entrance face ${entrance} (${count[entrance]} plain ground faces), door at ${doorX},${doorZ}; wrote ${res.blocks} blocks, palette ${res.palette} -> ${out}`);
