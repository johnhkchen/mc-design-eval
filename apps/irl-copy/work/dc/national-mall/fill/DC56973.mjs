// 1730 7th St NW: a 1920s red-brick elevator apartment block on 7th Street (east face), limestone string courses and
// cornice, granite base, a 7-storey core on a 6-storey shoulder and 5-storey wings, a one-storey lobby at the north
// end of the street front. Storeys are 2 blocks: windows on the odd rows, brick spandrels and calcite lines on the even.
// The massing is the lidar roof, median-smoothed and snapped to tiers (10 / 12 / 14); each column is solid from y 0 to
// its top, so every storey stands on the one below. No interiors: window-row cells not on an outer face stay air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56973.cells.json`, "utf8"));

const W = 9, H = 26, D = 29;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: lidar roof, 3x3 median over the tall cells, snapped to storey tiers; the low lobby cell stays low ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m < 11.5 ? 10 : m < 13.5 ? 12 : 14);
const top = new Map(), ground = new Map();
for (const [x, z, gr, roof] of cells) {
  ground.set(key(x, z), gr);
  if (roof <= 4) { top.set(key(x, z), 2); continue; }             // the lobby: one storey, roof at y 2
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c && c.roof > 4) near.push(c.roof);
  }
  top.set(key(x, z), tier(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;                      // -1 = outside the footprint
const G = (x, z) => ground.get(key(x, z)) ?? 0;

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands no higher than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const BRICK = "bricks", CALCITE = "calcite", BASE = "polished_granite", CORNICE = "stone_bricks";
const FOUND = "stone", DECK = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const panes = new Set(), set = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); set.add(pk(x, y, z)); };

// ---- the street-front lobby: a dark oak door in a calcite surround, a calcite lintel, a lantern just inside ----
const LOBBY = [8, 9];

// ---- main pass: solid columns from the foundation to each top, facade on the open faces ----
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  const gr = G(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { put(x, y, z, FOUND); continue; }                 // foundation below the ground (none here, kept for the rule)
    if (x === LOBBY[0] && z === LOBBY[1]) continue;                // lobby handled below
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    if (y === t - 1) {                                             // cornice on the open faces, roof deck inside
      put(x, y, z, ext ? CORNICE : DECK);
    } else if (y === 0) {                                          // granite base course
      put(x, y, z, ext ? BASE : FOUND);
    } else if (y % 2 === 0) {                                      // spandrel row: brick, calcite string courses
      put(x, y, z, ext ? (y === 2 || y === t - 2 ? CALCITE : BRICK) : FOUND);
    } else if (ext) {                                              // window row
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      if (ew && ns) put(x, y, z, CALCITE);                         // quoins at the corners
      else if (ew) {                                               // long faces: a brick pier, then two panes per bay
        if (z % 3 === 0) put(x, y, z, BRICK);
        else { put(x, y, z, GLASS); panes.add(pk(x, y, z)); }
      } else {                                                     // ends: panes and piers alternate
        if (x % 2 === 1) { put(x, y, z, GLASS); panes.add(pk(x, y, z)); }
        else put(x, y, z, BRICK);
      }
    }
    // else: an interior window-row cell stays air (no interiors)
  }
}

// ---- lobby: a 2-block door in the street front, calcite lintel above, a lantern hung just inside ----
{
  const [x, z] = LOBBY;
  const DOOR = { facing: "east", hinge: "left", open: "false", powered: "false" };
  put(x, 0, z, "dark_oak_door", { ...DOOR, half: "lower" });
  put(x, 1, z, "dark_oak_door", { ...DOOR, half: "upper" });
  put(x, 2, z, CALCITE);                                           // lintel over the door, on the string course line
  put(x - 1, 0, z, FOUND);                                         // lobby floor (under the lantern)
  put(x - 1, 1, z, "lantern", { hanging: "true", waterlogged: "false" });
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

// ---- warm light: a glowstone or a hanging lantern (from the floor slab above) just inside some windows ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (T(ix, iz) <= y || openSides(ix, iz, y).length || set.has(pk(ix, y, iz))) continue;   // only a free interior cell
  const h = (x * 7 + y * 3 + z * 5) % 9;
  if (h === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
  else if (h === 4) { g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" }); lights++; }
}

// ---- penthouse: the elevator and stair core on the top tier, the longest run of top-tier cells along z (set on the deck) ----
let penthouse = null;
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const run = [];
  for (let zz = z; T(x, zz) === 14; zz++) run.push([x, zz]);
  if (run.length >= 2 && (!penthouse || run.length > penthouse.length)) penthouse = run.slice(0, 2);
}
if (penthouse) for (const [px, pz] of penthouse) {
  g.set(px, 14, pz, "stone_bricks"); g.set(px, 15, pz, "stone_bricks");
}

// ---- parapet: a low wall on the outer edge of the lower wings, set on the cornice ----
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (T(x, z) !== 10) continue;
  const outer = DIRS.some(([, dx, dz]) => T(x + dx, z + dz) === -1);
  if (outer) g.set(x, 10, z, "stone_brick_wall");
}

// ---- roof plant: two HVAC units on the middle wing roof, set on the deck, inboard of the parapet ----
let hvac = 0;
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const inboard = DIRS.every(([, dx, dz]) => T(x + dx, z + dz) !== -1);
  if (hvac < 2 && T(x, z) === 10 && inboard && z % 6 === 0) {
    g.set(x, 10, z, "iron_block"); hvac++;
  }
}

const counts = g.save(`${DIR}/DC56973.nbt`);
console.log("saved DC56973.nbt", counts, "panes", panes.size, "lights", lights,
  "penthouse", penthouse ? "yes" : "no", "hvac", hvac);
