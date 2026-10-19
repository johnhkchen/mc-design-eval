// 47 West 47th Street, 1920: a narrow mid-block commercial and office building (6 x 26 cells) of the loft-and-office type
// Midtown put up in the 1920s. The street front is the high-z end (z 25): a shopfront and a centre door. The rear
// (z 0) steps down to a two-storey wing.
// Massing: lidar roofs smoothed to 3-block storeys (the 27 peaks on the west side are the tallest mass in the lot),
// setbacks to 24, 21 and 18, and a 2-storey rear. Ground is 0 everywhere, so no foundation is needed.
// Construction: each column is solid from y 0, so nothing floats. Outer skin is one cell thick (calcite piers, glass
// panes, smooth-stone storey bands, a stone-brick cornice). Interior is air behind the glazing with a floor slab
// per storey and a roof slab on each tier. A bulkhead sits on the roof of a low interior tier.
// Materials: polished granite base course, calcite walls, smooth stone bands, stone-brick cornice, stone roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034473.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 6, D = 26;

// Roof height above y 0 per footprint cell, [z][x]: z 0 rear .. 25 street front, x 0..5. Snapped to 3-block storeys.
const TIER = [
  [6, 6, 6, 6, 6, 12],      // z0  rear two-storey wing, east corner steps up
  [9, 18, 18, 18, 18, 18],  // z1
  [18, 18, 18, 18, 18, 18], // z2
  [18, 18, 21, 21, 18, 18], // z3
  [18, 18, 21, 21, 18, 18], // z4
  [18, 18, 18, 21, 21, 21], // z5
  [18, 18, 18, 18, 21, 18], // z6
  [24, 18, 21, 21, 21, 21], // z7
  [24, 18, 21, 21, 24, 24], // z8
  [27, 18, 21, 21, 21, 21], // z9  west peak
  [21, 21, 21, 21, 21, 21], // z10 low interior tier
  [24, 21, 21, 21, 24, 24], // z11
  [21, 21, 21, 21, 21, 24], // z12
  [21, 21, 21, 21, 21, 24], // z13
  [24, 24, 24, 24, 21, 21], // z14
  [27, 24, 24, 24, 24, 21], // z15
  [27, 24, 24, 24, 21, 21], // z16
  [27, 24, 24, 24, 24, 24], // z17
  [27, 24, 24, 24, 24, 24], // z18
  [24, 24, 24, 24, 24, 24], // z19 lidar hole filled from neighbours
  [27, 24, 24, 24, 24, 24], // z20
  [27, 24, 24, 24, 24, 24], // z21
  [21, 21, 18, 18, 18, 18], // z22 step down toward the street
  [18, 18, 18, 18, 18, 18], // z23
  [18, 18, 18, 18, 18, 18], // z24
  [18, 18, 18, 18, 18, 18], // z25 street front, six storeys
];

// Lidar check: where the tier differs from the raw roof by more than 3 blocks, the cell was smoothed on purpose.
const byXZ = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const smoothed = [...byXZ].filter(([k, roof]) => { const [x, z] = k.split(",").map(Number); return Math.abs(TIER[z][x] - roof) > 3; })
  .map(([k, roof]) => { const [x, z] = k.split(",").map(Number); return `${x},${z}:${roof}->${TIER[z][x]}`; });
console.log(`cells: ${cells.length}, smoothed beyond 3 blocks: ${smoothed.length} ${smoothed.join(" ")}`);

const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const top = (x, z) => (inside(x, z) ? TIER[z][x] : 0);
// Open at height y: outside the footprint, or a neighbour whose roof is already below y.
const open = (x, z, y) => !inside(x, z) || top(x, z) <= y;
// One cell in from a face, toward the building's inside, where a window's light sits.
const inward = (x, z, y) => {
  if (open(x - 1, z, y) && !open(x + 1, z, y)) return [x + 1, z];
  if (open(x + 1, z, y) && !open(x - 1, z, y)) return [x - 1, z];
  if (open(x, z - 1, y) && !open(x, z + 1, y)) return [x, z + 1];
  if (open(x, z + 1, y) && !open(x, z - 1, y)) return [x, z - 1];
  return null;
};
// Glass connects to the solid piers beside it: side panes run along z, street and rear panes along x.
const pane = (alongZ) => (alongZ
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels([W, 39, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glazed = [];   // windows to light after the shell is down

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const exX = open(x - 1, z, y) || open(x + 1, z, y);   // a side face (wall plane runs along z)
    const exZ = open(x, z - 1, y) || open(x, z + 1, y);   // an end face (wall plane runs along x)
    const s = Math.floor(y / 3), r = y % 3;               // storey and row within it
    if (!exX && !exZ) {                                   // interior: air behind the glass, a slab per storey, a roof on top
      if (r === 0) put(x, y, z, "smooth_stone");
      if (y === t - 1) put(x, y, z, "stone");
      continue;
    }
    // Street entrance, centre bay of the street front: a dark oak door, a granite lintel, the wall above.
    if (z === D - 1 && x === 2 && s === 0) {
      if (r === 0) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (r === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "polished_granite");
      continue;
    }
    if (y === t - 1) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // cornice on the tier's top row
    if (r === 0) { put(x, y, z, s === 0 ? "polished_granite" : "smooth_stone"); continue; }                     // base course, then storey bands
    const corner = exX && exZ;
    const endWindow = exZ && !exX && (x === 1 || x === 3 || (s === 0 && x === 4));    // ends: panes at x 1 and 3, shopfront to x 4
    const sideWindow = exX && !exZ && z % 2 === 0;                                    // sides: a pane on every even z, piers between
    if (corner || !(endWindow || sideWindow)) { put(x, y, z, "calcite"); continue; }
    put(x, y, z, "glass_pane", pane(exX && !exZ));
    glazed.push([x, y, z, s]);
  }
}

// Warm light behind some panes; the shopfront on the street is always lit.
for (const [x, y, z, s] of glazed) {
  const shop = z === D - 1 && s === 0;
  if (!shop && (x + 2 * z + 3 * s) % 5 !== 0) continue;
  const at = inward(x, z, y);
  if (!at) continue;
  const [ix, iz] = at;
  if (!inside(ix, iz) || y >= top(ix, iz) || g.get(ix, y, iz)) continue;   // only into air inside the building
  put(ix, y, iz, (x + z + s) % 3 === 0 ? "shroomlight" : "glowstone");
}

// The entrance lantern, hung from the storey-1 floor slab just inside the door.
if (g.get(2, 3, D - 2) && !g.get(2, 2, D - 2)) put(2, 2, D - 2, "lantern", { hanging: "true", waterlogged: "false" });

// Roof bulkhead on the low interior tier (x 2..3, z 12..13, tier 21): calcite walls and a stone-brick cap.
for (const x of [2, 3]) for (const z of [12, 13]) {
  put(x, 21, z, "calcite");
  put(x, 22, z, "calcite");
  put(x, 23, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1034473.nbt`);
console.log(`NYC1034473.nbt: ${blocks} blocks, ${palette} palette entries, glazed ${glazed.length}`);
