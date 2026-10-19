// 640 Fifth Avenue, 1940 commercial and office building: a stripped Art Deco office block in pale limestone (calcite)
// with a polished-andesite base and blue-grey steel-sash glass, set in setbacks. Footprint 40 x 32; lidar roof 84 blocks
// (about 28 storeys of 3). The lidar roof is read as clean tiers (84 tower, 76 mid setback, 41 and 34 wings, 31 and 24
// low wings), not followed cell by cell: each cell takes the nearest tier, then a 3x3 mode pass removes lidar noise.
// Envelope: a one-cell ring of solid wall on every face that meets open air, so the wall is solid through its tier.
// Ring rows: a floor line (calcite spandrel) every 3 blocks, two rows of glass, calcite piers every third column.
// Inside the ring the volume is air, with a stone floor slab at each storey line and a roof covering on each tier
// top (no interiors). Ground storey: andesite base course, shopfront glass, a double iron door on the south (low z)
// wing with a lintel and a black canopy band. Parapets on every tier edge, crenellated crown on the 84 tower, a
// penthouse with an andesite roof on the tower top. Warm glowstone sits behind some panes of the middle rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034516.cells.json`, "utf8"));
const X = 40, Y = 92, Z = 32;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const keys = [...cell.keys()];
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Tiers (block heights above y 0). Lidar values snap to the nearest tier; roofs of 3 or less are gaps.
const TIERS = [84, 76, 41, 34, 31, 24];
const nearest = (r) => TIERS.reduce((b, t) => (Math.abs(t - r) < Math.abs(b - r) ? t : b));
let tier = new Map();
for (const [k, { roof }] of cell) if (roof > 3) tier.set(k, nearest(roof));
// Two mode passes over the 3x3 neighbourhood (self counted double): smooths lidar noise and fills the gap cells.
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const k of keys) {
    const [x, z] = k.split(",").map(Number), count = new Map();
    const add = (t, w) => { if (t) count.set(t, (count.get(t) || 0) + w); };
    add(tier.get(k), 2);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (dx || dz) add(tier.get(`${x + dx},${z + dz}`), 1);
    let best = 0, bestN = -1;
    for (const [t, n] of count) if (n > bestN || (n === bestN && t > best)) { best = t; bestN = n; }
    if (bestN > 0) next.set(k, best);
  }
  tier = next;
}
const roofAt = (x, z) => tier.get(`${x},${z}`) ?? 0;

// Outward faces: [dx, dz]; +z is the south (high z) side, the low wing with the entrance.
const NORMALS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const open = (x, y, z) => roofAt(x, z) <= y;          // outside the footprint, unbuilt, or below this height
const exposed = (x, y, z) => NORMALS.find(([dx, dz]) => open(x + dx, y, z + dz)) ?? null;

const g = new Voxels([X, Y, Z]);
const glass = [];                                     // exposed panes in the storey rows, for the warm lights
const paneState = (n) => (n[0] === 0                  // a pane on a face along x runs along z, and the reverse
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

// Entrance: a double iron door on the south face, x 17-18, with an andesite lintel and a black canopy band above.
const DOOR_X = [17, 18];
const doorState = (x) => ({ facing: "south", hinge: x === 17 ? "left" : "right", open: "false", powered: "false" });

for (const k of keys) {
  const [x, z] = k.split(",").map(Number), T = roofAt(x, z), { ground } = cell.get(k);
  if (!T) continue;
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation up to the ground
    const face = exposed(x, y, z), u = face && face[0] === 0 ? x : z;             // position along the face

    if (y === T - 1) { g.set(x, y, z, face ? "calcite" : "stone"); continue; }     // roof covering; the wall's top course
    if (!face) { if (y % 3 === 1) g.set(x, y, z, "stone"); continue; }             // interior: a slab per storey, else air

    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === 1) {                                                                // base course, or the door
      if (face[1] === 1 && DOOR_X.includes(x) && roofAt(x, z) > 2) g.set(x, y, z, "iron_door", { ...doorState(x), half: "lower" });
      else g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (y <= 3) {                                                                 // shopfront
      const doorBay = face[1] === 1 && x >= 16 && x <= 19;
      if (doorBay && y === 2 && DOOR_X.includes(x)) g.set(x, y, z, "iron_door", { ...doorState(x), half: "upper" });
      else if (doorBay && y === 3) g.set(x, y, z, "polished_andesite");
      else if (u % 3 === 0 || doorBay) g.set(x, y, z, "polished_andesite");
      else { g.set(x, y, z, "light_blue_stained_glass_pane", paneState(face)); glass.push([x, y, z, face]); }
      continue;
    }
    if (y === 4 && face[1] === 1 && x >= 15 && x <= 20) { g.set(x, y, z, "black_concrete"); continue; }   // canopy band
    if (y % 3 === 1) { g.set(x, y, z, "calcite"); continue; }                     // floor line (spandrel)
    if (u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                     // pier
    g.set(x, y, z, "light_blue_stained_glass_pane", paneState(face));
    glass.push([x, y, z, face]);
  }
}

// Parapets on every tier edge; the 84 tower gets a crenellated crown.
for (const k of keys) {
  const [x, z] = k.split(",").map(Number), T = roofAt(x, z);
  if (!T) continue;
  const face = exposed(x, T, z);
  if (!face) continue;
  g.set(x, T, z, "polished_andesite");
  if (T === 84 && (x % 2 === 0 || z % 2 === 0)) g.set(x, T + 1, z, "calcite");
}

// Warm lights: glowstone one block inside some glass in the middle rows (on the storey's slab), never a floating one.
for (const [x, y, z, n] of glass) {
  if (y % 3 !== 2 || (x * 5 + y * 3 + z) % 7 !== 0) continue;
  const ix = x - n[0], iz = z - n[1];
  if (inFoot(ix, iz) && roofAt(ix, iz) > y && !exposed(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// Penthouse on the 84 tower: a 7 x 6 box of calcite and glass on the roof covering, with an andesite roof.
for (let z = 8; z <= 13; z++) for (let x = 9; x <= 15; x++) {
  if (roofAt(x, z) !== 84) continue;
  const ring = x === 9 || x === 15 || z === 8 || z === 13;
  if (ring) { g.set(x, 84, z, "calcite"); g.set(x, 85, z, "light_blue_stained_glass_pane", paneState([x === 9 || x === 15 ? 1 : 0, 0])); }
  g.set(x, 86, z, "polished_andesite");
}

const counts = g.save(`${DIR}/NYC1034516.nbt`);
console.log(JSON.stringify({ built: counts, glass: glass.length, tiers: Object.fromEntries(TIERS.map((t) => [t, [...tier.values()].filter((v) => v === t).length])) }));
