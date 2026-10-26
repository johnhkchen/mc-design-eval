// 2001 Massachusetts Ave NW: a 1920s-30s Washington office block on Embassy Row (Commercial-Office-Small), in pale
// limestone-clad brick with a dark granite shopfront plinth, a stepped massing from the lidar (an 11-block tower
// corner on a 9-block mid tier, 7-block low wings), 2-block storeys (slab rows on the even y, window rows between),
// a stone cornice and parapet on every roof edge, a copper-capped penthouse on the tower and a lit lobby entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57745.cells.json`, "utf8"));

const W = 7, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof, snapped to flat tiers (11 tower, 9 mid, 7 low) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m >= 10 ? 11 : m >= 8.5 ? 9 : 7);
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

const PIER = "quartz_block", QUOIN = "chiseled_quartz_block", SLAB = "smooth_quartz", CORNICE = "stone_bricks";
const PLINTH = "polished_andesite", SHOP_PIER = "polished_granite", GLASS = "light_blue_stained_glass_pane";
const SHOP_GLASS = "glass_pane", FLOOR = "smooth_stone";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- main pass: solid body, floor slabs on the even rows, facade on the odd window rows, cornice on the top row ----
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    if (y === t - 1) {                                           // cornice / roof deck
      g.set(x, y, z, ext ? CORNICE : FLOOR);
    } else if (y === 0) {                                        // granite plinth on the street; foundation below the ground
      g.set(x, y, z, ext ? PLINTH : "stone");
    } else if (y % 2 === 0) {                                    // floor slab: a smooth quartz string course on the face
      g.set(x, y, z, ext ? SLAB : FLOOR);
    } else if (ext) {                                            // window row
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      const shop = y === 1;                                      // ground floor: shopfront, granite piers, clear glass
      if (ew && ns) g.set(x, y, z, QUOIN);                       // quoins at the corners
      else if (ew) {                                             // long faces: bays of two, a pier every third cell
        if (z % 3 === 0) g.set(x, y, z, shop ? SHOP_PIER : PIER);
        else { g.set(x, y, z, shop ? SHOP_GLASS : GLASS); panes.add(pk(x, y, z)); }
      } else {                                                   // ends: a bay every other cell
        if (x % 2 === 0) { g.set(x, y, z, shop ? SHOP_GLASS : GLASS); panes.add(pk(x, y, z)); }
        else g.set(x, y, z, shop ? SHOP_PIER : PIER);
      }
    }
    // else: an interior window-row cell stays air (no interiors)
  }
}

// ---- parapet on every roof edge, one course above the cornice ----
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  if (openSides(x, z, t - 1).length) g.set(x, t, z, CORNICE);
}

// ---- the lobby: a double door on the street (downhill, south) face, with a lantern hung in the bay above ----
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(3, 1, 8, "oak_door", { ...door, half: "lower" });
g.set(3, 2, 8, "oak_door", { ...door, half: "upper" });
g.set(3, 3, 8, "lantern", { hanging: "true", waterlogged: "false" });

// ---- penthouse: a one-block stone box with a copper cap on the tallest interior roof cell, set in from every edge ----
let best = null;
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  const inside = [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dz]) => T(x + dx, z + dz) >= t);
  if (inside && (!best || t > best.t)) best = { x, z, t };
}
if (best) {
  g.set(best.x, best.t, best.z, "stone_bricks");
  g.set(best.x, best.t + 1, best.z, "oxidized_copper");
}

// ---- warm light: some panes read lit (glowstone set in the glass row, the ground floor's clear glass left as is) ----
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (y > 1 && (x + 2 * z + y) % 7 === 0) { g.set(x, y, z, "glowstone"); panes.delete(k); }
}

// ---- glass panes connect to any neighbouring block in their row, so each window is a framed grid ----
const solid = (x, y, z) => g.val(x, y, z) !== 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const block = y === 1 ? SHOP_GLASS : GLASS;
  g.set(x, y, z, block, {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
  });
}

g.save(`${DIR}/DC57745.nbt`);
