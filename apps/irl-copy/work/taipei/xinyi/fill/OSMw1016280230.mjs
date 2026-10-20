import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280230";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 52, D = 23;
const ROOF = 40;          // roof deck level, about 40 blocks above lowest ground
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const maxZ = Math.max(...cells.map(([, z]) => z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outer-wall test: any missing orthogonal neighbour
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
// Corner: missing neighbour on both axes
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Lit windows: sparse, warm glowstone behind the pane
const lit = (x, y, z) => ((x * 7 + z * 5 + y * 3) % 13) === 0;

// Door on the front (+z) face, near the middle
const doorX = Math.floor(W / 2);
const isDoor = (x, z) => z === maxZ && (x === doorX || x === doorX + 1);

for (const [x, z, gr] of cells) {
  const P = perim(x, z);
  const C = corner(x, z);
  const u = (((x + z) % 3) + 3) % 3;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Entrance door (lower at gr+1 on the granite base, upper at gr+2)
  if (P && isDoor(x, z)) {
    const hinge = x === doorX ? "left" : "right";
    put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  }

  for (let y = gr; y <= ROOF + 1; y++) {
    let b = null;

    if (y === gr) {
      // base course on the perimeter, floor slab inside
      b = P ? "polished_granite" : "gray_concrete";
    } else if (y === ROOF) {
      // roof deck (interior) / parapet cap (perimeter)
      b = P ? "white_concrete" : "gray_concrete";
    } else if (y === ROOF + 1) {
      // parapet only
      b = P ? "white_concrete" : null;
    } else if (!P) {
      // interior: floor slab per storey, air otherwise
      if (y % 5 === 0) b = "gray_concrete";
    } else if (y - gr < 5) {
      // ground storey shopfront
      if (isDoor(x, z) && (y === gr + 1 || y === gr + 2)) {
        b = null; // handled above
      } else if (C || u === 0) {
        b = "polished_andesite";
      } else if (y - gr === 4) {
        b = "white_concrete";
      } else {
        b = lit(x, y, z) ? "glowstone" : "light_blue_stained_glass";
      }
    } else if (y % 5 === 0) {
      // storey line
      b = "light_gray_concrete";
    } else if (y % 5 === 4) {
      // spandrel
      b = "white_concrete";
    } else {
      // window grid: piers and glass
      if (C || u === 0) b = "white_concrete";
      else b = lit(x, y, z) ? "glowstone" : "light_blue_stained_glass";
    }

    if (b) put(x, y, z, b);
  }
}

// Rooftop plant room and antenna in the centre of the roof
for (const [x, z] of cells) {
  if (x >= 11 && x <= 21 && z >= 8 && z <= 14) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    if (x >= 12 && x <= 20 && z >= 9 && z <= 13) {
      put(x, ROOF + 2, z, "light_gray_concrete");
      put(x, ROOF + 3, z, "gray_concrete");
    }
  }
}
for (let y = ROOF + 4; y <= ROOF + 8; y++) put(16, y, 11, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
