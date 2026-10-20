import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s-90s Taipei commercial office block: five storeys, white tiled
// concrete piers, tinted glass bands, granite base, smooth-quartz storey lines,
// a parapet cornice and a central mechanical penthouse.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw644315124.cells.json", "utf8"));

const H = 38;
const ROOF_Y = 25;        // roof deck; parapet at 26
const g = new Voxels([10, H, 16]);

const ground = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals of a cell (empty list means interior).
function normals(x, z) {
  const n = [];
  if (!has(x, z - 1)) n.push([0, -1]);
  if (!has(x, z + 1)) n.push([0, 1]);
  if (!has(x - 1, z)) n.push([-1, 0]);
  if (!has(x + 1, z)) n.push([1, 0]);
  return n;
}
const facingName = ([dx, dz]) =>
  dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east";

const DOOR = "oak_door";
const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const SLAB = "light_gray_concrete";
const QUARTZ = "smooth_quartz";
const BASE = "polished_granite";
const FOUND = "stone_bricks";

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
}

// 2. Body, facades, storey lines, roof.
for (const [x, z, gr] of cells) {
  if (gr > ROOF_Y - 1) continue;
  const ns = normals(x, z);
  const perim = ns.length > 0;
  const corner = ns.length > 1;

  // Interior: air, with floor slabs at storey lines and the roof deck.
  if (!perim) {
    for (let k = 1; k <= 4; k++) {
      const b = gr + 5 * k;
      if (b <= 24) g.set(x, b, z, SLAB);
    }
    g.set(x, ROOF_Y, z, SLAB);
    continue;
  }

  // Roof edge cornice and parapet.
  g.set(x, ROOF_Y, z, QUARTZ);
  g.set(x, ROOF_Y + 1, z, PIER);

  // Facade: one normal per cell except corners (use the first, pillars override).
  const nrm = ns[0];
  const alongMin = nrm[0] !== 0 ? zmin : xmin;
  const along = nrm[0] !== 0 ? z : x;
  const i = along - alongMin;
  const isPier = corner || i % 2 === 0;

  for (let k = 0; k <= 4; k++) {
    const b = gr + 5 * k;
    if (b > 24) break;

    // Base course or storey line.
    g.set(x, b, z, k === 0 ? BASE : QUARTZ);

    for (let r = 1; r <= 3; r++) {
      const y = b + r;
      if (y > 24) break;
      if (isPier) {
        g.set(x, y, z, PIER);
      } else {
        g.set(x, y, z, GLASS);
      }
    }
    // Spandrel row below next storey line.
    if (b + 4 <= 24) g.set(x, b + 4, z, PIER);
    // Warm light behind selected windows (inside the air gap).
    if (!isPier && (i + k) % 3 === 0) {
      const ix = x - nrm[0], iz = z - nrm[1];
      if (has(ix, iz) && normals(ix, iz).length === 0 && b + 2 <= 24) {
        g.set(ix, b + 2, iz, "glowstone");
      }
    }
  }
}

// 3. Entrance on the north (street) face: double doors, shopfront glazing.
for (const x of [4, 5]) {
  const gr = ground.get(`${x},${zmin}`);
  if (gr === undefined) continue;
  const hinge = x === 4 ? "left" : "right";
  const props = (half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
  g.set(x, gr + 1, zmin, DOOR, props("lower"));
  g.set(x, gr + 2, zmin, DOOR, props("upper"));
  g.set(x, gr + 3, zmin, PIER);
}
// Shopfront glazing to either side of the entrance on the ground storey.
for (const x of [1, 2, 3, 6, 7, 8]) {
  const gr = ground.get(`${x},${zmin}`);
  if (gr === undefined) continue;
  for (let r = 1; r <= 3; r++) g.set(x, gr + r, zmin, r === 3 ? PIER : GLASS);
}

// 4. Mechanical penthouse on the roof deck, set back from the parapet.
for (let x = 3; x <= 6; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const edge = x === 3 || x === 6 || z === 5 || z === 10;
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
      g.set(x, y, z, edge ? "smooth_stone" : "air");
    }
    g.set(x, ROOF_Y + 4, z, SLAB);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw644315124.nbt");
