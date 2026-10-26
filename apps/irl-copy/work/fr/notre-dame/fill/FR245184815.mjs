// FR245184815: a commercial ring block (a Haussmann-scale department store round a glazed court), built on the lidar footprint.
// The ring's roof steps from the court's 8-block level up to 6 storeys (33-38 blocks), with one storey set back within two
// blocks of the edge. Storey lines sit on the plinth top (y 8) every 5 blocks: string course, three rows of window, lintel.
// Shopfronts with doors and a flush hood on the ground floor; the walls are one block thick, air behind the glass, a floor
// slab per storey and a calcite pier grid inside to carry the floors. Lamps stand on the floor behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184815.cells.json`, "utf8"));

const BASE = 8, STOREY = 5;
const V = new Voxels([191, 56, 239]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r, n: 0, T: BASE, d: Infinity, dir: null, out: null, door: false, canopy: false });
const at = (x, z) => fp.get(key(x, z));
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const DXZ = Object.fromEntries(NEI.map(([d, dx, dz]) => [d, [dx, dz]]));

// 1. Smooth the lidar: 3x3 median of the roof heights, snapped to the storey lines above the plinth.
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.n = Math.max(0, Math.round((vals[vals.length >> 1] - BASE) / STOREY));
}

// 2. Edge distance (0 on the outer edge of the footprint), for the setback.
const queue = [];
for (const c of fp.values()) if (NEI.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 0; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of NEI) { const n = at(c.x + dx, c.z + dz); if (n && n.d > c.d + 1) { n.d = c.d + 1; queue.push(n); } }
}

// 3. Setback: a tall tier steps in one storey within two blocks of the edge; then each cell's top.
for (const c of fp.values()) {
  if (c.n >= 5 && c.d <= 1) c.n -= 1;
  c.T = BASE + STOREY * c.n;
}

// 4. Exposed faces: a face to the outside of the footprint wins; otherwise a face to a lower neighbour (a setback step).
for (const c of fp.values()) {
  const expo = NEI.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });
  if (c.T <= BASE || !expo.length) continue;
  const out = expo.find(([, dx, dz]) => !at(c.x + dx, c.z + dz));
  c.out = out ? out[0] : null;
  c.dir = c.out ?? expo[0][0];
}
const axisP = (c) => (c.dir === "north" || c.dir === "south" ? c.x : c.z);   // the coordinate that runs along a face
const alongX = (dir) => dir === "north" || dir === "south";

// Entrances: one door per 48 blocks of outer ground-floor frontage, with a hood over the cells beside it.
for (const c of fp.values()) if (c.out && axisP(c) % 48 === 24) c.door = true;
const doorDir = new Map(); for (const c of fp.values()) if (c.door) doorDir.set(key(c.x, c.z), c.dir);
for (const c of fp.values()) {
  if (!c.dir || !c.out) continue;
  for (let i = -2; i <= 2; i++) {
    const k = alongX(c.dir) ? key(c.x + i, c.z) : key(c.x, c.z + i);
    if (doorDir.get(k) === c.dir) c.canopy = true;
  }
}

const paneState = (dir) => (alongX(dir) ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const wallState = (dir) => (alongX(dir) ? { north: "none", south: "none", east: "low", west: "low", up: "true" } : { north: "low", south: "low", east: "none", west: "none", up: "true" });
const doorState = (dir, half) => ({ facing: dir, half, hinge: "left", open: "false", powered: "false" });

// 5. Blocks, cell by cell: foundation, plinth, the court or the storeys, then the roof cover, parapet and chimneys.
for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < Math.min(g, BASE); y++) V.set(x, y, z, "stone_bricks");
  for (let y = g; y < BASE; y++) V.set(x, y, z, "polished_andesite");
  if (T === BASE) { V.set(x, BASE, z, c.d === 0 ? "smooth_stone" : "light_gray_stained_glass"); continue; }

  for (let b = BASE; b < T; b += STOREY) {
    const s = (b - BASE) / STOREY, P = axisP(c);
    for (let off = 0; off < STOREY; off++) {
      const y = b + off;
      if (!c.dir) {                                       // interior: floor slab per storey, a pier grid, air between
        if (off === 0) V.set(x, y, z, "smooth_stone");
        else if (x % 6 === 3 && z % 6 === 3) V.set(x, y, z, "calcite");
        continue;
      }
      if (off === 0) { V.set(x, y, z, s === 0 ? "polished_andesite" : "smooth_stone"); continue; }
      if (off === 4) { V.set(x, y, z, "calcite"); continue; }
      const pane = s === 0 ? P % 6 !== 0 : P % 3 === 1;   // shopfront glass wider than the upper windows
      if (s === 0 && c.door && (off === 0 || off === 1)) {
        V.set(x, y, z, "dark_oak_door", doorState(c.dir, off === 0 ? "lower" : "upper"));
        continue;
      }
      if (s === 0 && off === 3 && c.canopy) { V.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (pane) V.set(x, y, z, "light_blue_stained_glass_pane", paneState(c.dir));
      else V.set(x, y, z, "calcite");
    }
  }

  V.set(x, T, z, "deepslate_tiles");                       // the roof cover
  if (c.out) V.set(x, T + 1, z, "stone_brick_wall", wallState(c.out));
  if (!c.dir && T >= 23 && x % 13 === 7 && z % 11 === 4) for (let y = T + 1; y <= T + 3; y++) V.set(x, y, z, "bricks");
}

// 6. Warm lights: a lamp on the floor behind some windows (never in a pier column, never in a facade's own cell).
for (const c of fp.values()) {
  if (!c.dir) continue;
  const [dx, dz] = DXZ[OPP[c.dir]];
  const n = at(c.x + dx, c.z + dz);
  if (!n || n.dir || n.T <= BASE || (n.x % 6 === 3 && n.z % 6 === 3)) continue;
  for (let b = BASE; b < c.T; b += STOREY) {
    const s = (b - BASE) / STOREY, P = axisP(c);
    const pane = s === 0 ? P % 6 !== 0 : P % 3 === 1;
    if (!pane || (s === 0 && c.door)) continue;
    if (b + 1 >= n.T) continue;
    const h = (c.x * 7 + c.z * 13 + s * 5) % 9;
    if (h === 0) V.set(n.x, b + 1, n.z, "glowstone");
    else if (h === 4) V.set(n.x, b + 1, n.z, "shroomlight");
  }
}

const info = V.save(`${DIR}/FR245184815.nbt`);
console.log(`FR245184815: ${info.blocks} blocks, ${info.palette} palette entries`);
