import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950878";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 10 x 13 footprint, roof ~11 blocks above lowest ground: a two-storey pale-tile
// shophouse with a red fascia, a glazed ground-floor shopfront and a rooftop plant box.
const W = 10, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const low = Math.min(...cells.map((c) => c[2]));

const outsOf = (x, z) => Object.keys(DIRS).filter(
  (k) => !has(x + DIRS[k][0], z + DIRS[k][1]),
);
const isWall = (x, z) => outsOf(x, z).length > 0;

// Entrance: on the north face if present, otherwise the south face; middle cell of that run.
let doorKey = null, doorFace = null;
for (const face of ["N", "S"]) {
  const run = cells
    .filter(([x, z]) => outsOf(x, z).includes(face) && !outsOf(x, z).some((k) => k === "E" || k === "W"))
    .map(([x, z]) => x)
    .sort((a, b) => a - b);
  if (run.length) {
    const cx = run[Math.floor(run.length / 2)];
    const cz = cells.find(([x, z]) => x === cx && outsOf(x, z).includes(face))[1];
    doorKey = `${cx},${cz}`;
    doorFace = face;
    break;
  }
}
const doorFacing = doorFace === "N" ? "north" : "south";

const inwardOf = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

for (const [x, z, gr] of cells) {
  const base = gr - low;
  const outs = outsOf(x, z);
  const wall = outs.length > 0;
  const corner = outs.some((k) => k === "N" || k === "S") && outs.some((k) => k === "E" || k === "W");
  const ew = outs.some((k) => k === "E" || k === "W"); // wall runs along z
  const t = ew ? z : x;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const paneProps = ew
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  if (!wall) {
    // Interior: floor slabs at ground, storey line and roof; air elsewhere.
    if (base <= 10) g.set(x, base, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, 11, z, "light_gray_concrete");
    // Rooftop plant enclosure.
    if (x >= 3 && x <= 5 && z >= 4 && z <= 8) {
      g.set(x, 12, z, "gray_concrete");
      g.set(x, 13, z, "light_gray_concrete");
    }
    continue;
  }

  // Roof deck at the top of the walls.
  g.set(x, 11, z, "smooth_stone");

  for (let y = base; y <= 10; y++) {
    if (y < 0) continue;
    const win = t % 3 !== 0;
    let id = null, props = undefined;

    if (corner) {
      id = "white_concrete";
    } else if (y <= 1) {
      id = "polished_andesite";
    } else if (y === 2 || y === 3) {
      if (doorKey === `${x},${z}`) {
        id = "dark_oak_door";
        props = { facing: doorFacing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else if (win) {
        id = "light_blue_stained_glass_pane"; props = paneProps;
      } else {
        id = "white_concrete";
      }
    } else if (y === 4) {
      id = "red_concrete";
    } else if (y === 5) {
      id = "white_concrete";
    } else if (y === 6 || y === 9) {
      id = "smooth_quartz";
    } else if (y === 7 || y === 8) {
      if (win) { id = "light_blue_stained_glass_pane"; props = paneProps; }
      else id = "white_concrete";
    } else if (y === 10) {
      id = "white_concrete";
    }

    if (id) {
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    }
  }

  // Warm light behind some upper-floor windows (one cell inside the glass).
  if (!corner && t % 6 === 1 && outs.length === 1) {
    const [ix, iz] = inwardOf[outs[0]];
    const nx = x + ix, nz = z + iz;
    if (has(nx, nz) && !isWall(nx, nz)) g.set(nx, 7, nz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
