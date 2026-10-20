import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE108-0066-22F: 2019 mixed-use glass tower, Xinyi district.
// ~21 storeys of 5 blocks: 16-block podium, three setback tiers, crown at y 107, spire to 118.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0066-22F";
const W = 57, H = 119, D = 54;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) fp.set(k(x, z), { x, z, g, d: Infinity });
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from footprint edge (1 = edge cell).
const queue = [];
for (const c of fp.values()) {
  if (N4.some(([dx, dz]) => !fp.has(k(c.x + dx, c.z + dz)))) {
    c.d = 1;
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of N4) {
    const n = fp.get(k(c.x + dx, c.z + dz));
    if (n && n.d > c.d + 1) {
      n.d = c.d + 1;
      queue.push(n);
    }
  }
}

const TIERS = [
  { name: "podium", minD: 1, to: 16,
    glass: "light_blue_stained_glass", frame: "smooth_quartz",
    band: "polished_andesite", cap: "light_gray_concrete", mull: 3 },
  { name: "tower1", minD: 4, to: 62,
    glass: "cyan_stained_glass", frame: "white_concrete",
    band: "light_gray_concrete", cap: "light_gray_concrete", mull: 3 },
  { name: "tower2", minD: 8, to: 96,
    glass: "cyan_stained_glass", frame: "white_concrete",
    band: "light_gray_concrete", cap: "light_gray_concrete", mull: 3 },
  { name: "crown", minD: 12, to: 107,
    glass: "light_blue_stained_glass", frame: "white_concrete",
    band: "light_gray_concrete", cap: "light_gray_concrete", mull: 3 },
];

const plan = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  plan.set(`${x},${y},${z}`, { x, y, z, id, props });
};
const has = (x, y, z) => plan.has(`${x},${y},${z}`);

const inT = (t, x, z) => {
  const c = fp.get(k(x, z));
  return !!c && c.d >= t.minD;
};
const perim = (t, x, z) => N4.some(([dx, dz]) => !inT(t, x + dx, z + dz));

// Vertical mullions on each face, spaced by the tier's mull value.
const frameAt = (t, x, z) => {
  let f = false;
  if (!inT(t, x - 1, z) || !inT(t, x + 1, z)) f = f || (z % t.mull === 0);
  if (!inT(t, x, z - 1) || !inT(t, x, z + 1)) f = f || (x % t.mull === 0);
  return f;
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const c of fp.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone");
}

// 2. Tiers: each column stacks storeys contiguously from its own ground.
const ends = new Map();
const lightCand = [];
for (const c of fp.values()) {
  let cur = c.g;
  for (const t of TIERS) {
    if (c.d < t.minD) break;
    const end = Math.max(t.to, cur + 5);
    const p = perim(t, c.x, c.z);
    for (let y = cur; y < end; y++) {
      const rel = y - cur;
      const band = rel % 5 === 0;
      if (y === end - 1) {
        put(c.x, y, c.z, t.cap);
      } else if (p) {
        if (band) put(c.x, y, c.z, t.band);
        else if (frameAt(t, c.x, c.z)) put(c.x, y, c.z, t.frame);
        else {
          put(c.x, y, c.z, t.glass);
          // Sparser, deliberate lit windows (grouped by storey, not speckled).
          if (rel % 5 === 2 && ((Math.floor(c.x / 3) * 5 + Math.floor(c.z / 3) * 3 + Math.floor(y / 5)) % 9) === 0) {
            lightCand.push({ t, x: c.x, y, z: c.z, cur, end });
          }
        }
      } else if (band) {
        put(c.x, y, c.z, t.band); // floor slab
      }
    }
    if (p) put(c.x, end, c.z, t.frame); // parapet / cornice course
    if (t.name === "crown") ends.set(k(c.x, c.z), end);
    cur = end;
  }
}

// 3. Warm light just inside lit windows, only into empty air.
for (const L of lightCand) {
  const { t, x, y, z, cur, end } = L;
  if ((y - cur) % 5 === 0 || y >= end - 1) continue;
  for (const [dx, dz] of N4) {
    const ix = x - dx, iz = z - dz;
    if (inT(t, ix, iz) && !perim(t, ix, iz) && !has(ix, y, iz)) {
      put(ix, y, iz, "glowstone");
      break;
    }
  }
}

// 4. Street entrance: recessed three-wide lobby on the lowest-z face,
// with pillars, a double door and a canopy.
const cells2 = [...fp.values()];
const cx = cells2.reduce((s, c) => s + c.x, 0) / cells2.length;
const minZ = Math.min(...cells2.map(c => c.z));
const frontRow = cells2
  .filter(c => c.z === minZ)
  .sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
if (frontRow.length) {
  const e = frontRow[0];
  const base = e.g;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  // Lobby opening: clear the glass for x-1..x+1 at ground and first floor.
  for (let dx = -1; dx <= 1; dx++) {
    const x = e.x + dx;
    if (!fp.has(k(x, minZ))) continue;
    for (let y = base; y < base + 4; y++) {
      if (y === base || y === base + 1) put(x, y, minZ, "air");
      else put(x, y, minZ, "glowstone"); // warm soffit light inside the lobby
    }
  }
  // Pillars flanking the lobby.
  for (const dx of [-2, 2]) {
    const x = e.x + dx;
    if (!fp.has(k(x, minZ))) continue;
    for (let y = base; y < base + 4; y++) put(x, y, minZ, "smooth_quartz");
  }
  // Double-leaf door in the middle of the opening.
  put(e.x, base, minZ, "dark_oak_door", doorProps("lower"));
  put(e.x, base + 1, minZ, "dark_oak_door", doorProps("upper"));
  // Canopy: a slab course across the lobby head, two cells deep.
  for (let dx = -2; dx <= 2; dx++) {
    for (const dz of [0, 1]) {
      const x = e.x + dx, z = minZ + dz;
      if (fp.has(k(x, z))) put(x, base + 4, z, "light_gray_concrete");
    }
  }
}

// 5. Crown mast: spire on the innermost cell, above the crown roof.
let best = null;
const mx = cells2.reduce((s, q) => s + q.x, 0) / cells2.length;
const mz = cells2.reduce((s, q) => s + q.z, 0) / cells2.length;
for (const c of cells2) {
  const score = c.d * 1000 - Math.hypot(c.x - mx, c.z - mz);
  if (!best || score > best.score) best = { c, score };
}
if (best) {
  const mc = best.c;
  const mbase = ends.get(k(mc.x, mc.z)) ?? 107;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = mc.x + dx, z = mc.z + dz;
      if (inT(TIERS[3], x, z)) {
        for (let y = mbase; y < mbase + 4; y++) put(x, y, z, "white_concrete");
      }
    }
  }
  for (let y = mbase + 4; y < Math.min(mbase + 10, 117); y++) put(mc.x, y, mc.z, "iron_block");
  put(mc.x, Math.min(mbase + 10, 118), mc.z, "lightning_rod", { facing: "up" });
}

// 6. Write the voxels.
const g = new Voxels([W, H, D]);
for (const p of plan.values()) {
  if (p.id === "air") continue;
  if (p.props) g.set(p.x, p.y, p.z, p.id, p.props);
  else g.set(p.x, p.y, p.z, p.id);
}
g.save(`${DIR}/${ID}.nbt`);
