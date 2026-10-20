import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682880";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground (y 0 reference).
const ground = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  B = Math.min(B, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);
const ROOF = B + 11; // roof surface ~11 blocks above lowest ground

// Per-cell outward faces (perimeter = any missing 4-neighbour).
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
};
const inwardOf = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

const perimeterSet = new Set();
const glowCells = [];

for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  if (perim) perimeterSet.add(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const rel = y - B;

    if (!perim) {
      // Interior: floor slabs at ground, storey line, and roof; air otherwise.
      if (y === gr || rel === 5 || rel === ROOF - B) {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    const face = faces[0];
    const idx = face === "north" || face === "south" ? x : z;
    let block = null;
    let props = undefined;

    if (rel === 0) {
      block = "polished_andesite"; // base course
    } else if (rel >= 1 && rel <= 3) {
      // Ground-floor shopfront.
      if (face === "south" && idx === 7) {
        const half = rel === 1 ? "lower" : rel === 2 ? "upper" : null;
        if (half) {
          block = "dark_oak_door";
          props = { facing: "south", half, hinge: "left", open: "false", powered: "false" };
        } else {
          block = "light_blue_stained_glass";
        }
      } else if (idx % 4 === 0) {
        block = "gray_concrete";
      } else {
        block = "light_blue_stained_glass";
      }
    } else if (rel === 4) {
      block = "smooth_quartz"; // shopfront lintel / storey line
    } else if (rel >= 5 && rel <= 9) {
      if (rel === 5 || rel === 9) {
        block = "smooth_quartz"; // spandrels
      } else if (idx % 3 === 0) {
        block = "smooth_quartz"; // piers
      } else {
        block = "light_blue_stained_glass";
      }
    } else if (rel === 10) {
      block = "chiseled_quartz_block"; // cornice band
    } else if (rel === 11) {
      block = "smooth_quartz"; // parapet
    }

    if (block) g.set(x, y, z, block, props);
    if (rel === 7 && block === "light_blue_stained_glass" && idx % 6 === 1) {
      glowCells.push({ x, z, face });
    }
  }

  // Roof surface on interior cells (perimeter parapet already placed above).
  if (perim) {
    // nothing extra
  } else {
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Roof plant: small gray boxes on the roof, centred.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (has(x, z) && !perimeterSet.has(`${x},${z}`) && x >= 5 && x <= 10 && z >= 5 && z <= 10) {
    if ((x + z) % 2 === 0) {
      for (let y = ROOF + 1; y <= ROOF + 2; y++) g.set(x, y, z, "gray_concrete");
    }
  }
}

// Warm lights: glowstone on the inside of selected upper-storey windows.
for (const { x, z, face } of glowCells) {
  const [dx, dz] = inwardOf[face];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !perimeterSet.has(`${ix},${iz}`)) {
    g.set(ix, B + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
