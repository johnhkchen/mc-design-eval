// Cultures, Languages and Linguistics (way 23893812), Auckland: a 1970s concrete-frame academic block. Six storeys
// on the tower (west), a podium and lower wings east. Storeys are 4 blocks: a floor band, two rows of glass between
// piers, and a head band. The storeys sit on one floor datum (y = 1 + 4k), so neighbouring cells on the slope line
// up; a cell's plinth fills from y 0 up to its first floor. The roof comes from lidar, median-smoothed and quantised
// to the storey datum. Only footprint cells are built; the shell is one cell thick with air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893812.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893812.nbt";

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const inFoot = (x, z) => raw.has(key(x, z));

// Smoothed roof: median of the footprint's roof values within two cells; then quantised to the storey datum.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const foot = new Map();
for (const c of raw.values()) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n) near.push(n.r); }
  const rm = median(near);
  const Lc = c.g + ((1 - c.g) % 4 + 4) % 4;                // first floor at or above the ground, on the 1 + 4k datum
  let Tt = 4 * Math.round((rm - 1) / 4) + 1;               // roof surface, also on the datum
  if (Tt < Lc + 4) Tt = Lc + 4;                             // at least one storey
  const perim = DIRS.some(([dx, dz]) => !inFoot(c.x + dx, c.z + dz));
  const corner = DIRS.filter(([dx, dz]) => !inFoot(c.x + dx, c.z + dz)).length >= 2;
  foot.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, Lc, Tt, perim, corner });
}
const at = (x, z) => foot.get(key(x, z));

// Each cell's block at height y, as far as the facade needs it (for pane connections and lights).
const piers = (c) => c.corner || (c.x + c.z) % 3 === 0;
const kindAt = (x, z, y) => {
  const c = at(x, z); if (!c || y < 0 || y >= c.Tt) return null;
  if (y < c.Lc) return "solid";
  if (y === c.Tt - 1) return "solid";
  if (!c.perim) return ((y - c.Lc) % 4 === 0) ? "solid" : null;
  const o = (y - c.Lc) % 4;
  if (y === c.Lc || o === 0 || o === 3) return "solid";
  return piers(c) ? "solid" : "glass";
};

const v = new Voxels([63, 41, 84]);

// Entrance: the north-most ground-floor perimeter cell (not a corner), with its neighbour along the wall.
const outward = (c) => DIRS.find(([dx, dz]) => !inFoot(c.x + dx, c.z + dz));
let entrance = null;
for (const c of foot.values()) if (c.perim && !c.corner && c.Lc === 5 && c.Tt <= 17 && (!entrance || c.z < entrance.z || (c.z === entrance.z && c.x < entrance.x))) entrance = c;
const wallMate = entrance && [[1, 0], [-1, 0]].map(([dx]) => at(entrance.x + dx, entrance.z)).find((n) => n && n.perim && !n.corner && n.Lc === entrance.Lc);
const entranceCells = new Set([key(entrance?.x, entrance?.z), wallMate ? key(wallMate.x, wallMate.z) : ""]);

// Roof plant: a 3 x 3 core on the tallest interior tier, standing on the roof deck.
const tallest = Math.max(...[...foot.values()].map((c) => c.Tt));
const tallInterior = [...foot.values()].filter((c) => !c.perim && c.Tt === tallest &&
  [-2, -1, 0, 1, 2].every((dz) => [-2, -1, 0, 1, 2].every((dx) => at(c.x + dx, c.z + dz)?.Tt === tallest)));
let plant = null;
if (tallInterior.length) {
  const mx = tallInterior.reduce((s, c) => s + c.x, 0) / tallInterior.length, mz = tallInterior.reduce((s, c) => s + c.z, 0) / tallInterior.length;
  plant = tallInterior.reduce((b, c) => ((c.x - mx) ** 2 + (c.z - mz) ** 2 < (b.x - mx) ** 2 + (b.z - mz) ** 2 ? c : b));
}
const inPlant = (x, z) => plant && Math.abs(x - plant.x) <= 1 && Math.abs(z - plant.z) <= 1;

for (const c of foot.values()) {
  const { x, z, Lc, Tt, perim } = c;
  const top = Tt - 1;
  // plinth from y 0 up to the first floor
  for (let y = 0; y < Lc; y++) v.set(x, y, z, "stone_bricks");
  for (let y = Lc; y < Tt; y++) {
    const o = (y - Lc) % 4;
    if (y === top) { v.set(x, y, z, perim ? "light_gray_concrete" : "gray_concrete"); continue; }
    if (!perim) { if (o === 0) v.set(x, y, z, "light_gray_concrete"); continue; }
    const k = key(x, z);
    if (y === Lc) { v.set(x, y, z, "polished_andesite"); continue; }
    if (o === 0 || o === 3) { v.set(x, y, z, "light_gray_concrete"); continue; }
    if (entranceCells.has(k) && y <= Lc + 2) {
      if (k === key(entrance.x, entrance.z)) {
        if (y === Lc + 1) v.set(x, y, z, "dark_oak_door", { facing: outward(c)[2], half: "lower", hinge: "left", open: "false", powered: "false" });
        else v.set(x, y, z, "dark_oak_door", { facing: outward(c)[2], half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === Lc + 1) v.set(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false" });
      else v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (piers(c)) { v.set(x, y, z, "light_gray_concrete"); continue; }
    const conn = (dx, dz) => (["glass", "solid"].includes(kindAt(x + dx, z + dz, y)) ? "true" : "false");
    v.set(x, y, z, "light_blue_stained_glass_pane", { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0) });
    // warm light behind some panes, in the air gap of the room inside
    const hsh = (x * 31 + z * 17 + y * 7) % 11;
    if (hsh === 0) {
      const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => at(nx, nz) && !at(nx, nz).perim);
      if (inward) v.set(inward[0], y, inward[1], "glowstone");
    }
  }
}

// Roof plant room on the tallest tier: a 3 x 3 concrete box two storeys high, with a vent on top.
if (plant) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const px = plant.x + dx, pz = plant.z + dz;
    for (let y = tallest; y < tallest + 2; y++) v.set(px, y, pz, "light_gray_concrete");
  }
  v.set(plant.x, tallest + 2, plant.z, "iron_block");
}

// Rooftop units on the lower wings: a few small units standing on the roof deck.
for (const c of foot.values()) {
  if (c.perim || c.Tt >= tallest || inPlant(c.x, c.z)) continue;
  if ((c.x * 7 + c.z * 3) % 61 === 0) v.set(c.x, c.Tt, c.z, "iron_block");
}

const info = v.save(OUT);
console.log(JSON.stringify({ cells: cells.length, tallest, entrance: entrance && [entrance.x, entrance.z], ...info }));
