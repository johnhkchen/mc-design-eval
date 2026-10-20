import { writeFileSync, readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block with a shopfront ground floor,
// white-concrete facades, quartz cornice, flat roof and a central plant room.
const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682877.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682877.nbt";

const cells = JSON.parse(readFileSync(IN, "utf8"));
const W = 18, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (clamped to a sane range).
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(x + "," + z, Math.max(0, Math.min(Math.round(gr), 10)));
  }
}
const inside = (x, z) => ground.has(x + "," + z);
const at = (x, z) => ground.get(x + "," + z);

// Perimeter: any side open to outside the footprint.
const isPerim = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
// Corner: open on one horizontal and one vertical side.
const isCorner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

// Front = south face (open at z+1). Door sits at the median x of that edge.
const frontXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inside(x, z + 1)) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);
const doorZ = D - 1;

const FLOOR2 = 5;   // slab between storeys
const ROOF = 10;    // roof deck slab
const PARAPET = 11; // top of parapet

// Pillars: corners and every third bay; otherwise glazing.
const isPillar = (x, z) => isCorner(x, z) || (x + z) % 3 === 0;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Ground-floor slab.
  g.set(x, gr, z, "smooth_stone");
  // Storey and roof slabs (only where they lie above ground).
  if (gr < FLOOR2) g.set(x, FLOOR2, z, "smooth_stone");
  if (gr < ROOF) g.set(x, ROOF, z, "light_gray_concrete");

  if (!isPerim(x, z)) {
    // Interior: air gap, with warm lights behind some glazing.
    if (gr < 7 && (x + z) % 4 === 0) g.set(x, 7, z, "shroomlight");
    if (gr < 2 && (2 * x + z) % 5 === 0) g.set(x, 2, z, "glowstone");
    continue;
  }

  // Perimeter facade, bottom-up.
  for (let y = gr + 1; y <= PARAPET; y++) {
    let id;
    if (y === PARAPET) id = "white_concrete";                 // parapet cap
    else if (y === ROOF) id = "smooth_quartz";                // cornice
    else if (y === 9) id = "light_gray_concrete";             // upper header
    else if (y === 8 || y === 7) id = isPillar(x, z) ? "white_concrete" : "glass_pane";
    else if (y === 6) id = "light_gray_concrete";             // upper sill
    else if (y === FLOOR2) id = "smooth_stone";               // storey line
    else if (y === 4) id = "light_gray_concrete";             // shopfront lintel
    else if (y === 3 || y === 2) id = isPillar(x, z) ? "white_concrete" : "glass_pane";
    else if (y === 1) id = "stone_bricks";                    // base course
    else id = "white_concrete";
    g.set(x, y, z, id);
  }

  // Shopfront entrance on the front face.
  if (z === doorZ && Math.abs(x - doorX) <= 0) {
    const doorY = Math.max(gr + 1, 1);
    if (doorY + 1 <= 3) {
      g.set(x, doorY, z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, doorY + 1, z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // Hanging lantern above the door, inside the shopfront band.
      if (doorY + 2 <= 3) {
        g.set(x, doorY + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Central plant room on the roof, standing on the roof deck slab.
for (let x = 5; x <= 12; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!inside(x, z)) continue;
    if (at(x, z) >= ROOF) continue;
    const edge = x === 5 || x === 12 || z === 4 || z === 10;
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, edge ? "light_gray_concrete" : "iron_bars");
  }
}

g.save(OUT);
