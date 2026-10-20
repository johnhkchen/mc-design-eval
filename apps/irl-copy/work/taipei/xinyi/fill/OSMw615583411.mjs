import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw615583411";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Two storeys of ~5 blocks plus a parapet course: roof sits 11 blocks above the lowest ground.
// Reads as a late-1980s/1990s Taipei commercial block: white tiled walls, grey stone base,
// aluminium-framed glass bands, shopfront on the ground floor, parapet and rooftop plant.
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const L = Math.min(...cells.map((c) => c[2]));
const S1 = L + 5;   // first floor line
const S2 = L + 10;  // parapet / roof deck block

const has = (x, z) => cellMap.has(key(x, z));
const missing = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has(x + dx, z + dz));

// Wall block for a boundary cell at height y (null = air / not a wall).
function wallKind(x, z, y) {
  const gr = cellMap.get(key(x, z));
  if (gr === undefined) return null;
  if (y < gr || y > S2) return null;
  const miss = missing(x, z);
  if (miss.length === 0) return null; // interior: handled by floors
  const corner = miss.length >= 2;

  if (y === gr) return "stone_bricks";                 // base course
  if (y === S2) return corner ? "smooth_quartz" : "white_terracotta"; // parapet
  if (y === S1) return "smooth_quartz";                // storey line / cornice

  if (corner || (x + z) % 3 === 0) return "white_terracotta"; // piers

  if (y < S1) {
    if (y === gr + 1) return "smooth_stone";           // shopfront sill
    if (y === S1 - 1) return "smooth_quartz";          // fascia
    return "glass_pane";
  }
  if (y === S1 + 1) return "smooth_quartz";            // upper sill
  if (y === S2 - 1) return "smooth_quartz";            // head
  if (y === S1 + 3 && (x + z) % 9 === 4) return "shroomlight"; // lit office window
  return "glass_pane";
}

// Pane connection: connect to any wall block along the same row.
const paneConn = (x, z, y, dx, dz) => (wallKind(x + dx, z + dz, y) !== null ? "true" : "false");

// 1. Foundations, floors, storey slabs and walls
for (const [x, z, gr] of cells) {
  // foundation fill up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const miss = missing(x, z);
  const boundary = miss.length > 0;

  if (boundary) {
    for (let y = gr; y <= S2; y++) {
      const id = wallKind(x, z, y);
      if (!id) continue;
      if (id === "glass_pane") {
        g.set(x, y, z, "glass_pane", {
          north: paneConn(x, z, y, 0, -1),
          south: paneConn(x, z, y, 0, 1),
          east: paneConn(x, z, y, 1, 0),
          west: paneConn(x, z, y, -1, 0),
          waterlogged: "false",
        });
      } else {
        g.set(x, y, z, id);
      }
    }
  } else {
    // interior: ground floor slab, storey floor slab, roof deck
    g.set(x, gr, z, "smooth_stone");
    if (gr <= S1) g.set(x, S1, z, "smooth_stone");
    if (gr <= S2) g.set(x, S2, z, "light_gray_concrete");
  }
}

// 2. Entrance on the north face, near the middle of its run
{
  const northCells = cells
    .filter(([x, z]) => !has(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  if (northCells.length) {
    const [ex, ez, egr] = northCells[Math.floor(northCells.length / 2)];
    if (egr + 2 <= S1 - 1) {
      g.set(ex, egr + 1, ez, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(ex, egr + 2, ez, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
  }
}

// 3. Rooftop plant: a small grey plant room on the roof deck, interior cells only
for (let x = 7; x <= 9; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!has(x, z) || missing(x, z).length) continue;
    for (let y = S2 + 1; y <= S2 + 2 && y < H; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}
// roof parapet vents at the plant-room corners
for (const [x, z] of [[7, 6], [9, 8]]) {
  if (has(x, z) && !missing(x, z).length && S2 + 3 < H) {
    g.set(x, S2 + 3, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
