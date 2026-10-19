// 1200 Avenue of the Americas (1960, commercial & office): a 1960s glass-and-spandrel office slab on a granite base.
// The lidar roof is the massing: a crown row on the north edge (31), a 29-block tower over the north half, a 23-block
// shoulder over the south half. Lidar drop-outs (roof 0-1) inside the massing are infilled from their tall neighbours;
// open edge cells become a one-storey lobby roof (5). Every column is solid from y0 up through a floor slab per storey,
// so each tier stands on the one below. The facade is a 1-cell ring; behind it is air (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034470.cells.json`, "utf8"));

const W = 11, D = 21, H = 43;
const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // west, east, north, south (north = low z = uptown)

// Tier top (exclusive) per cell from the lidar roof; null = lidar drop-out to be infilled.
const tierOf = (roof) => (roof >= 31 ? 31 : roof >= 26 ? 29 : roof >= 4 ? 23 : null);
const top = new Map(cells.map(([x, z, , roof]) => [key(x, z), tierOf(roof)]));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const [k, t] of [...top]) {
  if (t !== null) continue;
  const [x, z] = k.split(",").map(Number);
  const near = DIRS.map(([dx, dz]) => top.get(key(x + dx, z + dz))).filter((v) => v);
  top.set(k, near.length >= 3 ? median(near) : 5);
}

// Sides of this cell that face air at height y (outside the footprint, or above the neighbour's top).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = top.get(key(x + dx, z + dz)); return n === undefined || y >= n; });

const cellsOf = [...top].map(([k, T]) => ({ x: +k.split(",")[0], z: +k.split(",")[1], T }));

// Ring of the facade, floor by floor. Storey k spans y = 1+3k .. 3+3k: spandrel, glass, frame.
for (const { x, z, T } of cellsOf) {
  const nS = Math.floor((T - 2) / 3), yR = 1 + 3 * nS;
  g.set(x, 0, z, "polished_granite");                                  // base course: the foundation on every cell
  for (let y = 1; y < T; y++) {
    const ex = exposed(x, z, y), out = ex.length > 0, corner = ex.length === 2;
    const u = ex.some(([dx]) => dx !== 0) ? z : x;                     // position along the face it looks out of
    let b = null, s;
    if (y === T - 1) b = T === 31 ? "stone_bricks" : out ? "quartz_block" : "gray_concrete";   // cap / coping
    else if (y === yR) b = out ? "quartz_block" : "gray_concrete";                              // tower roof under the penthouse
    else if (y > yR) b = out ? "stone_bricks" : null;                                           // crown penthouse walls
    else {
      const k = Math.floor((y - 1) / 3), r = (y - 1) % 3;
      if (r === 0) b = out ? (k === 0 ? "polished_granite" : "quartz_block") : "smooth_stone";  // base band / spandrel / floor slab
      else if (!out) b = null;
      else if (corner) b = "light_gray_concrete";
      else if (k === 0) {                                                                         // shopfront: glass, piers every 4
        if (r === 1) b = u % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
        else b = "light_gray_concrete";                                                           // transom
      } else if (r === 1) b = u % 2 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";  // window grid
      else b = "light_gray_concrete";                                                             // head frame
    }
    if (b) g.set(x, y, z, b, s);
  }
}

// Warm windows: a standing lantern on the floor just behind some glass (y = 2 mod 3, the glass row), inside the air gap.
for (const { x, z, T } of cellsOf) {
  const nS = Math.floor((T - 2) / 3), yR = 1 + 3 * nS;
  for (let y = 2; y < yR; y += 3) {
    const ex = exposed(x, z, y);
    if (!ex.length || ex.length === 2 || (x * 5 + z * 3 + y) % 7 !== 0) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    const inT = top.get(key(ix, iz));
    if (inT === undefined || inT <= y || exposed(ix, iz, y).length) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Entrances. Main lobby on the avenue face (west, x=0): granite portal, door, lintel and a canopy soffit at y=4.
for (let z = 8; z <= 12; z++) g.set(0, 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
for (const z of [9, 11]) for (let y = 1; y <= 3; y++) g.set(0, y, z, "polished_granite");
for (let z = 9; z <= 11; z++) g.set(0, 3, z, "polished_granite");
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(0, 1, 10, "iron_door", door("west", "lower"));
g.set(0, 2, 10, "iron_door", door("west", "upper"));
g.set(1, 1, 8, "lantern", { hanging: "true", waterlogged: "false" });   // lobby lights hang from the floor above
g.set(1, 1, 12, "lantern", { hanging: "true", waterlogged: "false" });
// Side door on the street (south, z=20).
g.set(3, 1, 20, "iron_door", door("south", "lower"));
g.set(3, 2, 20, "iron_door", door("south", "upper"));

// Roof plant: a tower plant box and a shoulder box; a lightning rod on the crown.
for (let x = 3; x <= 4; x++) for (let z = 4; z <= 5; z++) for (const y of [29, 30]) g.set(x, y, z, "light_gray_concrete");
for (const x of [7, 8]) g.set(x, 23, 13, "light_gray_concrete");
for (const y of [31, 32]) g.set(5, y, 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const { blocks, palette } = g.save(`${DIR}/NYC1034470.nbt`);
console.log(`NYC1034470: ${blocks} blocks, palette ${palette}`);
