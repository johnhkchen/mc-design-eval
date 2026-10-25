import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499668";
const W = 13, H = 25, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) raw.set(key(c[0], c[1]), { ground: c[2], roof: c[3] });

// Smooth ground over a 3x3 neighbourhood so the base doesn't step on lidar noise.
const ground = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = raw.get(key(x + dx, z + dz));
    if (r) { sum += r.ground; n++; }
  }
  ground.set(k, Math.max(0, Math.min(H - 10, Math.round(sum / n))));
}

// One flat roof for the whole block: median of the lidar roof heights.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const R = Math.min(H - 2, Math.max(Math.round(roofs[Math.floor(roofs.length / 2)]),
  Math.max(...[...ground.values()]) + 6));

const sides = (x, z) => ({
  n: !raw.has(key(x, z - 1)),
  s: !raw.has(key(x, z + 1)),
  w: !raw.has(key(x - 1, z)),
  e: !raw.has(key(x + 1, z)),
});
const isBoundary = (x, z) => { const s = sides(x, z); return s.n || s.s || s.w || s.e; };

// Entrance: south-facing exterior cell nearest the footprint's centre line.
let cxSum = 0;
for (const c of cells) cxSum += c[0];
const cx = cxSum / cells.length;
let doorKey = null, bestDist = Infinity;
for (const c of cells) {
  const x = c[0], z = c[1];
  if (!sides(x, z).s) continue;
  const d = Math.abs(x - cx);
  if (d < bestDist) { bestDist = d; doorKey = key(x, z); }
}

// Pass 1: foundation, walls, floor slabs, windows, parapet and roof deck.
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  const sd = sides(x, z);
  const boundary = sd.n || sd.s || sd.w || sd.e;
  const corner = (sd.n || sd.s) && (sd.e || sd.w);
  const facadeAlongZ = sd.e || sd.w;
  const along = facadeAlongZ ? z : x;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= R; y++) {
    if (y === gr) {
      g.set(x, y, z, boundary ? "polished_andesite" : "smooth_stone");
      continue;
    }
    if (y === R - 1) {
      g.set(x, y, z, boundary ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === R) {
      if (boundary) g.set(x, y, z, "stone_bricks"); // parapet
      continue;
    }
    if (y > R) continue;

    const rel = (y - gr) % 5;
    if (rel === 0) {
      // Storey floor slab / belt course, all cells.
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!boundary) continue; // interior air

    if (rel === 1) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else if (rel === 2 || rel === 3) {
      const isDoor = k === doorKey && y <= gr + 2;
      const isWindow = !corner && along % 3 === 1 && !isDoor;
      if (isWindow) {
        g.set(x, y, z, "glass_pane", facadeAlongZ
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      } else {
        g.set(x, y, z, "stone_bricks");
      }
    } else {
      g.set(x, y, z, "stone_bricks"); // lintel course
    }
  }
}

// Pass 2: entrance, then warm light behind some windows.
if (doorKey) {
  const [x, z] = doorKey.split(",").map(Number);
  const gr = ground.get(doorKey);
  g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  const sd = sides(x, z);
  const boundary = sd.n || sd.s || sd.w || sd.e;
  const corner = (sd.n || sd.s) && (sd.e || sd.w);
  if (!boundary || corner) continue;
  const along = (sd.e || sd.w) ? z : x;
  if (along % 3 !== 1 || k === doorKey) continue;

  let ix = x, iz = z;
  if (sd.n) iz = z + 1;
  else if (sd.s) iz = z - 1;
  else if (sd.w) ix = x + 1;
  else if (sd.e) ix = x - 1;
  const inKey = key(ix, iz);
  if (!raw.has(inKey) || isBoundary(ix, iz)) continue;

  for (let y = gr + 1; y < R - 1; y++) {
    if ((y - gr) % 5 !== 2) continue;
    if ((x * 5 + z * 7 + y) % 4 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
