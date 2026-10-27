// Hampton Court (way 130501840): an eight-storey reinforced-concrete apartment block of the 1960s-70s, the kind of
// flat-roofed, white-painted slab that filled the Mt Eden and Eden Terrace ridges of the period. The lidar roof is a
// single flat plane at 34 blocks above y0 (392 of 395 cells; the few 31s and 33 are noise), so the massing is one
// tier: a stone plinth on the slope, eight storeys of white piers and glazed bays with spandrel lines, a cornice and
// a parapet, and plant rooms on the roof. Only footprint cells are built; the interior is air behind the glass with
// a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_130501840.cells.json", "utf8"));
const W = 25, H = 47, D = 29;
const ROOF = 34;                              // the lidar roof, smoothed to one flat tier
const NST = Math.floor((ROOF - 2) / 4);       // eight storeys of 4 blocks; the top two blocks are cornice and parapet
const FOUND = "stone", BASE = "stone_bricks", PIER = "white_concrete", SPAN = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", CORNICE = "smooth_stone", ROOFM = "gray_concrete", PLANT = "stone_bricks";

const F = new Map();
for (const [x, z, gr] of cells) F.set(`${x},${z}`, { x, z, g: gr });
const at = (x, z) => F.get(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const windows = [];
for (const c of F.values()) {
  const { x, z } = c, gr = c.g, ex = exposed(x, z), perim = ex.length > 0;
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);                 // foundation up to the lowest ground under the cell
  for (let y = gr; y < ROOF; y++) {
    if (!perim) {                                                    // interior: floor slabs, a ceiling under the roof, air between
      if (y === ROOF - 1) g.set(x, y, z, ROOFM);
      else if (y === ROOF - 2 || y === gr || (y % 4 === 0 && y <= 4 * NST)) g.set(x, y, z, SPAN);
      continue;
    }
    if (y >= 4 * NST) { g.set(x, y, z, y === 4 * NST ? CORNICE : PIER); continue; }   // cornice, then parapet
    if (y === gr) { g.set(x, y, z, BASE); continue; }                // base course on the slope
    const local = y % 4;
    if (local === 0 || local === 3) { g.set(x, y, z, SPAN); continue; }   // spandrels: the storey lines
    const pier = ex.length > 1 || (x + z) % 3 === 0;                 // corner and mullion piers between glazed bays
    if (pier) g.set(x, y, z, PIER);
    else { g.set(x, y, z, GLASS); windows.push({ x, y, z, ex }); }
  }
}

// Entrance on the north street face (cell 9,0 on the ground at y 2): iron glass door, a stone canopy band over it
// and a hanging lantern from the floor slab just inside.
const door = at(9, 0);
if (door) {
  const y0 = door.g;
  g.set(9, y0, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(9, y0 + 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [8, 9, 10]) g.set(x, 4, 0, BASE);
  g.set(9, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Relief: the glazing sits one block back behind the piers and spandrels, so the piers stand proud of the bays.
// Where the cell behind is interior, the outer cell is opened and the glass moves in; corners keep flat glass.
const interiorAt = (x, z, y) => { const c = at(x, z); return !!c && exposed(x, z).length === 0 && y >= c.g && y < 4 * NST; };
const recessed = [];
for (const w of windows) {
  const [dx, dz] = w.ex[0];
  if (w.ex.length !== 1 || !interiorAt(w.x - dx, w.z - dz, w.y)) continue;
  g.set(w.x, w.y, w.z, "air");
  g.set(w.x - dx, w.y, w.z - dz, GLASS);
  recessed.push({ ...w, dx, dz });
}

// Warm light in some bays: the air cell just behind the recessed glass, never on the edge or under a slab.
for (const w of recessed) {
  if ((w.x * 5 + w.z * 3 + w.y) % 9 !== 0) continue;
  const xb = w.x - 2 * w.dx, zb = w.z - 2 * w.dz;
  if (!interiorAt(xb, zb, w.y) || g.val(xb, w.y, zb)) continue;
  g.set(xb, w.y, zb, (w.x + w.z) % 2 ? "shroomlight" : "glowstone");
}

// Roof plant: two boxes of stone on the flat roof, well inside the parapet, one with an aerial on its corner.
const isInterior = (x, z) => at(x, z) && exposed(x, z).length === 0;
function findBox(w, d, taken) {
  let best = null;
  for (let x0 = 0; x0 + w <= W; x0++) for (let z0 = 0; z0 + d <= D; z0++) {
    let ok = true;
    for (let x = x0; x < x0 + w && ok; x++) for (let z = z0; z < z0 + d && ok; z++) {
      if (!isInterior(x, z) || taken.some(([a, b, c, e]) => x >= a && x < c && z >= b && z < e)) ok = false;
    }
    if (!ok) continue;
    const score = Math.abs(x0 + w / 2 - 12) + Math.abs(z0 + d / 2 - 14);
    if (!best || score < best.score) best = { x0, z0, score };
  }
  return best;
}
const boxes = [];
const a = findBox(6, 4, boxes);
if (a) boxes.push([a.x0, a.z0, a.x0 + 6, a.z0 + 4]);
const b = findBox(3, 3, boxes);
if (b) boxes.push([b.x0, b.z0, b.x0 + 3, b.z0 + 3]);
if (a) {
  for (let x = a.x0; x < a.x0 + 6; x++) for (let z = a.z0; z < a.z0 + 4; z++) for (let y = ROOF; y < ROOF + 3; y++) g.set(x, y, z, PLANT);
  for (let y = ROOF + 3; y < ROOF + 7; y++) g.set(a.x0, y, a.z0, "iron_bars");
}
if (b) for (let x = b.x0; x < b.x0 + 3; x++) for (let z = b.z0; z < b.z0 + 3; z++) for (let y = ROOF; y < ROOF + 2; y++) g.set(x, y, z, PLANT);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_130501840.nbt";
console.log(g.save(out));
