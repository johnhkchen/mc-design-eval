import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1980s concrete office block on a stepped massing. The lidar roof is averaged over 5x5 cells and snapped to 4-block
// storeys (tiers at 32 / 36 / 40 / 44, plant to 47). Storey lines sit on absolute y so the facade bands run level over
// the slope. Each column is solid from y 0 to its own roof, so nothing floats. Facades: stone base course and shopfront
// at grade, glazed bays with grey mullions over a white concrete body, quoins at the corners, parapets on top. Windows
// have a one-block air gap behind the glass, a warm glowstone in some, and each storey keeps its floor slab.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23921343.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23921343.nbt";
const W = 88, H = 59, D = 58;
const STOREY = 4, TOP_MIN = 8, TOP_MAX = 44, PLANT_TOP = 47;

const FOUNDATION = "stone_bricks", BASE = "polished_andesite", BODY = "white_concrete", LINE = "smooth_quartz";
const SPANDREL = "light_gray_concrete", MULLION = "gray_concrete", ROOF = "smooth_stone", QUOIN = "light_gray_concrete";
const WINDOW = "light_blue_stained_glass_pane", WINDOW_DARK = "gray_stained_glass_pane", SHOP = "glass_pane";
const GLOW = "glowstone", PLANT = SPANDREL, PLANT_CAP = "smooth_stone";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roofRaw.set(key(x, z), r); }
const inside = (x, z) => ground.has(key(x, z));
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];                       // N E S W, outward
const missing = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

// Tier tops: the roof averaged over 5x5, snapped to a storey line.
const topOf = new Map();
for (const [x, z] of cells) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const r = roofRaw.get(key(x + dx, z + dz)); if (r !== undefined) { s += r; n++; }
  }
  const avg = s / n;
  topOf.set(key(x, z), Math.min(TOP_MAX, Math.max(TOP_MIN, Math.floor((avg + 2) / STOREY) * STOREY)));
}

// Depth in from the outline (0 = skin).
const depth = new Map(), queue = [];
for (const [x, z] of cells) if (missing(x, z).length) { depth.set(key(x, z), 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !depth.has(key(nx, nz))) { depth.set(key(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}

// Facade cells with one outward face; two or more faces is a corner (quoin).
const facades = [];
for (const [x, z] of cells) {
  if (depth.get(key(x, z)) !== 0) continue;
  const m = missing(x, z);
  if (m.length === 1) facades.push({ x, z, n: m[0] });
}
const corners = new Set();
for (const [x, z] of cells) if (depth.get(key(x, z)) === 0 && missing(x, z).length >= 2) corners.add(key(x, z));

// Main entrance: the longest run of one facade direction, at its lowest ground, in the middle of the run.
const groups = new Map();
for (const f of facades) { const gk = f.n.join(); if (!groups.has(gk)) groups.set(gk, []); groups.get(gk).push(f); }
const mainRun = [...groups.values()].sort((a, b) => b.length - a.length)[0];
const alongOf = (f) => (f.n[0] !== 0 ? f.z : f.x);
mainRun.sort((a, b) => alongOf(a) - alongOf(b));
const minG = Math.min(...mainRun.map((f) => ground.get(key(f.x, f.z))));
const lowRun = mainRun.filter((f) => ground.get(key(f.x, f.z)) === minG);
const ent = lowRun[Math.floor(lowRun.length / 2)];
const entKey = key(ent.x, ent.z);
const FACING = { "0,-1": "north", "1,0": "east", "0,1": "south", "-1,0": "west" };

// Air gap behind window glass (one block in, storey by storey), with a glowstone in some.
const air = new Set(), glow = new Set();
for (const { x, z, n } of facades) {
  if (key(x, z) === entKey) continue;
  const u = n[0] !== 0 ? z : x;
  if (((u % 4) + 4) % 4 === 0) continue;                                 // mullion column
  const ix = x - n[0], iz = z - n[1], ik = key(ix, iz);
  if (!inside(ix, iz) || !(depth.get(ik) > 0)) continue;
  const g = ground.get(key(x, z)), t = topOf.get(key(x, z));
  for (let s = 0; 4 * s < t; s++) for (const yy of [1, 2]) {
    const y = 4 * s + yy;
    if (y < g || y >= t || y < ground.get(ik) || y >= topOf.get(ik)) continue;
    air.add(`${ix},${y},${iz}`);
    if (s >= 1 && yy === 1 && (x * 5 + z * 3 + s * 7) % 9 === 0) glow.add(`${ix},${y},${iz}`);
  }
}

// Panes connect in the plane of their wall.
const pane = (n, block) => {
  const alongZ = n[0] !== 0;
  return [block, { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" }];
};

const V = new Voxels([W, H, D]);
const plantCols = [];
for (const [x, z] of cells) {
  const k = key(x, z), g = ground.get(k), t = topOf.get(k), d = depth.get(k);
  const isFacade = d === 0, isCorner = corners.has(k), n = facades.find((f) => f.x === x && f.z === z)?.n;
  const isEntrance = k === entKey;
  const u = n && n[0] !== 0 ? z : x, pos = ((u % 4) + 4) % 4;
  if (t === 44 && d >= 6 && (((x >> 3) + (z >> 3)) % 2 === 0)) plantCols.push([x, z]);
  for (let y = 0; y < t; y++) {
    if (y < g) { V.set(x, y, z, FOUNDATION); continue; }
    if (isEntrance && (y === g || y === g + 1)) {
      V.set(x, y, z, "dark_oak_door", { facing: FACING[n.join()], half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrance && y === g + 2) { V.set(x, y, z, LINE); continue; }
    const kk = `${x},${y},${z}`;
    if (air.has(kk) && !glow.has(kk)) continue;
    if (glow.has(kk)) { V.set(x, y, z, GLOW); continue; }
    const top = y === t - 1, s = Math.floor(y / STOREY), yy = y % STOREY;
    if (isCorner) { V.set(x, y, z, QUOIN); continue; }
    if (isFacade && n) {
      if (top) { V.set(x, y, z, LINE); continue; }
      if (s === 0) {
        if (yy === 0) V.set(x, y, z, BASE);
        else if (yy === 3) V.set(x, y, z, LINE);
        else if (pos === 0) V.set(x, y, z, MULLION);
        else V.set(x, y, z, ...pane(n, SHOP));
      } else {
        if (yy === 0) V.set(x, y, z, LINE);
        else if (yy === 3) V.set(x, y, z, SPANDREL);
        else if (pos === 0) V.set(x, y, z, MULLION);
        else V.set(x, y, z, ...pane(n, (x * 3 + z + s) % 6 === 0 ? WINDOW_DARK : WINDOW));
      }
      continue;
    }
    V.set(x, y, z, top ? ROOF : BODY);
  }
}

// Roof plant: boxes on the top tier's inner blocks, lifting the crown to the lidar's 47.
for (const [x, z] of plantCols) {
  for (let y = TOP_MAX; y < PLANT_TOP; y++) V.set(x, y, z, y === PLANT_TOP - 1 ? PLANT_CAP : PLANT);
}

const res = V.save(OUT);
console.log(JSON.stringify({ blocks: res.blocks, palette: res.palette, facades: facades.length, plant: plantCols.length, entrance: [ent.x, ent.z] }));
