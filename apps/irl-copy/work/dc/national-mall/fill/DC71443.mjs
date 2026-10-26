// 1715 Connecticut Ave NW (Dupont Circle): a 1910s-style brick commercial block. Shopfronts on the ground floor, one
// upper storey of punched windows, a stone cornice and parapet, and a 7-high tower on the middle of the plot (the
// lidar's 6-7 roof cluster). Lidar roof heights are smoothed into three tiers: wing (<=3), body (4-5), tower (6-7).
// Walls are one block thick with an air gap behind the glass, a floor slab per storey, and a few warm lights behind
// windows. Nothing is built off the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71443.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71443.nbt";

const WALL = "bricks", TRIM = "smooth_stone", PLINTH = "stone_bricks", FLOOR = "oak_planks";
const DIRS = [
  { n: "north", dx: 0, dz: -1 }, { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 }, { n: "east", dx: 1, dz: 0 },
];
const key = (x, z) => `${x},${z}`;

// lidar roof -> smoothed tier (the height in blocks of the top row is T = tier - 1)
const tierOf = (r) => (r <= 3 ? 2 : r <= 5 ? 6 : 7);
const fp = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) fp.set(key(x, z), { x, z, g, T: tierOf(r) - 1 });
const nbOf = (c, d) => fp.get(key(c.x + d.dx, c.z + d.dz));

// the sides of column c that face open air at height y (no neighbour, or a neighbour that stops below y)
const exposedAt = (c, y) => DIRS.filter((d) => { const n = nbOf(c, d); return !n || n.T < y; });

// the planned blocks, keyed by x,y,z, so panes can be connected to their neighbours before writing
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);
const isPier = (c, faces) => faces.length > 1 || (faces[0].dx !== 0 ? c.z : c.x) % 3 === 0;

// entrance: the middle window bay of the longest street-facing side at ground level (a body cell, ground row)
const candidates = { north: [], south: [], west: [], east: [] };
for (const c of fp.values()) {
  if (c.g !== 0 || c.T !== 5) continue;   // the body's street front, not the tower's flank
  const faces = exposedAt(c, 1);
  if (faces.length !== 1 || isPier(c, faces)) continue;
  candidates[faces[0].n].push({ c, d: faces[0] });
}
const sideKey = (o) => (o.d.dx !== 0 ? o.c.z : o.c.x);
const bestSide = Object.values(candidates).sort((a, b) => b.length - a.length)[0];
const door = bestSide.length ? bestSide.sort((a, b) => sideKey(a) - sideKey(b))[Math.floor(bestSide.length / 2)] : null;

const panes = [];   // { x, y, z, d, row } for the glass pass
for (const c of fp.values()) {
  for (let y = c.g; y <= c.T; y++) {
    const faces = exposedAt(c, y);
    if (!faces.length) {
      // inside: the floor of each storey and the ceiling/roof deck; air between
      if (y === c.g) put(c.x, y, c.z, FLOOR);
      else if (y === 3 && c.T > 3) put(c.x, y, c.z, FLOOR);
      else if (y === c.T) put(c.x, y, c.z, TRIM);
      continue;
    }
    const pier = isPier(c, faces);
    if (y === c.T) {
      // cornice row; the parapet lip stands on it (brick piers rise above the parapet as pilasters)
      put(c.x, y, c.z, TRIM);
      if (pier) put(c.x, y + 1, c.z, WALL);
      else put(c.x, y + 1, c.z, TRIM + "_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === c.g && c.T >= 3) { put(c.x, y, c.z, PLINTH); continue; }
    if (y === 3 && c.T > 3) { put(c.x, y, c.z, TRIM); continue; }
    const shop = y <= 2;
    const upper = y >= 4;
    if (!shop && !upper) { put(c.x, y, c.z, WALL); continue; }
    if (pier) { put(c.x, y, c.z, WALL); continue; }
    const d = faces[0];
    if (door && c === door.c && (y === 1 || y === 2)) {
      const facing = door.d.n;
      put(c.x, y, c.z, "dark_oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    panes.push({ x: c.x, y, z: c.z, d, row: shop ? "shop" : "upper" });
    put(c.x, y, c.z, "glass_pane");
  }
}

// warm light behind some windows: an air cell inside the glass, one block in from the pane
for (const p of panes) {
  const ix = p.x - p.d.dx, iz = p.z - p.d.dz;
  if (!fp.has(key(ix, iz)) || has(ix, p.y, iz)) continue;
  if (p.row === "upper" && (p.x + p.z) % 4 === 0) put(ix, p.y, iz, "glowstone");
  if (p.row === "shop" && (p.x + p.z) % 5 === 0 && p.y === 1) put(ix, p.y, iz, "shroomlight");
}

// roof equipment: a stone plant box on the tower's deck, where the tower stands 6 high
for (const c of fp.values()) {
  if (c.T === 6 && c.x >= 7 && c.x <= 8 && c.z >= 7 && c.z <= 8 && !exposedAt(c, 6).length) put(c.x, 7, c.z, PLINTH);
}

// panes connect to the neighbouring glass or wall in their own plane
const connect = (x, y, z) => {
  const s = {};
  for (const d of DIRS) s[d.n] = has(x + d.dx, y, z + d.dz) ? "true" : "false";
  return { ...s, waterlogged: "false" };
};
for (const p of panes) put(p.x, p.y, p.z, "glass_pane", connect(p.x, p.y, p.z));

const g = new Voxels([12, 19, 22]);
for (const { x, y, z, block, state } of plan.values()) g.set(x, y, z, block, state);
const res = g.save(OUT);
console.log(`built DC71443: ${res.blocks} blocks, palette ${res.palette}, door ${door ? `${door.c.x},${door.c.z} ${door.d.n}` : "none"}`);
