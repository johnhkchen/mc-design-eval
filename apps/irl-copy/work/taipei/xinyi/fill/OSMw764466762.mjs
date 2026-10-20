import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466762";
const CELLS = `${DIR}/${ID}.cells.json`;
const OUT = `${DIR}/${ID}.nbt`;

// Record: 81 x 18 footprint, roof ~26 above lowest ground, ~5 storeys of 5 blocks.
// Read as a 1990s-2000s Xinyi commercial/office block: white concrete frame with
// tinted glass bays, a shopfront storey with a central entrance and canopy,
// a cornice parapet, and a roof plant room.
const W = 81, H = 38, D = 18;
const ROOF_DECK = 25;   // roof slab course
const CORNICE = 26;     // parapet / cornice course
const PLANT_TOP = 29;   // plant room walls top
const PLANT_ROOF = 30;  // plant room roof

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const [x, z, gr] of raw) {
  cells.set(key(x, z), Math.min(Math.max(Math.round(gr), 0), 20));
}
const has = (x, z) => cells.has(key(x, z));
const groundOf = (x, z) => cells.get(key(x, z));
const isPerim = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Facade: which outward face a perimeter cell belongs to, its bay index, and
// the inward neighbour direction (for glowstone behind glass).
function facadeOf(x, z) {
  if (!has(x, z - 1)) return { axis: "x", bay: x, dx: 0, dz: 1 };  // z=0 face, outward -z
  if (!has(x, z + 1)) return { axis: "x", bay: x, dx: 0, dz: -1 }; // z=max face
  if (!has(x - 1, z)) return { axis: "z", bay: z, dx: 1, dz: 0 };  // west end
  if (!has(x + 1, z)) return { axis: "z", bay: z, dx: -1, dz: 0 }; // east end
  return null;
}

const vox = new Voxels([W, H, D]);

function pane(x, y, z, color, axis) {
  const props = axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
  vox.set(x, y, z, `${color}_stained_glass_pane`, props);
}

// 1. Columns: foundation below ground, floors, facades, roof deck.
for (const [k, gr] of cells) {
  const [x, z] = k.split(",").map(Number);

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const face = perim ? facadeOf(x, z) : null;

  if (!perim || !face) {
    // Interior / roofed-over cells: floor slabs per storey, roof deck, air between.
    for (let y = gr; y <= ROOF_DECK; y++) {
      if (y === gr || y % 5 === 0) {
        vox.set(x, y, z, y === ROOF_DECK ? "gray_concrete" : "white_concrete");
      }
    }
    if (perim) {
      // Perimeter with no facade (should not occur); close it off with a parapet.
      vox.set(x, CORNICE, z, "white_concrete");
    }
    continue;
  }

  // Perimeter facade column.
  for (let y = gr; y <= CORNICE; y++) {
    if (y === CORNICE) {
      vox.set(x, y, z, "white_concrete"); // cornice / parapet cap
      continue;
    }
    if (y === gr || y % 5 === 0) {
      vox.set(x, y, z, "white_concrete"); // floor band / spandrel line
      continue;
    }
    // Window band within a storey.
    if (face.bay % 3 === 0) {
      vox.set(x, y, z, "light_gray_concrete"); // mullion pier
    } else {
      const color = y < 5 ? "light_blue" : "cyan";
      pane(x, y, z, color, face.axis);
    }
    // Warm light behind some glass, in the room just inside the facade.
    if (face.bay % 6 === 2 && y % 5 === 2) {
      const ix = x + face.dx, iz = z + face.dz;
      if (has(ix, iz) && !isPerim(ix, iz)) {
        vox.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof deck of a perimeter cell is the white band at ROOF_DECK (set above).
}

// 2. Main entrance on the z=0 face, centred, with a canopy above.
const EX = 40;
if (has(EX, 0)) {
  const gr = groundOf(EX, 0);
  if (gr + 2 < 25) {
    vox.set(EX, gr + 1, 0, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    vox.set(EX, gr + 2, 0, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Doorway glass either side of the door, shopfront style.
    for (const dx of [-1, 1]) {
      if (has(EX + dx, 0)) {
        vox.set(EX + dx, gr + 1, 0, "light_blue_stained_glass_pane", {
          east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
        });
        vox.set(EX + dx, gr + 2, 0, "light_blue_stained_glass_pane", {
          east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
        });
      }
    }
    // Canopy over the entrance.
    for (let x = EX - 3; x <= EX + 3; x++) {
      for (let z = 0; z <= 1; z++) {
        if (has(x, z)) vox.set(x, gr + 3, z, "light_gray_concrete");
      }
    }
  }
}

// 3. Roof plant room, centred on the roof, with a lightning rod on top.
const PX0 = 30, PX1 = 50, PZ0 = 4, PZ1 = 13;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = CORNICE; y <= PLANT_TOP; y++) {
      if (edge) {
        // Louvred panels on the walls, plain concrete corners.
        const louvre = (y === 27 || y === 28) && (x + z) % 2 === 0;
        vox.set(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
      }
    }
    vox.set(x, PLANT_ROOF, z, "gray_concrete");
  }
}
if (has(40, 9)) {
  vox.set(40, PLANT_ROOF + 1, 9, "lightning_rod");
}

vox.save(OUT);
