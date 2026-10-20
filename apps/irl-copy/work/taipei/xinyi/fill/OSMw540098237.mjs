import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540098237";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 8 x 21 footprint, 2 storeys of 5 blocks, cornice at y10, parapet to y11,
// plus a small penthouse on the roof. Height is kept within the 23-block volume.
const W = 8, H = 23, D = 21;
const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Footprint lookup, ground normalised so the lowest cell sits at y 0.
const minG = Math.min(...cells.map((c) => Math.round(c[2])));
const inF = new Map();
for (const [x, z, ground] of cells) {
  // Ground is capped at 4 so the two storeys and roof stay within the 11-block record.
  const gr = Math.min(Math.max(Math.round(ground) - minG, 0), 4);
  inF.set(`${x},${z}`, gr);
}
const has = (x, z) => inF.has(`${x},${z}`);
const groundAt = (x, z) => inF.get(`${x},${z}`);

// Exterior if any side neighbour is outside the footprint. Returns the outward face.
function faceOf(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}
const isExt = (x, z) => faceOf(x, z) !== null;

const ENTRANCE_X = [3, 4]; // centred on the north (z = 0) short face

for (const [x, z] of inF.keys().map((k) => k.split(",").map(Number))) {
  const gr = groundAt(x, z);
  const face = faceOf(x, z);
  const ext = face !== null;

  // Foundation from y0 up to this cell's ground, so nothing floats on the slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  put(x, gr, z, ext ? "polished_andesite" : "smooth_stone");

  // Second-floor slab (belt course on the outside).
  put(x, 5, z, ext ? "white_concrete" : "smooth_stone");

  // Roof deck, cornice and parapet.
  put(x, 10, z, ext ? "white_concrete" : "gray_concrete");
  if (ext) put(x, 11, z, "light_gray_concrete");

  if (!ext) continue;

  // Index along the facade: z for east/west faces, x for north/south faces.
  const i = face === "west" || face === "east" ? z : x;
  const pilaster = i % 3 === 0;
  const isEntranceCell = face === "north" && ENTRANCE_X.includes(x) && z === 0;

  // Ground floor: glass band with a lintel row at y4; pilasters full height.
  for (let y = gr + 1; y <= 4; y++) {
    if (pilaster) put(x, y, z, "white_concrete");
    else if (y <= 3) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_concrete");
  }

  // Upper floor: sill at y6, glass at y7-8, lintel at y9.
  for (let y = 6; y <= 9; y++) {
    if (pilaster || y === 6 || y === 9) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // Warm lights just inside some windows, behind the glass.
  const inX = face === "west" ? x + 1 : face === "east" ? x - 1 : x;
  const inZ = face === "north" ? z + 1 : face === "south" ? z - 1 : z;
  const lightSpot = !pilaster && has(inX, inZ) && !isExt(inX, inZ);
  if (lightSpot && i % 2 === 1) put(inX, 7, inZ, "glowstone");
  if (lightSpot && i % 6 === 4 && gr + 1 <= 2) put(inX, 2, inZ, "shroomlight");

  // Entrance: pair of doors, shopfront glass either side, canopy above.
  if (isEntranceCell) {
    const hinge = x === 3 ? "left" : "right";
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
  if (face === "north" && z === 0 && x >= 2 && x <= 5 && gr + 3 <= 4) {
    put(x, gr + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof penthouse on the interior of the roof deck.
for (let x = 2; x <= 5; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!has(x, z) || isExt(x, z)) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "smooth_stone");
  }
}

// Small roof plant units.
for (const [x, z] of [[6, 10], [6, 11], [1, 15], [1, 16]]) {
  if (has(x, z) && !isExt(x, z)) put(x, 11, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
