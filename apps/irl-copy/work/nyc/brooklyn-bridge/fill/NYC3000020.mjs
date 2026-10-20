import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000020";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 22, D = 12;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, st) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// footprint lookup
const fp = new Map();
for (const [x, z, gr, roof] of cells) {
  fp.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => fp.has(`${x},${z}`);
const isEdge = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const outwardOf = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x, z + 1)) out.push([0, 1]);
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x + 1, z)) out.push([1, 0]);
  return out;
};

// one flat roof level for the whole block (median lidar roof), never below any ground + 3
const roofs = [...fp.values()].map((v) => v.roof).sort((a, b) => a - b);
const grounds = [...fp.values()].map((v) => v.gr);
const maxC = Math.max(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(H - 3, Math.max(medRoof, maxC + 3));

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SLAB_TOP = { type: "top", waterlogged: "false" };

const frontCells = [];

for (const [x, z, grRaw] of cells) {
  const c = Math.max(0, Math.min(maxC, Math.round(grRaw)));

  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < c; y++) put(x, y, z, "stone_bricks");

  // storeys of 2 blocks, all stopping under one common roof level T
  const nst = Math.max(1, Math.floor((T - c) / 2));
  const edge = isEdge(x, z);

  if (!edge) {
    // interior: solid core from ground to roof, with air only in the window rows
    // (the space behind glass); floor slabs at every storey line
    for (let y = c; y <= T; y++) {
      const rel = y - c;
      const windowRow = rel % 2 === 1 && rel < 2 * nst;
      if (!windowRow) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  // facade shell: brick from ground to cornice
  for (let y = c; y <= T; y++) put(x, y, z, "bricks");

  // base course and storey string courses
  put(x, c, z, "stone_bricks");
  for (let k = 1; k <= nst; k++) put(x, c + 2 * k, z, "stone_bricks");
  // cornice and parapet cap, flat across the whole block
  put(x, T, z, "stone_bricks");
  put(x, T + 1, z, "stone_brick_slab", SLAB_TOP);

  const faces = outwardOf(x, z);
  if (faces.length === 0) continue;
  const [dx, dz] = faces[0];
  const idx = dz !== 0 ? x : z;
  const inwardX = x - dx, inwardZ = z - dz;
  const inwardInterior = has(inwardX, inwardZ) && !isEdge(inwardX, inwardZ);

  if (dz === 1) frontCells.push({ x, z, c });

  // window grid: stone piers every third block, glass between
  for (let k = 0; k < nst; k++) {
    const y = c + 2 * k + 1;
    if (idx % 3 === 0) {
      put(x, y, z, "stone_bricks"); // pier
      continue;
    }
    put(x, y, z, "glass_pane", GLASS);
    // warm light in the air gap behind some panes
    if (inwardInterior && (x * 7 + z * 3 + k) % 4 === 0) {
      put(inwardX, y, inwardZ, "shroomlight");
    }
  }
}

// entrance on the street-facing (max z) front, centred along x
if (frontCells.length) {
  frontCells.sort((a, b) => a.x - b.x);
  const door = frontCells[Math.floor(frontCells.length / 2)];
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(door.x, door.c, door.z, "dark_oak_door", { ...base, half: "lower" });
  put(door.x, door.c + 1, door.z, "dark_oak_door", { ...base, half: "upper" });
}

g.save(`${DIR}/${ID}.nbt`);
