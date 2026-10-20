import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001594.cells.json`, "utf8"));

const W = 6, H = 21, D = 9;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> { gr: ground y }
const map = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr) });
  roofs.push(Math.round(rf));
}
// One smoothed flat roof for the whole building (lidar median), kept in range
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const minGround = Math.min(...[...map.values()].map((c) => c.gr));
const R = Math.min(H - 4, Math.max(medRoof, minGround + 8));

const has = (x, z) => map.has(`${x},${z}`);
const get = (x, z) => map.get(`${x},${z}`);

// Outward directions: N = min z (street side), S = max z, W = min x, E = max x
const DIRS = {
  N: { dx: 0, dz: -1, pane: { north: "true", south: "true", east: "false", west: "false" } },
  S: { dx: 0, dz: 1, pane: { north: "true", south: "true", east: "false", west: "false" } },
  W: { dx: -1, dz: 0, pane: { north: "false", south: "false", east: "true", west: "true" } },
  E: { dx: 1, dz: 0, pane: { north: "false", south: "false", east: "true", west: "true" } },
};

const BRICK = "bricks";
const TRIM = "smooth_sandstone";
const BASE = "stone_bricks";
const FLOOR = "oak_planks";
const ROOF = "stone_bricks";
const SURROUND = "stone_bricks";

// Entrance cell on the street face
const DOOR_X = 2, DOOR_Z = 0;

for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);

  const ext = Object.keys(DIRS).filter((f) => !has(x + DIRS[f].dx, z + DIRS[f].dz));
  const isExt = ext.length > 0;
  const corner = ext.length >= 2;

  // Foundation from y=0 to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  // Flat roof slab at the smoothed level
  g.set(x, R, z, ROOF);

  // Interior: floor slabs only, air elsewhere
  if (!isExt) {
    for (let y = gr; y <= R - 2; y += 2) g.set(x, y, z, FLOOR);
    continue;
  }

  // Exterior walls from ground to cornice row
  for (let y = gr; y <= R - 1; y++) {
    if (y === R - 1) g.set(x, y, z, TRIM);            // cornice
    else if (y === gr) g.set(x, y, z, BASE);          // base course
    else if ((y - gr) % 2 === 0) g.set(x, y, z, y === gr + 2 ? BRICK : TRIM); // storey lines
    else g.set(x, y, z, BRICK);
  }

  if (corner) continue;

  const face = ext[0];
  const { dx, dz, pane } = DIRS[face];
  const isFront = face === "N";
  const isDoorCell = isFront && x === DOOR_X && z === DOOR_Z;
  const isDoorSurround = isFront && z === DOOR_Z && Math.abs(x - DOOR_X) === 1;

  // Windows: one per storey, sitting on each storey line
  for (let k = 0; gr + 2 * k + 1 <= R - 2; k++) {
    const wy = gr + 2 * k + 1;

    // Entrance: door cell and its flanking surround cells at ground storey
    if (isDoorCell && k === 0) continue;
    if (isDoorSurround && k === 0) {
      g.set(x, wy, z, SURROUND);
      g.set(x, gr, z, SURROUND);
      continue;
    }

    g.set(x, wy, z, "glass_pane", { ...pane, waterlogged: "false" });

    // Sparse warm light behind glass, in the interior cell
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && (x + 2 * z + k) % 5 === 0 && k >= 1) {
      g.set(ix, wy, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Entrance: dark oak door framed by stone surround and sandstone lintel
  if (isDoorCell) {
    g.set(x, gr, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, TRIM);
  }
}

// Brick chimney on the flat roof at an interior cell
if (has(4, 1)) {
  g.set(4, R + 1, 1, BRICK);
  g.set(4, R + 2, 1, BRICK);
  g.set(4, R + 3, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001594.nbt`);
