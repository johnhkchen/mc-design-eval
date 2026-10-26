// 1314 1/2 9th St NW (Store-Misc), Logan Circle. A three-bay-deep brick commercial block of the 1900s: a shopfront on the
// street (north) face, the upper storey stepping down eastward from a 3-storey corner to a 2-storey shop range and a
// single-storey wing. Massing follows the lidar roof tiers (6 / 4 / 3 blocks), smoothed into flat steps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC72321.cells.json`, "utf8"));
const g = new Voxels([16, 18, 4]);

const WALL = "bricks", TRIM = "calcite", BASE = "stone_bricks", FLOOR = "smooth_stone", FASCIA = "dark_oak_planks";
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z
const DOOR_CELL = [6, 0];                                                                              // north face, lower/upper at y0-1

const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
// Lidar roof tiers, smoothed: the corner block to 6 blocks, the shop range to 4, the east wing to 3.
const tier = (x) => (x <= 4 ? 6 : x <= 11 ? 4 : 3);
// Exterior faces of a footprint cell: the sides with no footprint cell beyond them.
const faces = (x, z) => [["N", x, z - 1], ["S", x, z + 1], ["W", x - 1, z], ["E", x + 1, z]]
  .filter(([, nx, nz]) => !has(nx, nz)).map(([f]) => f);
// Street (north) face wins a corner; otherwise the side the cell faces.
const facade = (f) => (f.includes("N") ? "N" : f.includes("E") ? "E" : f.includes("W") ? "W" : "S");
const bay = (x, z, face) => (face === "E" || face === "W" ? z : x);
const glass = (face) => (face === "E" || face === "W" ? PANE_EW : PANE_NS);

// Foundation: y 0 is the lowest ground and every cell's ground is 0, so nothing is filled under the walls here.
// Foundation layer for any cell whose ground is above 0 (none in this footprint).
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const r = tier(x);
  const f = faces(x, z);

  if (!f.length) {
    // interior: a floor slab at each storey line, air in the storeys between (no interiors)
    g.set(x, 0, z, BASE);
    if (r === 6) g.set(x, 3, z, FLOOR);
    g.set(x, r - 1, z, TRIM);                       // the roof is capped in the same stone as the cornice
    continue;
  }

  const face = facade(f);
  const idx = bay(x, z, face);
  const pier = idx % 3 === 0;                       // piers between window bays

  for (let y = 0; y < r; y++) {
    // base course at ground level; the street door sits in it, lower half at y 0 and upper at y 1
    if (y === 0) {
      if (face === "N" && x === DOOR_CELL[0] && z === DOOR_CELL[1])
        g.set(x, 0, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, 0, z, BASE);
      continue;
    }
    if (y === 1 && face === "N" && x === DOOR_CELL[0] && z === DOOR_CELL[1]) {
      g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // cornice or parapet capping the tier
    if (y === r - 1) { g.set(x, y, z, TRIM); continue; }
    // storey line between the shop and the upper floor (the corner tier only)
    if (r === 6 && y === 3) { g.set(x, y, z, TRIM); continue; }
    // upper-floor window row (corner tier only)
    if (r === 6 && y === 4) {
      if (pier) g.set(x, y, z, WALL); else { const w = glass(face); g.set(x, y, z, "glass_pane", w.state); }
      continue;
    }
    // ground storey: shopfront with a dark oak fascia on the street, window bays elsewhere
    if (face === "N" && y === 2 && r >= 4) { g.set(x, y, z, FASCIA); continue; }
    if (pier) g.set(x, y, z, face === "N" ? TRIM : WALL);
    else { const w = glass(face); g.set(x, y, z, "glass_pane", w.state); }
  }
}

// Warm light: glowstone in the air gap behind some street-face and upper-floor windows.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const r = tier(x), f = faces(x, z);
  // the street-facing window cell must have an interior cell behind it (footprint, no exterior face)
  if (!f.includes("N") || !has(x, z + 1) || faces(x, z + 1).length) continue;
  for (const y of [1, 4]) {
    if (y >= r - 1 || (y === 4 && r !== 6)) continue;
    if ((x + y) % 4 === 0) g.set(x, y, z + 1, "glowstone");
  }
}

g.save(`${dir}/DC72321.nbt`);
