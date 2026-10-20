import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw549464502.cells.json`, "utf8"));

const W = 14, H = 38, D = 17;
const g = new Voxels([W, H, D]);

// Mid-rise commercial/residential block, five storeys of five blocks,
// white tiled concrete frame, pale stone base, glazed bays, parapet roof.
const ROOF = 25;   // roof slab level
const TOP = 26;    // parapet level on exterior cells
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => fp.has(key(x, z));
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(key(x, z), Math.min(Math.max(0, Math.round(gr)), 24));
}

// Which outward face a cell sits on (null = interior of the footprint)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Entrance: exterior south-face cell nearest the footprint's mean x
let entranceKey = null;
{
  const south = cells.filter(([x, z]) => faceOf(x, z) === "south");
  if (south.length) {
    const mean = cells.reduce((s, [x]) => s + x, 0) / cells.length;
    south.sort((a, b) => Math.abs(a[0] - mean) - Math.abs(b[0] - mean));
    entranceKey = key(south[0][0], south[0][1]);
  }
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z] of cells) {
  const k = key(x, z);
  const gr = groundOf.get(k);
  const f = faceOf(x, z);
  const ext = f !== null;
  const isEntrance = k === entranceKey;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body from ground to roof slab, plus parapet
  for (let y = gr; y <= ROOF; y++) {
    const s = Math.floor(y / 5);
    const yr = y % 5;

    if (y === ROOF) {
      put(x, y, z, "light_gray_concrete");          // roof slab, all cells
      continue;
    }
    if (y === gr && yr !== 0) {
      put(x, y, z, "stone_bricks");                  // base course
      continue;
    }
    if (yr === 0) {
      put(x, y, z, "light_gray_concrete");           // storey floor line
      continue;
    }

    if (!ext) {
      // Interior: air, with occasional warm lanterns on the floor
      if (yr === 1 && (x * 3 + z * 5) % 7 === 0) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    // Exterior facade
    const idx = (f === "north" || f === "south") ? x : z;
    const pier = idx % 3 === 0;

    if (s === 0) {
      // Shopfront ground storey
      if (isEntrance) {
        if (yr <= 3) continue;                       // open doorway
        put(x, y, z, "stone_bricks");                // lintel over entrance
        continue;
      }
      if (yr === 4) { put(x, y, z, "white_concrete"); continue; }
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", PANE);
      continue;
    }

    // Upper storeys: glazed bays between piers, spandrel below each floor line
    if (yr === 4) { put(x, y, z, "white_concrete"); continue; }
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", PANE);
  }

  // Parapet cap on exterior cells
  if (ext) put(x, TOP, z, "stone_bricks");
}

// Rooftop plant: a low equipment box in the middle of the roof
for (const [x, z] of cells) {
  if (faceOf(x, z) !== null) continue;
  if (x >= 4 && x <= 9 && z >= 5 && z <= 11) {
    const gr = groundOf.get(key(x, z));
    if (gr <= ROOF) {
      put(x, TOP, z, "light_gray_concrete");
      put(x, TOP + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/OSMw549464502.nbt`);
