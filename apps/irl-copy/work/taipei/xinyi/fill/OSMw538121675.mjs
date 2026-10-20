import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121675";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Footprint extents for facade indexing
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = (minX + maxX) / 2;

// Pass 1: foundations (solid from y 0 up to each cell's ground)
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");
}

// Pass 2: walls, floors, roof, facade articulation
const perimeterInfo = new Map(); // key -> {ex, pier, k, face}
const doorCandidates = [];
const windowCells = [];

for (const [x, z, gc] of cells) {
  const ex = exposed(x, z);
  const key = `${x},${z}`;

  if (ex.length > 0) {
    const face = ex[0];
    const alongX = face === "north" || face === "south";
    const k = (alongX ? x - minX : z - minZ);
    const corner = ex.length >= 2;
    const pier = corner || k % 3 === 0;
    perimeterInfo.set(key, { ex, pier, k, face: corner ? null : face });

    // Facade column from its ground to the parapet
    for (let y = gc; y <= 11; y++) {
      let b;
      if (y === gc) b = "polished_andesite";                       // plinth
      else if (y <= 4) {
        if (pier) b = "light_gray_concrete";
        else if (y === 4) b = "dark_oak_planks";                   // shopfront lintel
        else b = "light_blue_stained_glass";                       // shop glass
      } else if (y === 5) b = "stone_bricks";                      // storey line
      else if (y <= 9) {
        if (pier) b = "light_gray_concrete";
        else if (y === 6 || y === 9) b = "quartz_block";           // sill / head
        else b = "light_blue_stained_glass";                       // upper glass
      } else if (y === 10) b = "smooth_stone";                     // cornice
      else b = "white_concrete";                                   // parapet
      put(x, y, z, b);
    }

    if (!pier && face && gc <= 2) {
      if (face === "south") doorCandidates.push({ x, z, gc, k });
    }
    if (!pier && face) windowCells.push({ x, z, gc, face, k });
  } else {
    // Interior: floor slab at ground, storey slab at y 5, roof deck at y 10
    for (let y = gc; y <= 10; y++) {
      if (y === gc) put(x, y, z, "stone_bricks");
      else if (y === 5 || y === 10) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Entrance door on the south face, near the middle, on the ground floor
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
  const d = doorCandidates[0];
  put(d.x, d.gc + 1, d.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, d.gc + 2, d.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Small lantern-style warm light beside the door, inside the shop
  const ix = d.x, iz = d.z - 1;
  if (has(ix, iz) && !perimeterInfo.has(`${ix},${iz}`)) put(ix, d.gc + 3, iz, "glowstone");
}

// Warm light behind some windows (inside the interior air gap)
for (const w of windowCells) {
  if (w.k % 6 !== 1) continue;
  const [dx, dz] = DIRS[w.face];
  const ix = w.x - dx, iz = w.z - dz;
  if (!has(ix, iz) || perimeterInfo.has(`${ix},${iz}`)) continue;
  const iy = w.gc <= 2 ? w.gc + 2 : 7;
  if (iy <= 9) put(ix, iy, iz, "glowstone");
  if (iy !== 7 && w.gc + 2 <= 9) put(ix, 7, iz, "shroomlight");
}

// Roof equipment: a rooftop unit and a lightning rod mast on interior roof cells
const interiorCells = cells
  .filter(([x, z]) => !perimeterInfo.has(`${x},${z}`))
  .map(([x, z, gc]) => ({ x, z, gc }));

if (interiorCells.length) {
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  const dist = (c, ox, oz) => Math.hypot(c.x - ox, c.z - oz);
  const sorted = [...interiorCells].sort((a, b) => dist(a, cx, cz) - dist(b, cx, cz));
  const unit = sorted[0];
  put(unit.x, 11, unit.z, "iron_block");
  put(unit.x + 1, 11, unit.z, "iron_block");

  const far = sorted.find((c) => dist(c, unit.x, unit.z) >= 4) || sorted[sorted.length - 1];
  if (far) {
    for (let y = 11; y <= 13; y++) {
      put(far.x, y, far.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
