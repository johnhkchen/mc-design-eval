import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1608 Rhode Island Ave NW: a early-1900s red-brick dormitory with limestone trim, a 3-block storey module
// (string course, two window rows), piers between bays, a lower wing and a taller core stepping up at the centre.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86714.cells.json`, "utf8"));

const W = 27, H = 22, D = 27;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));
const missing = (x, z) => [!has(x + 1, z), !has(x - 1, z), !has(x, z + 1), !has(x, z - 1)].filter(Boolean).length;
const isEdge = (x, z) => missing(x, z) > 0;

// ---- roof: 5x5 smoothing of the lidar height, then three-block tiers (storey lines) ----
const map = new Map();
for (const [k, c] of raw.entries()) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const o = raw.get(key(x + dx, z + dz));
      if (o) { sum += o.roof; n++; }
    }
  const Rq = Math.min(Math.max(3 * Math.round(sum / n / 3), c.gr + 6), 18);
  map.set(k, { gr: c.gr, Rq });
}
const maxRq = Math.max(...[...map.values()].map((c) => c.Rq));

// ---- materials ----
const BRICK = "bricks";
const TRIM = "smooth_stone";        // limestone string courses, quoins, lintels
const BASE = "polished_granite";
const FOUNDATION = "stone_bricks";
const CORNICE = "stone_bricks";
const PARAPET = "stone_brick_wall";
const GLASS = "light_gray_stained_glass_pane";
const DECK = "stone";

// ---- main pass: foundation, base, piers, glazing, storey slabs, cornice, parapet ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const { gr, Rq } = map.get(key(x, z));
    for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

    if (isEdge(x, z)) {
      // the face this cell sits on, and its position along that face
      let face, b;
      if (!has(x, z - 1)) { face = "n"; b = x; }
      else if (!has(x, z + 1)) { face = "s"; b = x; }
      else if (!has(x - 1, z)) { face = "w"; b = z; }
      else { face = "e"; b = z; }
      const corner = missing(x, z) >= 2;
      const pier = corner || b % 3 === 0;

      for (let y = gr; y < Rq; y++) {
        let m;
        if (y === gr) m = BASE;
        else if (y === Rq - 1) m = CORNICE;
        else if (y === Rq - 2) m = TRIM;
        else if (y % 3 === 0) m = TRIM;
        else if (pier) m = corner ? TRIM : BRICK;
        else m = GLASS;
        g.set(x, y, z, m);
      }
      g.set(x, Rq, z, PARAPET);

      // warm light behind some glass: a glowstone on the inner floor, under the window head
      let ix = x, iz = z;
      if (face === "n") iz = z + 1;
      else if (face === "s") iz = z - 1;
      else if (face === "w") ix = x + 1;
      else ix = x - 1;
      if (has(ix, iz) && !isEdge(ix, iz) && !pier && b % 6 === 4) {
        for (let y = gr + 1; y < Rq - 2; y++) if (y % 3 === 2) g.set(ix, y, iz, "glowstone");
      }
    } else {
      // interior: a floor slab at each storey line, air between, a roof deck on top
      for (let y = gr; y < Rq - 1; y++) if (y === gr || y % 3 === 0) g.set(x, y, z, "smooth_stone");
      g.set(x, Rq - 1, z, DECK);
    }
  }
}

// ---- entrance: middle of the longest exterior run on a face, pilasters, lintel, doors ----
const runs = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z) || !isEdge(x, z) || missing(x, z) >= 2) continue;
  const face = !has(x, z - 1) ? "n" : !has(x, z + 1) ? "s" : !has(x - 1, z) ? "w" : "e";
  (runs[face] ??= []).push({ b: face === "n" || face === "s" ? x : z, x, z, facing: { n: "north", s: "south", w: "west", e: "east" }[face] });
}
let best = null;
for (const [face, bs] of Object.entries(runs)) {
  bs.sort((a, b) => a.b - b.b);
  let run = [bs[0]];
  const close = (r) => { if (!best || r.length > best.run.length) best = { face, run: r }; };
  for (const c of bs.slice(1)) { if (c.b !== run[run.length - 1].b + 1) { close(run); run = []; } run.push(c); }
  close(run);
}
const ef = best.face;
const mid = best.run[Math.floor(best.run.length / 2)];
{
  const { x: ex, z: ez, facing } = mid;
  const { gr } = map.get(key(ex, ez));
  // flanking pilasters and a lintel over the door, all on the wall that is already there
  const along = ef === "n" || ef === "s" ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const [ax, az] = [ex + along[0] * s, ez + along[1] * s];
    if (!has(ax, az)) continue;
    for (let y = gr; y <= gr + 2; y++) g.set(ax, y, az, TRIM);
  }
  for (const s of [-2, 2]) {
    const [ax, az] = [ex + along[0] * s, ez + along[1] * s];
    if (has(ax, az)) for (let y = gr; y <= gr + 2; y++) g.set(ax, y, az, TRIM);
  }
  // door: two-high, opening into the room; a warm lantern in the head above it
  g.set(ex, gr, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, gr + 1, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, gr + 2, ez, "lantern", { hanging: "false" });
}

// ---- roof: a stepped penthouse on the top tier, chimney stacks on the middle tier, planters on the low wing ----
{
  const inset2 = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!has(x + dx, z + dz)) return false; return true; };
  const P = new Set();
  for (const [k, c] of map.entries()) {
    const [x, z] = k.split(",").map(Number);
    if (c.Rq === maxRq && inset2(x, z)) P.add(k);
  }
  for (const k of P) {
    const [x, z] = k.split(",").map(Number);
    const { Rq } = map.get(k);
    const ring = !P.has(key(x + 1, z)) || !P.has(key(x - 1, z)) || !P.has(key(x, z + 1)) || !P.has(key(x, z - 1));
    if (ring) {
      g.set(x, Rq, z, "smooth_stone");
      g.set(x, Rq + 1, z, GLASS);
    } else {
      g.set(x, Rq, z, "smooth_stone");
    }
  }
  for (const [k, c] of map.entries()) {
    const [x, z] = k.split(",").map(Number);
    if (P.has(k)) continue;
    if (c.Rq === 15 && x % 6 === 3 && z % 6 === 3 && !isEdge(x, z)) {
      g.set(x, c.Rq, z, BRICK);
      g.set(x, c.Rq + 1, z, BRICK);
      g.set(x, c.Rq + 2, z, "smooth_stone_slab", { type: "top" });
    }
    if (c.Rq === 6 && !isEdge(x, z) && x % 4 === 1 && z % 4 === 1) g.set(x, c.Rq, z, "oak_fence");
  }
}

console.log(g.save(`${DIR}/DC86714.nbt`));
