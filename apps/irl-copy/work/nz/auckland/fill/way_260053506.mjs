// Regatta Court, Auckland (way 260053506): a 1980s concrete-frame office block on a basalt plinth. Nine storeys of 4 blocks
// (floor lines at y 4, 8 ... 40) over a 32 x 20 footprint, the lidar's 41 roof as a grey roof deck with a stone parapet. A
// penthouse core (lidar 44-46) is set back from the edges, capped at 44 with a plant block at 45. The facade is a 4-block
// storey rhythm: a white floor band, two rows of light-blue glass between white piers every 4 blocks, a light-grey spandrel.
// Ground floor is a shopfront (sill, glass, andesite piers, timber fascia); the entrance is on the east face at the 4-block
// floor, where the ground is also 4, so the door is flush. Some windows are lit with glowstone. Interiors are air with a
// floor slab per storey; nothing stands on air except the core's cap, which the penthouse walls carry.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053506.cells.json", "utf8"));
const X = 32, Z = 20, Y = 59;

// lidar roof per cell, smoothed: anything outside 40..46 is noise (a single 10 and a single 32), read as the main roof
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof: roof >= 40 && roof <= 46 ? roof : 41 });
const inF = (x, z) => F.has(`${x},${z}`);
const tower = (x, z) => inF(x, z) && F.get(`${x},${z}`).roof >= 44;
const penthouse = (x, z) => inF(x, z) && F.get(`${x},${z}`).roof >= 46;
const boundary = (x, z) => inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));
const coreWall = (x, z) => tower(x, z) && (!tower(x - 1, z) || !tower(x + 1, z) || !tower(x, z - 1) || !tower(x, z + 1));

// one storey's facade course at height y, base B (the floor band)
function facade(x, z, y, B) {
  const o = y - B;
  const ground = B === 4;
  if (o === 0) return ground || B === 40 ? "smooth_stone" : "white_concrete";
  if (o === 3) return ground ? "dark_oak_planks" : "light_gray_concrete";
  const bay = !inF(x, z - 1) || !inF(x, z + 1) ? x : z;      // along the north/south faces count x, along east/west count z
  if (bay % 4 === 0) return ground ? "polished_andesite" : "white_concrete";
  if ((x * 7 + z * 5 + bay * 3 + B) % 16 === 0) return "glowstone";      // about one lit window in sixteen
  return "light_blue_stained_glass";
}

const g = new Voxels([X, Y, Z]);
const ENTRY = { x: 30, z: 6 };     // east face, ground 4 = the ground floor's level: flush, no steps
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inF(x, z)) continue;
  const edge = boundary(x, z);
  // foundation and basalt plinth to the first floor line, a base course on the outside
  for (let y = 0; y < 4; y++) g.set(x, y, z, y === 3 && edge ? "deepslate_bricks" : "cobbled_deepslate");
  // floor slabs per storey and the grey roof deck
  for (let y = 4; y < 40; y += 4) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 40, z, "gray_concrete");
  if (edge) {
    for (let k = 0; k < 9; k++) {
      const B = 4 + 4 * k;
      for (let o = 0; o < 4; o++) g.set(x, B + o, z, facade(x, z, B + o, B));
    }
    g.set(x, 40, z, "smooth_stone");                       // cornice on the roof edge
    if (!tower(x, z)) g.set(x, 41, z, "stone_bricks");     // parapet on the lower roof
  }
  // the penthouse core: walls on its outer faces, a cap at 44, a plant block or a parapet at 45
  if (coreWall(x, z)) for (let y = 41; y < 44; y++) g.set(x, y, z, facade(x, z, y, 40));
  if (tower(x, z)) g.set(x, 44, z, "light_gray_concrete");
  if (tower(x, z) && penthouse(x, z)) g.set(x, 45, z, "iron_block");
  else if (coreWall(x, z)) g.set(x, 45, z, "stone_bricks");
  // roof plant on the lower roof, a few boxes in a grid away from the edges
  if (!edge && !tower(x, z) && x % 6 === 2 && z % 5 === 2) g.set(x, 41, z, "iron_block");
}

// entrance: a timber door pair in the east wall, a timber lintel band above it, a lantern on the floor inside
const { x: ex, z: ez } = ENTRY;
if (!inF(ex, ez) || !boundary(ex, ez) || F.get(`${ex},${ez}`).ground !== 4) throw new Error("entrance cell is not an east-face ground-4 cell");
g.set(ex, 4, ez, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 5, ez, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let z = ez - 1; z <= ez + 1; z++) if (inF(ex, z)) g.set(ex, 6, z, "dark_oak_planks");
g.set(ex - 1, 5, ez, "lantern", { hanging: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053506.nbt";
const r = g.save(out);
console.log(`way_260053506: ${r.blocks} blocks, ${r.palette} palette entries -> ${out}`);
