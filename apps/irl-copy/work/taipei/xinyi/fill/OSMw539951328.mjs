import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw539951328: unrecorded mid-rise commercial block, Xinyi district.
// Read as a two-storey 1980s-90s Taipei shopfront block: cream quartz-clad walls,
// grey concrete bands, a polished-andesite plinth, a stone-brick fascia over the
// shopfront, tinted glass panes in a three-bay pier rhythm, a flat roof with a
// parapet, and a mechanical box on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951328";
const W = 14, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Storey levels (absolute, above y 0 = lowest ground under the footprint)
const Y_FLOOR2 = 5;   // upper floor slab / sill band
const Y_ROOF = 10;    // roof slab / cornice band
const Y_TOP = 11;     // parapet top (roof about 11 blocks above lowest ground)

const M = {
  found: "stone_bricks",
  plinth: "polished_andesite",
  wall: "smooth_quartz",
  band: "light_gray_concrete",
  fascia: "stone_bricks",
  pier: "polished_andesite",
  floor: "smooth_stone",
  roof: "stone_bricks",
  parapet: "light_gray_concrete",
  plant: "light_gray_concrete",
  glass: "light_blue_stained_glass_pane",
  light: "glowstone",
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inS = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, name, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Which of the four neighbours lie outside the footprint: [dx, dz] offsets of open faces
function missing(x, z) {
  const m = [];
  if (!inS(x, z - 1)) m.push([0, -1]); // north
  if (!inS(x, z + 1)) m.push([0, 1]);  // south
  if (!inS(x - 1, z)) m.push([-1, 0]); // west
  if (!inS(x + 1, z)) m.push([1, 0]);  // east
  return m;
}

const DOOR_X = 6;
const DOOR_Z = D - 1;

for (const [x, z, grRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = G(x, z);

  // 1. Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, M.found);

  const m = missing(x, z);

  // 2. Interior cells: floor slabs only, air above, no interior walls
  if (m.length === 0) {
    put(x, gr, z, M.floor);
    put(x, Y_FLOOR2, z, M.floor);
    put(x, Y_ROOF, z, M.roof);
    continue;
  }

  // 3. Perimeter cells: plinth, storey walls, bands, parapet
  put(x, gr, z, M.plinth);
  for (let y = gr + 1; y <= Y_TOP; y++) {
    let name = M.wall;
    if (y === Y_FLOOR2 || y === Y_ROOF) name = M.band;
    else if (y === Y_TOP) name = M.parapet;
    else if (y === 4) name = M.fascia;
    put(x, y, z, name);
  }

  // Corners and piers (two open faces) stay solid; single faces may take glass
  if (m.length !== 1) continue;

  const [dx, dz] = m[0];
  const onZFace = dz !== 0;                 // north or south facade
  const along = onZFace ? x : z;
  const len = onZFace ? W : D;
  const isWin = along >= 1 && along <= len - 2 && along % 3 !== 0;

  const isDoorCell = dz === 1 && x === DOOR_X && z === DOOR_Z;
  const isDoorSurround = dz === 1 && (x === DOOR_X - 1 || x === DOOR_X + 2) && z === DOOR_Z;

  // Entrance surround piers on the south facade
  if (isDoorSurround) {
    for (let y = gr + 1; y <= 3; y++) put(x, y, z, M.pier);
    continue;
  }

  // Entrance door
  if (isDoorCell && gr + 2 <= 4) {
    const doorProps = (half) => ({
      facing: "south", half, hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 1, z, "oak_door", doorProps("lower"));
    put(x, gr + 2, z, "oak_door", doorProps("upper"));
    // fanlight over the door, lintel stays fascia
    continue;
  }

  if (!isWin) continue;

  const paneProps = onZFace
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Ground storey shopfront glass (below fascia at y 4)
  if (gr + 1 <= 3) {
    for (let y = gr + 1; y <= 3; y++) put(x, y, z, M.glass, paneProps);
  }
  // Upper storey windows between sill band (5) and head wall (9)
  for (let y = Y_FLOOR2 + 1; y <= 8; y++) put(x, y, z, M.glass, paneProps);

  // Warm light behind some glass: glowstone on the inside cell
  const ix = x - dx, iz = z - dz;
  if (inS(ix, iz) && missing(ix, iz).length === 0) {
    if (along % 4 === 2) put(ix, Y_FLOOR2 + 1, iz, M.light);
    else if (along % 4 === 1 && gr + 1 <= 3) put(ix, gr + 1, iz, M.light);
  }
}

// Roof plant: a small mechanical box on the roof, on the roof slab
for (let x = 4; x <= 5; x++) {
  for (let z = 7; z <= 8; z++) {
    if (missing(x, z).length !== 0 || !inS(x, z)) continue;
    put(x, Y_ROOF + 1, z, M.plant);
    put(x, Y_ROOF + 2, z, M.plant);
  }
}

g.save(`${DIR}/${ID}.nbt`);
