// Customhouse: a civic office block of about twelve storeys (the lidar roof reads 47 blocks, 39 m), built as a
// stone-faced podium of four storeys under a pale concrete body that steps back twice to a tower with a plant room.
// The record gives no era, so this one is read from its height and its name: a 1970s-style civic block, not a claim
// about the building on the ground. Lidar roofs are smoothed into flat tiers (tower 48, setback 44, body 42, wings
// rounded up to the next storey line); storeys are 4 blocks on the absolute 4 k lines, every column solid from its
// ground up, with a recessed three-bay entrance on the lowest street face and shops on the ground floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907642.cells.json", "utf8"));
const W = 44, H = 59, D = 41;
const PODIUM = "stone_bricks", PODIUM_TRIM = "chiseled_stone_bricks", BASE = "polished_andesite";
const WHITE = "white_concrete", TRIM = "light_gray_concrete", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", DEEP = "gray_stained_glass_pane", SHOP = "glass_pane";
const DOOR = "iron_door", LAMP = "glowstone", PODIUM_TOP = 16;

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const key = (x, z) => `${x},${z}`;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
// Lidar roof -> flat tier top (exclusive), snapped to the 4-block storey lines.
const tierOf = (R) => (R >= 45 ? 48 : R >= 42 ? 44 : R >= 39 ? 42 : Math.max(4, 4 * Math.ceil((R + 1) / 4)));
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const raw = new Map();
for (const [x, z, g, R] of cells) raw.set(key(x, z), { x, z, g, T: tierOf(R) });
const outsideOf = (x, z, d) => !raw.has(key(x + DIRS[d][0], z + DIRS[d][1]));

// Entrance: the three-bay run on one street edge with the most even, lowest ground; the middle bay is the door.
let pick = null;
for (const c of raw.values()) for (const d of Object.keys(DIRS)) {
  if (!outsideOf(c.x, c.z, d)) continue;
  const [ax, az] = d === "north" || d === "south" ? [1, 0] : [0, 1];
  const bay = [-1, 0, 1].map((o) => raw.get(key(c.x + ax * o, c.z + az * o)));
  if (bay.some((b) => !b || !outsideOf(b.x, b.z, d))) continue;
  const gs = bay.map((b) => b.g), score = [Math.max(...gs) - Math.min(...gs), Math.max(...gs)];
  if (!pick || score[0] < pick.score[0] || (score[0] === pick.score[0] && score[1] < pick.score[1])) pick = { d, bay, score };
}
const entry = new Map();
pick.bay.forEach((b, i) => entry.set(key(b.x, b.z), { d: pick.d, centre: i === 1 }));

// Every tier stands at least one storey above its ground and ends on a storey line.
const fin = new Map();
for (const c of raw.values()) {
  const T = Math.ceil(Math.max(c.T, c.g + 4) / 4) * 4;
  fin.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, T });
}
const cellOf = (x, z) => fin.get(key(x, z));
// The faces of (x, y, z) that open on air: outside the footprint, or above a lower neighbour's top. Inside the mass
// with a neighbour above it is interior; below a neighbour's ground is earth.
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]);
  return !nb || y >= nb.T;
});

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

for (const c of fin.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                    // foundation: solid up to this cell's ground
  const door = entry.get(key(x, z));
  for (let y = g; y < T; y++) {
    if (y === T - 1) { put(x, y, z, ROOF); continue; }                // roof cap
    if (door && y <= g + 3) {                                         // entrance: doors, transom, lintel
      if (y === g + 3) put(x, y, z, PODIUM_TRIM);
      else if (y === g + 2) put(x, y, z, TRIM);
      else if (door.centre) put(x, y, z, DOOR, doorState(door.d, y === g ? "lower" : "upper"));
      else put(x, y, z, SHOP);
      continue;
    }
    const out = faces(x, z, y);
    const podium = y < PODIUM_TOP;
    const wall = podium ? PODIUM : WHITE;
    const pier = podium ? PODIUM_TRIM : TRIM;
    if (y === g) { put(x, y, z, out.length ? BASE : TRIM); continue; }   // base course on the street, floor inside
    if (y % 4 === 0 || y === T - 2) { put(x, y, z, out.length ? wall : TRIM); continue; }  // storey slab, and the ceiling under the roof
    if (!out.length) continue;                                        // air behind the glass
    if (y % 4 === 3) { put(x, y, z, wall); continue; }                // spandrel under each window band
    const ns = out.includes("north") || out.includes("south"), ew = out.includes("east") || out.includes("west");
    const a = ns && !ew ? x : ew && !ns ? z : x + z;                  // position along the face
    if (a % 3 === 0) { put(x, y, z, pier); continue; }                // piers between bays
    put(x, y, z, podium || y < g + 4 ? SHOP : Math.floor(a / 3) % 4 === 2 ? DEEP : GLASS);
  }
}

// The roof edge gets a parapet where it drops away (outside the footprint, or to a lower tier).
for (const c of fin.values()) {
  const { x, z, T } = c;
  const drop = Object.keys(DIRS).some((d) => { const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]); return !nb || nb.T < T; });
  if (drop) put(x, T, z, PODIUM);
}

// Plant room on the tower roof: a small box of louvred walls and a flat roof, only where the tower stands.
for (let z = 14; z <= 18; z++) for (let x = 25; x <= 30; x++) {
  const c = cellOf(x, z); if (!c || c.T !== 48) continue;
  const edge = x === 25 || x === 30 || z === 14 || z === 18;
  if (edge) {
    put(x, 48, z, PODIUM_TRIM);
    for (let y = 49; y <= 50; y++) put(x, y, z, edge && (x + z + y) % 2 === 0 && y === 49 ? DEEP : TRIM);
  }
  put(x, 51, z, ROOF);
}

// Glass panes connect to the solid or glass beside them in the wall's plane, so a window grid reads as a wall.
for (const [k, v] of plan) {
  if (!v.block.endsWith("glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const out = faces(x, z, y);
  const ns = out.includes("north") || out.includes("south"), ew = out.includes("east") || out.includes("west");
  const want = ns && !ew ? ["east", "west"] : ew && !ns ? ["north", "south"] : ["north", "east", "south", "west"];
  v.state = Object.fromEntries(["north", "east", "south", "west"].map((d) =>
    [d, want.includes(d) && at(x + DIRS[d][0], y, z + DIRS[d][1]) ? "true" : "false"]));
}

// Warm lights: a lamp in the room just behind some windows, on the floor's first course.
for (const [k, v] of [...plan]) {
  if (!v.block.endsWith("glass_pane") && v.block !== GLASS && v.block !== DEEP) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 !== 1 || hash(x, y, z) % 4 !== 0) continue;
  for (const d of faces(x, z, y)) {
    const ix = x - DIRS[d][0], iz = z - DIRS[d][1], c = cellOf(ix, iz);
    if (!c || y < c.g + 1 || y >= c.T - 2 || at(ix, y, iz)) continue;
    put(ix, y, iz, LAMP); break;
  }
}

const vox = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, block, state);
}
vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907642.nbt");
