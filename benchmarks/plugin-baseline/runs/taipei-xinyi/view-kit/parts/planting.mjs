// Planting and trees (plan PARTS 5): shrub clumps at the rock feet and along the trails, and trees T1..T3.
// Spots are drawn from a seeded rng() over the plot, each 2 to 3 cells outside a rock, a trail, the deck, a lamp, a
// sign or a bench, so a clump's neighbours never reach a cell an earlier part fills. Trees stand on the TREES sites.
import { ROCKS, DECK, LANTERN_POSTS, BENCHES, SIGN, TREES, PLOT, onTrail, rng, shrub, tree } from "../vocab.mjs";

const SEED = 5;
const ROCK_P = 0.12; // chance a rock-foot cell takes a clump
const TRAIL_P = 0.08; // chance a trail-edge cell takes a clump
const ROCK_KINDS = [["moss_carpet", 3], ["fern", 3], ["short_grass", 3], ["azalea", 2], ["flowering_azalea", 2], ["large_fern", 1]];
const TRAIL_KINDS = [["fern", 3], ["short_grass", 3], ["azalea", 2], ["flowering_azalea", 2]];
const TREE_SITES = [["T1", "oak"], ["T2", "jungle"], ["T3", "oak"]];

// Chebyshev distance from (x, z) to a box, 0 inside it
const gap = (b, x, z) => Math.max(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1));

// True if a reserved trail column lies within r cells of (x, z)
function nearTrail(x, z, r) {
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (onTrail(x + dx, z + dz)) return true;
  return false;
}

// Weighted pick from [[kind, weight], ...] using one draw
function pick(table, u) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let t = u * total;
  for (const [kind, w] of table) {
    if ((t -= w) < 0) return kind;
  }
  return table[table.length - 1][0];
}

const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const SOLID = (id) => !/(^|:)(cave_)?air$/.test(id);

// A crown leaf with at most one solid face contact is a stray (it hangs off the hill or the crown's edge by one face,
// which the fit check reads as an orphan). Two passes, since removing one stray can leave its neighbour with one contact.
function trimStrays(g, b) {
  let n = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) {
      if (!/leaves$/.test(g.blockAt(x, y, z))) continue;
      const contacts = FACES.filter(([dx, dy, dz]) => SOLID(g.blockAt(x + dx, y + dy, z + dz))).length;
      if (contacts <= 1) { g.set(x, y, z, "air"); n++; }
    }
  }
  return n;
}

const ROCK_BOXES = Object.values(ROCKS);
const TREE_BOXES = Object.values(TREES).map((t) => t.box);
const POSTS = [...LANTERN_POSTS.map(([x, z]) => ({ x0: x, x1: x, z0: z, z1: z })), { x0: SIGN.x, x1: SIGN.x, z0: SIGN.z, z1: SIGN.z }, ...BENCHES.map((b) => ({ x0: b.x0, x1: b.x1, z0: b.z, z1: b.z }))];

// Keeps every clump's 3x3 neighbourhood off the deck, the rocks' footprints, the trail, the posts and the trees
function clear(x, z) {
  if (x < 0 || z < 0 || x >= PLOT[0] || z >= PLOT[2]) return false;
  if (gap(DECK, x, z) < 2) return false;
  if (ROCK_BOXES.some((b) => gap(b, x, z) < 2)) return false;
  if (TREE_BOXES.some((b) => gap(b, x, z) < 2)) return false;
  if (POSTS.some((b) => gap(b, x, z) < 2)) return false;
  return !nearTrail(x, z, 1);
}

export function build(g) {
  const r = rng(SEED);
  const out = { rock: 0, trail: 0, trees: 0, refused: 0 };

  for (const [name, kind] of TREE_SITES) {
    const t = TREES[name];
    out.trees += tree(g, t.trunk[0], t.trunk[1], kind);
  }
  for (const b of TREE_BOXES) out.trees -= trimStrays(g, b);

  for (let x = 0; x < PLOT[0]; x++) {
    for (let z = 0; z < PLOT[2]; z++) {
      const roll = r(); // one draw per cell, so the sequence depends only on the cell order
      const kindDraw = r();
      if (!clear(x, z)) continue;

      const rockGap = Math.min(...ROCK_BOXES.map((b) => gap(b, x, z)));
      if (rockGap <= 3 && roll < ROCK_P) {
        const s = shrub(g, x, z, pick(ROCK_KINDS, kindDraw));
        out.rock += s.placed;
        out.refused += s.refused;
      } else if (nearTrail(x, z, 3) && roll < TRAIL_P) {
        const s = shrub(g, x, z, pick(TRAIL_KINDS, kindDraw));
        out.trail += s.placed;
        out.refused += s.refused;
      }
    }
  }
  return out;
}
