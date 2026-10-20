// Taipei Xinyi, OSMw1016280233: a 1990s-style four-storey office block with a
// stone-faced plinth, white concrete bands and piers, blue-tinted glazing, a
// glazed shopfront with a recessed entrance, warm glowstone behind some
// windows, a parapet, and a small rooftop plant room with a louvred mast.
// Roof slab at y=20, parapet to y=21, mast tip at y=32 (H=33).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280233";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (clamped so the body stays above it)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(19, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const OFFS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const missing = (x, z) =>
  Object.keys(OFFS).filter((k) => !has(x + OFFS[k][0], z + OFFS[k][1]));

const ROOF_Y = 20;     // roof slab / cornice level
const PARAPET_Y = 21;  // parapet cap
const FLOORS = [5, 10, 15];

// 1. Foundations, floors, walls, roof and parapet for every footprint cell
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const miss = missing(x, z);
  const perim = miss.length > 0;
  const face = miss[0];
  const u = face === "n" || face === "s" ? x : z;

  // Foundation fill from y=0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground surface / base course
  g.set(x, gr, z, perim ? "stone_bricks" : "light_gray_concrete");

  // Interior floor slabs above ground
  for (const fy of FLOORS) {
    if (fy > gr) g.set(x, fy, z, "light_gray_concrete");
  }

  // Roof slab over the whole footprint
  g.set(x, ROOF_Y, z, perim ? "white_concrete" : "light_gray_concrete");

  if (!perim) continue;

  // Parapet cap
  g.set(x, PARAPET_Y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Facade walls between the base course and the cornice
  for (let y = gr + 1; y < ROOF_Y; y++) {
    // Recessed entrance on the north face, one door column at x=9
    if (face === "n" && x === 9 && gr + 2 <= 4 && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let block;
    if (y < 5) {
      // Ground-floor shopfront band
      if (y === 4) {
        block = "white_concrete";
      } else {
        block = u % 3 === 0 ? "polished_andesite" : "glass";
      }
    } else {
      // Upper storeys: floor lines, window zones, piers
      const yr = y % 5;
      if (yr === 0 || yr === 4) {
        block = "white_concrete";
      } else if (u % 3 === 0) {
        block = "white_concrete";
      } else {
        block = "light_blue_stained_glass";
        // Warm light behind some windows on alternate storeys
        if (yr === 2 && Math.floor(y / 5) % 2 === 1 && u % 6 === 1) {
          const [ix, iz] = INWARD[face];
          const cx = x + ix, cz = z + iz;
          if (has(cx, cz)) g.set(cx, y, cz, "glowstone");
        }
      }
    }
    g.set(x, y, z, block);
  }
}

// 2. Rooftop plant room with louvres, and a mast on top
const boxX = [6, 13], boxZ = [5, 10];
let boxOk = true;
for (let x = boxX[0]; x <= boxX[1]; x++)
  for (let z = boxZ[0]; z <= boxZ[1]; z++)
    if (!has(x, z)) boxOk = false;

if (boxOk) {
  for (let x = boxX[0]; x <= boxX[1]; x++) {
    for (let z = boxZ[0]; z <= boxZ[1]; z++) {
      const edge = x === boxX[0] || x === boxX[1] || z === boxZ[0] || z === boxZ[1];
      if (edge) {
        for (let y = 21; y <= 24; y++) {
          const louvre = (y === 22 || y === 23) && (x + z) % 2 === 0;
          g.set(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
        }
      }
      // Roof of the plant room
      g.set(x, 25, z, "light_gray_concrete");
    }
  }

  // Mast on the plant room, from y=26 to a lightning rod at y=32
  for (let y = 26; y <= 31; y++) g.set(9, y, 7, "iron_bars");
  g.set(9, 32, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
