// NYC1035444: 422 Madison Avenue, a 1930 commercial office block of six storeys (19 blocks, about 21 m) on a 22 x 8
// footprint. Cream limestone upper floors in a Deco grid (quartz piers, smooth quartz spandrels, glass between), a black
// stone base with a shopfront and a central entrance under a marquee, a stone cornice over every roof, three tiers from
// the lidar (19, 18 and 15 blocks) and a roof plant room. Street front: the north face (z 0, and z 1 where the footprint
// steps back). Behind the glass an air gap and a floor slab per storey; lanterns and glowstone in some of those gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const OUT = `${DIR}/NYC1035444.nbt`;
const W = 22, D = 8, H = 31;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035444.cells.json`, "utf8"));

// Footprint: each cell's ground and lidar roof.
const G = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) G[z][x] = { ground, roof };
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] !== null;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Roof tiers: the lidar's 3 x 3 median (drop-outs under 8 take their neighbours), snapped to clean tiers.
// 19 = the tallest corners and the street-side row, 18 = the main block, 15 = the wings (lidar 16 to 17).
const tier = (h) => (h >= 19 ? 19 : h >= 18 ? 18 : 15);
const T = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!has(x + dx, z + dz)) continue;
    const r = G[z + dz][x + dx].roof; if (r >= 8) nb.push(r);
  }
  T[z][x] = tier(nb.length ? median(nb) : 15);
}
const ground = (x, z) => G[z][x].ground;
const top = (x, z) => (has(x, z) ? T[z][x] : 0);

// A side is exposed at height y when the neighbour is off the footprint or stands lower than y.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) <= y).map(([d]) => d);
// The cell one step inside the building from a face.
const INSIDE = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Materials: limestone upper floors, black stone base, quartz piers and spandrels, a grey stone cornice.
const PIER = "quartz_pillar", SPANDREL = "smooth_quartz", BASE = "polished_blackstone_bricks", PIER_LOW = "polished_blackstone";
const CORNICE = "stone_bricks", FOUNDATION = "stone_bricks", FLOOR = "smooth_stone", GLASS = "glass_pane";
const DOOR_X = [10, 11], MARQUEE_X = [9, 10, 11, 12];
const SHOP_LAMPS = [4, 7, 16, 19], UPPER_LAMPS = [4, 7, 13, 16, 19];

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { x, y, z, block, state });
const lights = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const t = T[z][x], g = ground(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);

    // Interior: an air gap, with a floor slab per storey and the roof slab under the cornice level.
    if (!ex.length) {
      if (y < g || y % 3 === 0 || y === t - 1) put(x, y, z, FLOOR);
      continue;
    }

    // Foundation under a cell whose ground is higher than y 0.
    if (y < g) { put(x, y, z, FOUNDATION); continue; }

    // Face: the north (street) face wins at a corner; piers sit on the grid of its own face.
    const face = ex.includes("N") ? "N" : ex.includes("S") ? "S" : ex.includes("E") ? "E" : "W";
    const u = face === "N" || face === "S" ? x : z;
    const pier = u % 3 === 0;
    const k = Math.floor(y / 3), r = y % 3;

    if (y === t - 1) { put(x, y, z, CORNICE); continue; }

    // Ground floor: black base at y 0, then the shopfront with its entrance on the north face.
    if (k === 0) {
      if (y === 0) { put(x, y, z, BASE); continue; }
      if (face === "N" && DOOR_X.includes(x)) {
        const half = y === 1 ? "lower" : "upper";
        put(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) { put(x, y, z, PIER_LOW); continue; }
      put(x, y, z, GLASS);
      if (face === "N" && SHOP_LAMPS.includes(x)) lights.push({ face, x, y, z, block: "lantern" });
      continue;
    }

    // Marquee over the entrance: a bottom slab on the piers and the door head.
    if (y === 3 && face === "N" && MARQUEE_X.includes(x)) { put(x, y, z, "polished_blackstone_slab", { type: "bottom", waterlogged: "false" }); continue; }

    // Upper storeys: a spandrel course on each floor line, piers on the grid, glass between.
    if (r === 0) { put(x, y, z, pier ? PIER : SPANDREL); continue; }
    if (pier) { put(x, y, z, PIER); continue; }
    put(x, y, z, GLASS);
    if (r === 1 && k % 2 === 1 && UPPER_LAMPS.includes(u)) lights.push({ face, x, y, z, block: "glowstone" });
  }
}

// Warm light in the air gap behind a chosen window, where that cell is inside the building.
for (const l of lights) {
  const [dx, dz] = INSIDE[l.face];
  const ix = l.x + dx, iz = l.z + dz;
  if (!has(ix, iz) || exposed(ix, iz, l.y).length) continue;
  if (B.has(`${ix},${l.y},${iz}`)) continue;
  put(ix, l.y, iz, l.block);
}

// Roof plant room on the main tier (18), set in from the street.
for (const [x, z] of [[6, 3], [7, 3], [15, 4], [16, 4]]) {
  if (!has(x, z) || T[z][x] !== 18 || exposed(x, z, 17).length) continue;
  put(x, 18, z, "light_gray_concrete");
  put(x, 19, z, "light_gray_concrete");
}

// Glass panes join the facade materials along their wall, not the air or the lamps behind them.
const WALL = new Set([GLASS, PIER, PIER_LOW, SPANDREL, BASE, CORNICE, FOUNDATION]);
const panes = [...B.values()].filter((c) => c.block === GLASS);
for (const c of panes) {
  const link = (dx, dz) => { const n = B.get(`${c.x + dx},${c.y},${c.z + dz}`); return n && WALL.has(n.block) ? "true" : "false"; };
  c.state = { east: link(1, 0), west: link(-1, 0), north: link(0, -1), south: link(0, 1), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const c of B.values()) g.set(c.x, c.y, c.z, c.block, c.state);
const { blocks, palette } = g.save(OUT);

const tops = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) tops[T[z][x]] = (tops[T[z][x]] || 0) + 1;
console.log(`NYC1035444: ${blocks} blocks, palette ${palette}, roof tiers`, tops, `-> ${OUT}`);
