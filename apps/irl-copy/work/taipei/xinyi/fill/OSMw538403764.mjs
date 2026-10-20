import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403764";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);
const inside = (x, z) => ground.has(k(x, z));
const gOf = (x, z) => ground.get(k(x, z));
const lo = Math.min(...ground.values());
const hi = Math.max(...ground.values());

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Record: roof about 11 blocks above lowest ground. Two storeys of 5 blocks.
const roofY = Math.min(lo + 11, H - 3);            // first air block above the roof
const sh = Math.max(2, Math.min(5, Math.floor((roofY - hi - 1) / 2))); // storey height
const deckY = hi + 2 * sh;                          // roof deck / cornice level

// Outward sides of an edge cell
const sides = (x, z) => {
  const s = [];
  if (!inside(x, z - 1)) s.push({ n: [0, -1], pos: x });
  if (!inside(x, z + 1)) s.push({ n: [0, 1], pos: x });
  if (!inside(x - 1, z)) s.push({ n: [-1, 0], pos: z });
  if (!inside(x + 1, z)) s.push({ n: [1, 0], pos: z });
  return s;
};

// Front = the z-minimum side. Find door position from its cells.
const frontPos = [];
for (const [x, z] of cells) {
  if (!inside(x, z - 1)) frontPos.push(x);
}
frontPos.sort((a, b) => a - b);
const mid = Math.floor(frontPos.length / 2);
const doorXs = new Set([frontPos[mid], frontPos[mid - 1]].filter((v) => v !== undefined));
const doorMin = Math.min(...doorXs), doorMax = Math.max(...doorXs);

// 1. Foundation: solid from y 0 up to each cell's ground, plinth up to the body base.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < hi; y++) {
    put(x, y, z, "stone_bricks");
  }
}

// 2. Body: interior floor slabs, facade and roof per cell.
for (const [x, z] of cells) {
  const ss = sides(x, z);

  if (ss.length === 0) {
    // Interior: floor slabs only (air gap behind glass, no interiors)
    put(x, hi, z, "smooth_stone");
    put(x, hi + sh, z, "light_gray_concrete");
    put(x, deckY, z, "light_gray_concrete");
    continue;
  }

  const corner = ss.length >= 2;
  const main = ss.find((sd) => sd.n[1] === -1) ?? ss[0];
  const s = main.pos;
  const out = main.n;
  const isFront = ss.some((sd) => sd.n[0] === 0 && sd.n[1] === -1);
  const isDoor = isFront && doorXs.has(x);
  const onCanopy = isFront && x >= doorMin - 2 && x <= doorMax + 2;
  const pillar = s % 3 === 0;

  for (let rel = 0; rel <= 2 * sh; rel++) {
    const y = hi + rel;

    if (corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (rel === sh) { put(x, y, z, "light_gray_concrete"); continue; }
    if (rel === 2 * sh) { put(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
    if (rel === 2 * sh - 1 || rel === sh - 1) { put(x, y, z, "white_concrete"); continue; }

    if (isDoor && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (isFront && rel === 3 && onCanopy) {
      put(x, y, z, "stone_brick_slab", { type: "bottom" });
      continue;
    }

    const inShop = rel >= 1 && rel <= sh - 2;
    const inUpper = rel >= sh + 1 && rel <= 2 * sh - 2;

    if (pillar || !(inShop || inUpper)) {
      put(x, y, z, "white_concrete");
      continue;
    }

    put(x, y, z, "glass");

    // Warm lights set back in the air gap behind some glass
    const bx = x - out[0], bz = z - out[1];
    if (inShop && rel === 2 && s % 6 === 4 && inside(bx, bz)) {
      put(bx, y, bz, "glowstone");
    }
    if (inUpper && rel === sh + 3 && s % 6 === 1 && inside(bx, bz)) {
      put(bx, y, bz, "shroomlight");
    }
  }
}

// 3. Roof equipment: a few plant units on the deck, kept off the edge.
for (const [x, z] of cells) {
  if (sides(x, z).length === 0 && x % 7 === 3 && z % 5 === 2) {
    put(x, deckY + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
