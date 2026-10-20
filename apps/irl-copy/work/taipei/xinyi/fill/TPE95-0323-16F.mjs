import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0323-16F";
const W = 37, H = 90, D = 97;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x * 200 + z;
const unkey = (k) => [Math.floor(k / 200), k % 200];
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the footprint edge (4-neighbour BFS), so setbacks follow any outline.
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = unkey(k);
  let edge = false;
  for (const [dx, dz] of N4) if (!ground.has(key(x + dx, z + dz))) edge = true;
  if (edge) { dist.set(k, 0); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const [x, z] = unkey(k);
  for (const [dx, dz] of N4) {
    const nk = key(x + dx, z + dz);
    if (ground.has(nk) && !dist.has(nk)) { dist.set(nk, dist.get(k) + 1); queue.push(nk); }
  }
}

let zMin = Infinity;
let xMid = 0, midN = 0;
for (const k of ground.keys()) {
  const [x, z] = unkey(k);
  zMin = Math.min(zMin, z);
}
// centre of the street-facing run (cells on zMin) for the entrance
{
  const xs = [];
  for (const k of ground.keys()) { const [x, z] = unkey(k); if (z === zMin) xs.push(x); }
  xs.sort((a, b) => a - b);
  xMid = xs[Math.floor(xs.length / 2)];
}

// Massing: podium, three tower setbacks, and a small crown. Roof of main block at y 78.
const TIERS = [
  { kind: "podium", inset: 0,  lo: 0,  hi: 20 },
  { kind: "tower",  inset: 4,  lo: 20, hi: 45 },
  { kind: "tower",  inset: 8,  lo: 45, hi: 65 },
  { kind: "tower",  inset: 11, lo: 65, hi: 78 },
  { kind: "crown",  inset: 14, lo: 78, hi: 82 },
];

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

function entranceBlock(x, z, y, gr) {
  // entrance on the street face (zMin), podium ground floor only
  if (z !== zMin) return null;
  const dx = x - xMid;
  if (Math.abs(dx) > 4) return null;
  if (y === gr + 4) return { name: "quartz_block" };          // lintel over the doors
  if (y < gr + 4 && Math.abs(dx) === 4) return { name: "quartz_block" }; // door piers
  if (y < gr + 4 && Math.abs(dx) <= 3) {
    if (dx === 0 && y < gr + 2) return { name: "iron_block" }; // centre door mullion
    return { name: "light_blue_stained_glass" };
  }
  return null;
}

function blockAt(T, x, z, y, ld, gr, d) {
  const r = (((y - T.lo) % 5) + 5) % 5;
  // roof cap closing each tier
  if (y === T.hi - 1) return { name: "light_gray_concrete" };

  // entrance (ground floor, outer skin only)
  if (T.kind === "podium" && ld === 0 && y >= gr && y <= gr + 4) {
    const e = entranceBlock(x, z, y, gr);
    if (e) return e;
  }

  // base course on podium edges
  if (T.kind === "podium" && ld === 0 && y === gr) return { name: "polished_andesite" };

  // storey lines
  if (r === 0) return { name: ld === 0 ? "quartz_block" : "light_gray_concrete" };

  // interior air gap, with warm lights behind the glass
  if (ld >= 1) {
    if (ld === 1 && r >= 1 && r <= 3 && ((x * 7 + y * 3 + z * 5) % 19 === 0)) return { name: "glowstone" };
    return null;
  }

  // facade
  if (r === 4) return { name: "white_concrete" };
  // full-height piers every six blocks, mullions every three between them
  const pier = x % 6 === 0 || z % 6 === 0;
  if (pier) return { name: "quartz_block" };
  const mullion = x % 3 === 0 || z % 3 === 0;
  if (mullion) return { name: "white_concrete" };
  if (T.kind === "podium") return { name: "light_blue_stained_glass" };
  // alternate tint bays for rhythm on the towers
  return { name: ((x >> 2) + (z >> 2)) % 2 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass" };
}

for (const [k, gr] of ground) {
  const [x, z] = unkey(k);
  const d = dist.get(k) ?? 0;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let t = 0; t < TIERS.length; t++) {
    const T = TIERS[t];
    if (d < T.inset) continue;
    const next = TIERS[t + 1];
    const ld = d - T.inset;
    const s = Math.max(T.lo, gr);
    if (s < T.hi) {
      for (let y = s; y < T.hi; y++) {
        const b = blockAt(T, x, z, y, ld, gr, d);
        if (b) put(x, y, z, b.name, b.props);
      }
    }
    // parapet on the outer edge of each uncovered top
    if (ld === 0 && (!next || d < next.inset) && s < T.hi && T.hi < H) {
      put(x, T.hi, z, "quartz_slab", { type: "bottom" });
    }
  }
}

// Roof plant on the third tower roof (y 78), kept off the crown footprint.
for (const [k, gr] of ground) {
  const [x, z] = unkey(k);
  const d = dist.get(k) ?? 0;
  if (gr > 77 || d < 12 || d > 13) continue;
  if (x % 6 === 2 && z % 9 === 4) {
    for (let y = 78; y <= 80; y++) put(x, y, z, "iron_block");
  }
}

// Mast on the deepest crown-covered cell, on top of the crown roof at y 81.
let best = null, bestD = -1;
for (const [k, gr] of ground) {
  const d = dist.get(k) ?? 0;
  if (gr < 78 && d >= 14 && d > bestD) { bestD = d; best = k; }
}
if (best !== null) {
  const [mx, mz] = unkey(best);
  for (let y = 82; y <= 86; y++) put(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
