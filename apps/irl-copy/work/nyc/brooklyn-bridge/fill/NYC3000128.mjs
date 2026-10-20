import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3000128.cells.json`, "utf8"));

const W = 5, H = 24, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const parsed = cells.map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

// Smooth lidar noise: one flat roof tier for the whole building (median of cell roofs)
const roofs = parsed.map(p => p[3]).sort((a, b) => a - b);
const ROOF = roofs[Math.floor(roofs.length / 2)];

const cellMap = new Map();
for (const [x, z, gr] of parsed) cellMap.set(key(x, z), { x, z, gr, roof: ROOF });
const has = (x, z) => cellMap.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const { x, z } of cellMap.values()) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Outward faces of a cell (missing neighbours). north = -z, south = +z, west = -x, east = +x.
function faces(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push({ name: "west", dx: -1, dz: 0 });
  if (!has(x + 1, z)) out.push({ name: "east", dx: 1, dz: 0 });
  if (!has(x, z - 1)) out.push({ name: "north", dx: 0, dz: -1 });
  if (!has(x, z + 1)) out.push({ name: "south", dx: 0, dz: 1 });
  return out;
}

const PANE = { north: "true", east: "true", south: "true", west: "true", waterlogged: "false" };

// Bay index along the face; odd bays are windows, even bays are brick piers (corners land on even).
function bayIndex(x, z, face) {
  return face.dx !== 0 ? z - minZ : x - minX;
}
function isWindowBay(x, z, face) {
  return bayIndex(x, z, face) % 2 === 1;
}

// Street-front entrance: middle bay of the east (long) facade
const midZ = minZ + Math.floor((maxZ - minZ) / 2);
let doorKey = null;
for (const c of cellMap.values()) {
  const fs = faces(c.x, c.z);
  if (fs.some(f => f.name === "east") && c.z === midZ) { doorKey = key(c.x, c.z); break; }
}
if (!doorKey) {
  for (const c of cellMap.values()) {
    const fs = faces(c.x, c.z);
    if (fs.length && isWindowBay(c.x, c.z, fs[0])) { doorKey = key(c.x, c.z); break; }
  }
}

// ---- build each cell --------------------------------------------------------
for (const { x, z, gr, roof } of cellMap.values()) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const perimeter = fs.length > 0;

  // Storey belts every 2 blocks above the 3-block ground storey; window row sits above each belt.
  // Top window row must stay below the cornice (roof-1).
  const belts = new Set();
  const windowRows = new Set();
  for (let f = gr + 3; f + 1 <= roof - 2; f += 2) {
    belts.add(f);
    windowRows.add(f + 1);
  }

  if (perimeter) {
    const face = fs[0];
    const pier = !isWindowBay(x, z, face) || fs.length > 1; // corners are piers
    const isDoor = doorKey === key(x, z);
    for (let y = gr; y < roof; y++) {
      // Cornice cap on top
      if (y === roof - 1) { g.set(x, y, z, "smooth_stone"); continue; }
      // Plinth course
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
      // Ground-floor storefront with entrance
      if (y === gr + 1 || y === gr + 2) {
        if (isDoor && face.name === "east") {
          g.set(x, y, z, "oak_door", {
            facing: face.name,
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (pier) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "glass_pane", PANE);
        continue;
      }
      // Storey belt courses
      if (belts.has(y)) { g.set(x, y, z, "smooth_stone"); continue; }
      // Upper windows with occasional warm light
      if (windowRows.has(y) && !pier) {
        g.set(x, y, z, "glass_pane", PANE);
        const storey = Math.floor((y - gr - 3) / 2);
        if ((x + z + storey) % 3 === 0) {
          const ix = x - face.dx, iz = z - face.dz;
          if (has(ix, iz) && faces(ix, iz).length === 0) g.set(ix, y, iz, "glowstone");
        }
        continue;
      }
      // Solid brick wall
      g.set(x, y, z, "bricks");
    }
  } else {
    // Interior cell: wood floor per storey, air between floors, tar-coloured roof surface
    g.set(x, gr, z, "stone_bricks");
    for (const f of belts) g.set(x, f, z, "oak_planks");
    g.set(x, roof - 1, z, "stone");
  }
}

// Roof stair bulkhead on an interior cell near the middle
const bulkCell = [...cellMap.values()].find(c =>
  faces(c.x, c.z).length === 0 && c.x === minX + 2 && c.z === minZ + 5
) || [...cellMap.values()].find(c => faces(c.x, c.z).length === 0);
if (bulkCell && ROOF + 1 < H) {
  g.set(bulkCell.x, ROOF, bulkCell.z, "bricks");
  g.set(bulkCell.x, ROOF + 1, bulkCell.z, "bricks");
}

g.save(`${DIR}/NYC3000128.nbt`);
