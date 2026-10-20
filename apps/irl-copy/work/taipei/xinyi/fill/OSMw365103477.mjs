import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Office/residential tower, late-20th-century Taipei: a glazed curtain-wall
// shaft on a stone-based podium, two setbacks, a plant penthouse and a mast.
// Roof sits ~88 blocks above the lowest ground (about 17 storeys of 5 blocks).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103477";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 100, D = 48;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- footprint and ground ----
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inside = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

// distance from the outside edge (1 = outer ring), used for setbacks
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const maxDist = Math.max(...dist.values());
const maxG = Math.max(...cells.map(c => Math.round(c[2])));

// ---- vertical levels ----
const PT = Math.max(maxG + 10, 22);            // podium top (about 3-4 storeys)
const MID = Math.max(60, PT + 25);             // first setback
const TOP = 88;                                // main roof
const PH_TOP = 92;                             // penthouse top

const setOf = (minDist) => {
  const s = new Set();
  for (const [x, z] of cells) if (dist.get(key(x, z)) >= minDist) s.add(key(x, z));
  return s;
};
const P = setOf(1);
const T1 = setOf(Math.min(3, maxDist));
const T2 = setOf(Math.min(6, Math.max(1, maxDist - 3)));
const C = setOf(Math.min(9, Math.max(1, maxDist - 5)));

const tiers = [
  { to: PT, set: P },
  { to: MID, set: T1 },
  { to: TOP, set: T2 },
  { to: PH_TOP, set: C },
];

const edge = (x, z, S) => DIRS.some(([dx, dz]) => !S.has(key(x + dx, z + dz)));

const facadeBlock = (x, y, z, i, base, G) => {
  const k = (y - base) % 5;
  const ground = i === 0 && y - G < 5;
  // two mullion rhythms: wide pillars every 3 cells, slim fins every 2 cells on upper tiers
  const pillar = (x + z) % 3 === 0;
  const fin = i > 0 && (x + z) % 2 === 1 && (x * 2 + z) % 6 === 1;
  if (k === 4) return "light_gray_concrete";                       // storey band
  if (ground && pillar) return "polished_andesite";                  // stone base course
  if (pillar) return "white_concrete";
  if (fin) return "quartz_block";                                    // slim fins catch the light
  if (k === 2 && (x * 7 + z * 13 + y * 3) % 11 === 0) return "glowstone"; // lit window
  if (i === 0) return "cyan_stained_glass";
  return "light_blue_stained_glass";
};

// ---- columns ----
for (const [x, z] of cells) {
  if (!P.has(key(x, z))) continue;
  const G = groundAt(x, z);

  // foundation
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  let start = G;
  for (let i = 0; i < tiers.length; i++) {
    const { to, set } = tiers[i];
    const kk = key(x, z);
    if (!set.has(kk)) break;
    const base = i === 0 ? G : tiers[i - 1].to;
    const next = tiers[i + 1] ? tiers[i + 1].set : null;

    for (let y = Math.max(start, base); y < to && y < H; y++) {
      if (y === to - 1 && (!next || !next.has(kk))) {
        g.set(x, y, z, "light_gray_concrete");              // roof of this tier
      } else if ((y - base) % 5 === 0) {
        g.set(x, y, z, i === 0 && y - G < 5 ? "polished_andesite" : "light_gray_concrete");
      } else if (edge(x, z, set)) {
        g.set(x, y, z, facadeBlock(x, y, z, i, base, G));
      }
    }

    // parapet on the outer edge where this tier steps back or ends
    if ((!next || !next.has(kk)) && edge(x, z, set) && to < H) {
      g.set(x, to, z, "stone_brick_wall");
    }
    start = to;
  }
}

// ---- roof plant on the main roof (outside the penthouse) ----
for (const [x, z] of cells) {
  const kk = key(x, z);
  if (!T2.has(kk) || C.has(kk) || edge(x, z, T2)) continue;
  if (x % 6 === 2 && z % 6 === 3) {
    g.set(x, TOP, z, "smooth_stone");
    g.set(x, TOP + 1, z, "smooth_stone");
  }
}

// ---- mast on the penthouse ----
{
  const cs = [...C].map(k => k.split(",").map(Number));
  if (cs.length) {
    const cx = cs.reduce((a, c) => a + c[0], 0) / cs.length;
    const cz = cs.reduce((a, c) => a + c[1], 0) / cs.length;
    const [mx, mz] = cs.reduce((best, c) =>
      Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
    for (let y = PH_TOP; y < Math.min(PH_TOP + 5, H); y++) g.set(mx, y, mz, "lightning_rod");
  }
}

// ---- entrance on the south (max z) podium frontage ----
{
  let best = null;
  for (const [x, z] of cells) {
    const kk = key(x, z);
    if (!P.has(kk) || !edge(x, z, P)) continue;
    if (!best || z > best[1] || (z === best[1] && x < best[0])) best = [x, z];
  }
  if (best) {
    const [ex, ez] = best;
    const G = groundAt(ex, ez);
    // glazed vestibule three cells wide, two storeys tall, with a light column each side
    for (const dx of [-1, 0, 1]) {
      const nx = ex + dx;
      if (!P.has(key(nx, ez))) continue;
      const nG = groundAt(nx, ez);
      for (let y = nG; y < nG + 3; y++) g.set(nx, y, ez, "glass");
      g.set(nx, nG + 3, ez, "light_gray_concrete");
    }
    // door in the middle, lower and upper halves
    g.set(ex, G, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(ex, G + 1, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // canopy five cells wide where the footprint allows, at the storey line above the door
    for (const dx of [-2, -1, 0, 1, 2]) {
      const nx = ex + dx;
      if (P.has(key(nx, ez))) {
        g.set(nx, G + 4, ez, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
    // warm lanterns either side of the door
    for (const dx of [-2, 2]) {
      const nx = ex + dx;
      if (P.has(key(nx, ez))) g.set(nx, G + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
