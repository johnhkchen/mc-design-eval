import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001360.cells.json`, "utf8"));

const W = 7, H = 28, D = 22;
const g = new Voxels([W, H, D]);

// Build a lookup of footprint cells: ground per cell, plus the lidar roof heights.
const cellMap = new Map();
const roofs = [];
for (const c of cells) {
  const [x, z, gr, roof] = c;
  const gi = Math.max(0, Math.round(gr));
  roofs.push(roof);
  cellMap.set(`${x},${z}`, { g0: gi, roof });
}

// Smooth the lidar noise into one flat roof tier for the whole block (median of the record).
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(H - 1, Math.max(8, Math.round(medRoof)));
for (const v of cellMap.values()) {
  v.top = TOP;
  v.g0 = Math.min(v.g0, TOP - 6);
}

const has = (x, z) => cellMap.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const FOUNDATION = "granite";
const BASE = "polished_granite";
const BRICK = "bricks";
const SILL = "stone_bricks";
const CORNICE = "stone_bricks";
const PIER = "stone_bricks";
const FLOOR = "oak_planks";
const ROOF_DECK = "smooth_stone";
const GLASS_UP = "glass_pane";
const GLASS_SHOP = "glass";
const LIGHT = "glowstone";

function isInteriorlessEdge(x, z) {
  return Object.values(DIRS).every(([dx, dz]) => has(x + dx, z + dz));
}

for (const [key, { g0, top }] of cellMap) {
  const [x, z] = key.split(",").map(Number);

  // Foundation up to each cell's own ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, FOUNDATION);

  // Exterior faces = sides with no neighbour in footprint
  const faces = Object.keys(DIRS).filter(d => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });
  const isExt = faces.length > 0;

  // Storey floor lines every 3 blocks above the 4-block shopfront band
  const floors = [];
  for (let f = g0 + 4; f <= top - 4; f += 3) floors.push(f);

  if (!isExt) {
    // Interior cell: floor slabs only, air between them (air behind glass)
    g.set(x, g0, z, FLOOR);
    for (const f of floors) g.set(x, f, z, FLOOR);
    g.set(x, top - 1, z, ROOF_DECK);
    continue;
  }

  // Exterior cell: solid brick shell from ground to cornice
  for (let y = g0; y <= top - 2; y++) g.set(x, y, z, BRICK);
  g.set(x, g0, z, BASE);
  g.set(x, top - 1, z, CORNICE);
  for (const f of floors) g.set(x, f, z, SILL);

  // Primary facade face and its along-face coordinate
  const face = faces[0];
  const [odx, odz] = DIRS[face];
  const u = (face === "E" || face === "W") ? z : x;
  const winOK = (uu) => uu % 3 !== 0;

  // Ground floor shopfront: glass bays between stone piers
  for (let y = g0 + 1; y <= g0 + 3; y++) {
    if (winOK(u)) g.set(x, y, z, GLASS_SHOP);
    else g.set(x, y, z, PIER);
  }

  // Entrance on the south-facing front at the centre of the block
  if (face === "S" && x === 3) {
    g.set(x, g0 + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, g0 + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, g0 + 3, z, "lantern", { hanging: "true" });
  }

  // Upper windows: glass panes between brick piers, stone sills and lintels
  const inwardX = x - odx, inwardZ = z - odz;
  const inwardInside = has(inwardX, inwardZ) && !isInteriorlessEdge(inwardX, inwardZ);
  for (const f of floors) {
    if (f + 2 > top - 2) continue;
    for (let y = f + 1; y <= f + 2; y++) {
      if (winOK(u)) g.set(x, y, z, GLASS_UP);
      else g.set(x, y, z, BRICK);
    }
    // Warm light behind some glazed bays (inward neighbour is interior air)
    if (winOK(u) && inwardInside && (x + z + f + u) % 4 === 0) {
      g.set(inwardX, f + 1, inwardZ, LIGHT);
    }
  }
}

g.save(`${DIR}/NYC1001360.nbt`);
