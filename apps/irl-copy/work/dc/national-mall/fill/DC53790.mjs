// 1818 7th St NW: a three-storey red-brick apartment block (c. 1900-1920 DC walk-up, limestone trim) with a
// stepped massing from the lidar: a 7-block core, 5-block shoulders on the flanks, 3-block wings, 2-block low ends.
// Every column is solid from y 0 to its top, with floor slabs at the even rows, so nothing floats: the rows above
// the base are a window row (glass with air behind, brick piers, calcite quoins) and a limestone string course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53790.cells.json`, "utf8"));

const W = 11, H = 19, D = 47;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof, snapped to flat tiers (1-block noise does not make a tier) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m >= 6.5 ? 7 : m >= 4.5 ? 5 : m >= 2.5 ? 3 : 2);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), tier(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const WALL = "bricks", STONE = "calcite", PLINTH = "polished_granite", CORNICE = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- main pass: solid base, floor slabs on the even rows, facade on the window rows, cornice on the top row ----
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    if (y === t - 1) {                                           // cornice / roof deck
      g.set(x, y, z, ext ? CORNICE : "smooth_stone");
    } else if (y === 0) {                                        // plinth; foundation below the ground
      g.set(x, y, z, ext ? PLINTH : "stone");
    } else if (y % 2 === 0) {                                    // floor slab: limestone sill course at the first floor, brick above
      g.set(x, y, z, ext ? (y === 2 ? STONE : WALL) : "stone");
    } else if (ext) {                                            // window row
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      if (ew && ns) g.set(x, y, z, STONE);                       // quoins at the corners
      else if (ew) {                                             // long faces: bays of three, brick piers between
        if (z % 3 === 0) g.set(x, y, z, WALL);
        else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
      } else {                                                   // ends: a bay every other cell
        if (x % 2 === 0) { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
        else g.set(x, y, z, WALL);
      }
    }
    // else: an interior window-row cell stays air (no interiors)
  }
}

// ---- glass panes connect to neighbouring panes in their row, so each window is a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: a lantern hung from the floor slab or a glowstone block set just inside some windows ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  // the interior cell behind this pane: opposite the exposed side
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (T(ix, iz) <= y || openSides(ix, iz, y).length) continue;   // only a free interior cell
  const h = (x * 7 + y * 3 + z * 5) % 8;
  if (h === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
  else if (h === 3) { g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); lights++; }
}

// ---- entrance on the west face (the tall shoulder, the street side): calcite surround, dark oak door,
// limestone transom, a hanging lantern in the hall ----
const DOOR = { facing: "east", hinge: "left", open: "false", powered: "false" };
g.set(1, 1, 11, STONE); g.set(1, 1, 13, STONE);
g.set(1, 3, 12, STONE);
g.set(1, 1, 12, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(1, 2, 12, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(2, 3, 12, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof plant: HVAC boxes on the core roof, set on the roof deck ----
for (const z of [10, 22, 34]) {
  if (T(4, z) === 7 && T(5, z) === 7) { g.set(4, 7, z, "iron_block"); g.set(5, 7, z, "iron_block"); }
}

const counts = g.save(`${DIR}/DC53790.nbt`);
console.log("saved DC53790.nbt", counts, "panes", panes.size, "lights", lights);
