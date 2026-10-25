import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499487";
const W = 28, H = 27, D = 71;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// raw footprint lookup
const raw = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(`${x},${z}`, { ground: gr, roof: rf });
}
const has = (x, z) => raw.has(`${x},${z}`);

// smoothed ground: 3x3 mean over footprint cells, rounded (removes lidar noise, keeps slope)
const fp = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const q = raw.get(`${x + dx},${z + dz}`);
    if (q) { s += q.ground; n++; }
  }
  fp.set(k, { ground: Math.round(s / n) });
}

// one flat roof level for the whole block: median of lidar roof heights
const roofs = [...raw.values()].map(c => c.roof).sort((a, b) => a - b);
const ROOF = Math.round(roofs[Math.floor(roofs.length / 2)]);

// outward face of a perimeter cell (null if interior)
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const hsh = (x, y, z) => Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 7;
const DOOR_X = new Set([13, 14]);

// rooftop units: a few deliberate 2x2 plant boxes, not scattered specks
const RTU = [[7, 20], [7, 21], [8, 20], [8, 21], [19, 44], [19, 45], [20, 44], [20, 45]];
const rtuSet = new Set(RTU.map(([x, z]) => `${x},${z}`));

for (const [k, cell] of fp) {
  const [x, z] = k.split(",").map(Number);
  const base = Math.max(0, cell.ground);
  const top = Math.min(H - 3, Math.max(ROOF, base + 5));
  const f = faceOf(x, z);
  const per = f !== null;
  let dx = 0, dz = 0;
  if (f === "S") dz = -1;
  if (f === "N") dz = 1;
  if (f === "W") dx = 1;
  if (f === "E") dx = -1;
  const u = (f === "N" || f === "S") ? x : z;

  // foundation to ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  for (let y = base; y < top; y++) {
    // flat roof slab
    if (y === top - 1) { g.set(x, y, z, per ? "stone_bricks" : "smooth_stone"); continue; }

    if (!per) {
      // interior floor slabs at storey lines
      if (y > base && (y - base) % 5 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // ---- perimeter walls ----
    if (y === base) { g.set(x, y, z, "stone_bricks"); continue; }      // plinth
    if (y === top - 2) { g.set(x, y, z, "stone_bricks"); continue; }  // cornice

    const k0 = y - base;
    const isGround = k0 < 5;

    if (isGround) {
      if (f === "S" && DOOR_X.has(x) && (k0 === 1 || k0 === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "south", half: k0 === 1 ? "lower" : "upper",
          hinge: x === 13 ? "left" : "right", open: "false", powered: "false",
        });
        continue;
      }
      if (k0 === 0 || k0 === 4) { g.set(x, y, z, "stone_bricks"); continue; }
    } else {
      const rel = k0 % 5;
      if (rel === 0 || rel === 4) { g.set(x, y, z, "stone_bricks"); continue; }
    }

    // window bays: calcite piers every 3 blocks, glass between
    if (u % 3 === 0) {
      g.set(x, y, z, "calcite");
    } else {
      g.set(x, y, z, "glass_pane");
      if (hsh(x, y, z) === 0 && has(x + dx, z + dz) && !(isGround && k0 === 0)) {
        g.set(x + dx, y, z + dz, "glowstone");
      }
    }
  }

  // continuous parapet on the roof edge
  if (per && top < H) g.set(x, top, z, "stone_bricks");

  // deliberate rooftop plant boxes on the roof
  if (!per && rtuSet.has(k) && top < H - 1) g.set(x, top, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
