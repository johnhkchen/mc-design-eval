import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded office tower, c. 1995-2005 Xinyi: 23 storeys (~5 blocks each) to a
// roof at y 116. Granite-faced glass podium, stepped mid-rise ring, glass
// curtain-wall core with white spandrels, grey penthouse with louvres and a rod.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871928";
const W = 43, D = 37, H = 128;
const ROOF = 116;     // main roof, blocks above lowest ground
const PENT = 121;     // penthouse roof

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const info = new Map();
for (const [x, z, gr] of cells) info.set(key(x, z), { x, z, gr: Math.round(gr) });
const inside = (x, z) => info.has(key(x, z));
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the footprint edge (1 = outermost ring), 4-neighbour BFS.
const dist = new Map();
const q = [];
for (const c of info.values()) {
  if (nb.some(([dx, dz]) => !inside(c.x + dx, c.z + dz))) {
    dist.set(key(c.x, c.z), 1);
    q.push(c);
  }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of nb) {
    const nx = c.x + dx, nz = c.z + dz, k = key(nx, nz);
    if (inside(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      q.push(info.get(k));
    }
  }
}

// Tier: 0 podium, 1 mid ring (to y 60), 2 core (to y 116), 3 penthouse (to y 121).
const levelOf = (x, z) => {
  const d = dist.get(key(x, z)) ?? 1;
  return d >= 15 ? 3 : d >= 12 ? 2 : d >= 6 ? 1 : 0;
};
const topOf = (x, z) => {
  const gr = info.get(key(x, z)).gr;
  const L = levelOf(x, z);
  return [
    gr + 20,
    Math.max(60, gr + 25),
    Math.max(ROOF, gr + 30),
    Math.max(PENT, gr + 35),
  ][L];
};
// Facade cell: touches outside, or a lower tier.
const isEdge = (x, z) =>
  nb.some(([dx, dz]) => !inside(x + dx, z + dz) || levelOf(x + dx, z + dz) < levelOf(x, z));

const zs = [...info.values()].map((c) => c.z);
const minZ = Math.min(...zs);
const frontRow = [...info.values()].filter((c) => c.z === minZ).map((c) => c.x);
const cxm = frontRow.reduce((a, b) => a + b, 0) / frontRow.length;
const isEntrance = (x, z, r) =>
  z === minZ && Math.abs(x - cxm) <= 2 && levelOf(x, z) === 0 && r >= 1 && r <= 3;

// Warm light in an interior cell directly behind a facade window.
const litBehindGlass = (x, z, y) => {
  if (((x * 7 + z * 5 + Math.floor(y / 5)) % 4) !== 0) return false;
  return nb.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || !isEdge(nx, nz)) return false;
    const n = info.get(key(nx, nz));
    return y >= n.gr && y < topOf(nx, nz);
  });
};

const facade = (x, z, r, L, o) => {
  if (L === 3) {                       // penthouse: louvres and warm shroomlights
    if (o === 0 || o === 4) return "gray_concrete";
    if (o === 2 && (x + z) % 4 === 0) return "shroomlight";
    return (x + z) % 2 === 0 ? "iron_bars" : "gray_concrete";
  }
  if (r < 5) {                         // podium ground storey: granite base, shopfronts
    if (o === 0 || o === 4) return "polished_granite";
    if (isEntrance(x, z, r)) return "tinted_glass";
    return (x + z) % 3 === 0 ? "black_concrete" : "cyan_stained_glass";
  }
  const glass = L === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
  if (o === 0) return "white_concrete";          // floor line / spandrel
  if (o === 4) return "light_gray_concrete";     // ceiling band
  return (x + z) % 3 === 0 ? "white_concrete" : glass; // mullions and glass
};

// Build columns: foundation, storeys, floor slabs, facades, roofs.
let spire = null;
for (const c of info.values()) {
  const { x, z, gr } = c;
  const L = levelOf(x, z);
  const E = isEdge(x, z);
  const top = topOf(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const r = y - gr;
    const o = r % 5;
    let b = null;
    if (!E) {
      if (o === 0) b = "smooth_stone";                       // floor slab per storey
      else if (o === 2 && litBehindGlass(x, z, y)) b = "glowstone";
    } else {
      b = facade(x, z, r, L, o);
    }
    if (b) g.set(x, y, z, b);
  }

  // Roofs: flat cap inside, parapet on the edge of every tier below the penthouse.
  if (!E) g.set(x, top - 1, z, "light_gray_concrete");
  else if (L < 3) g.set(x, top, z, "white_concrete");

  if (L === 3) {
    const d = dist.get(key(x, z)) ?? 0;
    if (!spire || d > spire.d) spire = { x, z, d, top };
  }
}

// Mast on the penthouse roof, each rod resting on the one below.
if (spire) {
  for (let y = spire.top; y < spire.top + 4 && y < H; y++) {
    g.set(spire.x, y, spire.z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
