// Mayoral Drive Exchange: a 1980s-era CBD office block on a podium, precast-concrete frame with blue-tinted glazing,
// in Auckland's own palette (white and grey concrete, tinted glass, a stone base). Storeys are 4 blocks: a concrete floor
// row, a spandrel row, two glass rows. The lidar roof is median-smoothed over 5x5 and quantised to whole storeys, so the
// massing steps down in clean tiers (a podium of about 5 storeys, a 14-storey slab, a taller top tier with plant boxes).
// Each cell is a solid column from its own ground up to its roof, so every storey stands on the one below. Walls only
// stand where a cell faces open air or a lower neighbour; the interior is air behind the glass, with a few glowstone lamps.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238369.cells.json", "utf8"));
const W = 67, D = 67, H = 82, STOREY = 4;

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the roof: median of the footprint's roof heights within 2 cells, then quantised down to whole storeys so every tier is
// flat. A cell's roof row T is a multiple of 4; it sits at least one storey above its own ground's floor line.
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, gr] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  const rs = median(v);
  T[x][z] = Math.max(STOREY * Math.floor(rs / STOREY), STOREY * Math.ceil(gr / STOREY) + STOREY);
}

// a face of a cell at height y is open to air (or a lower neighbour) when the neighbour is outside the footprint or has no
// column there; an interior neighbour's air is one room, so no wall between them
const exposed = (x, z, dx, dz, y) => !inside(x + dx, z + dz) || y >= T[x + dx][z + dz];

// the palette: white and grey precast for the frame, dark spandrels, pale tinted glass, a stone base
const FLOOR = "white_concrete", INNER_FLOOR = "light_gray_concrete", SPAN = "gray_concrete", FRAME = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", BASE = "stone_bricks", FOUND = "stone", ROOF = "gray_concrete", CORNICE = "white_concrete";
const LAMP = "glowstone";

const g = new Voxels([W, H, D]);
const ENTRANCE_U = 33;                                    // the street entrance on the south face, near x 33
const kgOf = (gr) => Math.floor(gr / STOREY);             // the ground storey of a cell (the one holding its grade)

for (const [x, z, gr] of cells) {
  const t = T[x][z], kg = kgOf(gr);
  const outAt = (y) => DIRS.filter(([dx, dz]) => exposed(x, z, dx, dz, y));

  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, y === gr - 1 ? BASE : FOUND); continue; }   // foundation up to the cell's ground
    const k = Math.floor(y / STOREY), r = y % STOREY, ex = outAt(y);
    if (r === 0) { g.set(x, y, z, ex.length ? FLOOR : INNER_FLOOR); continue; }  // the storey's floor slab, every storey
    if (!ex.length) continue;                              // interior: air behind the glass

    // a stepped edge exposes two faces at once: the street-side one (outside the footprint) carries the facade, so the
    // cell does not turn into a solid light column on every diagonal step
    const [dx, dz] = ex.find(([ax, az]) => !inside(x + ax, z + az)) || ex[0];
    const u = dx !== 0 ? z : x;                           // the coordinate along the face
    const mullion = u % 3 === 0;

    // the street entrance: three glass bays in the ground storey of the south face, with a stone canopy over them
    if (dz === 1 && k === kg && Math.abs(u - ENTRANCE_U) <= 1) {
      g.set(x, y, z, r === 3 ? "smooth_stone" : r === 1 ? BASE : GLASS);
      continue;
    }
    if (k === kg) {                                       // the shopfront: a base course, then glass between frames
      g.set(x, y, z, r === 1 ? BASE : mullion ? FRAME : GLASS);
      continue;
    }
    if (r === 1) { g.set(x, y, z, mullion ? FRAME : SPAN); continue; }   // spandrel row under each window
    if (mullion) { g.set(x, y, z, FRAME); continue; }
    g.set(x, y, z, GLASS);
    // a warm lamp just inside some windows, one block behind the glass
    const ix = x - dx, iz = z - dz;
    if (r === 2 && (u + 2 * k) % 9 === 4 && inside(ix, iz) && y < T[ix][iz]) g.set(ix, y, iz, LAMP);
  }

  // the roof slab, and a cornice on the outer edge (the parapet stands one block above the slab)
  g.set(x, t, z, ROOF);
  if (outAt(t - 1).length) g.set(x, t + 1, z, CORNICE);
}

// roof equipment on the top tiers: a few plant and lift boxes, two blocks tall above the slab
for (const [x, z] of cells) {
  if (T[x][z] < 56 || x % 6 !== 3 || z % 6 !== 3) continue;
  for (let y = T[x][z] + 1; y <= T[x][z] + 3; y++) g.set(x, y, z, FRAME);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238369.nbt");
console.log(JSON.stringify(info));
