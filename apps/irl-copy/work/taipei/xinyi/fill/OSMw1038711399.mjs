import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711399";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 25 x 17. Two-storey commercial block (c. 1980s-90s Xinyi low-rise):
// stone base, white tiled concrete walls, storey line at y=5, cornice at y=10,
// parapet to y=11, glass shopfront on the ground floor, glass-and-pier windows above.
const W = 25, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front entrance: middle cell of the lowest-z row, facing north (outward = -z).
const minZ = Math.min(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = minZ;

for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 9);       // keep the building within the volume
  const perim = isPerim(x, z);
  const isDoor = perim && x === doorX && z === doorZ;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level slab / base course.
  if (perim) g.set(x, gr, z, "stone_bricks");
  else g.set(x, gr, z, "smooth_stone");

  if (perim) {
    // Walls from above ground to the parapet at y=11.
    for (let y = gr + 1; y <= 11; y++) {
      if (y <= 4) {
        // Ground-floor shopfront.
        if (isDoor && (y === gr + 1 || y === gr + 2)) {
          g.set(x, y, z, "oak_door", {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (isDoor && y === gr + 3) {
          g.set(x, y, z, "smooth_stone");
        } else if ((x + z) % 4 === 0) {
          g.set(x, y, z, "dark_oak_planks");   // dark shopfront piers
        } else {
          g.set(x, y, z, "glass");
        }
      } else if (y === 5) {
        g.set(x, y, z, "smooth_stone");        // storey line
      } else if (y >= 6 && y <= 9) {
        if (y === 6 || y === 9) {
          g.set(x, y, z, "white_concrete");    // spandrels
        } else if ((x + z) % 3 === 0) {
          g.set(x, y, z, "white_concrete");    // window piers
        } else if (y === 7 && (x * 3 + z) % 7 === 0) {
          g.set(x, y, z, "glowstone");         // lit window
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane");
        }
      } else if (y === 10) {
        g.set(x, y, z, "smooth_stone");        // cornice
      } else if (y === 11) {
        g.set(x, y, z, "white_concrete");      // parapet
      }
    }
  } else {
    // Interior: floor slabs per storey and the roof deck, no interior fitout.
    if (gr < 5) g.set(x, 5, z, "light_gray_concrete");
    g.set(x, 10, z, "gray_concrete");
    // Roof plant on a sparse grid.
    if (x % 6 === 3 && z % 5 === 2) g.set(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
