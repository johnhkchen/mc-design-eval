// Clearpoint: a 1980s office block, eight storeys of precast concrete and tinted glass on a dark volcanic basalt base
// course (Auckland's own stone). Lidar roofs are smoothed into flat tiers: a nine-storey core (36) stepped in on a
// two-bay terrace (32), the eight-storey body (32), and a seven-storey wing on the north-east corner (28). Storeys are
// 4 blocks on absolute lines (slab at y%4==0, a 2-block window band, a spandrel), the ground storey is shopfront with
// a basalt fascia, the lowest street face gets a canopied entrance (door, hanging lantern over it). Every column is
// solid from the ground up through its slabs; the terrace stands on the body's roof cap, and the core stands on it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907425.cells.json", "utf8"));
const W = 40, H = 49, D = 34;
const BASE = "polished_blackstone", WALL = "light_gray_concrete", TRIM = "white_concrete", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", DEEP = "cyan_stained_glass_pane", SHOP = "glass";
const DOOR = "iron_door", LANTERN = "lantern", LAMP = "glowstone", PLANT = "stone_bricks", PLANT_CAP = "stone_brick_slab";

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const key = (x, z) => `${x},${z}`;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Core: the cells lidar reads at 35 blocks and up. Its inner part (3 or more cells from the core's edge) is the 36 tower;
// the rest of the core is the 32 terrace, the same height as the body.
const raw = new Map(cells.map(([x, z, g, R]) => [key(x, z), { x, z, g, R }]));
const isCore = (c) => c.R >= 35;
const edgeDist = new Map();
const queue = [];
for (const c of raw.values()) {
  if (!isCore(c)) continue;
  const edge = Object.values(DIRS).some(([dx, dz]) => { const n = raw.get(key(c.x + dx, c.z + dz)); return !n || !isCore(n); });
  if (edge) { edgeDist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = edgeDist.get(key(c.x, c.z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const n = raw.get(key(c.x + dx, c.z + dz));
    if (n && isCore(n) && !edgeDist.has(key(n.x, n.z))) { edgeDist.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}
const tierOf = (c) => {
  if (isCore(c)) return edgeDist.get(key(c.x, c.z)) >= 3 ? 36 : 32;
  return c.R >= 31 ? 32 : 28;
};
const fin = new Map();
for (const c of raw.values()) fin.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, T: tierOf(c), core: isCore(c) && tierOf(c) === 36 });
const cellOf = (x, z) => fin.get(key(x, z));

// The faces of (x, y, z) that open on air: outside the footprint, or above a lower neighbour's roof.
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]);
  return !nb || y >= nb.T;
});

// Entrance: the lowest run of three bays on one street edge; the middle bay is the door, the flanks are shopfront.
let pick = null;
for (const c of fin.values()) for (const d of Object.keys(DIRS)) {
  if (faces(c.x, c.z, c.g).indexOf(d) < 0) continue;
  const [ax, az] = d === "north" || d === "south" ? [1, 0] : [0, 1];
  const bay = [-1, 0, 1].map((o) => cellOf(c.x + ax * o, c.z + az * o));
  if (bay.some((b) => !b || faces(b.x, b.z, b.g).indexOf(d) < 0)) continue;
  const gB = Math.max(...bay.map((b) => b.g));
  if (!pick || gB < pick.gB) pick = { d, bay, gB };
}
const entry = new Map();
pick.bay.forEach((b, i) => entry.set(key(b.x, b.z), { d: pick.d, centre: i === 1 }));

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// A floor is a slab row (y%4==0 above the ground) or the ground itself; the lamp sits on it, behind the glass.
const onFloor = (y, g) => y - 1 === g || (y - 1 > g && (y - 1) % 4 === 0);

for (const c of fin.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                    // foundation: solid up to this cell's ground
  const door = entry.get(key(x, z));
  for (let y = g; y < T; y++) {
    if (y === T - 1) { put(x, y, z, ROOF); continue; }                  // roof cap
    const out = faces(x, z, y);
    const ns = out.includes("north") || out.includes("south"), ew = out.includes("east") || out.includes("west");
    const corner = ns && ew;
    const a = ns && !ew ? x : ew && !ns ? z : x + z;                  // position along the face
    if (door && out.length && y < 4) {                                  // entrance bay: door, lintel, fascia
      if (y === g || y === g + 1) { if (door.centre) put(x, y, z, DOOR, doorState(door.d, y === g ? "lower" : "upper")); else put(x, y, z, SHOP); continue; }
      if (y === g + 2 && door.centre && g + 2 < 3) { put(x, y, z, LANTERN, { hanging: "true", waterlogged: "false" }); continue; }
    }
    if (!out.length) {                                                  // hollow behind the glass; a lamp on some room floors
      const lit = onFloor(y, g) && hash(x, y, z) % 5 === 0 &&
        Object.keys(DIRS).some((d) => { const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]); return nb && y >= nb.g && y < nb.T && faces(nb.x, nb.z, y).length > 0; });
      if (lit) put(x, y, z, LAMP);
      else if (y === g || (y % 4 === 0 && y > g)) put(x, y, z, TRIM);  // floor slab, spanning the room
      continue;
    }
    if (y === g) { put(x, y, z, BASE); continue; }                     // basalt base course on the street
    if (y < 4) {                                                        // ground storey: shopfront, basalt fascia
      if (y === 3) { put(x, y, z, BASE); continue; }
      if (corner || a % 3 === 0) { put(x, y, z, BASE); continue; }
      put(x, y, z, SHOP);
      continue;
    }
    if (y % 4 === 0) { put(x, y, z, TRIM); continue; }                  // storey slab
    if (corner) { put(x, y, z, TRIM); continue; }                       // corner pier
    if (y % 4 === 3) { put(x, y, z, WALL); continue; }                  // spandrel under each window band
    if (a % 3 === 0) { put(x, y, z, TRIM); continue; }                  // mullion
    put(x, y, z, (Math.floor(a / 3) + Math.floor(y / 4)) % 4 === 2 ? DEEP : GLASS);
  }
}

// Parapets where a roof drops away (outside, or a lower tier); plant on the tower and the body roof.
for (const c of fin.values()) {
  const { x, z, T } = c;
  const drop = Object.keys(DIRS).some((d) => { const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]); return !nb || nb.T < T; });
  if (drop) { put(x, T, z, TRIM); continue; }                          // white cornice on the roof's edge
  if (c.core && x % 9 === 4 && z % 9 === 4) { put(x, T, z, PLANT); put(x, T + 1, z, PLANT); put(x, T + 2, z, PLANT_CAP); }
  else if (!c.core && T === 32 && x % 7 === 2 && z % 6 === 2) { put(x, T, z, PLANT); put(x, T + 1, z, PLANT_CAP); }
}

// Glass panes connect to the solid or glass beside them in the wall's plane, so a window grid reads as a wall.
for (const [k, v] of plan) {
  if (!v.block.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const out = faces(x, z, y);
  const ns = out.includes("north") || out.includes("south"), ew = out.includes("east") || out.includes("west");
  const want = ns && !ew ? ["east", "west"] : ew && !ns ? ["north", "south"] : ["north", "east", "south", "west"];
  v.state = Object.fromEntries(["north", "east", "south", "west"].map((d) =>
    [d, want.includes(d) && at(x + DIRS[d][0], y, z + DIRS[d][1]) ? "true" : "false"]));
}

const vox = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, block, state);
}
vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907425.nbt");
