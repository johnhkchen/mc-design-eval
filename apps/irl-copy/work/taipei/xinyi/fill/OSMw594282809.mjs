import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw594282809";
const W = 69, H = 43, D = 14;
const ROOF_Y = 30;      // roof slab top course
const PARAPET_Y = 31;   // parapet course on the exterior ring

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => {
  if (Array.isArray(c)) return { x: c[0], z: c[1], g: c[2] };
  return { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 };
}).map((c) => ({ x: c.x, z: c.z, g: Math.max(0, Math.min(H - 8, Math.round(c.g))) }));

const S = new Map();
for (const c of cells) S.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => S.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front (z-min) and back (z-max) facade extents for door placement
const frontU = cells.filter((c) => !has(c.x, c.z - 1)).map((c) => c.x);
const minU = Math.min(...cells.map((c) => c.x));
const maxU = Math.max(...cells.map((c) => c.x));
const isPier = (u) => u % 3 === 0;

const doorU = new Set();
for (const target of [minU + 4, maxU - 4]) {
  const cands = frontU
    .filter((u) => !isPier(u))
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
  if (cands.length) doorU.add(cands[0]);
}

// Facade block for an exterior face at relative height yRel within a storey
function wallBlock(u, yRel, k, face, z, x) {
  if (yRel === 4) return k === 0 ? ["smooth_quartz"] : ["light_gray_concrete"];
  if (k === 0) {
    if (face === "n" && yRel <= 2 && doorU.has(u) && !isPier(u)) {
      return ["dark_oak_door", {
        facing: "north", half: yRel === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      }];
    }
    if (isPier(u)) return ["smooth_quartz"];
    return ["light_blue_stained_glass"];
  }
  if (isPier(u)) return ["smooth_quartz"];
  return ["light_blue_stained_glass"];
}

// Foundations, floors, walls, roof
for (const { x, z, g: gr } of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // exterior faces: which side is open to the outside
  const faces = [];
  if (!has(x, z - 1)) faces.push("n");
  if (!has(x, z + 1)) faces.push("s");
  if (!has(x - 1, z)) faces.push("w");
  if (!has(x + 1, z)) faces.push("e");
  const ext = faces.length > 0;
  const face = faces[0];

  // storeys: floor slab at L, windows L+1..L+3, spandrel L+4
  let k = 0;
  for (let L = gr; L + 4 <= ROOF_Y - 1; L += 5, k++) {
    put(x, L, z, k === 0 ? "smooth_stone" : "light_gray_concrete");
    if (!ext) continue;
    const u = face === "n" || face === "s" ? x : z;
    for (let yRel = 1; yRel <= 4; yRel++) {
      const [id, props] = wallBlock(u, yRel, k, face, z, x);
      put(x, L + yRel, z, id, props);
    }
    // warm light behind glass on the inner side
    const inner = face === "n" ? [x, z + 1] : face === "s" ? [x, z - 1]
      : face === "w" ? [x + 1, z] : [x - 1, z];
    if (has(inner[0], inner[1]) && !isPier(u) && (u + k) % 4 === 1) {
      put(inner[0], L + 2, inner[1], k === 0 ? "glowstone" : "shroomlight");
    }
  }

  // roof slab and parapet
  put(x, ROOF_Y, z, "smooth_stone");
  if (ext) put(x, PARAPET_Y, z, "smooth_quartz");
}

// Roof equipment: mechanical penthouses on interior roof, and a mast
for (const { x, z } of cells) {
  if (x % 12 !== 4) continue;
  const block = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 5; dz <= 7; dz++) block.push([x + dx, dz]);
  if (!block.every(([bx, bz]) => has(bx, bz))) continue;
  if (block.some(([bx, bz]) => !has(bx, bz - 1) || !has(bx, bz + 1) || !has(bx - 1, bz) || !has(bx + 1, bz))) continue;
  for (const [bx, bz] of block) {
    for (let y = PARAPET_Y; y <= PARAPET_Y + 2; y++) put(bx, y, bz, "light_gray_concrete");
  }
}

const mx = Math.floor(W / 2);
if (has(mx, 7)) {
  for (let y = PARAPET_Y; y <= PARAPET_Y + 5; y++) put(mx, y, 7, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
