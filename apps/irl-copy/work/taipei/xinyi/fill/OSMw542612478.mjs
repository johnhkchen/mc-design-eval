import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612478";
const W = 28, H = 23, D = 23;

// Record: no building data. Read as a two-storey, concrete-frame Taipei shophouse
// (1960s-80s low-rise commercial): quartz-tiled facade, grey-tinted windows,
// clear shopfront glass at street level, stone cornice, parapet, rooftop water tank.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inFp = (x, z) => ground.has(key(x, z));
const B = Math.max(...ground.values()); // floor level: top of the highest foundation

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Exposed faces of a footprint cell. N = min-z side (street front), S = max z, E = max x, W = min x.
function faces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x + 1, z)) f.push("E");
  if (!inFp(x - 1, z)) f.push("W");
  return f;
}

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }; // pane runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // pane runs along z
const paneProps = (face) => (face === "N" || face === "S" ? PANE_NS : PANE_EW);
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Door: centre of the street-front (N) face
const northCells = cells.filter(([x, z]) => faces(x, z).includes("N")).map(([x, z]) => x).sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
let doorZ = null;
if (doorX !== null) {
  for (const [x, z] of cells) if (x === doorX && faces(x, z).includes("N")) doorZ = z;
}

// 1) Foundation, floors and perimeter walls
for (const [x, z] of cells) {
  // foundation: solid from the base up to the floor level
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  if (fs.length === 0) {
    // interior: floor slabs only, air between
    put(x, B + 5, z, "smooth_stone");
    put(x, B + 10, z, "light_gray_concrete");
    continue;
  }

  // base course
  put(x, B, z, "polished_andesite");

  // dominant face: N/S first, then E/W
  const face = fs.includes("N") ? "N" : fs.includes("S") ? "S" : fs[0];
  const t = face === "N" || face === "S" ? x : z;
  const isCorner = fs.length > 1;
  const isPier = isCorner || t % 4 === 0;

  // ground storey (dy 1..3): shopfront glass between quartz piers
  if (isPier) {
    for (let dy = 1; dy <= 3; dy++) put(x, B + dy, z, "quartz_block");
  } else {
    for (let dy = 1; dy <= 3; dy++) put(x, B + dy, z, "glass_pane", paneProps(face));
  }
  put(x, B + 4, z, "gray_concrete");   // sign band
  put(x, B + 5, z, "smooth_stone");    // storey line

  // upper storey (dy 6..8): grey-tinted windows between piers
  if (isPier) {
    for (let dy = 6; dy <= 8; dy++) put(x, B + dy, z, "quartz_block");
  } else {
    for (let dy = 6; dy <= 8; dy++) put(x, B + dy, z, "gray_stained_glass_pane", paneProps(face));
  }
  put(x, B + 9, z, "quartz_block");                                         // upper lintel band
  put(x, B + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
  put(x, B + 11, z, "quartz_block");                                        // parapet
  put(x, B + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet cap

  // warm light behind some windows (interior cell next to the glass)
  if (!isPier) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && faces(ix, iz).length === 0) {
      if (t % 8 === 2) put(ix, B + 7, iz, "shroomlight");
      if (t % 8 === 6) put(ix, B + 2, iz, "glowstone");
    }
  }
}

// 2) Entrance on the street front, centred on the N face
if (doorX !== null && doorZ !== null) {
  put(doorX, B + 1, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 2, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// 3) Roof: deck is already interior dy 10. Water tank and antenna near the centre.
const cx = Math.round(cells.reduce((s, [x]) => s + x, 0) / cells.length);
const cz = Math.round(cells.reduce((s, [, z]) => s + z, 0) / cells.length);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = cx + dx, z = cz + dz;
  if (!inFp(x, z) || faces(x, z).length) tankOk = false;
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(cx + dx, B + 11, cz + dz, "iron_block");
    put(cx + dx, B + 12, cz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  put(cx, B + 13, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
