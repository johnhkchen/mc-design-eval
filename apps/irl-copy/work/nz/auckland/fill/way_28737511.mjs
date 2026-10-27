// KPMG Centre (Auckland CBD, Queen Street / Viaduct side): a late-20th century glass-and-concrete office block on a stone
// plinth, the lidar's roof at 29-34 blocks (about 25-28 m) read as seven storeys in 4-block storey lines. Stepped
// massing: a five-storey podium at the edge, a six-storey middle tier, and a seven-storey crown in the core, each
// setback a flat terrace with a rail. Light-grey floor slabs and white piers and spandrels frame blue glass; a dark
// oak entrance sits under a lintel at the street face. Every column is a stack from y 0 to its top, so each tier stands
// on the one below. Floor plates run across the whole footprint and the glass has an air gap behind it; a few windows
// hold glowstone at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28737511.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28737511.nbt";

const W = 52, H = 49, D = 60;
const g = new Voxels([W, H, D]);

// --- footprint, edge depth, and tiers -----------------------------------------------------------------------------
const raw = new Map();                                       // "x,z" -> { g: ground, r: lidar roof above y 0 }
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { g: ground, r: roof });
const key = (x, z) => `${x},${z}`;
const inFoot = (x, z) => raw.has(key(x, z));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// depth 0 = the outer ring of the footprint; depth d = d cells in from the nearest edge
const depth = new Map();
let frontier = [];
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !inFoot(x + dx, z + dz))) { depth.set(k, 0); frontier.push([x, z]); }
}
for (let d = 0; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of N4) {
    const k = key(x + dx, z + dz);
    if (inFoot(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// the lidar roof, median-smoothed over the 3x3 footprint neighbourhood, then snapped to two clean tiers: the crown at
// the 8th storey line (32) where the roof reads 31 and up, the middle tier at the 7th (28) elsewhere
const top = new Map();
const tierOf = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) near.push(raw.get(key(x + dx, z + dz)).r);
  near.sort((a, b) => a - b);
  const r = near[(near.length - 1) >> 1];
  const S = r >= 31 ? 32 : 28;
  tierOf.set(k, S);
  const d = depth.get(k);
  // podium 20 at the edge, middle tier 28 one cell in, the lidar's crown in the core
  top.set(k, d === 0 ? 20 : d === 1 ? Math.min(S, 28) : S);
}
const topAt = (x, z) => (inFoot(x, z) ? top.get(key(x, z)) : -1);
// a voxel is in the massing when it is in the footprint and below its column's top (the top is the roof plate)
const inM = (x, y, z) => inFoot(x, z) && y >= 0 && y <= topAt(x, z);
const interior = (x, y, z) => inM(x + 1, y, z) && inM(x - 1, y, z) && inM(x, y, z + 1) && inM(x, y, z - 1) && inM(x, y + 1, z) && inM(x, y - 1, z);

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// --- the stack of every column --------------------------------------------------------------------------------------
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const t = top.get(k), d = depth.get(k), S = tierOf.get(k);

  // plinth: solid from the lowest ground to the ground floor (the foundation is hidden under the ground at most cells)
  for (let y = 0; y < 4; y++) g.set(x, y, z, y === 3 ? "smooth_stone" : "stone_bricks");

  for (let y = 4; y <= t; y++) {
    // floor plate on every storey line, across the whole footprint (it carries the air gap above it)
    if (y % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (interior(x, y, z)) continue;                          // no interiors: air behind the glass
    // facade band: the storey's three blocks above its plate, piers every third block, spandrel at the top
    const o = (y - 4) % 4;
    if (o === 3) { g.set(x, y, z, "white_concrete"); continue; }
    if ((x + z) % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    // a warm light behind some glazing, in the air cell just inside the glass
    const out = N4.find(([dx, dz]) => !inM(x + dx, y, z + dz));
    if (out && o === 2 && hash(x, y, z) % 9 === 0) {
      const [dx, dz] = out;
      if (inM(x - dx, y, z - dz)) g.set(x - dx, y, z - dz, "glowstone");
    }
  }

  // the crown's parapet: on the rim of the top tier, up to the lidar roof, with a cap course
  if (t === S && (c.r - 1) > t && N4.some(([dx, dz]) => !inFoot(x + dx, z + dz) || topAt(x + dx, z + dz) < t)) {
    for (let y = t + 1; y <= c.r - 1; y++) g.set(x, y, z, y === c.r - 1 ? "light_gray_concrete" : "white_concrete");
  }

  // terrace rail on the podium's roof, along its outer edge
  if (d === 0 && t === 20) {
    const conn = { north: "false", south: "false", east: "false", west: "false" };
    for (const [dx, dz] of N4) {
      const n = key(x + dx, z + dz);
      if (inFoot(x + dx, z + dz) && depth.get(n) === 0) conn[DIR[`${dx},${dz}`]] = "true";
    }
    g.set(x, 21, z, "iron_bars", { ...conn, waterlogged: "false" });
  }

  // plant on the crown's roof: two-high plant boxes on a grid in the core (stand on the roof plate)
  if (t === 32 && d >= 3 && (x % 9 === 4 || x % 9 === 5) && (z % 13 === 5 || z % 13 === 6)) {
    g.set(x, 33, z, "light_gray_concrete");
    g.set(x, 34, z, "light_gray_concrete");
  }
}

// --- entrance: a dark oak door under a lintel, on the street face at ground level --------------------------------
// street face = a ring cell at the ground floor's level (g 4) with an open side; choose the one nearest the middle of the
// footprint on the lowest-z side, so the door is on the flat frontage facing the street
let xs = 0, n = 0; for (const k of raw.keys()) { xs += Number(k.split(",")[0]); n++; }
const cx = xs / n;
let door = null;
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (depth.get(k) !== 0 || c.g !== 4) continue;
  const out = N4.find(([dx, dz]) => !inFoot(x + dx, z + dz));
  if (!out) continue;
  const score = Math.abs(x - cx) + 3 * (out[1] === -1 ? 0 : 1);   // prefer the north face, then centred
  if (!door || score < door.score) door = { x, z, out, score };
}
if (door) {
  const [dx, dz] = door.out;
  const facing = DIR[`${dx},${dz}`];
  g.set(door.x, 5, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 6, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // the bay's lintel canopy over the door, across the three cells of the bay
  for (const s of [-1, 0, 1]) {
    const bx = dz !== 0 ? door.x + s : door.x, bz = dx !== 0 ? door.z + s : door.z;
    if (inFoot(bx, bz)) g.set(bx, 7, bz, "light_gray_concrete");
  }
}

g.save(OUT);
console.log("way_28737511:", g.count(), "blocks, door", door ? DIR[`${door.out[0]},${door.out[1]}`] : "none");
