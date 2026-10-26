import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A narrow stone block of the cathedral precinct: a limestone shell on a stone plinth, storeys of 5 blocks
// (a band, three rows of windows, a sill band), a chiseled cornice and a slate roof cap on every column.
// Lidar roof heights are smoothed to whole storeys so each tier stands on the one below.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938053.cells.json`, "utf8"));

const WALL = "calcite", BAND = "stone_bricks", CORNICE = "chiseled_stone_bricks", ROOF = "deepslate_tiles";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone", FLOOR = "smooth_stone";

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inside = (x, z) => has.has(`${x},${z}`);
const exposed = (x, z) => ({ N: !inside(x, z - 1), S: !inside(x, z + 1), W: !inside(x - 1, z), E: !inside(x + 1, z) });
// whole 5-block storeys, at least one: lidar noise becomes flat tiers
const tier = (h) => Math.max(5, Math.round(h / 5) * 5);

const g = new Voxels([6, 38, 7]);

for (const [x, z, ground, h] of cells) {
  const T = tier(h);
  const ex = exposed(x, z);
  const boundary = ex.N || ex.S || ex.W || ex.E;
  for (let y = 0; y < ground; y++) g.set(x, y, z, BAND);
  for (let y = ground; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, ROOF); continue; }
    if (!boundary) {
      // interior: a floor slab per storey, air between; one warm light behind the wall
      if (y % 5 === 0) g.set(x, y, z, FLOOR);
      else if (y === 2) g.set(x, y, z, LIGHT);
      continue;
    }
    if (y === T - 2) { g.set(x, y, z, CORNICE); continue; }
    if (y % 5 === 0 || y % 5 === 4) { g.set(x, y, z, BAND); continue; }
    // window rhythm along each face: a glass bay, then a limestone pier
    if ((x + z) % 2 === 1) {
      if (y % 5 === 2 && (x + 2 * z) % 5 === 0) g.set(x, y, z, LIGHT);
      else {
        const along = ex.N || ex.S ? { east: "true", west: "true", north: "false", south: "false" }
          : { east: "false", west: "false", north: "true", south: "true" };
        g.set(x, y, z, GLASS, { ...along, waterlogged: "false" });
      }
    } else g.set(x, y, z, WALL);
  }
}

// entrance on the street (south) face: a dark oak door under a stone lintel
const doorX = 3, doorZ = 6;
g.set(doorX, 1, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, 2, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorX, 3, doorZ, CORNICE);

// roof equipment: a lightning rod on the tallest tier
g.set(2, tier(22), 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/FR241938053.nbt`);
