// Pinnacle Apartments (OSM way 293020894): an 18-storey, 1980s concrete-frame apartment tower on a three-storey podium.
// The lidar roof is one flat top at ~72 blocks (noisy edge cells at 68-71 snap to it); the two notches are real low wings,
// rounded to storey lines. Hollow: a one-block envelope with air behind the glass and a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020894.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020894.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([22, 85, 23]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PODIUM = 12;   // top of the three-storey podium (absolute y): the downhill side's extra storeys
const k = (x, z) => `${x},${z}`;

// one flat top for the tower, low wings rounded to storey lines (57 -> 56, 44 -> 44, 21 -> 20)
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  const r = roof >= 60 ? 72 : Math.round(roof / 4) * 4;
  fp.set(k(x, z), { x, z, b: Math.max(ground, 1), r, exp: [] });
}
// a face is exposed where the footprint ends (first, so it sets the bay pattern), or the neighbour's roof is lower
// (the wall carries up the step); the staircase outline makes most edge cells two-faced, so no corner piers
for (const c of fp.values()) {
  const open = DIRS.filter(([dx, dz]) => !fp.has(k(c.x + dx, c.z + dz)));
  const step = DIRS.filter(([dx, dz]) => { const n = fp.get(k(c.x + dx, c.z + dz)); return n && n.r < c.r; });
  c.exp = [...open, ...step];
}
const isEdge = (c) => c.exp.length > 0;

// the envelope: a grey frame every third bay, glass in the others, storey spandrels, parapet and cornice on top
function edgeBlock(c, y) {
  const podium = y < PODIUM;
  if (y === c.r) return "white_concrete";                                   // parapet
  if (y === c.r - 1) return "light_gray_concrete";                          // cornice band
  if (y === c.b) return "polished_andesite";                                // base course
  if (y % 4 === 0) return podium ? "smooth_stone" : "light_gray_concrete";  // storey line
  const [dx, dz] = c.exp[0];
  const t = dx !== 0 ? c.z : c.x;                                           // position along the face: bays of 3
  return t % 3 === 0 ? (podium ? "stone_bricks" : "gray_concrete") : "light_blue_stained_glass";
}

// the interior: the ground slab, a floor slab per storey, the roof slab; air between (no interiors)
function interiorBlock(c, y) {
  if (y === c.b || y === c.r - 1 || (y % 4 === 0 && y < c.r - 1)) return "light_gray_concrete";
  return null;
}

for (const c of fp.values()) {
  for (let y = 0; y < c.b; y++) g.set(c.x, y, c.z, "stone_bricks");        // foundation: solid from y 0 up to the ground
  for (let y = c.b; y <= c.r; y++) {
    const block = isEdge(c) ? edgeBlock(c, y) : interiorBlock(c, y);
    if (block) g.set(c.x, y, c.z, block);
  }
}

// the entrance: the lowest single-face wall on the south-east side, a glazed-frame door with a lintel above
const entry = [...fp.values()]
  .filter((c) => c.exp.length === 1 && c.exp.some(([dx, dz]) => dx === 1 || dz === 1))
  .sort((p, q) => p.b - q.b || (q.x + q.z) - (p.x + p.z))[0];
const [outward] = entry.exp;
const facing = outward[0] === 1 ? "west" : "north";                         // a door faces the street it opens onto
g.set(entry.x, entry.b + 1, entry.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(entry.x, entry.b + 2, entry.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// warm lamps in some tower windows: a glowstone in the air just behind the glass
for (const c of fp.values()) {
  if (!isEdge(c) || c.exp.length !== 1) continue;
  const [dx, dz] = c.exp[0];
  const t = dx !== 0 ? c.z : c.x;
  const inner = fp.get(k(c.x - dx, c.z - dz));
  if (!inner || isEdge(inner)) continue;
  for (let y = PODIUM; y < c.r - 1; y++) {
    if (y % 4 === 0 || t % 3 === 0 || (c.x * 7 + c.z * 3 + y) % 11 !== 0) continue;
    if (y > inner.b && y < inner.r - 1) g.set(inner.x, y, inner.z, "glowstone");
  }
}

// roof plant: a closed box on the roof's middle, standing on the roof slab
for (let z = 9; z <= 13; z++) for (let x = 8; x <= 13; x++) {
  const c = fp.get(k(x, z));
  if (!c || c.r !== 72 || isEdge(c)) continue;
  const ring = x === 8 || x === 13 || z === 9 || z === 13;
  if (ring) for (let y = 72; y <= 74; y++) g.set(x, y, z, "white_concrete");
  g.set(x, 75, z, "light_gray_concrete");
}

const { blocks, palette } = g.save(OUT);
console.log(`Pinnacle Apartments: ${blocks} blocks, ${palette} palette entries, entrance at (${entry.x}, ${entry.z})`);
