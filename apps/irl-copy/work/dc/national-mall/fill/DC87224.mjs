import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87224.cells.json`, "utf8"));

const W = 7, H = 19, D = 3;
const g = new Voxels([W, H, D]);

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof });
const has = (x, z) => cell.has(`${x},${z}`);

const clampY = (y) => Math.max(0, Math.min(H - 1, y));
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// One clean roof tier for the whole block: the highest lidar reading, clamped.
let roofTop = 0;
for (const [, , , roof] of cells) roofTop = Math.max(roofTop, roof);
roofTop = Math.min(H - 1, Math.max(roofTop, 6));

const BAND = 3; // 2 clear rows of glazing + 1 floor line per storey

for (const [x, z, ground0] of cells) {
  const ground = Math.max(0, Math.min(ground0, roofTop - 6));
  const perimeter = x === 0 || x === 6 || z === 0 || z === 2;
  const front = z === 0;
  const back = z === 2;

  // Foundation up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, clampY(y), z, "stone_bricks");

  for (let y = ground; y <= roofTop; y++) {
    const rel = y - ground;
    const k = Math.floor(rel / BAND);
    const r = rel % BAND;

    // Roof parapet and cap
    if (y === roofTop) {
      put(x, y, z, perimeter ? "bricks" : "smooth_stone");
      continue;
    }
    // Cornice: stone course with a lip below the parapet
    if (y === roofTop - 1) {
      if (perimeter) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === roofTop - 2) {
      if (perimeter) put(x, y, z, "stone_bricks");
      else put(x, y, z, "smooth_stone");
      continue;
    }

    // Floor slab / storey line on every cell
    if (r === 0) {
      if (y === ground && perimeter) {
        put(x, y, z, "stone_bricks"); // base course
      } else {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    if (!perimeter) {
      // Interior: air behind glass, with one warm lamp behind an upper window
      if (k === 1 && x === 2 && z === 1 && r === 1) put(x, y, z, "glowstone");
      continue;
    }

    // Perimeter brick shell
    let block = "bricks";
    const winCol = x === 1 || x === 2 || x === 4 || x === 5;
    const bay = (front || back) && winCol && (r === 1 || r === 2);

    if (front || back) {
      if (k === 0 && front && x === 3 && (r === 1 || r === 2)) {
        // Entrance door on the H Street front
        const half = r === 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (bay) {
        if (k === 0 && front && (x === 1 || x === 5)) {
          block = "oak_planks"; // boarded vacant shopfront bays
        } else {
          block = "glass_pane";
        }
      }
    }
    put(x, y, z, block);
  }
}

g.save(`${DIR}/DC87224.nbt`);
