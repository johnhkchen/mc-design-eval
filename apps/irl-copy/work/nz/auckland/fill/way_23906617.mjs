// Pullman Auckland Hotel And Apartments: a late-20th-century hotel and apartment block, a stone-clad podium and wings under
// a pale concrete tower with stepped setbacks. Lidar roofs are smoothed into flat tiers (tower 78, setback 74, body 68,
// podium 29, wings 25 / 22 / 18); storeys are 4 blocks on the absolute 4 k lines, every column solid from the ground up
// through its slabs, with a canopied entrance on the lowest street face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906617.cells.json", "utf8"));
const W = 104, D = 129, H = 90;
const WHITE = "white_concrete", TRIM = "light_gray_concrete", ROOF = "gray_concrete", BASE = "polished_andesite";
const PODIUM = "andesite", GLASS = "light_blue_stained_glass_pane", DEEP = "cyan_stained_glass_pane", SHOP = "gray_stained_glass_pane";
const DOOR = "iron_door", LAMP = "glowstone";

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const key = (x, z) => `${x},${z}`;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const tierOf = (R) => (R >= 76 ? 78 : R >= 70 ? 74 : R >= 60 ? 68 : R >= 26 ? 29 : R >= 22 ? 25 : R >= 19 ? 22 : 18);
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const raw = new Map();
for (const [x, z, g, R] of cells) raw.set(key(x, z), { x, z, g, T: tierOf(R) });
const outsideOf = (x, z, d) => !raw.has(key(x + DIRS[d][0], z + DIRS[d][1]));

// Entrance: the lowest run of three bays on one street edge; the middle bay is the door, the flanks are shopfront.
let pick = null;
for (const c of raw.values()) for (const d of Object.keys(DIRS)) {
  if (!outsideOf(c.x, c.z, d)) continue;
  const [ax, az] = d === "north" || d === "south" ? [1, 0] : [0, 1];
  const bay = [-1, 0, 1].map((o) => raw.get(key(c.x + ax * o, c.z + az * o)));
  if (bay.some((b) => !b || !outsideOf(b.x, b.z, d))) continue;
  const gB = Math.max(...bay.map((b) => b.g));
  if (!pick || gB < pick.gB) pick = { d, bay, gB };
}
const entry = new Map();
pick.bay.forEach((b, i) => entry.set(key(b.x, b.z), { d: pick.d, centre: i === 1 }));

// Each cell's ground is the entrance level in the bay, and every tier stands at least 4 blocks above its ground.
const fin = new Map();
for (const c of raw.values()) {
  const g = entry.has(key(c.x, c.z)) ? pick.gB : c.g;
  fin.set(key(c.x, c.z), { x: c.x, z: c.z, g, T: Math.max(c.T, g + 4) });
}
const cellOf = (x, z) => fin.get(key(x, z));
// The faces of (x, y, z) that open on air: outside the footprint, or above a lower neighbour's roof. Below a
// neighbour's roof and above its ground is interior, and below its ground is earth; neither is a face.
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]);
  return !nb || y >= nb.T;
});

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

for (const c of fin.values()) {
  const { x, z, g, T } = c;
  const podium = T <= 29;
  const slab = podium ? BASE : WHITE, spandrel = podium ? BASE : WHITE, mullion = podium ? BASE : TRIM;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                  // foundation: solid up to this cell's ground
  const door = entry.get(key(x, z));
  for (let y = g; y < T; y++) {
    if (door && y <= g + 3) {                                       // entrance bay: door, transom, canopy
      if (y === g + 3) put(x, y, z, BASE);
      else if (y === g + 2) put(x, y, z, TRIM);
      else if (door.centre) put(x, y, z, DOOR, doorState(door.d, y === g ? "lower" : "upper"));
      else put(x, y, z, SHOP);
      continue;
    }
    if (y === T - 1) { put(x, y, z, ROOF); continue; }             // roof cap
    const out = faces(x, z, y);
    if (y === g) { put(x, y, z, out.length ? BASE : TRIM); continue; }   // base course on the street, floor inside
    if (y === T - 2 || y % 4 === 0) { put(x, y, z, out.length ? slab : TRIM); continue; } // storey slab, and the ceiling under the roof
    if (!out.length) {                                              // hollow behind the glass; a lamp on some room floors
      const lit = y % 4 === 1 && hash(x, y, z) % 5 === 0 &&
        Object.keys(DIRS).some((d) => { const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]); return nb && y >= nb.g && y < nb.T && faces(nb.x, nb.z, y).length > 0; });
      if (lit) put(x, y, z, LAMP);
      continue;
    }
    if (y % 4 === 3) { put(x, y, z, spandrel); continue; }          // storey line under each window band
    const ns = out.includes("north") || out.includes("south"), ew = out.includes("east") || out.includes("west");
    const a = ns && !ew ? x : ew && !ns ? z : x + z;                 // position along the face
    if (a % 3 === 0) { put(x, y, z, mullion); continue; }
    const ground = y < g + 3;
    put(x, y, z, ground ? SHOP : podium ? GLASS : Math.floor(a / 3) % 4 === 2 ? DEEP : GLASS);
  }
}

// Roof edges get a parapet where the roof drops away (outside, or a lower tier); roof plant sits on the tower and body.
for (const c of fin.values()) {
  const { x, z, T } = c;
  const drop = Object.keys(DIRS).some((d) => { const nb = cellOf(x + DIRS[d][0], z + DIRS[d][1]); return !nb || nb.T < T; });
  if (drop) put(x, T, z, T <= 29 ? BASE : WHITE);
  else if (T >= 68 && x % 10 >= 3 && x % 10 <= 5 && z % 12 === 6) { put(x, T, z, TRIM); put(x, T + 1, z, TRIM); }
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
vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906617.nbt");
