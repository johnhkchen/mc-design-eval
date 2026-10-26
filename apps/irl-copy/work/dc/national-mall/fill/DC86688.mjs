// DC86688: 1156 15th St NW, a 1920s limestone Commercial-Office. Five storeys on a 17-high wing, a
// 19-high ring and a 20-high core (the lidar's three roof tiers, snapped clean). Storeys are 4 blocks; the
// envelope is one block thick, the interior is air except a floor slab per storey, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86688.cells.json`, "utf8"));
const X = 19, Y = 32, Z = 13;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot.has(`${x},${z}`);

// roof tiers: 20 core, 19 ring round it, 17 wings (lidar's 18s and 19s at the core's edge are noise)
const tier = (x, z) => (x >= 5 && x <= 12 && z >= 2 && z <= 10 ? 20 : x >= 4 && x <= 13 && z >= 2 && z <= 10 ? 19 : 17);
const H = (x, z) => (inFoot(x, z) ? tier(x, z) : 0);

const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];                 // north, south, east, west (z-, z+, x+, x-)
const exposed = (x, y, z, dx, dz) => H(x + dx, z + dz) <= y;     // open air (or outside the footprint) next to this cell
const interior = (x, y, z) => inFoot(x, z) && y < H(x, z) && !DIRS.some(([dx, dz]) => exposed(x, y, z, dx, dz));

const G = new Map();                                             // "x,y,z" -> { b, s }
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s = null) => G.set(key(x, y, z), { b, s });
const at = (x, y, z) => G.get(key(x, y, z));

// the building: storeys of 4 (floor slab, two window rows, spandrel); the top block of each tier is the cornice
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    if (y === h - 1) { put(x, y, z, "smooth_stone"); continue; }    // cornice and roof slab
    const k = Math.floor(y / 4), rel = y % 4;
    if (interior(x, y, z)) {                                          // no interiors: floor slabs, air behind the glass
      if (rel === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    const out = DIRS.filter(([dx, dz]) => exposed(x, y, z, dx, dz));
    const [dx, dz] = out.find(([, dz]) => dz !== 0) ?? out[0];        // the face: a z-face if there is one, else an x-face
    const u = dz !== 0 ? x : z;                                       // position along that face
    const front = dz === -1 && z === 0;                               // the street face, where the entrance is
    if (rel === 0) { put(x, y, z, k === 0 ? "polished_granite" : "polished_andesite"); continue; }   // base course, string courses
    if (rel === 3) { put(x, y, z, front && k === 0 && x >= 8 && x <= 10 ? "polished_granite" : "calcite"); continue; }  // spandrel; entrance canopy
    if (front && k === 0 && x === 9) {                                // the entrance door
      put(x, y, z, "iron_door", { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (u % 3 === 0) put(x, y, z, k === 0 ? "polished_granite" : "calcite");   // piers between the bays
    else put(x, y, z, "glass_pane");
    // warm light behind some glass: the cell just inside (air, and interior)
    if (rel === 1 && u % 3 !== 0) {
      const ix = x - dx, iz = z - dz;
      const warm = k === 0 ? u === 7 || u === 11 : (x * 5 + z * 3 + k * 7) % 7 === 0;
      if (warm && interior(ix, y, iz) && !at(ix, y, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// penthouse on the core: glass band over a calcite wall, a cap, and HVAC on top
for (let x = 7; x <= 10; x++) for (let z = 4; z <= 7; z++) {
  const edge = x === 7 || x === 10 || z === 4 || z === 7;
  const corner = (x === 7 || x === 10) && (z === 4 || z === 7);
  if (edge) {
    put(x, 20, z, corner ? "calcite" : "glass_pane");
    put(x, 21, z, "calcite");
  }
  put(x, 22, z, "smooth_stone");
}
for (let x = 8; x <= 9; x++) for (let z = 5; z <= 6; z++) put(x, 23, z, "iron_block");

// wing roof HVAC and lanterns on the parapet
for (let x = 1; x <= 2; x++) for (let z = 4; z <= 5; z++) put(x, 17, z, "iron_block");
for (let x = 15; x <= 16; x++) for (let z = 8; z <= 9; z++) put(x, 17, z, "iron_block");
for (const [x, z] of [[0, 0], [18, 0], [18, 12]]) put(x, 17, z, "lantern", { hanging: "false", waterlogged: "false" });

// glass panes connect to the neighbours in their wall plane
const NO_CONNECT = new Set(["iron_door", "glowstone", "lantern"]);
for (const [k, v] of G) {
  if (v.b !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const conn = (dx, dz) => { const n = at(x + dx, y, z + dz); return n && !NO_CONNECT.has(n.b) ? "true" : "false"; };
  v.s = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
}

const vox = new Voxels([X, Y, Z]);
for (const [k, { b, s }] of G) { const [x, y, z] = k.split(",").map(Number); vox.set(x, y, z, b, s ?? undefined); }
console.log(vox.save(`${DIR}/DC86688.nbt`));
