// Kingsbridge Apartments: a 1970s reinforced-concrete flats block, the Auckland type of its era. Painted white concrete
// walls with a light-grey floor line each storey, a basalt base course (the city's own stone), a grid of blue glass
// bays set in frames, a dark flat roof with a parapet, and a stepped massing from the lidar roof: an eight-storey
// tower at the south-west, six- and four-storey wings, and single-storey ends. No interiors: a 1-block facade shell,
// an air gap behind it, floor slabs per storey on the columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907631026.cells.json", "utf8"));

const W = 74, H = 52, L = 50;     // footprint box; 52 high clears the 40-block roof plus parapet and plant room
const DATUM = 8;                  // ground-floor slab, above the highest ground (7) so every floor shares one level
const STOREY = 4;                 // blocks per storey (about 3.3 m at 1.2 blocks per metre)
const key = (x, z) => `${x},${z}`;
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// cells: x, z, ground, lidar roof above y 0
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof });

// Smooth the lidar roof with the median of the 3x3 footprint around each cell, then snap it to the storey grid.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const c of cell.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) near.push(n.roof); }
  const snapped = DATUM + STOREY * Math.round((median(near) - DATUM) / STOREY);
  c.top = Math.min(40, Math.max(DATUM + STOREY, snapped));
}

// A facade cell is on the outside, or stands above a lower neighbour (a setback face).
for (const c of cell.values()) {
  c.facade = nb.some(([dx, dz]) => { const n = cell.get(key(c.x + dx, c.z + dz)); return !n || n.top < c.top; });
  // windows run along the face the cell is on: an x-facing face counts z, a z-facing face counts x
  const onZFace = !cell.has(key(c.x, c.z - 1)) || !cell.has(key(c.x, c.z + 1));
  c.bay = onZFace ? c.x : c.z;
}

const g = new Voxels([W, H, L]);
const isColumn = (c) => !c.facade && c.x % 4 === 0 && c.z % 4 === 0;

for (const c of cell.values()) {
  const { x, z, ground, top } = c;

  // foundation to the ground, then the base course (basalt on the outside, stone fill inside) up to the datum
  for (let y = 0; y < DATUM; y++) {
    const outside = c.facade && y >= ground;
    g.set(x, y, z, outside ? "polished_basalt" : "stone_bricks");
  }

  // each storey: a floor slab across the plan; on the facade, sill, glass bay with frames, and head
  for (let b = DATUM; b < top; b += STOREY) {
    g.set(x, b, z, "light_gray_concrete");
    if (c.facade) {
      const glass = c.bay % 3 !== 0;                               // every third bay is a frame pier
      g.set(x, b + 1, z, "white_concrete");                        // sill
      g.set(x, b + 2, z, glass ? "light_blue_stained_glass" : "light_gray_concrete");
      g.set(x, b + 3, z, "white_concrete");                        // head
    } else if (isColumn(c)) {
      for (let y = b + 1; y < b + STOREY; y++) g.set(x, y, z, "polished_andesite");
    }
  }

  // roof deck at the top, and on the facade a cornice with a parapet
  if (c.facade) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "white_concrete");
  } else {
    g.set(x, top, z, "stone");
  }
}

// Entrance: three bays on the south face (the +z edge), nearest the middle, a door pair on the ground storey.
const south = [...cell.values()].filter((c) => c.facade && !cell.has(key(c.x, c.z + 1)));
const midX = south.reduce((s, c) => s + c.x, 0) / south.length;
const hub = south.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));
for (const dx of [-1, 0, 1]) {
  const c = cell.get(key(hub.x + dx, hub.z));
  if (!c) continue;
  if (dx === 0) {
    g.set(c.x, DATUM + 1, c.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(c.x, DATUM + 2, c.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    g.set(c.x, DATUM + 1, c.z, "light_blue_stained_glass");       // lobby glazing either side of the door
    g.set(c.x, DATUM + 2, c.z, "light_blue_stained_glass");
  }
  g.set(c.x, DATUM + 3, c.z, "stone_bricks");                     // entrance head and canopy band
}

// Warm light: glowstone on the air-gap side of some glass bays, one storey in a few.
for (const c of cell.values()) {
  if (!c.facade) continue;
  for (let b = DATUM; b < c.top; b += STOREY) {
    const storey = (b - DATUM) / STOREY;
    if (c.bay % 3 === 0 || (c.bay + storey) % 5 !== 2) continue;
    const inward = nb.map(([dx, dz]) => cell.get(key(c.x + dx, c.z + dz))).find((n) => n && !n.facade && !isColumn(n));
    if (inward) g.set(inward.x, b + 2, inward.z, "glowstone");
  }
}

// Roof plant: a 3 x 3 lift and stair room on the flat top of the tower.
let plant = null;
for (const c of cell.values()) {
  if (plant || c.top !== 40 || c.facade) continue;
  const block = [];
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) block.push(cell.get(key(c.x + dx, c.z + dz)));
  if (block.every((n) => n && n.top === 40 && !n.facade)) plant = c;
}
if (plant) {
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    const x = plant.x + dx, z = plant.z + dz;
    g.set(x, 41, z, "stone_bricks"); g.set(x, 42, z, "stone_bricks");
    g.set(x, 43, z, "light_gray_concrete");
  }
  for (const [x, z] of [[plant.x + 1, plant.z + 1]]) g.set(x, 44, z, "stone_bricks");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907631026.nbt");
console.log("Kingsbridge Apartments", out);
