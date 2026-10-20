import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1089608";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 17, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { g: ground, r: lidar roof }
const map = new Map();
for (const [x, z, gr, r] of cells) map.set(`${x},${z}`, { g: gr, r });
const has = (x, z) => map.has(`${x},${z}`);

// Flat two-storey massing: roof follows the lidar record, but never lower
// than 8 blocks above the highest ground, so each cell keeps its shopfront,
// lintel band, upper storey and cornice. Clamped inside the 17-block box.
const maxG = Math.max(...cells.map(c => c[2]));
const maxR = Math.max(...cells.map(c => c[3]));
const top = Math.min(15, Math.max(Math.round(maxR), maxG + 8));

// Exterior sides of a footprint cell
function sidesOf(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push({ dx: 0, dz: -1, facing: "north" });
  if (!has(x, z + 1)) s.push({ dx: 0, dz: 1, facing: "south" });
  if (!has(x - 1, z)) s.push({ dx: -1, dz: 0, facing: "west" });
  if (!has(x + 1, z)) s.push({ dx: 1, dz: 0, facing: "east" });
  return s;
}
const isPerim = (x, z) => sidesOf(x, z).length > 0;

const DOOR_PROPS = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  const sides = sidesOf(x, z);
  const perim = sides.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Roof deck across the whole footprint
  g.set(x, top, z, "stone");

  if (!perim) {
    // Interior: ground floor slab and upper-storey ceiling slab, air between
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 3, z, "smooth_stone");
    continue;
  }

  // Perimeter shell: brick, one block thick
  for (let y = gr; y < top; y++) g.set(x, y, z, "bricks");

  const cornerCell = sides.length > 1;

  // Pilasters at corners, full height above the shopfront
  if (cornerCell) {
    for (let y = gr + 4; y <= top - 1; y++) g.set(x, y, z, "stone_bricks");
  }

  for (const s of sides) {
    const u = s.dz !== 0 ? x : z;                 // position along the face
    const center = s.dz !== 0 ? Math.floor(W / 2) : Math.floor(D / 2);
    const isStreetDoor = s.facing === "north" && u === center;

    // Ground storey: kick plate, glass shopfront, street door
    g.set(x, gr, z, "polished_andesite");
    if (!cornerCell) {
      if (isStreetDoor) {
        g.set(x, gr + 1, z, "oak_door", DOOR_PROPS(s.facing, "lower"));
        g.set(x, gr + 2, z, "oak_door", DOOR_PROPS(s.facing, "upper"));
      } else {
        g.set(x, gr + 1, z, "glass");
        g.set(x, gr + 2, z, "glass");
      }
    } else {
      g.set(x, gr + 1, z, "stone_bricks");
      g.set(x, gr + 2, z, "stone_bricks");
    }

    // Storey line above the shopfront
    g.set(x, gr + 3, z, "stone_bricks");

    // Upper storey: sill row, window rows, lintel row
    if (!cornerCell) {
      const sill = gr + 4;
      const lintel = top - 2;
      g.set(x, sill, z, "smooth_stone");
      g.set(x, lintel, z, "smooth_stone");
      const isWinCol = u % 2 === 1;
      for (let y = sill + 1; y <= lintel - 1; y++) {
        if (isWinCol) {
          g.set(x, y, z, "glass");
          if ((u + y) % 4 === 0) {
            const ix = x - s.dx, iz = z - s.dz;
            if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "shroomlight");
          }
        } else {
          g.set(x, y, z, "bricks");
        }
      }
    }
  }

  // Cornice band and flat stone coping (low parapet, not merlons)
  g.set(x, top - 1, z, "smooth_stone");
  g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop bulkhead on two interior roof cells
for (const [bx, bz] of [[2, 2], [3, 2]]) {
  if (has(bx, bz) && !isPerim(bx, bz)) g.set(bx, top + 1, bz, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
