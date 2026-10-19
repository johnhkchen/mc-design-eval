// 143 West 46th Street, an NYC individual landmark of 1895 in the public facilities and institutions class: a red-brick
// Romanesque-Revival institutional block with granite base courses, brownstone-coloured sandstone sills and a cornice,
// set around an open court. Footprint 34 x 55 (x across the front, low z = north = the street front). Massing from the
// lidar roof, smoothed: a 12-block podium ring on the north and the flanks, 18 to 21 blocks on the west and east wings,
// and a 33-block tower spine up the middle, with its setbacks read as flat tiers in 3-block storeys. Every cell stands on
// its own foundation (stone to its ground, paved top), and each storey is solid masonry with a sandstone sill band under
// two window rows, so nothing hangs. The windows are glass panes set flush on the face with an air gap
// behind them, a floor slab in each storey, and warm glowstone in about one window in seven. The north entrance has a
// granite base, a double door and a sandstone canopy on two granite posts with hanging lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022665.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [34, 46, 55];
const g3 = new Voxels(SIZE);

const key = (x, z) => `${x},${z}`;
const src = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ring8 = (x, z) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// 1. Building or open ground. Lidar roofs that stand less than 3 above the cell's ground are open paving (the court, the
//    forecourt). A pinhole in the massing (an open cell with 5 or more built neighbours) is lidar noise and is filled.
const B = new Map();
for (const [x, z, ground, roof] of cells) if (roof - ground >= 3) B.set(key(x, z), { x, z, g: ground, roof });
for (const [x, z, ground] of cells) {
  if (B.has(key(x, z))) continue;
  const n = ring8(x, z).filter(([a, b]) => B.has(key(a, b)));
  if (n.length >= 5) B.set(key(x, z), { x, z, g: ground, roof: median(n.map(([a, b]) => B.get(key(a, b)).roof)) });
}

// 2. Tiers: the median roof of each building cell and its neighbours, rounded to whole 3-block storeys.
const topOf = new Map();
for (const c of B.values()) {
  const near = [[c.x, c.z], ...ring8(c.x, c.z)].filter(([a, b]) => B.has(key(a, b))).map(([a, b]) => B.get(key(a, b)).roof);
  const t = Math.round(median(near) / 3) * 3;
  topOf.set(key(c.x, c.z), Math.max(t, Math.ceil((c.g + 3) / 3) * 3));
}
const T = (x, z) => topOf.get(key(x, z)) ?? 0;          // building top, 0 = none
const G = (x, z) => src.get(key(x, z))?.ground ?? 0;    // ground under the cell
const solid = (x, z, y) => T(x, z) > y && y >= G(x, z);
// Outward faces at height y: a neighbour with no block at y (off the footprint, open, or a lower tier) exposes the face.
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, z + dz, y)).map(([d]) => d);

// 3. Solid masonry per cell, storey by storey (rows counted from y 0, storeys every 3 blocks).
for (const c of B.values()) {
  const { x, z } = c, g = G(x, z), t = T(x, z);
  for (let y = 0; y < g; y++) g3.set(x, y, z, "stone_bricks");                           // foundation
  for (let y = g; y < t; y++) {
    const outer = exposed(x, z, y).length > 0;
    let b;
    if (y === t - 1) b = outer ? "smooth_sandstone" : "smooth_stone";                     // cornice / roof membrane
    else if (y < 3) b = outer ? "polished_granite" : "stone_bricks";                     // base course
    else if (y % 3 === 0) b = outer ? "smooth_sandstone" : "smooth_stone";               // sill band / floor slab
    else b = "bricks";                                                                    // window rows (piers) and brick
    g3.set(x, y, z, b);
  }
  if (exposed(x, z, t - 1).length) g3.set(x, t, z, "stone_bricks");                      // parapet on the outer edge
}

// 4. Windows: on a single exposed face, 2 of every 4 bays (piers at 0 and 3 mod 4), two rows high under each sill band
//    (the cornice row is left solid). The glass sits on the face and the cell behind it is air (or a glowstone lamp),
//    so each window is a recess-backed pane, not a flat slab.
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
for (const c of B.values()) {
  const { x, z } = c, t = T(x, z);
  for (let y = 4; y < t - 1; y++) {
    if (y % 3 === 0) continue;
    const ex = exposed(x, z, y);
    if (ex.length !== 1) continue;
    const [dx, dz] = DIRS[ex[0]];
    const i = dx ? z : x;
    if (i % 4 === 0 || i % 4 === 3) continue;
    const ix = x - dx, iz = z - dz;
    if (!solid(ix, iz, y)) continue;
    g3.set(x, y, z, "glass_pane", dx ? PANE_X : PANE_Z);
    const lit = (x * 5 + y * 3 + z * 7) % 7 === 0;
    g3.set(ix, y, iz, lit ? "glowstone" : "air");
  }
}

// 5. Crown: the tallest tier's interior gets a two-storey plant room with a sandstone cap (a clear top to the spine).
const maxT = Math.max(...[...topOf.values()]);
for (const c of B.values()) {
  const { x, z } = c, t = T(x, z);
  if (t !== maxT || exposed(x, z, t - 1).length) continue;
  g3.set(x, t, z, "stone_bricks"); g3.set(x, t + 1, z, "stone_bricks"); g3.set(x, t + 2, z, "smooth_sandstone");
}

// 6. North entrance on the front (z = 1): granite portal, a double door, and a sandstone canopy on two granite posts over
//    the forecourt (z = 0), with hanging lanterns under it.
const yD = G(15, 1);
for (let x = 13; x <= 18; x++) g3.set(x, 3, 0, "smooth_sandstone");
for (const x of [13, 18]) for (let y = G(x, 0); y < 3; y++) g3.set(x, y, 0, "polished_granite");
g3.set(14, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
g3.set(17, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
const door = (x, half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
for (const [x, hinge] of [[15, "left"], [16, "right"]]) {
  g3.set(x, yD, 1, "dark_oak_door", door(x, "lower", hinge));
  g3.set(x, yD + 1, 1, "dark_oak_door", door(x, "upper", hinge));
}

const { blocks, palette } = g3.save(`${DIR}/NYC1022665.nbt`);
console.log(`NYC1022665: ${blocks} blocks, ${palette} palette entries, top ${maxT}, ${B.size} building cells`);
