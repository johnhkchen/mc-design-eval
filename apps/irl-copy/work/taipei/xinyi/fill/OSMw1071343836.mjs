import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 17 x 12 footprint, roof ~11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi-style low-rise commercial block: two storeys of
// about 5 blocks, a granite base with shopfront glazing on the ground storey,
// cream tiled walls with blue-tinted window bands, a cornice and parapet, and
// a flat roof with plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343836";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 12;
const FLOOR2 = 5;     // second-storey floor line
const CORN = 10;      // cornice course
const TOP = 11;       // parapet cap, roof is about 11 blocks above lowest ground
const ROOF = 10;      // roof deck over interior cells

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward faces. Preference order picks one primary face per perimeter cell.
const FACES = [
  { name: "S", dx: 0, dz: 1, facing: "south", axis: "x" },
  { name: "N", dx: 0, dz: -1, facing: "north", axis: "x" },
  { name: "E", dx: 1, dz: 0, facing: "east", axis: "z" },
  { name: "W", dx: -1, dz: 0, facing: "west", axis: "z" },
];
const faceOf = (x, z) => {
  for (const f of FACES) if (!has(x + f.dx, z + f.dz)) return f;
  return null;
};

// ---- 1. Foundation: solid from y 0 up to each cell's ground ----
for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. Facades, storefront, windows ----
for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  const f = faceOf(x, z);
  if (!f) continue;                       // interior cell, handled below
  if (G > TOP) continue;

  // position along the face, and whether this cell is a corner or pier
  const t = f.axis === "x" ? x : z;
  const a1 = f.axis === "x" ? has(x - 1, z) : has(x, z - 1);
  const a2 = f.axis === "x" ? has(x + 1, z) : has(x, z + 1);
  const pier = !a1 || !a2 || t % 3 !== 1;
  const isDoorCell = f.name === "S" && t === 7;

  for (let y = G; y <= TOP; y++) {
    let block = null;
    let props;

    if (y === TOP) {
      block = "white_concrete";                                 // parapet cap
    } else if (y === CORN) {
      block = "polished_andesite";                              // cornice
    } else if (y === G) {
      block = "polished_granite";                               // base course
    } else if (y <= 4) {
      // ground storey: shopfront
      if (isDoorCell && (y === G + 1 || y === G + 2) && !pier) {
        block = "dark_oak_door";
        props = {
          facing: f.facing,
          half: y === G + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (pier) {
        block = "smooth_quartz";
      } else if (y === 4) {
        block = "smooth_quartz";                                // lintel
      } else {
        block = "cyan_stained_glass_pane";                      // shop glazing
      }
    } else if (y === FLOOR2) {
      block = "polished_andesite";                              // storey line
    } else if (y === 9) {
      block = "smooth_quartz";                                  // upper lintel
    } else {
      // y 6..8, second storey
      block = pier ? "smooth_quartz" : "light_blue_stained_glass_pane";
    }

    if (block) put(x, y, z, block, props);
  }

  // Warm light behind some upper windows: a glowing block in the air gap
  // inside, one cell in from the glass.
  if (!pier && t % 6 === 1) {
    const ix = x - f.dx, iz = z - f.dz;
    const inner = has(ix, iz) && !faceOf(ix, iz);
    if (inner && 7 >= G) {
      put(ix, 7, iz, (t + z) % 12 === 1 ? "shroomlight" : "glowstone");
    }
  }
}

// ---- 3. Interior: floor slabs per storey, roof deck, air gaps between ----
for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  if (faceOf(x, z)) continue;             // perimeter already built
  if (G > ROOF) continue;

  put(x, G, z, "smooth_stone");           // ground floor slab
  if (G <= FLOOR2) put(x, FLOOR2, z, "smooth_stone");   // second floor slab
  put(x, ROOF, z, "smooth_stone");        // roof deck, air gap below it

  // roof plant: AC boxes and a lantern on a few cells
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, TOP, z, "light_gray_concrete");
  } else if (x % 5 === 3 && z % 4 === 2) {
    put(x, TOP, z, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
