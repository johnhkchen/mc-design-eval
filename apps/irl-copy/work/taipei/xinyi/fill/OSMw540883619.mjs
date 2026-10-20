import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883619.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883619.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 9, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block: cream tiled walls, grey concrete
// piers, shopfront glass at street level, a row of upper windows, flat roof
// with a quartz parapet and rooftop plant.
const FLOOR_Y = 6;   // storey slab
const ROOF_Y = 11;   // roof deck
const TOP_Y = 12;    // parapet course

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

// Classify the perimeter and the facade it sits on
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const alongX = (x, z) => !has(x, z - 1) || !has(x, z + 1); // north/south face: index by x

// Pier if the facade index is a multiple of 4, or at a corner
const isPier = (x, z) => {
  if (isCorner(x, z)) return true;
  const u = alongX(x, z) ? x : z;
  return u % 4 === 0;
};

// Inward neighbour for placing a lit interior cell behind a window
const inward = (x, z) => {
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (has(x + dx, z + dz) && !isPerim(x + dx, z + dz)) return [x + dx, z + dz];
  }
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (has(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
};

// Entrance on the south face, middle bay
const DOOR = [4, 4];

for (const [x, z, gr] of cells) {
  const base = Math.max(0, Math.min(gr, 10));
  const perim = isPerim(x, z);
  const pier = perim && isPier(x, z);
  const isDoor = perim && x === DOOR[0] && z === DOOR[1];

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab
  g.set(x, base, z, "smooth_stone");

  // Ground storey: shopfront glass, piers, transom and lintel above
  for (let y = base + 1; y <= 5; y++) {
    if (!perim) continue; // interior air
    if (isDoor) {
      if (y === base + 1) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === base + 2) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y <= base + 3) {
        g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
      continue;
    }
    if (pier) {
      g.set(x, y, z, "gray_concrete");
    } else if (y <= base + 3) {
      g.set(x, y, z, "glass");
    } else {
      g.set(x, y, z, "smooth_quartz");
    }
  }

  // Storey slab / string course
  g.set(x, FLOOR_Y, z, perim ? "smooth_quartz" : "smooth_stone");

  // Upper storey: window grid
  for (let y = 7; y <= 9; y++) {
    if (!perim) continue;
    if (pier) {
      g.set(x, y, z, "gray_concrete");
    } else {
      g.set(x, y, z, "glass_pane");
      const u = alongX(x, z) ? x : z;
      if ((u + y) % 3 === 0) {
        const n = inward(x, z);
        if (n) g.set(n[0], y, n[1], "glowstone");
      }
    }
  }

  // Upper lintel band
  if (perim) g.set(x, 10, z, "smooth_quartz");

  // Roof deck, cornice on the edge
  g.set(x, ROOF_Y, z, perim ? "smooth_quartz" : "gray_concrete");

  // Parapet and rooftop plant
  if (perim) {
    g.set(x, TOP_Y, z, "smooth_quartz");
  } else if (x % 4 === 2 && z === 2) {
    g.set(x, TOP_Y, z, "light_gray_concrete");
  }
}

g.save(OUT);
