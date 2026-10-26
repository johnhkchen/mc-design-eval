import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1908 Florida Ave NW: a red-brick walk-up with sandstone string courses, a 3-storey front, a 2-storey rear,
// and a 4-storey tower at the lidar's high cluster. Storeys are 2 blocks (a sill-and-window row, then a string
// course), so windows stand 1 block tall; the string courses are the floor slabs.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74131.cells.json`, "utf8"));

const W = 28, H = 21, D = 29;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });
const has = (x, z) => cell.has(key(x, z));

// ---- massing: the lidar roof, median-smoothed over the 3x3 footprint around each cell (clean flat tiers) ----
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) vals.push(cell.get(key(x + dx, z + dz)).roof);
  vals.sort((a, b) => a - b);
  c.top = vals[Math.floor(vals.length / 2)];
}

// ---- palette ----
const FOUND = "stone_bricks", BRICK = "bricks", STONE = "smooth_sandstone", ROOF = "stone";
const GLASS = "light_blue_stained_glass_pane", DOOR = "dark_oak_door";
const DIRS = [[0, -1, "n"], [0, 1, "s"], [1, 0, "e"], [-1, 0, "w"]];

// the entrance: the street (north) face, centred on its longest run
const DOOR_X = 15, DOOR_Z = 0;

// the exposed faces of a wall cell at height y: a neighbour missing, or lower than this row
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => {
  const n = cell.get(key(x + dx, z + dz));
  return !n || n.top < y;
});
const isExteriorFace = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// slab rows (floors) run across every cell, interior too: the string courses at 3, 5, 7...
const isSlabRow = (y, top) => y >= 3 && y % 2 === 1 && y < top;

// ---- pass 1: the shell ----
const paneAxis = new Map();   // "x,y,z" -> "ns" (pane in an east-west wall) or "ew" (pane in a north-south wall)
for (const [k, { top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  // foundation and roof deck run under and over every cell
  g.set(x, 0, z, FOUND);
  for (let y = 1; y < top; y++) {
    if (isSlabRow(y, top)) { g.set(x, y, z, STONE); continue; }
    const exp = exposed(x, y, z);
    if (exp.length === 0) continue;                       // interior air: behind the glass, between floors
    const isDoor = x === DOOR_X && z === DOOR_Z && (y === 1 || y === 2);
    if (isDoor) {
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, DOOR, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 1) { g.set(x, y, z, STONE); continue; }    // the base course on the street
    if (exp.length >= 2) { g.set(x, y, z, BRICK); continue; }   // corner pier
    const [ox, oz] = exp[0];                             // the outward face
    const onNS = oz !== 0;                               // exposed to the north or south: an east-west wall
    const u = onNS ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, BRICK); continue; }  // pier between bays
    g.set(x, y, z, GLASS);
    paneAxis.set(`${x},${y},${z}`, { onNS, ox, oz });
  }
  g.set(x, top, z, ROOF);                                 // the flat roof deck
}

// ---- pass 2: parapets on the outside edge, and a warm light in some windows ----
for (const [k, { top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!isExteriorFace(x, z)) continue;
  g.set(x, top + 1, z, BRICK);
  g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [k, { ox, oz }] of paneAxis) {
  const [x, y, z] = k.split(",").map(Number);
  if ((x + y) % 4 !== 0) continue;                        // a few lit bays, not all
  // the room side of the glass: one cell inward from the exposed face, if that cell is open
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz) || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// ---- pass 3: pane connections (a pane joins its neighbours in the same wall and any solid block) ----
const connects = (x, y, z) => {
  const b = g.get(x, y, z);
  return !!b && !b.block.includes("door");
};
for (const [k, { onNS }] of paneAxis) {
  const [x, y, z] = k.split(",").map(Number);
  const b = g.get(x, y, z);
  if (!b || b.block !== GLASS) continue;
  if (onNS) {
    g.set(x, y, z, GLASS, { east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), north: "false", south: "false", waterlogged: "false" });
  } else {
    g.set(x, y, z, GLASS, { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" });
  }
}

// ---- roof equipment: a brick chimney on the tower, a plant box on the front roof ----
const interiorTop = (x, z, t) => [-1, 0, 1].every(dx => [-1, 0, 1].every(dz => has(x + dx, z + dz) && cell.get(key(x + dx, z + dz)).top >= t));
const tall = [...cell].filter(([, c]) => c.top === 9).map(([k]) => k.split(",").map(Number));
const tower = tall.find(([x, z]) => interiorTop(x, z, 9));
if (tower) {
  const [x, z] = tower;
  for (let y = 10; y <= 12; y++) g.set(x, y, z, BRICK);
  g.set(x, 13, z, "brick_slab", { type: "bottom", waterlogged: "false" });
}
const front = [...cell].filter(([, c]) => c.top === 7).map(([k]) => k.split(",").map(Number));
const plant = front.find(([x, z]) => interiorTop(x, z, 7));
if (plant) {
  const [x, z] = plant;
  g.set(x, 8, z, "iron_block");
  g.set(x + 1, 8, z, "smooth_stone");
}

g.save(`${DIR}/DC74131.nbt`);
