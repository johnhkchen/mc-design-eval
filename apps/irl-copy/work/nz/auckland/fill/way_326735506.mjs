import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick commercial block: red brick walls, cream plaster quoins and string courses, a dark-oak shopfront
// at street level, four storeys to a flat roof at the lidar height (y 15), a parapet on top and two plant units.
// Ground varies 0..3 across the footprint, so storey lines follow each cell's own ground and the downhill west
// side shows the taller wall. Hollow inside: air behind the glass, one floor slab per storey.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326735506.cells.json`, "utf8"));
const ROOF = 15, STOREY = 4, SIZE = [19, 28, 11];

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const groundAt = (x, z) => ground.get(`${x},${z}`);
const FACES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
// the sides of a footprint cell that face outside the footprint (empty: interior)
const outFaces = (x, z) => Object.entries(FACES).filter(([, [dx, dz]]) => groundAt(x + dx, z + dz) === undefined).map(([f]) => f);

const blocks = new Map();   // "x,y,z" -> { block, state }, written to the volume at the end
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => blocks.get(`${x},${y},${z}`);

// street entrances: the north and south fronts, centred on their ground floor
const DOORS = [{ x: 2, z: 0, facing: "north" }, { x: 15, z: 10, facing: "south" }];
const pier = (x, z) => (x + z) % 3 === 0;   // brick piers every third cell: 2-wide bays of glass

for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation up to this cell's ground
  const faces = outFaces(x, z), perim = faces.length > 0, corner = faces.length > 1;

  for (let y = gr; y < ROOF - 1; y++) {
    const h = y - gr, s = Math.floor(h / STOREY), r = h % STOREY;
    if (!perim) { if (r === 0) put(x, y, z, "smooth_stone"); continue; }   // interior: floor slab per storey, air between
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }                // plaster quoins
    if (r === 0) { put(x, y, z, s === 0 ? "polished_andesite" : "smooth_quartz"); continue; }   // base course, string course
    if (r === 3) { put(x, y, z, s === 0 ? "dark_oak_planks" : "bricks"); continue; }            // shopfront fascia, header
    put(x, y, z, pier(x, z) ? (s === 0 ? "dark_oak_planks" : "bricks") : "glass_pane");        // window bays
  }

  // roof: the deck inside, a plaster cornice on the walls, a parapet above the lidar roof
  put(x, ROOF - 1, z, perim ? "stone_bricks" : "smooth_stone");   // grey cornice line under the cream parapet
  if (perim) put(x, ROOF, z, "smooth_quartz");
}

for (const { x, z, facing } of DOORS) {
  const gr = groundAt(x, z), state = { facing, hinge: "left", open: "false", powered: "false" };
  put(x, gr, z, "dark_oak_door", { ...state, half: "lower" });
  put(x, gr + 1, z, "dark_oak_door", { ...state, half: "upper" });
  put(x, gr + 2, z, "glass_pane");   // transom over the door
}

// warm light behind some upper and shop windows: a glowstone or shroomlight in the air gap just inside the glass
const lamps = ["glowstone", "shroomlight"];
for (const [x, z, gr] of cells) {
  const faces = outFaces(x, z);
  if (faces.length !== 1) continue;   // one wall face only
  const [dx, dz] = FACES[faces[0]], ix = x - dx, iz = z - dz;
  if (groundAt(ix, iz) === undefined || outFaces(ix, iz).length) continue;   // the cell behind must be interior
  for (let s = 0; gr + STOREY * s + 1 < ROOF - 1; s++) {
    const y = gr + STOREY * s + 1;
    if (get(x, y, z)?.block !== "glass_pane" || (x * 2 + z + s) % 6 !== 0) continue;
    if (blocks.has(`${ix},${y},${iz}`) || !blocks.has(`${ix},${y - 1},${iz}`)) continue;   // air above solid floor only
    put(ix, y, iz, lamps[(x + z + s) % 2]);
  }
}

// two plant units on the roof, set on the roof deck
for (const [x, z] of [[6, 4], [7, 4], [11, 6], [12, 6]]) {
  if (!outFaces(x, z).length) put(x, ROOF, z, "light_gray_concrete");
}

// panes join the walls and each other, never the lamps or doors
const NO_JOIN = new Set(["glowstone", "shroomlight", "dark_oak_door"]);
for (const [k, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number), joins = {};
  for (const [f, [dx, dz]] of Object.entries(FACES)) {
    const n = get(x + dx, y, z + dz);
    joins[f] = String(!!n && !NO_JOIN.has(n.block));
  }
  v.state = { ...joins, waterlogged: "false" };
}

const vox = new Voxels(SIZE);
for (const [k, { block, state }] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, block, state);
}
console.log(vox.save(`${DIR}/way_326735506.nbt`));
