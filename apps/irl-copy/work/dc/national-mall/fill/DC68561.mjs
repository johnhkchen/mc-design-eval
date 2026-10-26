// Scottish Rite Temple, 1733 16th St NW (John Russell Pope, 1911-15): a Neoclassical white-stone temple on a granite
// plinth, with a stepped massing from the lidar: a 17-block core on the axis, setbacks to 15, 13 and 11, shoulders at 6,
// and low 4-block wings at the front (north) and back. Every column is solid from y 0 to its tier top, so nothing
// floats; storeys run on a 4-block module (slab, two window rows, spandrel), and the window rows are hollow inside
// (air behind the glass) except for a few glowstone lights set just inside the panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68561.cells.json`, "utf8"));

const W = 23, H = 29, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof, snapped to flat tiers (1-block noise does not make a tier) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m <= 4.5 ? 4 : m <= 6.5 ? 6 : m <= 11.5 ? 11 : m <= 13.5 ? 13 : m <= 15.5 ? 15 : 17);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), tier(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// Faces a cell at row y shows to open air: the neighbour is outside the footprint or stands no higher than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const STONE = "smooth_quartz", WALL = "quartz_block", TRIM = "chiseled_quartz_block", PIER = "quartz_pillar";
const BASE = "polished_granite", INNER = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const pk = (x, y, z) => `${x},${y},${z}`;
const panes = new Map();                       // pane cell -> the face it looks out of
const ENTRY_Z = 0, ENTRY_X = [10, 11, 12];     // the north front: portico columns either side of the door

// ---- main pass: base, floor slabs and spandrels solid; window rows glazed on the outside and hollow inside ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z), gr = raw.get(key(x, z)).gr;
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, BASE); continue; }                           // foundation under the lower ground
    const sides = openSides(x, z, y), ext = sides.length > 0;
    if (y === t - 1) { g.set(x, y, z, ext ? TRIM : STONE); continue; }          // cornice / roof deck
    if (y === gr) { g.set(x, y, z, ext ? BASE : INNER); continue; }            // granite base course on the ground
    const r = y % 4;
    if (r === 0) { g.set(x, y, z, ext ? STONE : INNER); continue; }            // floor slab and string course
    if (r === 3) { g.set(x, y, z, ext ? WALL : INNER); continue; }             // spandrel under each window band
    if (!ext) continue;                                                       // interior window row: air behind the glass

    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    if (ew && ns) { g.set(x, y, z, PIER, { axis: "y" }); continue; }          // corner quoins
    if (z === ENTRY_Z && ENTRY_X.includes(x) && (y === 1 || y === 2)) {       // the entrance: door and portico columns
      if (x === 11) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, PIER, { axis: "y" });
      continue;
    }
    const along = ew ? z : x;                                                  // bays of two glazed, a pier between
    if (along % 3 === 0) { g.set(x, y, z, PIER, { axis: "y" }); continue; }
    panes.set(pk(x, y, z), sides);
  }
}

// ---- glass panes join their neighbours in the same row, so each window is a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const [k] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: a glowstone set just inside every few panes, so the glass glows at dusk ----
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
let lights = 0;
for (const [k, sides] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if ((x * 5 + y * 3 + z * 7) % 6 !== 0) continue;
  const [dx, dz] = INWARD[sides[0]];
  const ix = x + dx, iz = z + dz;
  if (T(ix, iz) <= y || y % 4 === 0 || y % 4 === 3) continue;                 // needs an air cell behind the glass
  g.set(ix, y, iz, "glowstone"); lights++;
}

// ---- roof equipment: a small mechanical house on the central core, with a lightning rod on top ----
const core = [...top.entries()].filter(([, v]) => v === 17).map(([k]) => k.split(",").map(Number));
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length);
const cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
const house = [];
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (T(cx + dx, cz + dz) === 17) house.push([cx + dx, cz + dz]);
if (house.length === 9) {
  for (const [x, z] of house) {
    g.set(x, 17, z, STONE);
    g.set(x, 18, z, WALL);
  }
  g.set(cx, 19, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const info = g.save(`${DIR}/DC68561.nbt`);
console.log(`DC68561: ${info.blocks} blocks, ${info.palette} palette entries, ${panes.size} panes, ${lights} lights, cupola ${house.length === 9 ? "yes" : "no"}`);
