// 775 12th St NW: a 1920s Classical Revival commercial hotel (red brick over a rusticated limestone base, limestone
// quoins and string courses, a smooth-stone cornice, a stone-brick parapet). The lidar gives a long six-storey slab on
// 18 (a storey is 3 blocks, two real floors, so the 20-block roof stays honest), a two-block penthouse crown 2 in from
// the edges reaching 20, 6-block wings east and south-east (the south-east one is shopfronts), and a carved portal on the
// south face. Every column is solid from y 0 to its top with a floor band on each storey, so nothing floats; interior
// window-row cells are air (the air gap behind the glass), with glowstone in some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76529.cells.json`, "utf8"));

const W = 27, H = 32, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const inFp = (x, z) => raw.has(key(x, z));

// ---- massing: lidar roof, a bled row cleaned up, median-smoothed, snapped to flat tiers ----
// The south edge row (z 30, x 17..26) reads 18 over a 5-6 wing: a neighbour's edge in the lidar, not this building.
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(key(x, z), z === 30 && x >= 17 ? raw.get(key(x, 29)).roof : r);

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const smooth = new Map();
for (const [x, z] of Array.from(raw.keys(), (k) => k.split(",").map(Number))) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (roof.has(key(x + dx, z + dz))) near.push(roof.get(key(x + dx, z + dz)));
  smooth.set(key(x, z), median(near));
}

const BODY = 18, CROWN = 20;
const inset = (x, z, r) => {                                  // every cell within r is in the footprint
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (!inFp(x + dx, z + dz)) return false;
  return true;
};
const top = new Map();
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number), m = smooth.get(k);
  top.set(k, m >= 15 ? (m >= 19 && inset(x, z, 2) ? CROWN : BODY) : m >= 5 ? 6 : m >= 3 ? 4 : 3);
}
const T = (x, z) => top.get(key(x, z)) ?? -1;                // -1 = outside the footprint

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

// ---- materials: 1920s brick over limestone ----
const BRICK = "bricks", LIMESTONE = "calcite", BASE = "stone_bricks", FOUND = "stone";
const CORNICE = "smooth_stone", DECK = "stone", PARAPET = "stone_brick_slab";
const GLASS = "light_blue_stained_glass_pane";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

// The window grid on an exposed face: limestone quoins at the corners, brick piers every third bay, glass between.
const windowCell = (x, y, z, sides) => {
  const ew = sides.some((s) => s === "E" || s === "W"), ns = sides.some((s) => s === "N" || s === "S");
  if (ew && ns) return g.set(x, y, z, LIMESTONE);
  const bay = ew ? z : x;
  if (bay % 3 === 0) g.set(x, y, z, BRICK);
  else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
};

// ---- main pass: foundation below each cell's ground, base course, storey bands every third row, windows between ----
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z), gr = raw.get(k).gr;
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y), ext = sides.length > 0;
    if (y < gr) { g.set(x, y, z, ext ? BASE : FOUND); continue; }   // foundation below the ground
    if (y === t - 1) { g.set(x, y, z, ext ? CORNICE : DECK); continue; }
    if (y === 0) { g.set(x, y, z, ext ? BASE : FOUND); continue; }
    if (t === CROWN && y === BODY - 1) { g.set(x, y, z, ext ? CORNICE : DECK); continue; }   // the body's roof under the crown

    if (y % 3 === 0) {                                            // storey band: limestone string course, solid floor
      if (t === CROWN && y === BODY && ext) windowCell(x, y, z, sides);   // the penthouse is glazed at its first row
      else g.set(x, y, z, ext ? LIMESTONE : FOUND);
      continue;
    }
    if (ext) windowCell(x, y, z, sides);                          // window row; an interior one stays air
  }
  if (t >= 6 && openSides(x, z, t - 1).length) g.set(x, t, z, PARAPET, { type: "bottom", waterlogged: "false" });
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

// ---- warm light: a glowstone block set just inside some windows, in the air gap behind the glass; only on a
// window's bottom row, so it stands on the solid storey floor below and nothing hangs ----
let lights = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 !== 1) continue;
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (!inFp(ix, iz) || T(ix, iz) <= y || openSides(ix, iz, y).length) continue;   // only a free interior cell
  if ((x * 7 + y * 3 + z * 5) % 9 === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
}

// ---- entrance on the south face (the street side, low ground): a calcite surround, dark oak doors under a limestone
// lintel, a hanging lantern in the lobby ----
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(12, 1, 30, LIMESTONE); g.set(12, 2, 30, LIMESTONE);
g.set(14, 1, 30, LIMESTONE); g.set(14, 2, 30, LIMESTONE);
g.set(13, 3, 30, LIMESTONE);
g.set(13, 1, 30, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(13, 2, 30, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(13, 2, 29, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof plant: air-handling boxes on the body roof, set on the cornice, clear of the parapet and the crown ----
let plant = 0;
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (T(x, z) !== BODY || !inset(x, z, 1) || openSides(x, z, BODY - 1).length) continue;
  if (x % 5 === 2 && z % 6 === 1) { g.set(x, BODY, z, "iron_block"); plant++; }
}

const counts = g.save(`${DIR}/DC76529.nbt`);
console.log("saved DC76529.nbt", counts, "panes", panes.size, "lights", lights, "plant", plant);
