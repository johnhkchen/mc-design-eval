// Way 291058284, Auckland (Mt Eden view): a 1970s-80s concrete office block. A stone plinth carries four storeys of
// grey concrete with blue-glass panes in gray mullion frames, a shopfront and entrance on the ground floor, and a
// stepped crown: the lidar's 18-block roof is the podium, with 24- and 36-block setback tiers over the taller cores.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_291058284.cells.json`, "utf8"));
const W = 60, H = 50, D = 48;

const M = {
  plinth: "stone_bricks",
  shopBand: "polished_andesite",
  floorBand: "white_concrete",
  slab: "light_gray_concrete",
  spandrel: "light_gray_concrete",
  glass: "light_blue_stained_glass_pane",
  mullion: "gray_concrete",
  cap: "smooth_quartz",
  roof: "smooth_stone",
  plant: "light_gray_concrete",
  hood: "stone_brick_slab",
  glow: "glowstone",
};

// Footprint cells by x,z; each carries its lidar ground and roof.
const at = new Map();
for (const [x, z, ground, raw] of cells) at.set(`${x},${z}`, { x, z, ground, raw });
const get = (x, z) => at.get(`${x},${z}`);

// Smooth the lidar roof into tiers: the median over a 3x3 window of footprint cells, quantised to 18 / 24 / 36.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
for (const c of at.values()) {
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = get(c.x + dx, c.z + dz); if (n) nb.push(n.raw); }
  const m = median(nb);
  c.top = m >= 30 ? 36 : m >= 21 ? 24 : 18;
}

// Exposed faces: a missing neighbour, or one whose tier is lower (the step faces open sky). Those cells are the skin.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const c of at.values()) {
  c.faces = DIRS.filter(([, dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || n.top < c.top; }).map((d) => d[0]);
  c.skin = c.faces.length > 0;
  c.face = c.faces.find((f) => f === "N" || f === "S") ?? c.faces[0];
  // bays run along the wall: x on north/south faces, z on east/west faces
  c.bay = c.face === "N" || c.face === "S" ? c.x : c.z;
}

// Entrance: the east-facing ground-floor skin cell nearest z 24, with a hood over the door.
let door = null;
for (const c of at.values()) if (c.skin && c.face === "E" && (!door || Math.abs(c.z - 24) < Math.abs(door.z - 24))) door = c;

const v = new Voxels([W, H, D]);
let windows = [];
for (const c of at.values()) {
  for (let y = 0; y < c.top; y++) {
    const F = y - (y % 4), r = y - F, top = y === c.top - 1;
    let b = null;
    if (y < 4) b = M.plinth;                                    // plinth on every cell: the foundation under the lowest ground
    else if (top) b = c.skin ? M.cap : M.roof;                  // parapet cap / roof surface
    else if (r === 0) b = c.skin ? (F === 4 ? M.shopBand : M.floorBand) : M.slab;   // storey lines and floor slabs
    else if (!c.skin) b = null;                                 // interior: air gap behind the glass
    else if (r === 3) b = M.spandrel;
    else b = c.bay % 3 === 0 ? M.mullion : M.glass;             // windows: panes between mullions
    if (b === M.glass) windows.push({ c, y, r, F });
    if (b) v.set(c.x, y, c.z, b);
  }
}

// Entrance: door on the wall cell at ground level (replacing its band and window), hood above it.
if (door) {
  v.set(door.x, 4, door.z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(door.x, 5, door.z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  v.set(door.x, 6, door.z, M.hood, { type: "bottom", waterlogged: "false" });
  windows = windows.filter((w) => w.c !== door);
}

// Warm light in the air gap behind some windows (glowstone one bay in eleven, on the first window row).
let lit = 0;
for (const w of windows) {
  if (w.r !== 1 || (w.c.x * 7 + w.c.z * 13 + w.F) % 11 !== 0) continue;
  const [ix, iz] = INWARD[w.c.face], n = get(w.c.x + ix, w.c.z + iz);
  if (!n || n.top <= w.y || n.skin) continue;
  v.set(n.x, w.y, n.z, M.glow); lit++;
}

// Glass panes connect to any neighbouring block in the wall.
for (const w of windows) {
  const { x, y, z } = { x: w.c.x, y: w.y, z: w.c.z };
  const conn = (dx, dz) => (v.get(x + dx, y, z + dz) ? "true" : "false");
  v.set(x, y, z, M.glass, { north: conn(0, -1), south: conn(0, 1), west: conn(-1, 0), east: conn(1, 0), waterlogged: "false" });
}

// Roof plant on the 18-block podium: 3x2 boxes on interior tier-18 cells, spaced apart.
const plant = [];
for (const c of at.values()) {
  if (plant.length >= 3) break;
  if (c.top !== 18) continue;
  const ok = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) { const n = get(c.x + dx, c.z + dz); ok.push(n && n.top === 18 && !n.skin); }
  if (!ok.every(Boolean)) continue;
  if (plant.some((p) => Math.abs(p.x - c.x) < 6 && Math.abs(p.z - c.z) < 5)) continue;
  plant.push(c);
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) v.set(c.x + dx, 18, c.z + dz, M.plant), v.set(c.x + dx, 19, c.z + dz, M.plant);
}

// Lift overrun on the tallest tier: a 3x3 core on interior tier-36 cells, up to 39.
let overrun = null;
for (const c of at.values()) {
  if (overrun) break;
  const cells9 = [];
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) cells9.push(get(c.x + dx, c.z + dz));
  if (cells9.every((n) => n && n.top === 36 && !n.skin)) overrun = c;
}
if (overrun) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) for (let y = 36; y < 39; y++) v.set(overrun.x + dx, y, overrun.z + dz, y === 38 ? M.cap : M.plant);

const tiers = {};
for (const c of at.values()) tiers[c.top] = (tiers[c.top] ?? 0) + 1;
const out = `${DIR}/way_291058284.nbt`;
const res = v.save(out);
console.log(JSON.stringify({ footprint: at.size, tiers, skin: [...at.values()].filter((c) => c.skin).length, doorAt: door && [door.x, door.z], windows: windows.length, glowstone: lit, plant: plant.length, overrun: !!overrun, ...res }));
