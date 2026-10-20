import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540892902.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540892902.nbt";

// Two-storey low-rise commercial block: brick walls, white-concrete bands,
// glass shopfront at grade, blue-glass upper bays, parapet roof with plant.
const W = 31, H = 23, D = 17;
const ROOF = 11;          // roof/parapet top, about 11 blocks above lowest ground
const FLOOR1 = 5;         // first-floor slab / belt course
const CORNICE = 10;       // roof deck / cornice level
const GROUND_TOP = 4;     // top of ground-floor storey

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, gr)));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const doorX = Math.round((minX + maxX) / 2);

function missing(x, z) {
  return {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);
  const m = missing(x, z);
  const edge = m.N || m.S || m.W || m.E;
  const corner = (m.N || m.S) && (m.W || m.E);
  // along-wall index: x on north/south faces, z on east/west faces
  const along = (m.N || m.S) ? x : z;
  const pier = corner || along % 4 === 0;
  const isDoor = edge && m.N && x === doorX && z === minZ && gr <= GROUND_TOP - 1;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (edge) {
    for (let y = gr; y <= ROOF; y++) {
      if (y <= GROUND_TOP) {
        // ground floor: shopfront
        if (isDoor && y <= gr + 1) {
          g.set(x, y, z, "dark_oak_door", {
            ...DOOR,
            half: y === gr ? "lower" : "upper",
          });
        } else if (pier) {
          g.set(x, y, z, "stone_bricks");
        } else if (y === gr) {
          g.set(x, y, z, "stone_bricks");
        } else if (y === GROUND_TOP) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "glass");
        }
      } else if (y === FLOOR1) {
        g.set(x, y, z, "white_concrete");
      } else if (y < CORNICE) {
        // upper storey: brick piers, blue-glass bays with sill and lintel
        if (pier) {
          g.set(x, y, z, "bricks");
        } else if (y === 6) {
          g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        } else if (y === 7 || y === 8) {
          g.set(x, y, z, "light_blue_stained_glass");
        } else {
          g.set(x, y, z, "bricks");
        }
      } else if (y === CORNICE) {
        g.set(x, y, z, "white_concrete");
      } else if (y === ROOF) {
        g.set(x, y, z, "stone_brick_wall");
      }
    }

    // glowstone just inside a few upper-storey bays (single-face cells only)
    const faces = [m.N, m.S, m.W, m.E].filter(Boolean).length;
    if (faces === 1 && !pier && along % 12 === 5) {
      let ix = x, iz = z;
      if (m.N) iz = z + 1; else if (m.S) iz = z - 1;
      else if (m.W) ix = x + 1; else if (m.E) ix = x - 1;
      if (has(ix, iz)) g.set(ix, 7, iz, "glowstone");
    }
  } else {
    // interior: air gap, floor slabs only
    g.set(x, FLOOR1, z, "smooth_stone");
    g.set(x, CORNICE, z, "smooth_stone");

    // hanging lanterns from the first-floor slab in the shopfront hall
    if (gr <= GROUND_TOP - 1 && x % 5 === 2 && z % 5 === 2) {
      g.set(x, GROUND_TOP, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // rooftop plant boxes
    if (x % 6 === 3 && z % 5 === 2) {
      g.set(x, ROOF, z, "light_gray_concrete");
    }
  }
}

g.save(OUT);
