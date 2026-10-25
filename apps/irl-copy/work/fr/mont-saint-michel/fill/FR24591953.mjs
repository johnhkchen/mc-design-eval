import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR24591953";
const W = 46, H = 21, D = 86;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const c of cells) cmap.set(key(c[0], c[1]), { x: c[0], z: c[1], gr: Math.round(c[2]), roof: c[3] });
const inFp = (x, z) => cmap.has(key(x, z));

// raw placement (bounds-checked)
const raw = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
// placement limited to footprint columns (no stray blocks off the building)
const put = (x, y, z, id, p) => { if (inFp(x, z)) raw(x, y, z, id, p); };
const stairP = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const paneP = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- massing from lidar -------------------------------------------------
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = (minX + maxX) / 2;
const halfW = (maxX - minX + 1) / 2;
const cxi = Math.round(cx);

const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...cells.map((c) => Math.round(c[2])));
const ridgeTarget = Math.min(10, Math.max(8, Math.round(medRoof)));
const eaveY = Math.max(ridgeTarget - 5, maxGround + 3);
const rise = (x) => {
  const d = Math.min(x - minX, maxX - x);
  return 1 + Math.round((4 * (d + 0.5)) / halfW);
};
const topOf = (x) => eaveY + rise(x);
const outFacing = (x) => (x < cx ? "west" : "east");

const WALL = "white_terracotta";
const BASE = "stone_bricks";
const ROOF = "stone_bricks";
const ROOF_ST = "stone_brick_stairs";
const PILAR = "stone_bricks";

// ---- footprint pass: foundation, floor, walls, gables, roof -------------
for (const c of cmap.values()) {
  const { x, z, gr } = c;
  const T = topOf(x);
  const xE = !inFp(x - 1, z) || !inFp(x + 1, z);
  const zE = !inFp(x, z - 1) || !inFp(x, z + 1);
  const edge = xE || zE;
  const corner = xE && zE;

  for (let y = 0; y < gr; y++) raw(x, y, z, "stone_bricks");
  raw(x, gr, z, edge ? BASE : "smooth_stone");

  if (edge) {
    for (let y = gr + 1; y <= eaveY - 1; y++) {
      if (y === eaveY - 1) raw(x, y, z, BASE);
      else raw(x, y, z, corner ? PILAR : WALL);
    }
  }

  if (zE) {
    for (let y = eaveY; y <= T - 2; y++) raw(x, y, z, WALL);
  }

  const lo = edge ? eaveY : eaveY - 1;
  for (let y = lo; y <= T - 2; y++) {
    if (zE && y >= eaveY) continue;
    raw(x, y, z, ROOF);
  }
  raw(x, T - 1, z, ROOF_ST, stairP(outFacing(x)));
}

// ---- pilasters on the long walls (break the flat render) ----------------
for (const c of cmap.values()) {
  const { x, z, gr } = c;
  const xE = !inFp(x - 1, z) || !inFp(x + 1, z);
  const zE = !inFp(x, z - 1) || !inFp(x, z + 1);
  if (!xE || zE) continue;
  if (((z - minZ) % 8) === 0 && z > minZ + 1 && z < maxZ - 1) {
    for (let y = gr + 1; y <= eaveY - 2; y++) raw(x, y, z, PILAR);
  }
}

// ---- windows: framed glass bays, some with warm glowstone ---------------
for (const c of cmap.values()) {
  const { x, z, gr } = c;
  const xE = !inFp(x - 1, z) || !inFp(x + 1, z);
  const zE = !inFp(x, z - 1) || !inFp(x, z + 1);
  if (!xE || zE) continue;
  const rel = z - minZ;
  const m = rel % 8;
  if (m >= 2 && m <= 6 && z > minZ + 2 && z < maxZ - 3) {
    const lit = (rel % 16) === 4 && m === 4;
    for (let y = gr + 1; y <= eaveY - 2; y++) {
      if (lit) raw(x, y, z, "glowstone");
      else if (m === 2 || m === 6) raw(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else raw(x, y, z, "glass_pane", paneP);
    }
  }
}

// ---- cart doors on the south gable: framed, lighter leaves --------------
const dx0 = cxi - 4, dx1 = cxi + 3;
for (let x = dx0 - 1; x <= dx1 + 1; x++) {
  const grv = cmap.get(key(Math.min(Math.max(x, minX), maxX), maxZ))?.gr ?? 0;
  for (let y = grv; y <= eaveY - 2; y++) {
    if (x === dx0 - 1 || x === dx1 + 1) { put(x, y, maxZ, PILAR); continue; }
    const brace = (x - dx0) % 4 === 0 || (y - grv) === 1;
    put(x, y, maxZ, brace ? "stripped_spruce_log" : "spruce_planks");
  }
  put(x, eaveY - 1, maxZ, BASE);
}
// stone lintel course above the doors, one block proud of the leaves
for (let x = dx0 - 1; x <= dx1 + 1; x++) put(x, eaveY - 2, maxZ, PILAR);

// hayloft door on the north gable, above the eave, framed
for (let x = cxi - 1; x <= cxi + 1; x++) {
  for (let y = eaveY; y <= eaveY + 1; y++) {
    put(x, y, minZ, x === cxi ? "stripped_spruce_log" : "spruce_planks");
  }
}

// warm lanterns on the floor inside the cart bay, seen through the doors
const lg = cmap.get(key(cxi - 4, maxZ - 2))?.gr ?? 0;
put(cxi - 2, lg + 1, maxZ - 3, "lantern", { hanging: "false", waterlogged: "false" });
put(cxi + 1, lg + 1, maxZ - 3, "lantern", { hanging: "false", waterlogged: "false" });

// ridge peak: the two opposing roof stairs already form the crest
for (const x of [Math.floor(cx), Math.ceil(cx)]) {
  const T = topOf(x);
  put(x, T - 1, minZ, ROOF_ST, stairP(outFacing(x)));
}

g.save(`${DIR}/${ID}.nbt`);
