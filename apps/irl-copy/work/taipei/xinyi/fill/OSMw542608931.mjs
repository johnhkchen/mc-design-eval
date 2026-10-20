import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608931";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Era and type: a 1980s-90s Xinyi-district commercial mid-rise, 2 storeys plus a
// parapet, white-tiled concrete facade with grey bands, glass shopfront below,
// a dark-timber entrance and rooftop plant. Roof sits 11 blocks above lowest ground.
const W = 28, H = 23, D = 20;
const ROOF = 11;          // top of parapet course (absolute, y0 = lowest ground)
const DECK = 10;          // roof deck level
const BAND_1 = 5;         // storey line between floors
const BAND_2 = 10;        // cornice / parapet course

const v = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inside(x, y, z)) v.set(x, y, z, id, props); };

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const IN = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
const faces = (x, z) => Object.keys(OUT).filter(f => !has(x + OUT[f][0], z + OUT[f][1]));

const glassFor = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: centre of the north-facing edge, three cells wide.
const northCells = cells.filter(([x, z]) => faces(x, z).includes("north"));
let entX = null;
if (northCells.length) {
  const xs = northCells.map(c => c[0]);
  entX = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
}
const isEntrance = (x, face) => face === "north" && entX !== null && Math.abs(x - entX) <= 1;

function edgeBlock(x, z, gr, fs, y) {
  const face = fs[0];
  const corner = fs.length > 1;
  const u = (face === "north" || face === "south") ? x : z;
  const pier = corner || u % 4 === 0;

  if (y === gr) return { id: "stone_bricks" };                       // base course
  if (y === BAND_1 || y === BAND_2) return { id: "light_gray_concrete" }; // storey line / cornice
  if (y === ROOF) return { id: "stone_bricks" };                      // parapet coping

  // Entrance bay on the north face
  if (isEntrance(x, face) && y >= 1 && y <= 4) {
    if (x === entX && (y === 1 || y === 2)) {
      return {
        id: "dark_oak_door",
        props: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
      };
    }
    if (y === 4) return { id: "dark_oak_slab", props: { type: "top", waterlogged: "false" } };
    return { id: "glass_pane", props: glassFor(face) };
  }

  // Window zones: ground floor (1..4) and second floor (6..9)
  if ((y >= 1 && y <= 4) || (y >= 6 && y <= 9)) {
    if (pier) return { id: "white_concrete" };
    return { id: "glass_pane", props: glassFor(face) };
  }
  return { id: "white_concrete" };
}

for (const [x, z, gr] of cells) {
  // Foundation under every footprint cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);

  if (fs.length === 0) {
    // Interior cell: floor slabs and roof deck only (air above, behind glass)
    put(x, gr, z, "smooth_stone");
    for (const y of [BAND_1, DECK]) if (y > gr) put(x, y, z, "smooth_quartz");
    // Roof plant: small AC boxes on the deck
    if (x % 7 === 3 && z % 6 === 2 && DECK > gr) {
      put(x, ROOF, z, "light_gray_concrete");
      put(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge cell: full wall column from its ground up to the parapet
  for (let y = gr; y <= ROOF; y++) {
    const b = edgeBlock(x, z, gr, fs, y);
    if (b) put(x, y, z, b.id, b.props);
  }
  // Roof deck sits behind the parapet on edge cells too
  if (DECK > gr) {
    // edge cells at deck level already carry the cornice band; keep the parapet solid
  }
}

// Warm light behind some second- and ground-floor windows (inside, one cell in)
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length) continue;
  const face = fs[0];
  if (fs.length > 1 || isEntrance(x, face)) continue;
  const u = (face === "north" || face === "south") ? x : z;
  if (u % 4 === 0 || u % 8 !== 2) continue;
  const ix = x + IN[face][0], iz = z + IN[face][1];
  if (!has(ix, iz) || faces(ix, iz).length) continue;
  for (const y of [2, 7]) put(ix, y, iz, "glowstone");
}

v.save(`${DIR}/${ID}.nbt`);
