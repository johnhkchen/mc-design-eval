// 2106 R St NW (Dupont Circle): a three-storey brick commercial block, c. 1905-1915, with a ground-floor shopfront
// (glass bays, a recessed-looking dark oak door, a dark fascia band) and calcite string courses, quoins and a stone
// cornice. The lidar roof sets the massing (a 9-block core, 8-block flanks, 7-block corners), smoothed by a 3x3 median
// into flat tiers. Each storey is a 3-block pitch: floor slab, window row, sill and head. The inside is air behind the
// glass with a floor slab per storey, so nothing floats and the windows have air behind them. z = 0 is the R Street front.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70202.cells.json`, "utf8"));

const W = 9, H = 21, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof within the footprint, clamped to the three tiers 7, 8, 9 ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), Math.min(9, Math.max(7, median(near))));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // roof tier; -1 = outside the footprint
const G = (x, z) => raw.get(key(x, z))?.gr ?? 0; // lowest-ground offset of the cell

// Faces at row y that look onto open air: the neighbour is outside the footprint or stands at or below y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);
const isExt = (x, z, y) => openSides(x, z, y).length > 0;

const BRICK = "bricks", TRIM = "calcite", BASE = "polished_granite", CORNICE = "stone_bricks";
const FLOOR = "smooth_stone", FOUND = "stone", FASCIA = "dark_oak_planks";
const PANE = "glass_pane", SHOP = "glass";

// ---- the envelope: foundation below the ground, a granite base, shopfront, three window rows, cornice ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z), gr = G(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, FOUND); continue; }                          // foundation under the ground
    const sides = openSides(x, z, y), ext = sides.length > 0;
    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    if (y === t - 1) { g.set(x, y, z, ext ? CORNICE : FLOOR); continue; }     // cornice / roof deck
    if (y <= 1) { g.set(x, y, z, ext ? BASE : (y === 0 ? FOUND : FLOOR)); continue; }   // base course, floor slab
    if (y === 4) { g.set(x, y, z, ext ? TRIM : FLOOR); continue; }            // sill course = floor slab, limestone
    if (y === 6) { g.set(x, y, z, ext ? BRICK : FLOOR); continue; }           // brick lintel band = slab above storey 2
    if (!ext) continue;                                                       // interior: air behind the glass
    if (ew && ns) { g.set(x, y, z, y === 5 || y === 7 ? TRIM : BRICK); continue; }   // limestone quoins at the window rows only
    const onNS = ns;                                                          // long faces: piers on the bay line
    const pier = onNS ? x % 3 === 0 : z % 3 === 0;
    if (y === 3) { g.set(x, y, z, FASCIA); continue; }                        // shop fascia band
    if (y === 2) {                                                            // ground storey: shop glass, piers
      if (sides.includes("N") && x === 3) continue;                           // the door (set below)
      g.set(x, y, z, pier ? BRICK : SHOP); continue;
    }
    g.set(x, y, z, pier ? BRICK : PANE);                                      // upper storeys: window row
  }
}

// ---- glass panes take the pane states of their neighbours, so each window reads as a framed grid ----
const isPane = (x, y, z) => g.get(x, y, z)?.block === "minecraft:glass_pane" || g.get(x, y, z)?.block === "glass_pane";
const panes = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (let y = 0; y < T(x, z); y++) if (isPane(x, y, z)) panes.push([x, y, z]);
for (const [x, y, z] of panes) {
  g.set(x, y, z, PANE, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- the shop door on the street front, a lower and upper half in the centre pier, with the canopy above ----
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(3, 2, 0, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(3, 3, 0, "dark_oak_door", { ...DOOR, half: "upper" });
for (const x of [2, 3, 4]) g.set(x, 4, 0, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// ---- warm light: a glowstone just inside the shop glass and some upper windows, a lantern hung in the shop fascia ----
let lights = 0;
for (const x of [2, 4, 7]) { g.set(x, 2, 1, "glowstone"); lights++; }
g.set(2, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(4, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, y, z] of panes) {
  if (y !== 5 && y !== 7) continue;
  const sides = openSides(x, z, y);
  if (sides.length !== 1) continue;                                           // one exposed face only
  const [ix, iz] = sides[0] === "W" ? [x + 1, z] : sides[0] === "E" ? [x - 1, z]
    : sides[0] === "N" ? [x, z + 1] : [x, z - 1];
  if (isExt(ix, iz, y) || T(ix, iz) <= y) continue;                          // the cell behind must be interior
  if ((x * 7 + y * 3 + z * 5) % 8 === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
}

// ---- roof plant on the 9-block core: two rooftop units, set on the roof deck of the tallest tier ----
g.set(5, 9, 2, "iron_block");
g.set(5, 9, 3, "iron_block");

const counts = g.save(`${DIR}/DC70202.nbt`);
console.log("saved DC70202.nbt", counts, "panes", panes.length, "lights", lights, "tops", JSON.stringify([...top]));
