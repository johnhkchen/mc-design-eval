import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456422";
const W = 19, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map();
let maxG = 0, minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  maxG = Math.max(maxG, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));

// Levels (absolute y). Two storeys of 5, flat roof, parapet.
const F2 = maxG + 5;    // upper floor slab
const RS = maxG + 10;   // roof slab
const PH_TOP = RS + 3;  // plant room top

const DIRS = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] };
const OUT = { px: "east", nx: "west", pz: "south", nz: "north" };

function exteriorFaces(x, z) {
  return Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
}

// Entrance: median exterior cell of the first face found in south, north, east, west order.
let entrance = null;
for (const f of ["pz", "nz", "px", "nx"]) {
  const list = cells.filter(([x, z]) => {
    const ef = exteriorFaces(x, z);
    return ef.length === 1 && ef[0] === f;
  });
  if (list.length) {
    const alongX = f === "pz" || f === "nz";
    list.sort((a, b) => (alongX ? a[0] - b[0] : a[1] - b[1]));
    const m = list[Math.floor(list.length / 2)];
    entrance = { x: m[0], z: m[1], g: m[2], face: f };
    break;
  }
}

function paneProps(alongX) {
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function facadeBlock(x, z, y, G, face) {
  if (!face) return ["white_concrete"]; // corner piers
  const alongX = face === "pz" || face === "nz";
  const u = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const bay = ((u - base) % 3 + 3) % 3;
  const band1 = y < F2;
  if (band1 && y === G + 1) return ["polished_andesite"];           // base course
  if (y === F2 - 1 || y === F2 + 1 || y === RS - 1) return ["light_gray_concrete"]; // lintel / spandrels
  const winLo = band1 ? G + 2 : F2 + 2;
  const winHi = band1 ? F2 - 2 : RS - 2;
  if (y >= winLo && y <= winHi && bay === 1) return ["glass_pane", paneProps(alongX)];
  return ["white_concrete"];
}

function blockAt(x, z, y, G, faces) {
  const ext = faces.length > 0;
  const face = faces.length === 1 ? faces[0] : null;
  if (y < G) return ["stone_bricks"];                                  // foundation
  if (y === G) return ["smooth_stone"];                                // ground floor slab
  if (y === F2) return ext ? ["light_gray_concrete"] : ["smooth_stone"];
  if (y === RS) return ext ? ["stone_bricks"] : ["smooth_stone"];      // cornice / roof
  if (y === RS + 1) return ext ? ["white_concrete"] : null;            // parapet
  if (y > RS + 1) return null;
  if (!ext) return null;
  const band1 = y >= G + 1 && y <= F2 - 1;
  const band2 = y >= F2 + 1 && y <= RS - 1;
  if (band1 || band2) return facadeBlock(x, z, y, G, face);
  return null;
}

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main shell
for (const [x, z, G] of cells) {
  const faces = exteriorFaces(x, z);
  for (let y = 0; y <= PH_TOP; y++) {
    const b = blockAt(x, z, y, G, faces);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

// Warm lights behind upper-storey glass (one block inside the wall)
for (const [x, z] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const alongX = f === "pz" || f === "nz";
  const u = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const bay = ((u - base) % 3 + 3) % 3;
  if (bay !== 1 || (x + z) % 2 !== 0) continue;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz)) put(ix, F2 + 3, iz, "glowstone");
}

// Entrance: double door, hanging lantern above
if (entrance) {
  const { x, z, g: G, face } = entrance;
  const facing = OUT[face];
  put(x, G + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, G + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, G + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant room, centred on the footprint, interior cells only
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
for (const [x, z] of cells) {
  if (exteriorFaces(x, z).length) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    put(x, RS + 1, z, "light_gray_concrete");
    put(x, RS + 2, z, "light_gray_concrete");
    put(x, RS + 3, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
