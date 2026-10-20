import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343737";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 26 x 22 footprint, roof about 11 blocks above lowest ground: two storeys
// of 5 blocks with a stone cornice and parapet. Commercial ground floor with
// shopfront glazing, mid-century Taipei concrete and quartz facade.
const W = 26, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.floor(gr));
const has = (x, z) => ground.has(key(x, z));

// facing names: north = -z, south = +z, west = -x, east = +x
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
function faceOf(x, z) {
  for (const [name, dx, dz] of DIRS) {
    if (!has(x + dx, z + dz)) return { name, dx, dz };
  }
  return null;
}

const ROOF = 10;      // top of the second-floor body (roof slab level)
const PARAPET = 11;   // parapet course sits on the roof slab

for (const [x, z, grRaw] of cells) {
  const gr = Math.floor(grRaw);
  if (gr > 8) continue; // safety: keep the body below the roof line

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  if (!f) {
    // Interior: floor slabs per storey, air gap otherwise (no interiors).
    g.set(x, gr, z, "smooth_stone");
    if (gr <= 5) g.set(x, 5, z, "smooth_quartz");
    g.set(x, ROOF, z, "light_gray_concrete");

    // Rooftop plant: penthouse block and a few AC units.
    if (x % 7 >= 3 && x % 7 <= 4 && z % 6 >= 2 && z % 6 <= 3) {
      g.set(x, 11, z, "gray_concrete");
      g.set(x, 12, z, "gray_concrete");
    } else if (x % 5 === 0 && z % 4 === 1) {
      g.set(x, 11, z, "iron_block");
    }
    continue;
  }

  // Edge (facade) cell. Wall body from its ground up to the roof slab.
  const idx = f.dx !== 0 ? z : x; // position along the facade
  const put = (y, id, props) => {
    if (y >= gr && y <= PARAPET) g.set(x, y, z, id, props);
  };

  for (let y = gr; y <= ROOF; y++) put(y, "quartz_block");

  // Base course
  put(gr, "polished_granite");

  // Ground storey: shopfront glazing with stone piers, fascia at y 4
  for (let y = gr + 1; y <= 3; y++) {
    if (idx % 3 === 0) put(y, "stone_bricks");
    else put(y, "glass");
  }
  put(4, "smooth_stone");

  // Storey line
  put(5, "smooth_quartz");

  // Second storey windows: paired glass panes between quartz piers
  for (let y = 6; y <= 8; y++) {
    if (idx % 4 === 1 || idx % 4 === 2) put(y, "glass_pane");
    else put(y, "quartz_block");
  }
  put(9, "quartz_block");

  // Cornice and parapet
  put(ROOF, "smooth_stone");
  put(PARAPET, "stone_bricks");

  // Entrance: lower and upper door halves on the south facade, centre bay
  if (f.name === "south" && x === 13) {
    put(gr + 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(gr + 2, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm lights behind glass: interior cell just inside the facade
  const inX = x - f.dx;
  const inZ = z - f.dz;
  if (has(inX, inZ)) {
    if ((idx % 4 === 1 || idx % 4 === 2) && idx % 8 === 1 && gr <= 6) {
      g.set(inX, 7, inZ, "shroomlight");
    }
    if (gr + 2 <= 3 && idx % 3 === 1 && idx % 6 === 1) {
      g.set(inX, gr + 2, inZ, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
