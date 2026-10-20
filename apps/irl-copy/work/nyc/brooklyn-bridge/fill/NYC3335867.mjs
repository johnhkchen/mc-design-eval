import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3335867.cells.json`, "utf8"));

// 30 Main Street, DUMBO, 1908: red-brick loft/warehouse with stone string courses,
// a shopfront ground storey with a central entrance on the street face, and tall window grids above.
const W = 29, H = 49, D = 22;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { g: gr, roof });
const has = (x, z) => map.has(key(x, z));

const G = Math.min(...cells.map((c) => c[2])); // common storey grid (lowest ground)

// Face analysis: one missing neighbour = single exterior face; two or more = corner.
function faceOf(x, z) {
  const miss = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const list = Object.keys(miss).filter((k) => miss[k]);
  const cnt = list.length;
  if (cnt !== 1) return { cnt, single: false };
  const f = list[0];
  const u = f === "N" || f === "S" ? x : z;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[f];
  return { cnt, single: true, f, u, inward };
}

// Street face = north (missing z-1) single-face cells; entrance at the median column.
const streetU = cells
  .filter(([x, z]) => {
    const fi = faceOf(x, z);
    return fi.single && fi.f === "N";
  })
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorU = streetU.length ? streetU[Math.floor(streetU.length / 2)] : -1;

// Lidar roof smoothing: 3x3 average, then quantise to storeys.
const roofAvg = (x, z) => {
  let s = 0, c = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const m = map.get(key(x + dx, z + dz));
      if (m) { s += m.roof; c++; }
    }
  return s / c;
};

const maxN = Math.floor((H - 4 - G) / 3);
const lights = [];

for (const [x, z, gr] of cells) {
  const avg = roofAvg(x, z);
  let n = Math.max(1, Math.round((avg - 1 - G) / 3), Math.ceil((gr - G) / 3));
  n = Math.min(n, maxN);
  const top = G + 3 * n;           // roof cap layer
  const fi = faceOf(x, z);
  const perim = fi.cnt > 0;
  const corner = fi.cnt >= 2;
  // Vertical quoins at corners alternate stone and brick for relief.
  const quoinBlock = (y) => ((y - G) % 2 === 0 ? "stone_bricks" : "bricks");

  for (let y = 0; y <= top; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }          // foundation
    if (y === top) { put(x, y, z, perim ? "smooth_stone" : "gray_concrete"); continue; }
    const r = (y - G) % 3;
    if (r === 0) { put(x, y, z, perim ? "stone_bricks" : "smooth_stone"); continue; } // floor / string course
    if (!perim) continue;                                               // hollow interior air
    const k = Math.floor((y - G) / 3);

    if (corner) { put(x, y, z, quoinBlock(y)); continue; }             // corner quoins

    if (fi.single && k === 0 && fi.f === "N") {                         // street storey
      const isDoor = fi.u === doorU;
      const isPier = fi.u % 3 === 0;
      if (isDoor) {
        const props = { facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "oak_door", props);
      } else if (isPier || Math.abs(fi.u - doorU) === 1) {
        put(x, y, z, "stone_bricks");                                   // piers and door surround
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    if (fi.single && fi.u % 3 === 1) {                                  // upper window bays
      put(x, y, z, "glass");
      if (r === 1 && ((x * 31 + z * 17 + k * 7) % 5 === 0)) {
        const nx = x + fi.inward[0], nz = z + fi.inward[1];
        if (has(nx, nz) && faceOf(nx, nz).cnt === 0) lights.push([nx, y, nz]);
      }
    } else {
      put(x, y, z, "bricks");                                           // brick piers
    }
  }

  // Parapet on the exterior edge.
  if (perim) put(x, top + 1, z, "bricks");

  // Small rooftop water tanks on some interior roof cells.
  if (!perim && x % 6 === 2 && z % 6 === 2 && top + 4 < H) {
    put(x, top + 1, z, "oak_planks");
    put(x, top + 2, z, "oak_planks");
    put(x, top + 3, z, "oak_slab", { type: "top", waterlogged: "false" });
  }
}

// Warm light behind some glass (inside the hollow interior).
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

g.save(`${DIR}/NYC3335867.nbt`);
