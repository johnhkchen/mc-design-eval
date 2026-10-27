// Auckland, way 269691397: a three-storey brick commercial block of the 1920s-30s (Auckland's stripped-Classical
// shop-and-office row): red brick walls, calcite (Oamaru-style) sill, lintel and cornice bands, a stone plinth on
// the lidar ground, a glazed shopfront on the street, a dark-oak entrance under a canopy, and a two-storey wing
// stepping down at the west end. Massing comes from the lidar roof heights, smoothed to three flat tiers.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269691397.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..31, z 0..17
const k = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));

// Tiers: the 3x3 median of the lidar roof, snapped to three flat heights (top solid y = T - 1)
const T = new Map();
for (const [x, z] of cells) {
  const v = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = fp.get(k(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); const med = v[v.length >> 1];
  T.set(k(x, z), med >= 14 ? 15 : med >= 12 ? 13 : 11);
}
const t = (x, z) => T.get(k(x, z));

// Facade faces: a side open to the air, or a step down to a lower tier (visible above that tier's roof)
const DIRS = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];
const facesOf = (x, z) => DIRS.flatMap(([d, dx, dz]) => {
  const nb = k(x + dx, z + dz);
  if (!T.has(nb)) return [{ d, dx, dz, base: 0 }];
  if (T.get(nb) < t(x, z)) return [{ d, dx, dz, base: T.get(nb) }];
  return [];
});

// A window's air gap: the cell behind the glass is air only where it sits on a level plateau of the same tier
const plateau = (x, z) => T.has(k(x, z)) && [[0, -1], [0, 1], [-1, 0], [1, 0]].every(([dx, dz]) => T.get(k(x + dx, z + dz)) === t(x, z));

const air = new Set();              // "x,y,z" kept empty (window gaps, the door hall)
const glass = new Map();            // "x,y,z" -> pane state
const lamps = new Map();            // "x,y,z" -> warm block behind a window
const yKey = (x, y, z) => `${x},${y},${z}`;
const WIN_ROWS = [4, 5, 8, 9, 12, 13];   // two glass rows in each storey, sill at 3/7/11, lintel at 6/10/14
const DOOR = { x: 18, z: 0 };            // the entrance on the north (street) face, mid-frontage

let winIdx = 0;
for (const [x, z] of cells) {
  const tier = t(x, z);
  for (const f of facesOf(x, z)) {
    const px = x - f.dx, pz = z - f.dz;                      // the room side of this face
    if (!plateau(px, pz) || T.get(k(px, pz)) !== tier) continue;
    const along = f.dz !== 0 ? x : z;                        // position along the face
    for (const y of WIN_ROWS) {
      if (y < f.base || y > tier - 2) continue;              // below the lower tier, or under the cap
      if (along % 3 === 0) continue;                         // a brick pier between bays
      if (x === DOOR.x && z === DOOR.z) continue;            // the entrance bay is set below
      const pane = f.dz !== 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                              : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      glass.set(yKey(x, y, z), pane);
      air.add(yKey(px, y, pz));
      if (y === 4 || y === 8 || y === 12) { if (winIdx++ % 4 === 1) lamps.set(yKey(px, y, pz), "shroomlight"); }
    }
  }
}

// Entrance: a dark-oak door in the middle of the north frontage, a hall behind it, and a canopy over it
const doorFace = facesOf(DOOR.x, DOOR.z).find((f) => f.d === "n");
if (doorFace) {
  for (const y of [4, 5]) air.add(yKey(DOOR.x, y, DOOR.z + 1));
}

// Rooftop plant: a few two-high boxes on the top tier, well inside the parapet, so each sits on the roof
const roofUnits = [];
const deep = (x, z) => [-3, -2, -1, 0, 1, 2, 3].every((dz) => [-3, -2, -1, 0, 1, 2, 3].every((dx) => T.get(k(x + dx, z + dz)) === 15));
for (const [x, z] of cells) {
  if (roofUnits.length >= 3 || !deep(x, z)) continue;
  if (roofUnits.every(([ux, uz]) => Math.abs(ux - x) + Math.abs(uz - z) >= 8)) roofUnits.push([x, z]);
}

const g = new Voxels([32, 28, 18]);
for (const [x, z] of cells) {
  const tier = t(x, z), faces = facesOf(x, z);
  for (let y = 0; y < tier; y++) {
    const kk = yKey(x, y, z);
    if (lamps.has(kk)) { g.set(x, y, z, lamps.get(kk)); continue; }
    if (glass.has(kk)) { g.set(x, y, z, "glass_pane", glass.get(kk)); continue; }
    if (air.has(kk)) continue;
    if (y <= 1) { g.set(x, y, z, "stone_bricks"); continue; }                 // the plinth on the lidar ground
    if (y === 2) { g.set(x, y, z, "polished_andesite"); continue; }           // base course
    if (faces.length) {
      if (y === tier - 1) { g.set(x, y, z, "calcite"); continue; }           // cornice cap
      if ([3, 6, 7, 10, 11, 14].includes(y)) { g.set(x, y, z, "calcite"); continue; }   // sills and lintels
      if (y < faces[0].base) continue;
      g.set(x, y, z, "bricks"); continue;
    }
    if (y === tier - 1) { g.set(x, y, z, "smooth_stone"); continue; }         // the flat roof, inside the parapet
    g.set(x, y, z, "bricks");                                                  // solid core, no interiors
  }
}

// Door and canopy on the north frontage
for (const y of [4, 5]) {
  g.set(DOOR.x, y, DOOR.z, "dark_oak_door", { facing: "north", half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
for (const dx of [-1, 0, 1]) g.set(DOOR.x + dx, 6, DOOR.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Roof plant: light grey boxes two high on the roof surface (y 15-16 sit on the tier's top at 14)
for (const [x, z] of roofUnits) for (const y of [15, 16]) g.set(x, y, z, "light_gray_concrete");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269691397.nbt";
const r = g.save(out);
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, tiers: [...new Set(T.values())], roofUnits }));
