import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC78240";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 34, H = 32, D = 27;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
// facade cell: footprint cell with at least one missing 4-neighbour
const isEdge = (x, z) =>
  has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));
const isInterior = (x, z) => has(x, z) && !isEdge(x, z);
const nearEdge = (x, z) => isEdge(x + 1, z) || isEdge(x - 1, z) || isEdge(x, z + 1) || isEdge(x, z - 1);

const SLAB = (type) => ({ type, waterlogged: "false" });

// street side = lowest-z facade cells; entrance is a 3-wide bay centred on the middle one
let minZ = Infinity;
for (const [x, z] of cells) if (isEdge(x, z) && z < minZ) minZ = z;
const frontXs = cells
  .filter(([x, z]) => isEdge(x, z) && z === minZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;
const entranceXs = doorX === null ? [] : [doorX - 1, doorX, doorX + 1].filter((x) => has(x, minZ) && isEdge(x, minZ));

for (const [x, z] of cells) {
  const { gr, roof } = map.get(key(x, z));

  // roof tier: quantised to 3-block tiers, at least two storeys above ground
  let T = Math.round(roof / 3) * 3;
  T = Math.min(28, Math.max(gr + 6, T));

  // foundation up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const interior = isInterior(x, z);

  for (let y = gr; y < T; y++) {
    const rel = y - gr;
    const storeyStart = rel % 3 === 0;

    if (interior) {
      if (storeyStart) g.set(x, y, z, "smooth_stone"); // floor slab per storey
      else if (rel % 3 === 1 && nearEdge(x, z) && (x * 5 + z * 3 + y * 7) % 9 === 0) {
        g.set(x, y, z, "glowstone"); // warm light behind the glass
      }
      continue;
    }

    // facade ring
    if (rel === 0) {
      g.set(x, y, z, "polished_granite"); // base course
    } else if (rel <= 2) {
      // shopfront band (ground storey): glass bays with dark mullions
      if ((x + z) % 3 === 0) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    } else if (storeyStart) {
      g.set(x, y, z, "white_concrete"); // storey line / spandrel
    } else {
      if ((x + z) % 3 === 0) g.set(x, y, z, "white_concrete"); // mullion
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // roof: slab over interior, cornice and parapet on the edge
  if (edge) {
    g.set(x, T, z, "polished_andesite");
    g.set(x, T + 1, z, "white_concrete");
    g.set(x, T + 2, z, "smooth_stone_slab", SLAB("bottom"));
  } else {
    g.set(x, T, z, "light_gray_concrete");
  }

  // mechanical penthouse in the middle of the roof
  if (interior && x >= 12 && x <= 21 && z >= 9 && z <= 17) {
    g.set(x, T + 1, z, "stone_bricks");
    g.set(x, T + 2, z, "stone_bricks");
    g.set(x, T + 3, z, "smooth_stone_slab", SLAB("bottom"));
  }
}

// entrance: a three-bay opening on the street side with a door in the centre bay
if (doorX !== null) {
  const gr = map.get(key(doorX, minZ)).gr;

  // flanking pilasters at ground level, then the glazed bays are kept as they are
  for (const x of entranceXs) {
    if (x !== doorX) {
      g.set(x, gr + 1, minZ, "polished_granite");
      g.set(x, gr + 2, minZ, "polished_granite");
    }
  }

  // centre door, lower and upper halves
  g.set(doorX, gr + 1, minZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 2, minZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });

  // lintel and a dark canopy line over the entrance
  for (const x of entranceXs) {
    g.set(x, gr + 3, minZ, "polished_andesite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
