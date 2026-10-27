import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1960s-70s reinforced-concrete office block over street-level shops, on the slope below Mt Eden: four storeys of
// ribbon glazing between white concrete piers, light-grey floor and head bands, a stone base course and a stone
// shopfront at the street, a dark timber door, and a flat roof with a parapet cap and a plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1039248620.cells.json`, "utf8"));

const X = 29, Y = 29, Z = 40;
const ROOF = 16;           // lidar roof 15-16 across the footprint, smoothed to one flat tier; the parapet cap makes it 17
const STOREY = 4;          // floor band, two glass rows, head band: the storey lines sit on absolute heights
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const FACE_ORDER = ["south", "east", "north", "west"];   // a corner cell takes its facade in this order

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);
const faces = (x, z) => FACE_ORDER.filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const core = (x, z) => inside(x, z) && faces(x, z).length === 0;   // all four neighbours inside: not on the skin
const airAt = (x, y, z) => core(x, z) && y >= ground.get(`${x},${z}`);   // a cell that can be opened: above its own ground

const blocks = new Map();   // "x,y,z" -> { block, state }; the shell is solid, then the glass pockets are carved
const k = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state = null) => blocks.set(k(x, y, z), { block, state });
const del = (x, y, z) => blocks.delete(k(x, y, z));
const occupied = (x, y, z) => blocks.has(k(x, y, z));
const streetStorey = (g) => Math.floor(g / STOREY) * STOREY;   // the storey the street meets

const outward = new Map();  // glass cell key -> the facade it is on
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, "stone");   // foundation: solid from y 0 up to the ground
  const [face] = faces(x, z);
  if (!face) {
    for (let y = g; y < ROOF; y++) put(x, y, z, y === ROOF - 1 ? "smooth_stone" : "white_concrete");
    continue;
  }
  const along = face === "north" || face === "south" ? x : z;   // position along the facade: a pier every 4th block
  const shop = streetStorey(g);
  for (let y = g; y <= ROOF; y++) {
    const shopfront = y < shop + STOREY;
    if (y === ROOF) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // parapet cap
    else if (y === g) put(x, y, z, "polished_andesite");                                        // base course
    else if (y % STOREY === 0 || y % STOREY === STOREY - 1) put(x, y, z, shopfront ? "polished_andesite" : "light_gray_concrete");
    else if (along % 4 === 0) put(x, y, z, shopfront ? "polished_andesite" : "white_concrete");  // pier
    else { put(x, y, z, "glass_pane", {}); outward.set(k(x, y, z), face); }
  }
}

// the air gap behind each pane: one cell in, only where that cell is open above its own ground and off the skin
for (const [key, face] of outward) {
  const [x, y, z] = key.split(",").map(Number);
  const [dx, dz] = DIRS[face];
  if (airAt(x - dx, y, z - dz)) del(x - dx, y, z - dz);
}
// warm lamps on the sill of about one window in five
for (const [key] of outward) {
  const [x, y, z] = key.split(",").map(Number);
  const [dx, dz] = DIRS[outward.get(key)];
  if (y % STOREY === 1 && (3 * x + 5 * z + y) % 5 === 0 && airAt(x - dx, y, z - dz)) put(x - dx, y, z - dz, "glowstone");
}

// the entrance: the street-front cell on the south edge, low ground, door on the shop plinth with a stone lintel
const street = cells.filter(([x, z, g]) => g <= 1 && faces(x, z)[0] === "south").sort((a, b) => a[0] - b[0]);
const [dX, dZ, dG] = street[Math.floor(street.length / 2)];
if (airAt(dX, dG, dZ - 1)) del(dX, dG, dZ - 1);
if (airAt(dX, dG + 1, dZ - 1)) del(dX, dG + 1, dZ - 1);
put(dX, dG, dZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dX, dG + 1, dZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dX, dG + 2, dZ, "polished_andesite");

// the roof: a two-high plant box with a slab cap, on the interior roof, set in from the parapet
for (const [x, z] of cells) {
  if (x < 10 || x > 16 || z < 14 || z > 20) continue;
  const ring = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => [x + i, z + j]));
  if (!ring.every(([a, b]) => core(a, b))) continue;
  put(x, ROOF, z, "white_concrete");
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// panes connect to whatever stands beside them in the wall plane; the carved air behind stays open
for (const [key, b] of blocks) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const side = (on) => (on ? "true" : "false");
  b.state = { north: side(occupied(x, y, z - 1)), south: side(occupied(x, y, z + 1)),
    east: side(occupied(x + 1, y, z)), west: side(occupied(x - 1, y, z)), waterlogged: "false" };
}


const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state ?? undefined);
}
const out = g.save(`${DIR}/way_1039248620.nbt`);
console.log(`saved ${out.blocks} blocks, ${out.palette} palette entries`);
