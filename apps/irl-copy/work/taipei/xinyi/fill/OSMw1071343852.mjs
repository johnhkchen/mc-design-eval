import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343852";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 31, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Two-storey commercial block, flat roof at minG+11, parapet above
const F1 = minG + 5;   // second-floor slab / belt course
const F2 = minG + 10;  // top of second storey / upper belt course
const R = minG + 11;   // roof deck and cornice level

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north", axis: "x" },
  S: { dx: 0, dz: 1, facing: "south", axis: "x" },
  W: { dx: -1, dz: 0, facing: "west", axis: "z" },
  E: { dx: 1, dz: 0, facing: "east", axis: "z" },
};

function exposed(x, z) {
  return Object.keys(DIRS).filter(k => !has(x + DIRS[k].dx, z + DIRS[k].dz));
}

// Pick the entrance: a street-facing (north, then south) cell at x = 15
let doorKey = null, doorFace = null;
for (const pref of ["N", "S", "W", "E"]) {
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (doorKey) break;
    if (x === 15 && exposed(x, z).includes(pref)) {
      doorKey = `${x},${z}`;
      doorFace = pref;
    }
  }
  if (doorKey) break;
}

// Facade material by height band; face and u index along the wall
function facadeBlock(y, gr, face, u, isDoor) {
  const bay = ((u % 4) + 4) % 4;
  const pier = bay === 0 || bay === 3;

  if (y < F1) {
    // Ground storey: shopfront
    if (isDoor && y <= gr + 2) return null;
    if (pier) return "quartz_block";
    if (y === F1 - 1) return "light_gray_concrete";
    return "glass";
  }
  if (y === F1) return "smooth_stone";
  if (y < F2) {
    // Upper storey: punched windows with sills and heads
    if (pier) return "quartz_block";
    if (y === F1 + 1) return "light_gray_concrete";
    if (y === F2 - 1) return "white_concrete";
    const lit = u % 8 === 5;
    return lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane";
  }
  if (y === F2) return "smooth_stone";
  if (y === R) return "smooth_stone";     // cornice
  if (y === R + 1) return "white_concrete"; // parapet
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const isPerimeter = ex.length > 0;

  if (isPerimeter) {
    // Base course at ground level
    g.set(x, gr, z, "stone_bricks");

    const face = ex.includes("N") ? "N" : ex.includes("S") ? "S" : ex[0];
    const u = (face === "N" || face === "S") ? x : z;
    const isDoor = `${x},${z}` === doorKey && face === doorFace;

    for (let y = gr + 1; y <= R + 1; y++) {
      const b = facadeBlock(y, gr, face, u, isDoor);
      if (b) g.set(x, y, z, b);
    }

    if (isDoor) {
      const props = { facing: DIRS[face].facing, hinge: "left", open: "false", powered: "false" };
      g.set(x, gr + 1, z, "dark_oak_door", { ...props, half: "lower" });
      g.set(x, gr + 2, z, "dark_oak_door", { ...props, half: "upper" });
      // Door surround over the opening
      g.set(x, gr + 3, z, "quartz_block");
    }
  } else {
    // Interior cells: floor slabs per storey, air between them
    for (const y of [gr, F1, F2, R]) {
      if (y >= 0 && y < H) g.set(x, y, z, "gray_concrete");
    }

    // Roof plant on the interior roof, sitting on the roof deck at R
    if (x >= 18 && x <= 22 && z >= 4 && z <= 7) {
      g.set(x, R + 1, z, "light_gray_concrete");
      g.set(x, R + 2, z, "smooth_stone");
    } else if (x % 5 === 1 && z % 4 === 1) {
      g.set(x, R + 1, z, "iron_block");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
