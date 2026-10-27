// A 1930s stripped-classical commercial block (cream plaster, quartz piers, shopfronts on the ground floor), built from
// the lidar's roof heights: a 4-storey tower (19), a 3-storey setback (15), a 1-storey shop wing (6) and a podium (2).
// Every footprint cell is solid from y 0 up to its tier, so each storey and tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340936.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340936.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const [W, H, D] = [20, 32, 29];
const PLATE = 2;          // ground-floor plate, above the highest ground under the footprint (2)
const STOREY = 4;         // blocks per storey: string course, two rows of glass, spandrel

// lidar roof -> clean flat tiers
const tierTop = (r) => (r <= 3 ? 2 : r <= 7 ? 6 : r <= 15 ? 15 : 19);

const plot = new Map();
for (const [x, z, g, r] of cells) plot.set(`${x},${z}`, { g, T: tierTop(r) });
const cellAt = (x, z) => plot.get(`${x},${z}`);
const solid = (x, z, y) => { const c = cellAt(x, z); return !!c && y < c.T; };

// outward directions: z grows south, x grows east
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
const exposed = (x, z, y) => DIRS.filter((d) => !solid(x + d.dx, z + d.dz, y));
// piers every third cell along a wall; the wall runs along x on north/south faces, along z on east/west
const pier = (x, z, d) => ((d.dz !== 0 ? x : z) % 3) === 0;

// entrances: the main door on the north face of the tower, a shop door on the east face of the shop wing
const doors = new Map();
{
  const cands = [...plot.keys()].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => cellAt(x, z).T === 19 && !solid(x, z - 1, PLATE) && !pier(x, z, DIRS[0]));
  const mid = cands.reduce((s, [x]) => s + x, 0) / cands.length;
  const [dx, dz] = cands.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
  doors.set(`${dx},${dz}`, DIRS[0]);
}
{
  const cands = [...plot.keys()].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => cellAt(x, z).T === 6 && !solid(x + 1, z, PLATE) && !pier(x, z, DIRS[2]));
  if (cands.length) {
    const mid = cands.reduce((s, [, z]) => s + z, 0) / cands.length;
    const [dx, dz] = cands.reduce((best, c) => (Math.abs(c[1] - mid) < Math.abs(best[1] - mid) ? c : best));
    doors.set(`${dx},${dz}`, DIRS[2]);
  }
}

// the rooftop core: a 3x3 box on the tower roof, kept one cell in from the parapet
let core = null;
{
  const tower = [...plot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => cellAt(x, z).T === 19);
  const cx0 = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz0 = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  let best = null;
  for (const [x, z] of tower) {
    let ok = true;
    for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (cellAt(x + dx, z + dz)?.T !== 19) ok = false;
    if (!ok) continue;
    const d = Math.hypot(x - cx0, z - cz0);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) core = best;
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const paneState = (d) => (d.dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const [key, c] of plot) {
  const [x, z] = key.split(",").map(Number);
  const { T } = c;
  const door = doors.get(key);
  for (let y = 0; y < T; y++) {
    const exp = exposed(x, z, y);
    // the top: a parapet cap on the edge, the roof deck inside
    if (y === T - 1) {
      if (T === 2) put(x, y, z, "stone_bricks");                         // podium: plinth stone, no ledge
      else if (exp.length) put(x, y, z, "quartz_block");
      else put(x, y, z, T === 19 ? "gray_concrete" : "smooth_stone");
      continue;
    }
    // the plinth: stone from the lowest ground up to the plate, so nothing floats on the slope
    if (y < PLATE) { put(x, y, z, "stone_bricks"); continue; }
    const rel = (y - PLATE) % STOREY;
    if (!exp.length) { if (rel === 0) put(x, y, z, "smooth_stone"); continue; }   // interior floor slabs; air otherwise
    const d = exp[0];
    const ground = y < PLATE + STOREY;
    if (rel === 0) { put(x, y, z, y === PLATE ? "polished_andesite" : "quartz_block"); continue; }   // base course, string courses
    if (door) {
      if (y === PLATE) { put(x, y, z, "dark_oak_door", doorState(d.name, "lower")); continue; }
      if (y === PLATE + 1) { put(x, y, z, "dark_oak_door", doorState(d.name, "upper")); continue; }
      if (y === PLATE + 2) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    }
    if (pier(x, z, d)) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (rel === 3) { put(x, y, z, ground ? "red_concrete" : "smooth_quartz"); continue; }   // awning fascia / spandrel
    if (ground) { put(x, y, z, "glass"); continue; }                                       // shopfront glass
    put(x, y, z, "glass_pane", paneState(d));
    // a warm light behind some upper windows: in the air gap just inside the glass
    if (rel === 1 && (x + z + Math.floor(y / STOREY)) % 4 === 0) {
      const ix = x - d.dx, iz = z - d.dz;
      if (cellAt(ix, iz) && exposed(ix, iz, y).length === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// the core: a three-by-three box with a glazed face on each side, on the tower roof
if (core) {
  const { x: cx, z: cz } = core, T = 19;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz, edge = Math.abs(dx) === 1 || Math.abs(dz) === 1, mid = dx === 0 || dz === 0;
    for (let y = T; y < T + 3; y++) {
      if (!edge) continue;
      put(x, y, z, mid && y === T + 1 ? "glass" : "smooth_quartz");
    }
    put(x, T + 3, z, "quartz_block");
  }
  put(cx, T + 3, cz, "quartz_block");
  // two plant units on the roof, clear of the core
  let placed = 0;
  for (const [key, c] of plot) {
    if (placed >= 2) break;
    const [x, z] = key.split(",").map(Number);
    if (c.T !== 19 || Math.abs(x - cx) < 3 || Math.abs(z - cz) < 3 || exposed(x, z, 18).length) continue;
    if (x % 4 !== 0 || z % 4 !== 0) continue;
    put(x, T, z, "iron_block"); placed++;
  }
}

const stats = v.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, palette ${stats.palette}`);
