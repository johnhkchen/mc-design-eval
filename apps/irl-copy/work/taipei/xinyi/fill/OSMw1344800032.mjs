import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344800032";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground levels
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Materials: 1980s low-rise commercial block, white tiled quartz walls,
// stone base, dark timber shopfront fascia, warm interior light behind glass.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "smooth_quartz";
const BAND = "polished_andesite";
const FRAME = "smooth_quartz";
const CEIL = "light_gray_concrete";
const ROOF = "light_gray_concrete";
const CORNICE = "smooth_quartz";
const FASCIA = "dark_oak_planks";

function panes(exposedAlongZ) {
  // Glass pane connection props: a pane on a z-facing wall runs east-west, and vice versa.
  return exposedAlongZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Pass 1: foundations, floor slab, walls, storey line, parapet, ceiling
for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  // Ground floor slab / base course
  g.set(x, gr, z, BASE);

  const n = !has(x, z - 1); // north face (street frontage, z = 0 side)
  const s = !has(x, z + 1);
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const perim = n || s || w || e;
  const count = [n, s, w, e].filter(Boolean).length;

  for (let y = gr + 1; y <= 5; y++) {
    if (!perim) {
      // Interior: air gap, with a ceiling slab at y 5 carried by the ring walls
      if (y === 5) g.set(x, y, z, CEIL);
      continue;
    }
    if (y === 5) {
      g.set(x, y, z, CORNICE); // parapet course
      continue;
    }
    if (y === 4) {
      g.set(x, y, z, BAND); // storey line
      continue;
    }
    if (count > 1) {
      g.set(x, y, z, WALL); // corner piers
      continue;
    }
    if (n) {
      // Street frontage: shopfront with entrance
      if (x === 1 && y <= gr + 2) {
        // Entrance door is handled in pass 2 (keeps the opening clear)
        continue;
      }
      if (y <= gr + 2) {
        g.set(x, y, z, "glass_pane", panes(false));
      } else {
        g.set(x, y, z, FASCIA);
      }
      continue;
    }
    // Side and rear faces: alternating glass bays and quartz mullions, quartz lintel
    if (y === 3) {
      g.set(x, y, z, FRAME);
    } else if ((s || n) && z % 2 === 0) {
      g.set(x, y, z, "glass_pane", panes(false));
    } else if ((w || e) && z % 2 === 0) {
      g.set(x, y, z, "glass_pane", panes(true));
    } else {
      g.set(x, y, z, FRAME);
    }
  }

  // Roof slab over the whole footprint: cornice ring, tar-grey deck inside
  const roofY = 6;
  g.set(x, roofY, z, perim ? CORNICE : ROOF);
}

// Pass 2: entrance door on the street frontage (z = 0, x = 1)
if (has(1, 0) && ground.get("1,0") === 0) {
  g.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(1, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Small canopy-style fascia over the door is the storey line above; keep the lantern as a warm marker
  g.set(1, 3, 0, FASCIA);
}

// Pass 3: warm light behind some windows (interior air cells next to the glass)
if (has(1, 3)) g.set(1, 2, 3, "shroomlight");
if (has(2, 6)) g.set(2, 2, 6, "shroomlight");
if (has(2, 1)) g.set(2, 2, 1, "shroomlight");

// Pass 4: roof plant on the flat deck, standing on the roof slab
if (has(1, 4)) g.set(1, 7, 4, "iron_block");
if (has(2, 4)) g.set(2, 7, 4, "iron_block");
if (has(1, 7)) g.set(1, 7, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
