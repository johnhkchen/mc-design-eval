import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c.1980s: two storeys of white tiled concrete over
// stone-clad plinth, lit shopfronts on the ground floor, a warm-lit window grid above,
// a smooth-quartz cornice, parapet, and a small rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408114";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 29;
const ROOF = 11;          // parapet top, absolute y (11 blocks above lowest ground)
const DECK = 10;          // roof deck / cornice level
const FLOOR2 = 5;         // storey line between floors
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), Math.round(gr));
const has = (x, z) => gmap.has(key(x, z));

// Neighbour directions: name, dx, dz
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

// Missing-neighbour facade side for a cell (first missing in N,S,W,E order)
function facadeOf(x, z) {
  for (const [name, dx, dz] of DIRS) if (!has(x + dx, z + dz)) return name;
  return null;
}
const isRing = (x, z) => facadeOf(x, z) !== null;

// Index along the facade so pillars and windows repeat evenly
function alongIndex(x, z, side) {
  return side === "north" || side === "south" ? x : z;
}

// Entrance: prefer south facade (max z), at the median x of its ring cells
const southRing = cells
  .filter(([x, z]) => isRing(x, z) && !has(x, z + 1))
  .map(([x, z]) => [x, z]);
let entrance = null;
if (southRing.length) {
  const xs = southRing.map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  entrance = southRing.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best
  );
} else {
  const r = cells.find(([x, z]) => isRing(x, z));
  if (r) entrance = [r[0], r[1]];
}
const entranceIdx = entrance ? alongIndex(entrance[0], entrance[1], "south") : null;
const isEntranceFacadeCell = (x, z) =>
  entrance && !has(x, z + 1) && Math.abs(alongIndex(x, z, "south") - entranceIdx) <= 1;

// Rooftop plant box: 3x3 of interior cells near centre
let cx = 0, cz = 0, n = 0;
for (const [x, z] of cells) { cx += x; cz += z; n++; }
cx = Math.round(cx / n); cz = Math.round(cz / n);
const plant = new Set();
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (has(x, z) && !isRing(x, z)) plant.add(key(x, z));
  }

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = gmap.get(key(x, z));
  const ring = isRing(x, z);
  const side = facadeOf(x, z);

  // Foundation from y 0 up to ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (!ring) {
    // Interior: floor slab, storey slab, roof deck; air between (no interiors)
    g.set(x, ground, z, "smooth_stone");
    if (FLOOR2 > ground) g.set(x, FLOOR2, z, "smooth_stone");
    if (DECK > ground) g.set(x, DECK, z, "light_gray_concrete");
    if (plant.has(key(x, z))) {
      g.set(x, DECK + 1, z, "light_gray_concrete");
      g.set(x, DECK + 2, z, "light_gray_concrete");
      if (x === cx && z === cz) g.set(x, DECK + 3, z, "iron_block");
      else g.set(x, DECK + 2, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
    continue;
  }

  // Ring (facade) cell: walls from ground up to parapet
  const alongIdx = alongIndex(x, z, side);
  const pillar = alongIdx % 3 === 0;
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[side];
  const ix = x + inward[0], iz = z + inward[1];
  const inwardInterior = has(ix, iz) && !isRing(ix, iz);

  for (let y = ground; y <= ROOF; y++) {
    if (y === ground) {
      g.set(x, y, z, "stone_bricks");                       // base course
    } else if (y === ROOF) {
      g.set(x, y, z, "white_concrete");                     // parapet
    } else if (y === DECK) {
      g.set(x, y, z, "smooth_quartz");                      // cornice
    } else if (y === FLOOR2) {
      g.set(x, y, z, "smooth_quartz");                      // storey line
    } else if (y < FLOOR2) {
      // Ground-floor shopfront band
      if (isEntranceFacadeCell(x, z) && y === ground + 1 && entrance && x === entrance[0] && z === entrance[1]) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isEntranceFacadeCell(x, z) && y === ground + 2 && entrance && x === entrance[0] && z === entrance[1]) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isEntranceFacadeCell(x, z) && y === ground + 3 && ground + 3 < FLOOR2) {
        g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });   // canopy
      } else if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      if (inwardInterior && y === ground + 2 && !pillar && hash(x, y, z) % 3 === 0 &&
          !(entrance && x === entrance[0] && z === entrance[1])) {
        g.set(ix, y, iz, "glowstone");
      }
    } else {
      // Upper storey: spandrels at 6 and 9, glazing rows 7-8, mullions per 3 cells
      if (y === 6 || y === 9) {
        g.set(x, y, z, "white_concrete");
      } else if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
      }
      if (inwardInterior && y === 7 && !pillar && hash(x, y, z) % 4 === 0) {
        g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
