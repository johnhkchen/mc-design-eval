// 1152 15th St NW: a Commercial-Office-Large, read as a 1980s pale-stone office block on a plinth. A five-storey
// podium (lidar 15-18) carries a set-back tower (19-20) with a crown band (21) across its south front; the low
// lidar wings (2-6) at the east and north-east are one-storey annexes. Every column is solid from y 0 up to its
// tier, so each storey and tier stands on the one below. Facade: stone plinth, shopfront glass on the ground floor
// with a stone fascia, then a curtain wall of blue glass panes in dark frames, a spandrel line each storey and a
// cornice cap. Interiors are an air gap behind the glass with a floor slab per storey, and warm glowstone sits
// behind some panes. Rooftop plant on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86682.cells.json`, "utf8"));

const X = 35, Z = 21, Y = 33;
const g = new Voxels([X, Y, Z]);

// The lidar roof (4th number) smoothed into flat tiers: 21 = crown, 19-20 = tower, 15-18 = podium, low = wing at 4.
const tierOf = (r) => (r >= 21 ? 21 : r >= 19 ? 20 : r >= 15 ? 17 : 4);
const col = new Map();
for (const [x, z, G, R] of cells) col.set(`${x},${z}`, { G, T: tierOf(R) });
const at = (x, z) => col.get(`${x},${z}`);
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.T; };

// Storey floors: the slabs that stand inside every storey. 16 and 17 are the podium deck and the tower's floor.
const FL = new Set([0, 3, 6, 9, 12, 15, 16, 17]);

const B = new Map();    // "x,y,z" -> { block, state } for the panes' connections and the support check
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); B.set(`${x},${y},${z}`, { block, state }); };

for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.T; y++) {
    if (y < c.G) { put(x, y, z, "stone_bricks"); continue; }                  // foundation under the ground
    const exX = !solid(x - 1, y, z) || !solid(x + 1, y, z);
    const exZ = !solid(x, y, z - 1) || !solid(x, y, z + 1);
    if (!exX && !exZ) {                                                      // interior: air gap, slabs only
      if (y === c.T - 1) put(x, y, z, "stone");                              // roof deck
      else if (FL.has(y) || y === c.G) put(x, y, z, "smooth_stone");         // storey floor (ground floor at G)
      continue;
    }
    if (y === c.T - 1) { put(x, y, z, "smooth_stone"); continue; }           // cornice cap
    if (exX && exZ) { put(x, y, z, "smooth_stone"); continue; }              // corner pilaster
    if (y === c.G) { put(x, y, z, "smooth_stone"); continue; }               // plinth course
    if (y === c.G + 2) { put(x, y, z, "calcite"); continue; }                 // ground-floor fascia
    if (y % 3 === 0) { put(x, y, z, "calcite"); continue; }                  // storey spandrel
    if ((x + z) % 3 === 0) { put(x, y, z, "polished_deepslate"); continue; } // window frame mullion
    put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// Entrance on the south front: a dark oak door set in the shopfront, flanked by frame mullions.
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(12, 1, 20, "dark_oak_door", door("lower"));
put(12, 2, 20, "dark_oak_door", door("upper"));

// Warm lights: some panes on a storey's middle row get a glowstone in the air gap behind them, on the slab below.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const [key, b] of [...B]) {
  if (b.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y % 3 !== 1 || !FL.has(y - 1)) continue;
  if ((x * 7 + y * 13 + z * 5) % 5 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    if (solid(x + dx, y, z + dz)) continue;                               // outward side is open, not the wall
    const ix = x - dx, iz = z - dz;
    if (!at(ix, iz) || B.has(`${ix},${y},${iz}`)) continue;
    put(ix, y, iz, "glowstone");
    break;
  }
}

// Panes connect to any block beside them in the same row, so the glass reads as a curtain wall, not posts.
for (const [key, b] of [...B]) {
  if (b.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => (B.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  const state = { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" };
  put(x, y, z, b.block, state);
}

// Rooftop plant on the tower: a light-grey box standing on the tower's roof deck.
for (let x = 14; x <= 19; x++) for (let z = 9; z <= 12; z++) for (let y = 20; y <= 21; y++) {
  if (at(x, z)) put(x, y, z, y === 21 ? "smooth_stone" : "light_gray_concrete");
}

// Every block stands on something: a block under it, or a wall beside it at its own height (a roof over an air gap).
for (const key of B.keys()) {
  const [x, y, z] = key.split(",").map(Number);
  const held = y === 0 || B.has(`${x},${y - 1},${z}`) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => B.has(`${x + dx},${y},${z + dz}`));
  if (!held) throw new Error(`floating block at ${key}`);
}

g.save(`${DIR}/DC86682.nbt`);
console.log("saved", DIR + "/DC86682.nbt", "blocks", g.count());
