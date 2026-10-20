import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 70 Washington Street, DUMBO. 1911 red-brick loft/warehouse: stone base,
// stone piers, glass shopfronts at street level, 3-block storey bands,
// lidar massing smoothed into clean setback tiers.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3388734";
const W = 25, H = 55, D = 60;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(H - 4, Math.round(gr)));
  raw.set(k(x, z), { x, z, ground, roof: Math.round(roof) });
}
const has = (x, z) => raw.has(k(x, z));

// Smooth the lidar roof over a 5x5 neighbourhood (mean), then quantise to
// whole storeys above the cell's own ground, so setbacks read as clean tiers.
const col = new Map();
for (const { x, z, ground, roof } of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = raw.get(k(x + dx, z + dz));
    if (o) { sum += o.roof - o.ground; n++; }
  }
  const meanAbove = n ? sum / n : roof - ground;
  const blended = 0.5 * (roof - ground) + 0.5 * meanAbove;
  const tiers = Math.max(1, Math.round(blended / STOREY));
  const top = Math.min(H - 4, ground + STOREY * tiers);
  col.set(k(x, z), { ground, top: Math.max(ground + STOREY, top) });
}
const at = (x, z) => col.get(k(x, z));

const g = new Voxels([W, H, D]);

for (const [key, { ground, top }] of col) {
  const [x, z] = key.split(",").map(Number);

  const exX0 = !has(x - 1, z), exX1 = !has(x + 1, z);
  const exZ0 = !has(x, z - 1), exZ1 = !has(x, z + 1);
  const xFace = exX0 || exX1;
  const zFace = exZ0 || exZ1;
  const perim = xFace || zFace;
  const corner = xFace && zFace;

  // Foundation: stone base from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const r = y - ground;

    if (y === top - 1) {
      g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (r % STOREY === 0) {
      g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!perim) continue; // interior air gap

    // Corners and piers: light stone so the window bays read at distance.
    if (corner) { g.set(x, y, z, "smooth_stone"); continue; }
    const pier = xFace ? (z % 3 === 0) : (x % 3 === 0);
    if (pier) { g.set(x, y, z, "smooth_stone"); continue; }

    // Windows: ground floor is a shopfront, upper floors are glazed bays.
    g.set(x, y, z, "glass");

    // Warm light behind some panes, on the inside of the window.
    const lit = ((x * 31 + z * 17 + y * 7) % 6) === 0;
    if (lit) {
      let dx = 0, dz = 0;
      if (exX0) dx = 1; else if (exX1) dx = -1;
      else if (exZ0) dz = 1; else if (exZ1) dz = -1;
      const ix = x + dx, iz = z + dz;
      const c2 = at(ix, iz);
      if (c2 && y >= c2.ground && y < c2.top - 1 && (y - c2.ground) % STOREY !== 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Sparse rooftop stair/lift boxes on the roof slab.
  if (!perim && x % 12 === 6 && z % 14 === 7 && top + 2 < H) {
    g.set(x, top, z, "bricks");
    g.set(x, top + 1, z, "bricks");
    g.set(x, top + 2, z, "smooth_stone");
  }
}

// Entrance: centred on the street (z=0) face, on a cell that really faces out.
let doorX = null;
for (const { x, z } of raw.values()) {
  if (z !== 0 || !col.has(k(x, z))) continue;
  if (doorX === null || Math.abs(x - 12) < Math.abs(doorX - 12)) doorX = x;
}
if (doorX !== null) {
  const { ground } = at(doorX, 0);
  g.set(doorX, ground + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, ground + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern over the door, and a stone canopy course above the entrance.
  g.set(doorX, ground + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
