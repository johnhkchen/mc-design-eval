import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280205";
const CELLS = `${DIR}/${ID}.cells.json`;
const OUT = `${DIR}/${ID}.nbt`;

// Footprint 8 x 16, roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed 1970s-80s Taipei mid-rise: white/grey
// concrete frame, glazed bays in aluminium-style frames, a dark timber
// shopfront band at street level, parapet and rooftop plant box.
const W = 8, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Outward normals for each face.
const FACES = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function exteriorFaces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(FACES)) {
    if (!inside(x + dx, z + dz)) out.push(name);
  }
  return out;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function paneProps(face) {
  // Panes on north/south walls connect east-west; on east/west walls, north-south.
  if (face === "north" || face === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
}

// Facade extents for along-wall indexing.
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

for (const [x, z, gr] of cells) {
  const b = gr; // storey base sits on this cell's ground
  const faces = exteriorFaces(x, z);
  const exterior = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces.length === 1 ? faces[0] : null;

  // Foundation under every cell so nothing floats on the slope.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, b, z, exterior ? "stone_bricks" : "smooth_stone");

  // First-floor slab / storey line (white band on the facade).
  put(x, b + 5, z, exterior ? "white_concrete" : "smooth_stone");

  // Roof slab and roof edge band.
  put(x, b + 10, z, exterior ? "white_concrete" : "smooth_stone");

  // Parapet on the perimeter.
  if (exterior) put(x, b + 11, z, "white_concrete");

  // Rooftop plant box on the interior, near the north-west.
  if (!exterior && (x === 2 || x === 3) && (z === 4 || z === 5)) {
    put(x, b + 11, z, "light_gray_concrete");
  }

  if (!exterior) continue;

  // Corners: solid concrete columns.
  if (corner || !face) {
    for (let y = b + 1; y <= b + 9; y++) {
      if (y === b + 5) continue;
      put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Along-wall index for window/pier rhythm.
  const isEW = face === "east" || face === "west";
  const u = isEW ? z - minZ : x - minX;
  const isPier = u % 2 === 0;
  const [ox, oz] = FACES[face];
  const inX = x - ox, inZ = z - oz;
  const interiorOk = inside(inX, inZ) && exteriorFaces(inX, inZ).length === 0;
  const isStreet = face === "south";
  const isDoor = isStreet && x === 3;

  // Storey 1: shopfront band (rows b+1 .. b+4).
  if (isPier) {
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "light_gray_concrete");
  } else if (isDoor) {
    put(x, b + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, b + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, b + 3, z, "glass_pane", paneProps(face));
    put(x, b + 4, z, "dark_oak_planks");
  } else {
    put(x, b + 1, z, "stone_bricks");
    put(x, b + 2, z, "glass_pane", paneProps(face));
    put(x, b + 3, z, "glass_pane", paneProps(face));
    put(x, b + 4, z, "dark_oak_planks");
    if (interiorOk && u % 4 === 3) put(inX, b + 2, inZ, "glowstone");
  }

  // Storey 2: window bays (rows b+6 .. b+9).
  if (isPier) {
    for (let y = b + 6; y <= b + 9; y++) put(x, y, z, "light_gray_concrete");
  } else {
    put(x, b + 6, z, "white_concrete");
    put(x, b + 7, z, "glass_pane", paneProps(face));
    put(x, b + 8, z, "glass_pane", paneProps(face));
    put(x, b + 9, z, "white_concrete");
    if (interiorOk && u % 4 === 1) put(inX, b + 7, inZ, "glowstone");
  }
}

g.save(OUT);
