import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241584056";
const W = 21, H = 23, D = 41;
const ROOF_Y = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward directions
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// First outward face of an edge cell, or null for interior cells
function outFace(x, z) {
  for (const f of FACES) if (!has(x + f.dx, z + f.dz)) return f;
  return null;
}

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade block on an edge cell, by storey band and bay index
function facade(y, gr, face, x, z) {
  const i = face.dz !== 0 ? x : z; // bay index along the face
  const pilaster = i % 4 === 0;
  // Storey 1 band (y 1..4)
  if (y >= 1 && y <= 4) {
    if (y <= gr) return null;
    if (pilaster) return "white_concrete";
    if (y === 4) return "light_gray_concrete"; // lintel
    return "light_blue_stained_glass";          // shopfront / window
  }
  // Storey 2 band (y 6..9)
  if (y >= 6 && y <= 9) {
    if (y <= gr) return null;
    if (pilaster) return "white_concrete";
    if (y === 6 || y === 9) return "light_gray_concrete"; // sill / head band
    return "light_blue_stained_glass";
  }
  return null;
}

// Pick the entrance: south-facing edge cell nearest the middle bay
let doorCell = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const f = outFace(x, z);
  if (!f || f.name !== "south") continue;
  if (!doorCell || Math.abs(x - 10) < Math.abs(doorCell[0] - 10)) doorCell = [x, z];
}

// 1. Foundation, base course, floors, cornice, parapet
for (const [x, z, gr] of cells) {
  const f = outFace(x, z);
  const edge = f !== null;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === gr) {
      put(x, y, z, edge ? "polished_andesite" : "smooth_stone"); // base course / floor
    } else if (y === 5) {
      put(x, y, z, "smooth_stone"); // storey 1/2 floor slab
    } else if (y === 10) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone"); // roof slab + cornice
    } else if (y === ROOF_Y) {
      if (edge) put(x, y, z, "white_concrete"); // parapet
    } else if (edge) {
      const b = facade(y, gr, f, x, z);
      if (b) put(x, y, z, b);
    }
  }
}

// 2. Warm lights behind some windows (interior cell inward of the glass)
for (const [x, z, gr] of cells) {
  const f = outFace(x, z);
  if (!f) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || outFace(ix, iz)) continue;
  const i = f.dz !== 0 ? x : z;
  if (i % 8 !== 2) continue;
  // Storey 1 glowstone just above the floor
  const y1 = gr + 1;
  if (y1 >= 1 && y1 <= 3) put(ix, y1, iz, "glowstone");
  // Storey 2 shroomlight just above the floor slab
  if (gr < 6) put(ix, 6, iz, "shroomlight");
}

// 3. Entrance: door, canopy header
if (doorCell) {
  const [dx0, dz0] = doorCell;
  const gr = ground.get(`${dx0},${dz0}`);
  const yl = gr + 1;
  put(dx0, yl, dz0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, yl + 1, dz0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy header across the entrance bay, stepping out over the door
  for (let k = -1; k <= 1; k++) {
    const cx = dx0 + k;
    if (has(cx, dz0) && outFace(cx, dz0)?.name === "south") {
      put(cx, gr + 3, dz0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 4. Roof equipment: small plant boxes on interior roof cells
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (outFace(x, z)) continue;
  if (x % 6 === 3 && z % 7 === 3) put(x, ROOF_Y, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
