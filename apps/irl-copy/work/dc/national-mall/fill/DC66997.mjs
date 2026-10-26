// DC66997: 1100 H St NW, a mid-century five-storey office block. Granite-and-stone base at street level, white precast
// piers with light-grey spandrel bands, glass between them, a flat roof with a stone parapet and a penthouse.
// The lidar roof is smoothed (3x3 median over the footprint) and snapped to storey lines (4 blocks each), so the
// massing is clean tiers: a 5-storey tower with 4-, 3- and 1-storey wings on the west and north-east edges.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cells = JSON.parse(readFileSync(join(here, "DC66997.cells.json"), "utf8"));   // [x, z, ground, roof]
const X = 12, Y = 32, Z = 14, STOREY = 4;
const PANE = "light_blue_stained_glass_pane";

const byCell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => byCell.has(`${x},${z}`);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// the roof tier of each footprint cell: lidar median-smoothed, then snapped to a storey line
const topMap = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) near.push(byCell.get(`${x + dx},${z + dz}`).roof);
  topMap.set(`${x},${z}`, STOREY * Math.round(median(near) / STOREY));
}
const top = (x, z) => topMap.get(`${x},${z}`) ?? 0;
const ground = (x, z) => byCell.get(`${x},${z}`).ground;

// a solid column from y 0 up to its tier; the outside of the footprint is air
const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top(x, z);
// a solid cell with air beside it, above it or below it is envelope; everything else inside is interior
const shell = (x, y, z) => solid(x, y, z) && (!solid(x + 1, y, z) || !solid(x - 1, y, z) || !solid(x, y, z + 1) || !solid(x, y, z - 1) || !solid(x, y + 1, z));

const blocks = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => blocks.set(key(x, y, z), { name, state });
const has = (x, y, z) => blocks.has(key(x, y, z));

// the facade of an envelope cell above its foundation and below its roof: storey k, row o within the storey
const entrance = (x, z) => z === Z - 1 && x >= 4 && x <= 7;            // the street door bay on the south face
function skin(x, y, z) {
  const k = Math.floor(y / STOREY), o = y % STOREY;
  const zFace = !solid(x, y, z + 1) || !solid(x, y, z - 1);
  const idx = zFace ? x : z, last = zFace ? X - 1 : Z - 1;
  const pier = idx % 3 === 0 || idx === last;                          // piers every 3, glass pairs between
  const onSouth = k === 0 && zFace && entrance(x, z);                 // the street entrance is on the ground floor only
  if (o === 0) return [k === 0 ? "stone_bricks" : "light_gray_concrete"];   // base course / storey line
  if (o === 3) return [onSouth ? "polished_granite" : "light_gray_concrete"];   // transom / spandrel
  if (onSouth) {
    if (x === 5 || x === 6) return ["dark_oak_door", {
      facing: "north", half: o === 1 ? "lower" : "upper", hinge: x === 5 ? "left" : "right", open: "false", powered: "false",
    }];
    return ["polished_granite"];                                        // door-bay pilasters
  }
  if (k === 0) return pier ? ["polished_granite"] : [PANE];          // shopfront: stone piers, glass
  return pier ? ["white_concrete"] : [PANE];
}

for (const [x, z, g] of cells) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    if (!shell(x, y, z)) { if (y % STOREY === 0) put(x, y, z, "smooth_stone"); continue; }   // interior: floor slabs, air between
    if (y < g) put(x, y, z, "stone_bricks");                             // foundation up to the lowest ground under it
    else if (!solid(x, y + 1, z)) put(x, y, z, "smooth_stone");          // roof deck
    else { const [name, state] = skin(x, y, z); put(x, y, z, name, state); }
  }
  // a stone parapet on the footprint's outer edge, one course above the roof
  if (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1)) put(x, T, z, "stone_bricks");
}

// the mechanical penthouse on the 20-block tier: a 4 x 4 box set back from the roof edge, 3 tall
for (let x = 4; x <= 7; x++) for (let z = 5; z <= 8; z++) for (let y = 20; y <= 22; y++) {
  const edge = x === 4 || x === 7 || z === 5 || z === 8;
  const corner = (x === 4 || x === 7) && (z === 5 || z === 8);
  if (y === 22) put(x, y, z, "smooth_stone");
  else if (edge) y === 21 && !corner ? put(x, y, z, PANE) : put(x, y, z, "smooth_quartz");
}
// two rooftop condenser units on the main roof
for (const [x, z] of [[2, 6], [2, 9]]) if (top(x, z) === 20) put(x, 20, z, "iron_block");

// warm light: glowstone just inside some windows of the upper storeys
for (const [x, z] of cells) {
  const T = top(x, z);
  for (let y = 5; y < T; y += STOREY) {                                 // the first row of each upper storey
    if (!shell(x, y, z) || !has(x, y, z) || blocks.get(key(x, y, z)).name !== PANE) continue;
    if ((x * 5 + z * 3 + y) % 4 !== 0) continue;
    const out = !solid(x, y, z + 1) ? [0, 1] : !solid(x, y, z - 1) ? [0, -1] : !solid(x + 1, y, z) ? [1, 0] : [-1, 0];
    const ix = x - out[0], iz = z - out[1];
    if (inF(ix, iz) && !shell(ix, y, iz) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
  }
}
// lobby lanterns standing on the ground-floor slab, behind the storefront
for (const [x, z] of [[4, 11], [8, 11]]) if (!has(x, 1, z)) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });

// glass panes connect to their neighbours (panes and solid blocks), as vanilla draws them
const solidish = (x, y, z) => { const b = blocks.get(key(x, y, z)); return !!b && !/door|lantern|glowstone/.test(b.name); };
const g = new Voxels([X, Y, Z]);
for (const [k, b] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  let state = b.state;
  if (b.name.endsWith("_pane")) state = {
    north: String(solidish(x, y, z - 1)), south: String(solidish(x, y, z + 1)),
    east: String(solidish(x + 1, y, z)), west: String(solidish(x - 1, y, z)), waterlogged: "false",
  };
  g.set(x, y, z, b.name, state);
}
const out = g.save(join(here, "DC66997.nbt"));
console.log(`DC66997.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
