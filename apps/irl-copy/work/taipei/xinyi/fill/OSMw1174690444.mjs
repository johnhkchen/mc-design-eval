import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690444";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 25 x 36. Roof about 11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi low-rise commercial block: two storeys of
// pale tiled walls, dark tinted glazing in pillared bays, a granite base,
// storey lines, a cornice and a crenellated parapet.
const W = 25, H = 23, D = 36;
const TOP = 11;               // body occupies y < TOP (parapet at y 10)
const WIN = [1, 2, 3, 6, 7, 8]; // window bands (storey 1 and storey 2)
const gv = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const faces = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isEdge = (x, z) => faces(x, z).length > 0;
const FACING = { "0,1": "south", "0,-1": "north", "1,0": "east", "-1,0": "west" };

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) gv.set(x, y, z, id, props);
  else gv.set(x, y, z, id);
}

// Entrance: the south (+z) face cell nearest the centre line.
let door = null;
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  if (!faces(x, z).some(([dx, dz]) => dx === 0 && dz === 1)) continue;
  if (!door || Math.abs(x - 12) < Math.abs(door.x - 12)) door = { x, z };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);

  if (f.length === 0) {
    // Interior: ground slab, storey 2 floor, roof deck; air gaps between.
    put(x, gr, z, "light_gray_concrete");
    for (const y of [5, 9]) if (y >= gr && y < TOP) put(x, y, z, "light_gray_concrete");
    // Roof plant: small mechanical blocks on the deck.
    if (x % 8 === 4 && z % 8 === 4 && gr <= 9) put(x, 10, z, "light_gray_concrete");
    continue;
  }

  const corner = f.length > 1;
  const [odx, odz] = f[0];
  const u = odz !== 0 ? x : z; // coordinate along the facade

  for (let y = gr; y < TOP; y++) {
    let b = null;
    if (y === gr) {
      b = "polished_granite";                                  // base course
    } else if (y === 4 || y === 5) {
      b = "polished_andesite";                                 // storey lines
    } else if (y === 9) {
      b = "smooth_stone";                                      // cornice
    } else if (y === 10) {
      if (corner || u % 2 === 0) b = "smooth_stone";           // merlons
    } else if (WIN.includes(y)) {
      if (corner) b = "smooth_quartz";
      else b = u % 3 === 0 ? "smooth_quartz" : "cyan_stained_glass"; // pillar / glass bay
    } else {
      b = "white_terracotta";                                  // tiled wall
    }
    if (b) put(x, y, z, b);
  }
}

// Warm lights set just inside the glazing (interior air behind the glass).
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const [odx, odz] = f[0];
  const u = odz !== 0 ? x : z;
  if (u % 6 !== 2) continue;
  const ix = x - odx, iz = z - odz;
  if (!inFp(ix, iz) || isEdge(ix, iz)) continue;
  if (gr >= 0) {
    put(ix, 2, iz, "shroomlight");   // storey 1
    put(ix, 7, iz, "glowstone");     // storey 2
  }
}

// Entrance door and its lintel-level glazing.
if (door) {
  const [dx, dz] = [0, 1];
  const gr = gAt(door.x, door.z);
  const facing = FACING[`${dx},${dz}`];
  put(door.x, gr, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, gr + 1, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

gv.save(`${DIR}/${ID}.nbt`);
