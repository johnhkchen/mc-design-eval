// A 1920s-30s Beaux-Arts commercial block of pale limestone on a dark granite plinth (the Federal Triangle / F Street
// office-and-shop type): a shopfront storey, three upper storeys in window bands divided by floor belts, a stone cornice
// and a parapet. The lidar's 14-block roof on the west core becomes a two-storey setback penthouse; the 12-block
// shoulders carry HVAC plant on the roof. Every row is solid under what sits above it (plinth, floor belts, cap),
// the window rows are a shell of piers and glass with air behind, and the interior of each window row stays air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61479.cells.json`, "utf8"));

const W = 16, H = 26, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 mean of the lidar roof, snapped to two flat tiers (12 shoulders, 14 penthouse core) ----
const T = new Map();
const topAt = (x, z) => T.get(key(x, z)) ?? -1;              // -1 = outside the footprint
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) { s += c.roof; n++; }
  }
  T.set(key(x, z), s / n >= 13 ? 14 : 12);
}

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([d]) => d);

// ---- storeys: plinth row 0; shopfront rows 1-3; floor belts on rows 4, 7, 10; window bands between; cap on top ----
const BELTS = new Set([4, 7, 10]);
const kindOf = (y, t) => {
  if (y === 0) return "plinth";
  if (y === t - 1) return "cap";
  if (BELTS.has(y)) return "belt";
  return y <= 3 ? "shop" : "window";
};

const CALC = "calcite", PLINTH = "polished_granite", BELT = "smooth_stone", CAP = "stone_bricks";
const DECK = "smooth_stone", SHOP_PIER = "dark_oak_planks", GLASS = "light_blue_stained_glass_pane";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- main pass: a solid plinth, belts and cap; piers and glass on the perimeter of each window band ----
for (const k of T.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) {
    const kind = kindOf(y, t);
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    if (kind === "plinth") g.set(x, y, z, PLINTH);
    else if (kind === "belt") g.set(x, y, z, ext ? CALC : BELT);
    else if (kind === "cap") g.set(x, y, z, ext ? CAP : DECK);
    else if (kind === "shop" && ext) {
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      if (ew && ns) g.set(x, y, z, CALC);                   // corner
      else if ((ew ? z : x) % 3 === 0) g.set(x, y, z, SHOP_PIER);   // shopfront piers
      else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
    } else if (kind === "window" && ext) {
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      if (ew && ns) g.set(x, y, z, CALC);                   // quoins
      else {
        const along = ew ? z : x;
        if (along % 3 === 0) g.set(x, y, z, CALC);          // bays of two panes between limestone piers
        else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
      }
    }
    // else: an interior cell of a shop or window band stays air (no interiors)
  }
  // a coping course of stone slabs on the roof edge, one row above the cap: a continuous cornice line, not crenellation
  if (openSides(x, z, t).length) g.set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- glass panes connect to neighbouring panes in their band, so each window reads as a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: some upper-storey panes are lit (glowstone set in the window), and hanging lanterns hang from
// the belt in the free air just behind others ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  if (!sides.length) continue;
  const h = (x * 7 + y * 3 + z * 5) % 9;
  if ((h === 0 || h === 5) && y >= 5) { g.set(x, y, z, "glowstone"); lights++; continue; }
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (topAt(ix, iz) < 0 || openSides(ix, iz, y).length) continue;   // only a free interior cell
  if (h === 4 && y === 6) { g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); lights++; }
}

// ---- entrance on the north face at x 9 (the Pennsylvania-side shopfront): calcite surround, dark oak door,
// a hanging lantern under the belt over the transom ----
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(9, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(9, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(10, 1, 0, CALC); g.set(10, 2, 0, CALC); g.set(10, 3, 0, CALC);
g.set(9, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof plant: HVAC boxes on the shoulder roofs, set on the cap, clear of the penthouse ----
for (const [x, z] of [[2, 12], [12, 3], [13, 5]]) {
  if (topAt(x, z) === 12 && topAt(x + 1, z) === 12 && topAt(x, z + 1) === 12 && topAt(x + 1, z + 1) === 12) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, 12, z + dz, "iron_block");
  }
}

const counts = g.save(`${DIR}/DC61479.nbt`);
console.log("saved DC61479.nbt", counts, "panes", panes.size, "lights", lights);
