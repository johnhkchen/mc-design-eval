// Interwar commercial block, Auckland (c. 1930s): a stripped-classical concrete-and-plaster block of shops and offices,
// a stone-base ground floor with shopfront glazing and a recessed-hood entrance on the north tip, cream plastered upper
// storeys with steel-look window bays (glass and iron-bar mullions between plaster piers), a belt course at every storey
// line, and a parapet cornice. The lidar roof is quantised to 4-block storey tiers: a 2-storey podium over most of the
// footprint, with the 3-7 storey block stepping up on the east side. Walls stand on a solid support where they sit over a
// lower tier, and each floor, deck and tier stands on what is below it. Interiors are an air gap behind the glazing with
// a floor slab per storey. A few windows carry warm lights just inside, and the roof has a lift room and two plant units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_269439357.cells.json`;
const OUT = `${DIR}/way_269439357.nbt`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const SIZE = [21, 40, 35];

const k = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inFoot = (x, z) => foot.has(k(x, z));
const gnd = (x, z) => foot.get(k(x, z)).g;

// 1. Storey tiers from the lidar roof (4-block storeys: 8, 12, 16, 20, 24, 28). The lidar roof is smoothed first by a
//    5x5 median over footprint cells, so single noisy cells do not become spikes; then it is quantised to the tiers.
const tierOf = (r) => (r <= 9 ? 8 : r <= 14 ? 12 : r <= 18 ? 16 : r <= 21 ? 20 : r <= 23 ? 24 : 28);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const topOf = new Map();                               // absolute y of the roof surface (first air block above)
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const kk = k(x + dx, z + dz); if (foot.has(kk)) vals.push(foot.get(kk).r);
  }
  topOf.set(key, tierOf(median(vals)));
}
const top = (x, z) => topOf.get(k(x, z));

// 2. Occupancy and the exposed faces. A cell is solid up to its tier top; a side is exposed where the neighbour one
//    cell over is out of the footprint or lower than this y.
const DIRS = [
  { dx: 0, dz: -1, name: "north", axis: "x" },
  { dx: 0, dz: 1, name: "south", axis: "x" },
  { dx: 1, dz: 0, name: "east", axis: "z" },
  { dx: -1, dz: 0, name: "west", axis: "z" },
];
const occ = (x, y, z) => inFoot(x, z) && y >= 0 && y < top(x, z);
const exposed = (x, y, z) => DIRS.filter((d) => !occ(x + d.dx, y, z + d.dz));
const wall = (x, y, z) => occ(x, y, z) && y >= gnd(x, z) && exposed(x, y, z).length > 0;

// Highest wall in each column: the solid cells below it (in a column that stands over a lower tier) are its support.
const wallTop = new Map();
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  let m = -1;
  for (let y = 0; y < top(x, z); y++) if (wall(x, y, z)) m = y;
  wallTop.set(key, m);
}

