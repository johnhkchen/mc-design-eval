// Way 370301075, Auckland (Mt Eden / Eden Terrace side): a concrete-framed 1970s university block. Eight storeys on a
// tower tier, stepping down to a 7-storey wing on the south and a 6-storey lower wing on the west. White concrete piers
// and string courses, grey spandrels, blue-tinted glazing, a stone base course, a coped parapet and a plant house on the
// roof. Its footprint is solid from y 0 to its ground; the walls are a one-cell shell with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_370301075.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..25, z 0..25

const key = (x, z) => `${x},${z}`;
// the lidar roof snapped to three flat tiers: a tower (8 storeys), a 7-storey wing, a 6-storey lower wing
const tier = (r) => (r >= 31 ? 32 : r >= 27 ? 28 : 24);

// majority passes over the 3x3 neighbourhood, so lidar noise on a tier edge does not leave ragged steps or the
// one- and two-cell spikes of the tower tier standing above the wings
const cur = new Map();
for (const [x, z, ground, roof] of cells) cur.set(key(x, z), { x, z, g: ground, t: tier(roof) });
const majority = (src) => {
  const out = new Map();
  for (const c of src.values()) {
    const cnt = {};
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const n = src.get(key(c.x + dx, c.z + dz)); if (!n) continue;
      cnt[n.t] = (cnt[n.t] || 0) + (dx || dz ? 1 : 2);
    }
    let best = c.t;
    for (const t of Object.keys(cnt)) if (cnt[t] > (cnt[best] || 0)) best = Number(t);
    out.set(key(c.x, c.z), { ...c, t: best });
  }
  return out;
};
const smooth = majority(majority(cur));
// a tower-tier cell with at most one tower-tier neighbour is a post, not a tier: it steps down to the wing's roof
for (const c of smooth.values()) {
  if (c.t !== 32) continue;
  const tallNb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => smooth.get(key(c.x + dx, c.z + dz))?.t === 32).length;
  if (tallNb <= 1) c.t = 28;
}
const info = new Map();
for (const c of smooth.values()) info.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, top: Math.max(c.t, c.g + 4) });   // top = the roof's upper face, y
const cellAt = (x, z) => info.get(key(x, z));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// the faces of cell (x, z) at height y that look out at air: off the footprint, or past a lower neighbour's roof
const exposure = (x, y, z) => DIRS.filter(([, dx, dz]) => { const n = cellAt(x + dx, z + dz); return !n || y >= n.top; });

const V = new Voxels([26, 46, 26]);
const lanterns = [], glowstones = [];
const ENTRY_Z = 1, ENTRY_X = 9;                  // the north entrance: a door at (9, 1, 1) under a canopy, piers either side

for (const c of info.values()) {
  const { x, z, g, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < g) { V.set(x, y, z, "stone"); continue; }                  // foundation: solid under the ground
    const ex = exposure(x, y, z);
    const edge = ex.length > 0;
    const ns = ex.some(([d]) => d === "N" || d === "S");
    const ew = ex.some(([d]) => d === "E" || d === "W");
    const r = y % 4;                                                   // storey lines at multiples of 4; r 1-2 glazing, 3 spandrel
    let b = null;

    // the north entrance: a door, piers, and a canopy over it
    if (z === ENTRY_Z && x >= ENTRY_X - 1 && x <= ENTRY_X + 1 && y <= 3) {
      if (x === ENTRY_X && y === 1) { V.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === ENTRY_X && y === 2) { V.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 3) { V.set(x, y, z, "stone_bricks"); continue; }
      if (y === 2) { V.set(x, y, z, "white_concrete"); continue; }
    }

    if (y === top - 1) b = edge ? "smooth_stone" : "light_gray_concrete";  // coping on the parapet, roof slab inside
    else if (y === g) b = edge ? "stone_bricks" : "light_gray_concrete";   // base course on the outside, floor slab inside
    else if (r === 0) b = edge ? "white_concrete" : "light_gray_concrete"; // string course, or the floor slab inside
    else if (!edge) b = null;                                              // the air gap behind the glass
    else if (ns && ew) {                                                   // corners: quoins alternate with glazed corners by storey
      if (r === 3) b = "gray_concrete";
      else b = Math.floor(y / 4) % 2 === 0 ? "white_concrete" : "light_blue_stained_glass";
    }
    else if (r === 3) b = "gray_concrete";                                 // spandrel under each window band
    else {                                                                 // window band, r 1 or 2
      const u = ns ? x : z;                                                // the run of the face: x on N/S, z on E/W
      if (u % 3 === 0) b = "white_concrete";                               // mullion pier every third block
      else {
        b = "light_blue_stained_glass";
        // a warm light just inside some panes, standing on the floor below
        const out = ex.find(([d]) => (ns ? d === "N" || d === "S" : d === "E" || d === "W"));
        if (r === 1 && out) {
          const gi = u + Math.floor(y / 4);
          const inW = cellAt(x - out[1], z - out[2]);
          if (inW && y - 1 >= inW.g && ((y - 1) % 4 === 0 || y - 1 === inW.g) && exposure(x - out[1], y, z - out[2]).length === 0) {
            if (gi % 12 === 7) glowstones.push([x - out[1], y, z - out[2]]);
            else if (gi % 4 === 1) lanterns.push([x - out[1], y, z - out[2]]);
          }
        }
      }
    }
    if (b) V.set(x, y, z, b);
  }
}

// the lights go in after the rooms are emptied, so their cells win
for (const [x, y, z] of lanterns) V.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, y, z] of glowstones) V.set(x, y, z, "glowstone");

// a plant house on the tower's roof: a solid box with an iron-barred crown, on the roof slab at y 31
const plant = [];
for (let x = 9; x <= 14; x++) for (let z = 5; z <= 9; z++) {
  const c = cellAt(x, z);
  if (!c || c.top !== 32) continue;
  const ok = [[0, 1], [0, -1], [1, 0], [-1, 0]].every(([dx, dz]) => { const n = cellAt(x + dx, z + dz); return n && n.top >= 32; });
  if (ok) plant.push([x, z]);
}
const inPlant = new Set(plant.map(([x, z]) => key(x, z)));
for (const [x, z] of plant) {
  V.set(x, 32, z, "light_gray_concrete");
  const ring = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dz]) => !inPlant.has(key(x + dx, z + dz)));
  V.set(x, 33, z, ring ? "light_gray_concrete" : "iron_bars");
}

const res = V.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_370301075.nbt");
console.log(`way_370301075: ${res.blocks} blocks, ${res.palette} palette entries, ${lanterns.length} lanterns, ${glowstones.length} glowstones, plant ${plant.length} cells`);
