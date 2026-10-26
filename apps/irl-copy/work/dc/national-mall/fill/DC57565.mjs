// 1150 Connecticut Ave NW: a late-1960s/1970s Commercial-Office-Large block on the Dupont Circle corridor. A tower of
// precast piers and tinted glass on a dark granite base, with the storey module at 2 blocks (one window row over one
// spandrel). The lidar gives a 20-block core, an 18-block shoulder and 16-block wings on the low side; the 3x3 median
// is snapped to those three tiers, and the tower steps in one block from its footprint edge. Every solid cell stands
// on a solid cell below (the even rows are full slabs), so nothing floats. The street is the south face: a ground
// floor storefront of glass and piers, an iron-framed entrance with a stone lintel, a lantern in the lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57565.cells.json`, "utf8"));

const W = 15, H = 32, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const pk = (x, y, z) => `${x},${y},${z}`;
const roofAt = new Map();
for (const [x, z, , roof] of cells) roofAt.set(key(x, z), roof);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- massing: 3x3 median of the lidar roof, snapped to three flat tiers (16 wings, 18 shoulder, 20 tower) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tierOf = (m) => (m <= 16.5 ? 16 : m <= 18.5 ? 18 : 20);
const T0 = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) near.push(r);
  }
  T0.set(key(x, z), tierOf(median(near)));
}
const T0At = (x, z) => T0.get(key(x, z)) ?? -1;
// the tower stands back one block from its edge: a 20 cell next to a lower cell or the outside drops to 18
const top = new Map();
for (const [k, t] of T0) {
  const [x, z] = k.split(",").map(Number);
  const setback = t === 20 && NB.some(([dx, dz]) => T0At(x + dx, z + dz) < 20);
  top.set(k, setback ? 18 : t);
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

// ---- materials ----
const PLINTH = "polished_granite", FOUND = "stone", PIER = "white_concrete", SPANDREL = "polished_andesite";
const SLAB = "stone", CORNICE = "stone_bricks", DECK = "smooth_stone", GLASS = "gray_stained_glass_pane";

// ---- main pass: granite base, slabs on the even rows, window rows on the odd rows, parapet on the top row ----
const panes = new Set();
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    if (y === t - 1) { g.set(x, y, z, ext ? CORNICE : DECK); continue; }      // parapet / roof deck
    if (y === 0) { g.set(x, y, z, ext ? PLINTH : FOUND); continue; }          // base course; foundation below
    if (y % 2 === 0) { g.set(x, y, z, ext ? SPANDREL : SLAB); continue; }     // floor slab, spandrel band outside
    if (!ext) continue;                                                        // interior window row: air behind the glass
    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    // corners and bay piers (every third cell along a face) frame the glass; the rest is glass
    const pier = ew && ns ? true : ew ? z % 3 === 0 : x % 3 === 0;
    if (pier) g.set(x, y, z, PIER);
    else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
  }
}

// ---- glass panes connect to neighbouring panes in their row, so each window reads as a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light behind some panes: glowstone on the floor, or a lantern hung from the slab above ----
let lit = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (!(T(ix, iz) > y + 1) || openSides(ix, iz, y).length) continue;   // a free interior cell with a slab above
  const h = (x * 7 + y * 3 + z * 5) % 8;
  if (h === 0) { g.set(ix, y, iz, "glowstone"); lit++; }
  else if (h === 3) { g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); lit++; }
}

// ---- entrance on the south (street) face, centre x=4: a 2-high iron door in the glass, a stone lintel over it
// on the window row, a lantern in the lobby just inside. Its door and lintel stand on solid cells below and beside.
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(4, 1, 19, "iron_door", { ...DOOR, half: "lower" });
g.set(4, 2, 19, "iron_door", { ...DOOR, half: "upper" });
for (const x of [3, 4, 5]) g.set(x, 3, 19, "stone_bricks");
g.set(4, 1, 18, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof plant: iron-clad mechanical boxes on the interior of each roof deck, and a lightning rod on the tower ----
const deckInterior = [];
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  if (openSides(x, z, t - 1).length) continue;                             // only the interior of each roof deck
  deckInterior.push([x, t, z]);
  if ((x * 3 + z * 5) % 13 === 0) g.set(x, t, z, "iron_block");
}
const tower = deckInterior.filter(([, t]) => t === 20);
if (tower.length) {
  const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, , z]) => s + z, 0) / tower.length;
  const [x, t, z] = tower.reduce((best, c) => ((c[0] - cx) ** 2 + (c[2] - cz) ** 2 < (best[0] - cx) ** 2 + (best[2] - cz) ** 2 ? c : best));
  g.set(x, t, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const counts = g.save(`${DIR}/DC57565.nbt`);
const tierCount = {}; for (const t of top.values()) tierCount[t] = (tierCount[t] ?? 0) + 1;
console.log("saved DC57565.nbt", counts, "panes", panes.size, "lit", lit, "tiers", tierCount);