// 3. The facade: belt course at each storey line, two window rows, a plaster row above; piers and mullions in the bays.
const DOOR = { x: 10, z: 0, face: "north" };          // the north tip of the footprint: the one entrance
function facade(x, y, z) {
  const base = y - (y % 4), r = y - base, ground = base === 0;
  const pier = ground ? "stone_bricks" : "white_concrete";
  const sides = exposed(x, y, z);
  if (r === 0) return [ground ? "stone_bricks" : "smooth_stone"];
  if (x === DOOR.x && z === DOOR.z && ground) {
    if (r === 3) return ["stone_bricks"];              // lintel over the door
    return ["dark_oak_door", { facing: DOOR.face, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (r === 3) return ["white_concrete"];
  if (sides.length > 1) return [pier];                 // corner pillar
  const side = sides[0];
  const u = side.axis === "x" ? x : z;                 // position along the face
  const plane = side.axis === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" };
  if (u % 4 === 0) return [pier];
  if (u % 4 === 2) return ["iron_bars", plane];        // steel-look mullion
  return ["glass_pane", plane];
}

// The block a cell takes before the roof and lights are added; null is air.
function spec(x, y, z) {
  if (!inFoot(x, z) || y >= top(x, z)) return null;
  const g = gnd(x, z);
  if (y < g) return ["stone_bricks"];                  // foundation under the lower ground
  const isWall = wall(x, y, z);
  if (y === top(x, z) - 1) return [isWall ? "smooth_stone" : "stone"];          // parapet / roof deck
  if (isWall) return facade(x, y, z);
  if (y < wallTop.get(k(x, z))) return ["stone"];      // support under a wall that stands over a lower tier
  if (y % 4 === 0 || y === g) return ["smooth_stone"]; // floor slab per storey
  return null;                                         // air gap
}

const g = new Voxels(SIZE);
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);
for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) {
  const s = spec(x, y, z); if (s) put(x, y, z, s);
}

// 4. Warm lights just inside some of the glazing (the air gap behind the panes), ground floor glowstone, upper shroomlight.
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < top(x, z) - 1; y++) {
    const r = y % 4;
    if (r !== 1 && r !== 2) continue;
    const s = spec(x, y, z);
    if (!s || s[0] !== "glass_pane") continue;
    const out = exposed(x, y, z)[0]; if (!out) continue;
    const ix = x - out.dx, iz = z - out.dz;
    if (!inFoot(ix, iz) || spec(ix, y, iz) !== null) continue;
    if (((x * 7 + z * 13 + y * 3) % 7) !== 0) continue;
    put(ix, y, iz, [y < 4 ? "glowstone" : "shroomlight"]);
  }
}

// 5. Roof: a lift room on a 3x3 clear part of the highest tier that has one, and two plant units on the podium.
const clear3 = (x, z, t) => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!inFoot(x + dx, z + dz) || top(x + dx, z + dz) !== t) return false; return true; };
let lift = null;
for (const t of [...new Set(topOf.values())].sort((a, b) => b - a)) {
  for (const [key] of foot) {
    const [x, z] = key.split(",").map(Number);
    if (top(x, z) === t && clear3(x, z, t)) { lift = { x, z, y0: t }; break; }
  }
  if (lift) break;
}
if (lift) {
  const { y0, x: cx, z: cz } = lift;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    for (let y = y0; y <= y0 + 2; y++) { if (dx === 0 && dz === 0) continue; put(cx + dx, y, cz + dz, ["white_concrete"]); }
    put(cx + dx, y0 + 3, cz + dz, ["smooth_stone"]);
  }
  put(cx, y0 + 1, cz - 1, ["glass_pane", { north: "true", south: "true" }]);
  put(cx, y0 + 1, cz + 1, ["glass_pane", { north: "true", south: "true" }]);
  put(cx - 1, y0 + 1, cz, ["glass_pane", { east: "true", west: "true" }]);
  put(cx + 1, y0 + 1, cz, ["glass_pane", { east: "true", west: "true" }]);
}
const clearLow = (x, z) => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!inFoot(x + dx, z + dz) || top(x + dx, z + dz) !== top(x, z)) return false; return true; };
const placed = [];
for (const [key] of foot) {
  if (placed.length >= 2) break;
  const [x, z] = key.split(",").map(Number);
  if (top(x, z) !== 8 || !clearLow(x, z)) continue;
  if (lift && Math.abs(x - lift.x) < 3 && Math.abs(z - lift.z) < 3) continue;
  if (placed.some((p) => Math.abs(x - p.x) + Math.abs(z - p.z) < 4)) continue;
  put(x, 8, z, ["light_gray_concrete"]);
  placed.push({ x, z });
}
const units = placed.length;

const info = g.save(OUT);
console.log(`way_269439357: ${info.blocks} blocks, ${info.palette} palette entries, lift ${lift ? "yes" : "no"}, plant units ${units}`);
