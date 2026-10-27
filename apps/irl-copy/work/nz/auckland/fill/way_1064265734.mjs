// Way 1064265734, Mt Eden side of the CBD: a 1970s-80s office and apartment block. A precast concrete frame with ribbon
// glazing in the tall parts, punched brick windows on the low wings, a stone plinth, a parapet and a cap on every
// tier. The lidar roof is snapped to flat tiers; each column stands on its own foundation and the tiers stack on it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1064265734.cells.json`, "utf8"));
const [X, Y, Z] = [122, 48, 103];

// storey tiers in blocks above y 0 (a storey is 4 blocks); the tallest tier is the lidar's ~36
const TIERS = [8, 12, 16, 20, 24, 28, 32, 36];
const snap = (v) => TIERS.reduce((a, t) => (Math.abs(t - v) < Math.abs(a - v) ? t : a));
const tierAtLeast = (v) => TIERS.find((t) => t >= v) ?? TIERS.at(-1);
const SIDES = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, G, R] of cells) foot.set(key(x, z), { x, z, G, R });
const at = (x, z) => foot.get(key(x, z));

// setup: the top tier (median lidar roof over footprint cells within 2, snapped), the faces that open to the air,
// the wall's bay coordinate (x on a north/south wall, z on an east/west wall, x+z at a corner), the zone by height.
// A thin edge (under 15 of its 25 neighbours on the footprint) keeps the lidar's spill off the wing: capped at 5 storeys, so the wing edges stay.
for (const c of foot.values()) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.R); }
  near.sort((a, b) => a - b);
  c.T = Math.min(36, Math.max(tierAtLeast(c.G + 8), snap(near[near.length >> 1])));
  if (near.length < 15) c.T = Math.min(c.T, 20);
  c.faces = SIDES.filter((s) => !at(c.x + s.dx, c.z + s.dz));
  c.exterior = c.faces.length > 0;
  c.zone = c.T <= 12 ? "low" : c.T <= 20 ? "mid" : "high";
  if (!c.exterior) continue;
  const onNS = c.faces.every((f) => f.dz !== 0), onEW = c.faces.every((f) => f.dx !== 0);
  c.axis = onNS ? "x" : onEW ? "z" : "corner";
  c.bay = onNS ? c.x : onEW ? c.z : c.x + c.z;
}

// two entrances: the south wall (near the median of its low cells) and the west wall
const faceCells = (name) => [...foot.values()].filter((c) => c.exterior && c.axis !== "corner" && c.G <= 7 && c.faces.some((f) => f.name === name));
function entranceBay(name) {
  const bays = faceCells(name).map((c) => c.bay).sort((a, b) => a - b);
  if (!bays.length) return null;
  const med = bays[bays.length >> 1];
  return bays.reduce((a, b) => (Math.abs(b - med) < Math.abs(a - med) ? b : a));
}
const ENTRANCES = ["south", "west"].map((name) => ({ name, bay: entranceBay(name) })).filter((e) => e.bay !== null);
for (const c of foot.values()) {
  if (!c.exterior || c.axis === "corner") continue;
  for (const e of ENTRANCES) {
    if (!c.faces.some((f) => f.name === e.name)) continue;
    const d = Math.abs(c.bay - e.bay);
    if (d <= 1) { c.entrance = { role: d === 0 ? "door" : "bay", facing: e.name }; break; }
  }
}

const pane = (c) => {
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (c.axis === "x") { st.east = "true"; st.west = "true"; }
  else if (c.axis === "z") { st.north = "true"; st.south = "true"; }
  return st;
};
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
// glass sits on bays 1 and 2 of every three (ribbon), on bay 1 alone in the low wings (punched windows)
const glassBay = (c) => (c.zone === "low" ? c.bay % 3 === 1 : c.bay % 3 !== 0);

// a facade cell at height y: spandrel row, glass rows, a transom, a parapet course and a cap at the top
function facadeSpec(c, y) {
  const r = y - c.G, q = r % 4;
  const body = c.zone === "low" ? "bricks" : "light_gray_concrete";
  const spandrel = c.zone === "low" ? "bricks" : "white_concrete";
  if (y === c.T - 1) return { b: "smooth_stone" };
  if (y === c.T - 2) return { b: body };
  const ent = c.entrance;
  if (ent) {
    if (r === 0 && ent.role === "door") return { b: "dark_oak_door", st: doorState(ent.facing, "lower") };
    if (r === 1 && ent.role === "door") return { b: "dark_oak_door", st: doorState(ent.facing, "upper") };
    if (r === 0) return { b: "stone_bricks" };
    if (r === 1) return { b: "light_blue_stained_glass_pane", st: pane(c) };
    if (r === 2) return { b: "dark_oak_slab", st: { type: "bottom", waterlogged: "false" } };
    if (r === 3) return { b: "gray_concrete" };
  }
  if (r === 0) return { b: "stone_bricks" };          // base course
  if (q === 0) return { b: spandrel };
  if (q === 3) return { b: "gray_concrete" };
  if (!glassBay(c)) return { b: c.zone === "low" ? body : "gray_concrete" };
  return { b: "light_blue_stained_glass_pane", st: pane(c) };
}

// the air gap behind each glass bay, and a warm light in some of them (glowstone), set on the inner cell
const over = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
for (const c of foot.values()) {
  if (!c.exterior || c.entrance) continue;
  const f = c.faces[0];
  const inner = at(c.x - f.dx, c.z - f.dz);
  if (!inner || inner.exterior) continue;
  for (let y = c.G + 1; y < c.T - 2; y++) {
    const q = (y - c.G) % 4;
    if ((q !== 1 && q !== 2) || !glassBay(c) || y < inner.G || y >= inner.T) continue;
    const h = ((c.x * 73856093) ^ (y * 19349663) ^ (c.z * 83492791)) >>> 0;
    if (q === 1 && h % 7 === 0) over.set(k3(inner.x, y, inner.z), { b: "glowstone" });
    else over.set(k3(inner.x, y, inner.z), "AIR");
  }
}

const g = new Voxels([X, Y, Z]);
for (const c of foot.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone_bricks");          // foundation up to the cell's ground
  for (let y = c.G; y < c.T; y++) {
    const o = over.get(k3(c.x, y, c.z));
    if (o === "AIR") continue;
    const spec = o ?? (c.exterior ? facadeSpec(c, y) : { b: "light_gray_concrete" });
    g.set(c.x, y, c.z, spec.b, spec.st);
  }
  // plant on the flat roofs of the tallest tier: small two-high boxes on the interior roof
  if (!c.exterior && c.T >= 28 && c.x % 4 === 0 && (c.z * 3 + c.x) % 7 === 0) {
    g.set(c.x, c.T, c.z, "gray_concrete");
    g.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
}

const out = `${DIR}/way_1064265734.nbt`;
const res = g.save(out);
console.log(`cells ${cells.length}, entrances ${JSON.stringify(ENTRANCES)}, blocks ${res.blocks}, palette ${res.palette} -> ${out}`);
