// 950 H St NW: a 1960s-70s speculative office block in pale precast and blue-glass ribbon windows, five storeys
// on a granite base, the tower on the north-east strip, setbacks stepping down to three storeys on the west.
// Lidar roof heights are median-smoothed (3x3) and snapped to four tiers (12, 15, 18, 20 blocks: 3, 4, 5 and 6 storeys
// at 4 blocks a storey), so each tier is a flat roof with a coping. Every cell is solid from y 0 up to its ground,
// and each storey has a floor slab over the whole footprint, so nothing stands on air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72729.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72729.nbt";

const X = 34, Y = 32, Z = 29;
const g = new Voxels([X, Y, Z]);

// Palette: pale precast piers and floor lines, white spandrels, pale blue glass, granite base and coping
const FOUND = "stone_bricks", BASE = "polished_granite", PIER = "smooth_quartz", FLOOR = "smooth_quartz";
const SPAN = "white_concrete", GLASS = "light_blue_stained_glass_pane", ROOF = "light_gray_concrete";
const COPING = "polished_granite", CORNICE = "polished_granite_slab", SHOP = "polished_granite";
const EQUIP = "light_gray_concrete";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const at = new Map();
for (const [x, z, gnd, roof] of raw) at.set(`${x},${z}`, { gnd: Math.round(gnd), roof: Math.round(roof) });
const cell = (x, z) => at.get(`${x},${z}`);

// Lidar noise: 3x3 median of the footprint's roof heights, then snapped to the four tiers
const tier = (r) => (r <= 13.5 ? 12 : r <= 16.5 ? 15 : r <= 19 ? 18 : 20);
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell(x + dx, z + dz); if (n) vals.push(n.roof); }
  vals.sort((a, b) => a - b);
  c.top = tier(vals[Math.floor(vals.length / 2)]);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// A face is exposed at height y when the cell beyond it is outside the footprint or stands no higher than y
const exposed = (x, z, y) => {
  const out = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) { const n = cell(x + dx, z + dz); out[d] = !n || n.top <= y; }
  return out;
};

// Front (north) entrance: the long north row of the footprint, middle of the run
const FRONT_Z = 2, DOOR_X = 19;

const stepRow = (y) => (y < 4 ? "shop" : y % 4 === 0 ? "slab" : y % 4 === 3 ? "span" : "glass");

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.gnd; y++) g.set(x, y, z, FOUND);

  for (let y = c.gnd; y <= c.top; y++) {
    const ex = exposed(x, z, y);
    const n = Object.values(ex).filter(Boolean).length;

    if (n === 0) {
      // Inside the building: a floor slab at each storey, the roof deck on top, air between
      if (y === c.top - 1) g.set(x, y, z, ROOF);
      else if (y < c.top && (y === c.gnd || y % 4 === 0)) g.set(x, y, z, FLOOR);
      continue;
    }

    if (y === c.top) { g.set(x, y, z, CORNICE, { type: "bottom", waterlogged: "false" }); continue; }
    if (y === c.top - 1) { g.set(x, y, z, COPING); continue; }
    if (y === c.gnd) { g.set(x, y, z, BASE); continue; }

    const ns = ex.N || ex.S, ew = ex.E || ex.W;
    const pier = n >= 2 || (ns && x % 3 === 1) || (ew && z % 3 === 1);
    const row = stepRow(y);

    if (row === "slab") { g.set(x, y, z, FLOOR); continue; }
    if (row === "span") { g.set(x, y, z, SPAN); continue; }
    if (pier) { g.set(x, y, z, row === "shop" ? SHOP : PIER); continue; }

    // Glass: panes run along the facade, so they connect to the piers and panes on either side
    const along = ns ? { east: "true", west: "true" } : { north: "true", south: "true" };
    g.set(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", ...along, waterlogged: "false" });
  }
}

// Entrance: a double door on the front row, a granite canopy over the bay, hanging lanterns either side
const fc = cell(DOOR_X, FRONT_Z);
for (const [i, hinge] of [[0, "left"], [1, "right"]]) {
  const x = DOOR_X + i;
  g.set(x, fc.gnd, FRONT_Z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, fc.gnd + 1, FRONT_Z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = DOOR_X - 1; x <= DOOR_X + 2; x++) {
  const c = cell(x, FRONT_Z);
  if (c) g.set(x, 4, FRONT_Z, BASE);
}
for (const x of [DOOR_X - 1, DOOR_X + 2]) {
  g.set(x, 3, FRONT_Z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light behind some upper-storey windows: a glowstone or shroomlight on the floor slab inside the glass
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 5; y < c.top - 1; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (!(ex.N || ex.S || ex.E || ex.W)) continue;
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    const inward = ex.N ? [0, 1] : ex.S ? [0, -1] : ex.E ? [-1, 0] : [1, 0];
    const n = cell(x + inward[0], z + inward[1]);
    if (!n || y < n.gnd || y >= n.top - 1) continue;
    if (Object.values(exposed(x + inward[0], z + inward[1], y)).some(Boolean)) continue;
    g.set(x + inward[0], y, z + inward[1], (x * 2 + z * 7) % 3 === 0 ? "shroomlight" : "glowstone");
  }
}

// Roof plant on the tallest and middle tiers: small screened boxes standing on the roof deck
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  if (c.top < 18) continue;
  if (Object.values(exposed(x, z, c.top - 1)).some(Boolean)) continue;
  const boxed = c.top === 20 ? (x % 8 === 4 && z % 6 === 3) : (x % 9 === 6 && z % 7 === 4);
  if (!boxed) continue;
  g.set(x, c.top, z, EQUIP);
  g.set(x, c.top + 1, z, EQUIP);
}

g.save(OUT);
console.log("saved", OUT, "cells", g.count(), "palette", g.palette.length);
