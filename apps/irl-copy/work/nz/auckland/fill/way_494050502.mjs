// Botanica: a late-20th-century four-storey apartment block in Eden Terrace, volcanic basalt plinth, cream render over
// the storeys, tinted glass in panes, a commercial shopfront on its south and west faces, a lower three-storey wing on
// the diagonal, and a planted roof terrace with plant boxes and air-conditioning plant. Storeys are 4 blocks on a global
// grid (floor at 2, 6, 10, 14), so the lowest ground under each cell only changes how deep the foundation goes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_494050502.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_494050502.nbt";
const W = 73, D = 61, H = 33;

const rows = JSON.parse(readFileSync(CELLS, "utf8"));
const cells = new Map();                       // z * W + x -> { x, z, g (ground), lidar roof, roof tier, d (depth in from outside) }
const key = (x, z) => z * W + x;
for (const [x, z, g, lidar] of rows) cells.set(key(x, z), { x, z, g, lidar });
const at = (x, z) => cells.get(key(x, z));

// 1. roof tiers: a 3x3 median of the lidar roof kills the noise; the two tiers are the main roof (20) and the lower wing (16)
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const c of cells.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.lidar); }
  c.roof = median(v) >= 18 ? 20 : 16;
}

// 2. depth from the outside: 1 = facade, 2 = the air gap behind the glass, 3+ = the solid core
for (const c of cells.values()) {
  const edge = !at(c.x + 1, c.z) || !at(c.x - 1, c.z) || !at(c.x, c.z + 1) || !at(c.x, c.z - 1);
  c.d = edge ? 1 : Infinity;
}
const queue = [...cells.values()].filter((c) => c.d === 1);
for (let qi = 0; qi < queue.length; qi++) {
  const c = queue[qi];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.d > c.d + 1) { n.d = c.d + 1; queue.push(n); }
  }
}

// 3. which face a facade cell looks out of (north/south first, so corners take the x-run), its bay index and the inward step
function face(c) {
  if (!at(c.x, c.z - 1)) return { dir: "N", i: c.x, facing: "north", inward: [0, 1] };
  if (!at(c.x, c.z + 1)) return { dir: "S", i: c.x, facing: "south", inward: [0, -1] };
  if (!at(c.x - 1, c.z)) return { dir: "W", i: c.z, facing: "west", inward: [1, 0] };
  if (!at(c.x + 1, c.z)) return { dir: "E", i: c.z, facing: "east", inward: [-1, 0] };
  return null;
}
const commercial = (f) => f && (f.dir === "S" || f.dir === "W");          // the street-facing frontages carry the shops
const paneState = (f) => (f.dir === "N" || f.dir === "S")
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 4. the entrance: the south facade cell nearest the middle of that face, not on a corner
const southFacade = [...cells.values()].filter((c) => c.d === 1 && face(c)?.dir === "S" && at(c.x - 1, c.z) && at(c.x + 1, c.z));
const meanI = southFacade.reduce((s, c) => s + c.x, 0) / southFacade.length;
const entrance = southFacade.reduce((best, c) => (Math.abs(c.x - meanI) < Math.abs(best.x - meanI) ? c : best));

// 5. the solid build: one block per cell per height, in the order of the storey grid
const v = new Voxels([W, H, D]);
const stats = { glass: 0, glow: 0, rooftop: 0 };
for (const c of cells.values()) {
  const { x, z, g: ground, roof: R, d } = c;
  const f = d === 1 ? face(c) : null;
  for (let y = 0; y < R; y++) {
    if (y < ground) { if (d === 1) v.set(x, y, z, "deepslate_bricks"); else v.set(x, y, z, "stone"); continue; }
    if (y === R - 1) {                                               // parapet on the edge, the roof terrace inside
      if (d === 1) v.set(x, y, z, "white_concrete");
      else rooftop(c, y);
      continue;
    }
    if (y === R - 2) {                                               // cornice on the edge, roof membrane inside
      v.set(x, y, z, d === 1 ? "smooth_stone" : "stone_bricks");
      continue;
    }
    if (y < 2) { v.set(x, y, z, d === 1 ? "deepslate_bricks" : "stone"); continue; }
    if (d >= 3) { v.set(x, y, z, "stone"); continue; }                // the core, solid and hidden
    const b = 2 + 4 * Math.floor((y - 2) / 4), r = y - b;              // band base (storey line) and row in the storey
    if (d === 2) {                                                   // ring: a floor slab per storey, air gap behind the glass
      if (r >= 1) continue;
      v.set(x, y, z, "stone");
      continue;
    }
    if (r === 0) { v.set(x, y, z, b === 2 ? "deepslate_bricks" : "light_gray_concrete"); continue; }
    if (r === 3) {
      const canopy = c === entrance || (z === entrance.z && Math.abs(x - entrance.x) === 1 && f?.dir === "S");
      if (b === 2 && canopy) v.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      else if (b === 2 && commercial(f)) v.set(x, y, z, "dark_oak_planks");
      else v.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // r = 1, 2: the window band
    if (b === 2 && c === entrance) {
      v.set(x, y, z, "dark_oak_door", { facing: f.facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = f.i % 4 === 0;
    if (pier) v.set(x, y, z, b === 2 && commercial(f) ? "bricks" : "white_concrete");
    else if (b === 2 && commercial(f)) { v.set(x, y, z, "light_blue_stained_glass"); stats.glass++; }
    else { v.set(x, y, z, "light_blue_stained_glass_pane", paneState(f)); stats.glass++; }
  }
}

// rooftop terrace: 6 x 6 plots inset from the parapet, moss planters (with azalea) and air-conditioning plant
function rooftop(c, y) {
  const { x, z, d } = c;
  if (d < 2) return;
  const ix = x % 6, iz = z % 6;
  if (ix < 1 || ix > 4 || iz < 1 || iz > 4) return;
  const kind = (Math.floor(x / 6) * 3 + Math.floor(z / 6) * 5) % 7;
  if (kind === 0) { v.set(x, y, z, "moss_block"); if (ix === 2 && iz === 2) { v.set(x, y + 1, z, "azalea"); stats.rooftop++; } }
  else if (kind === 1) { v.set(x, y, z, "iron_block"); stats.rooftop++; }
}

// 6. warm light: glowstone in the air gap behind some panes, and most shopfront bays
for (const c of cells.values()) {
  if (c.d !== 1) continue;
  const f = face(c);
  if (!f || c === entrance || f.i % 4 === 0) continue;               // piers and the door get no light
  const ring = at(c.x + f.inward[0], c.z + f.inward[1]);
  if (!ring || ring.d !== 2) continue;
  for (let y = 3; y <= c.roof - 3; y += 4) {                        // the lower window row of every storey
    const lit = commercial(f) ? (f.i % 3 === 0 && y === 3) : (c.x * 7 + c.z * 13 + y) % 5 === 0;
    if (!lit || y < ring.g) continue;
    v.set(ring.x, y, ring.z, "glowstone"); stats.glow++;
  }
}

v.save(OUT);
const per = { blocks: v.count(), palette: v.palette.length - 1 };
console.log(JSON.stringify({ cells: cells.size, roofTiers: { 20: [...cells.values()].filter((c) => c.roof === 20).length, 16: [...cells.values()].filter((c) => c.roof === 16).length }, entrance: [entrance.x, entrance.z], ...stats, ...per }));
