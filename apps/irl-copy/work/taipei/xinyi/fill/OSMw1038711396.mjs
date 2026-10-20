import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711396";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 15;
const ROOF = 11;        // roof slab top sits at y=11 (about 11 blocks above lowest ground)
const SLAB_Y = 5;       // storey line between ground floor and upper floor
const SHOP_TOP = 4;     // ground floor shopfront occupies y = ground..4
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(key(x, z), Math.max(0, Math.min(gr, ROOF - 1)));
const has = (x, z) => cellG.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street frontage = smallest z; entrance sits on the frontage cell nearest the middle.
const minZ = Math.min(...cells.map(([, z]) => z));
const frontCells = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = frontCells.length
  ? frontCells.reduce((best, x) => (Math.abs(x - 5) < Math.abs(best - 5) ? x : best))
  : -1;
const DOOR = { x: doorX, z: minZ };

const DOOR_FACING = "north";

for (const [x, z] of cells) {
  const gr = cellG.get(key(x, z));
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: no interior fit-out, just the storey floor slab and open air.
    if (gr <= SLAB_Y) g.set(x, SLAB_Y, z, "smooth_stone");
  } else {
    // Exterior shell from ground up to the roof line.
    for (let y = gr; y < ROOF; y++) {
      let b;
      if (y === gr) {
        b = "stone_bricks";                                  // base course
      } else if (y <= SHOP_TOP) {
        b = x % 2 === 0 ? "white_concrete" : "glass_pane";   // shopfront mullions
      } else if (y === SLAB_Y) {
        b = "smooth_stone";                                  // storey line
      } else if (y === 6 || y === 9) {
        b = "white_concrete";                                // spandrels
      } else if (y === 10) {
        b = "stone_bricks";                                  // cornice course
      } else {
        // Upper storey windows, 7 and 8, in an alternating grid.
        b = (x + z) % 2 === 1 ? "glass_pane" : "white_concrete";
      }
      g.set(x, y, z, b);
    }

    // Warm light behind a few upper-floor glass panes on the frontage.
    if (z === minZ && x % 3 === 1 && gr <= 7) {
      g.set(x, 7, z, "shroomlight");
    }

    // Parapet on the roof edge.
    g.set(x, ROOF + 1, z, "stone_brick_wall");
  }

  // Roof slab over every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  // Roof equipment: small plant/AC boxes on interior roof cells.
  if (!edge && (x % 4 === 1) && (z % 4 === 1)) {
    g.set(x, ROOF + 1, z, "smooth_stone");
    g.set(x, ROOF + 2, z, "smooth_stone");
  }
}

// Entrance door on the frontage, two blocks high, with a glowstone light above the lintel.
if (DOOR.x >= 0 && has(DOOR.x, DOOR.z)) {
  const gr = cellG.get(key(DOOR.x, DOOR.z));
  g.set(DOOR.x, gr, DOOR.z, "oak_door", {
    facing: DOOR_FACING, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  if (gr + 1 <= SHOP_TOP) {
    g.set(DOOR.x, gr + 1, DOOR.z, "oak_door", {
      facing: DOOR_FACING, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  if (gr + 2 <= SHOP_TOP) {
    g.set(DOOR.x, gr + 2, DOOR.z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
