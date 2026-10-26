// 1730 Rhode Island Ave NW: a mid-century limestone-clad office block (the Height Act envelope, about 50 m on an avenue)
// with the lidar's massing as tiers: a 14-block street podium round the edge, a 17-block main mass, a 21-block core,
// and a 4- and 7-block low wing on the east. A 3-block shopfront storey, then 2-block storeys. The envelope is one
// block thick with air behind the glass and a floor slab on each spandrel row; every column is solid from y 0 up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66886.cells.json`, "utf8"));

const W = 35, H = 33, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
// the lidar roof snapped to flat tiers: 4 and 7 the east wing, 14 podium, 17 main mass, 21 core
const tier = (r) => (r >= 19 ? 21 : r >= 15 ? 17 : r >= 11 ? 14 : r >= 5 ? 7 : 4);
const top = new Map(cells.map(([x, z, , roof]) => [key(x, z), tier(roof)]));
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const WALL = "smooth_quartz", PIER = "quartz_pillar", BASE = "polished_granite", CORNICE = "smooth_stone";
const ROOF = "stone", GLASS = "light_blue_stained_glass_pane";
const pk = (x, y, z) => `${x},${y},${z}`;
const panes = new Set();
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// a window row: piers on the long faces every third cell, quoins at the true corners, a chamfer by its diagonal
const isPier = (x, z, sides) => {
  const ew = sides.some((s) => s === "E" || s === "W");
  const ns = sides.some((s) => s === "N" || s === "S");
  if (ew && ns) return isCorner(x, z) || (x + z) % 3 === 0;
  if (ew) return z % 3 === 0;
  return x % 3 === 0;
};

// ---- main pass: solid base, shopfront, floor slabs on the odd rows, window rows on the even rows, cornice on top ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y), ext = sides.length > 0;
    if (y === t - 1) g.set(x, y, z, ext ? CORNICE : ROOF);                        // cornice / roof deck
    else if (y === 0) g.set(x, y, z, ext ? BASE : ROOF);                          // granite plinth
    else if (y === 1) {                                                           // shopfront: glass, granite piers
      if (!ext) continue;
      if (isPier(x, z, sides)) g.set(x, y, z, BASE);
      else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
    } else if (y === 2) { if (ext) g.set(x, y, z, BASE); }                        // granite fascia over the shops
    else if (y % 2 === 1) g.set(x, y, z, ext ? WALL : ROOF);                      // floor slab on the spandrel row
    else if (ext) {                                                               // window row
      if (isPier(x, z, sides)) g.set(x, y, z, PIER);
      else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
    }
    // else: an interior cell stays air (no interiors)
  }
}

// ---- glass panes join their neighbours in the row, so each bay is a framed grid ----
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const has = (dx, dz) => panes.has(pk(x + dx, y, z + dz));
  g.set(x, y, z, GLASS, {
    north: String(has(0, -1)), south: String(has(0, 1)), east: String(has(1, 0)), west: String(has(-1, 0)), waterlogged: "false",
  });
}

// ---- warm light: a glowstone, shroomlight or lantern just inside some panes (air behind the glass, slab above) ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (T(ix, iz) <= y || openSides(ix, iz, y).length) continue;   // only a free interior cell
  const h = (x * 7 + y * 3 + z * 5) % 8;
  if (h === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
  else if (h === 3) { g.set(ix, y, iz, "lantern", { hanging: String(y % 2 === 0), waterlogged: "false" }); lights++; }
  else if (h === 6) { g.set(ix, y, iz, "shroomlight"); lights++; }
}

// ---- entrance on the south face at the podium: granite surround, dark oak door, a lantern in the lobby ----
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(13, 1, 16, BASE); g.set(15, 1, 16, BASE); g.set(13, 2, 16, BASE); g.set(15, 2, 16, BASE);
g.set(14, 1, 16, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(14, 2, 16, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(14, 2, 15, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof plant: mechanical boxes on the core roof, set on its cornice ----
for (const [x, z] of [[19, 8], [23, 8], [19, 11], [23, 11]]) {
  if (T(x, z) === 21 && T(x + 1, z) === 21) {
    g.set(x, 21, z, "iron_block"); g.set(x + 1, 21, z, "iron_block");
  }
}

// ---- the east wing's terrace: shrubs in planters along its west edge ----
for (let z = 10; z <= 16; z += 2) {
  if (T(29, z) === 4 && T(30, z) === 4) g.set(29, 4, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

const counts = g.save(`${DIR}/DC66886.nbt`);
console.log("saved DC66886.nbt", counts, "panes", panes.size, "lights", lights);
