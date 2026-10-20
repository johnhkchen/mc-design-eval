import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344815461";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 19, D = 3;
const g = new Voxels([W, H, D]);

// Reading of the record: a mid-century Taipei shophouse-style street block,
// two storeys, white-tiled concrete walls, stone base, glazed shopfront,
// a storey line and a plain parapet cornice. Roof cover at y=7 from lowest ground.
const have = new Set(cells.map(([x, z]) => `${x},${z}`));
const maxG = Math.max(0, ...cells.map(c => c[2]));
const S = Math.max(4, maxG + 4);        // storey line (floor slab) level
const shopTop = S - 1;                   // top of ground-floor shopfront
const ROOF = Math.max(7, S + 3);         // roof cover level
const upperLo = S + 1, upperHi = ROOF - 1;
const midUpper = Math.floor((upperLo + upperHi) / 2);

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inB(x, y, z)) g.set(x, y, z, id, props); };

// 1. Foundation, base course and walls per footprint cell
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  // base course on the street face
  if (z === 0) put(x, gc, z, "stone_bricks");
  else put(x, gc, z, "stone_bricks");

  // party walls where neighbours are missing
  const side = !have.has(`${x - 1},${z}`) || !have.has(`${x + 1},${z}`);
  for (let y = gc + 1; y <= ROOF; y++) {
    if (side) put(x, y, z, "white_concrete");
  }
  // back wall
  if (z === 2) {
    for (let y = gc + 1; y <= ROOF; y++) put(x, y, z, "white_concrete");
  }
}

// 2. Ground-floor shopfront and upper facade on the street face (z = 0)
for (const [x, z, gc] of cells) {
  if (z !== 0) continue;
  // shop band
  for (let y = gc + 1; y <= shopTop; y++) {
    if (x % 4 === 0) put(x, y, 0, "polished_andesite");
    else put(x, y, 0, "glass_pane", paneX);
  }
  // upper band
  for (let y = upperLo; y <= upperHi; y++) {
    if (x % 4 === 0) put(x, y, 0, "smooth_quartz");
    else if (x % 4 === 3) put(x, y, 0, "white_concrete");
    else put(x, y, 0, "glass_pane", paneX);
  }
}

// 3. Entrance door, centred on the front
const doorX = have.has("6,0") ? 6 : (cells.find(c => c[1] === 0) || [0])[0];
const doorCell = cells.find(c => c[0] === doorX && c[1] === 0);
if (doorCell && shopTop >= doorCell[2] + 2) {
  put(doorX, doorCell[2] + 1, 0, "oak_door", door("lower"));
  put(doorX, doorCell[2] + 2, 0, "oak_door", door("upper"));
}

// 4. Floor slab at the storey line and roof cover, across the whole plan
for (const [x, z] of cells) {
  put(x, S, z, "smooth_stone");
  put(x, ROOF, z, "smooth_stone");
}

// 5. Cornice / parapet on the street face
for (const [x, z] of cells) {
  if (z === 0) put(x, ROOF + 1, z, "smooth_stone");
}

// 6. Warm lights behind some upper windows (interior air at z = 1)
for (const [x, z] of cells) {
  if (z !== 0) continue;
  if (x % 4 === 2) put(x, midUpper, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
