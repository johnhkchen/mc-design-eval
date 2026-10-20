import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001608";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 21, D = 10;
const g = new Voxels([W, H, D]);

// Brownstone / brick Federal rowhouse, 1829.
const PITCH = 3;
const BRICK = "bricks";
const STONE = "smooth_sandstone";
const FOUND = "stone_bricks";
const FLOOR = "spruce_planks";
const DECK = "gray_concrete";

// One smoothed roof line for the whole house (median of lidar roofs),
// so the massing is a single clean flat-topped block with no stepped patches.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const TOP_ROOF = roofs[Math.floor(roofs.length / 2)];
const TOP = TOP_ROOF - 1;

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), { ground: gr });
const has = (x, z) => map.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, ground] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y 0 up to this cell's ground: nothing floats on a slope.
  for (let y = 0; y < ground; y++) put(x, y, z, FOUND);

  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const isExt = front || back || west || east;
  const frontBack = front || back;
  const sideOnly = (west || east) && !frontBack;

  for (let y = ground; y <= TOP; y++) {
    const rel = y - ground;
    const storey = Math.floor(rel / PITCH);
    const row = rel % PITCH; // 0 = belt course / floor line, 1..2 = glazed rows

    // Roof deck (interior) and sandstone cornice (perimeter).
    if (y === TOP) {
      put(x, y, z, isExt ? STONE : DECK);
      continue;
    }

    if (isExt) {
      // Brick wall with sandstone belt courses at each storey line.
      let block = row === 0 ? STONE : BRICK;

      // Front entrance: centred door, sandstone head above it.
      if (front && x === 2 && (rel === 0 || rel === 1)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: rel === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (front && x === 2 && rel === 2) block = STONE;

      // Front and back: two window bays per storey at x=1 and x=4.
      if (frontBack && (x === 1 || x === 4) && (row === 1 || row === 2)) {
        put(x, y, z, "glass_pane", {
          east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
        });
        continue;
      }

      // Exposed side walls: a single window bay at z=3 and z=6.
      if (sideOnly && (z === 3 || z === 6) && (row === 1 || row === 2)) {
        put(x, y, z, "glass_pane", {
          east: "false", west: "false", north: "true", south: "true", waterlogged: "false",
        });
        continue;
      }

      put(x, y, z, block);
    } else {
      // Interior: floor slabs at storey lines, otherwise air behind the glass.
      if (row === 0) {
        put(x, y, z, FLOOR);
      } else if (front && z === 1 && (x === 1 || x === 4) && row === 2) {
        // Warm glow behind some front windows.
        if ((x + storey) % 3 !== 0) put(x, y, z, "glowstone");
      } else if (front && z === 1 && x === 2 && rel === 2 && storey === 0) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// One brick chimney rising from the common roof line.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (x === 3 && z === 4) {
    for (let y = TOP + 1; y <= TOP + 2; y++) put(x, y, z, y === TOP + 2 ? STONE : BRICK);
  }
}

g.save(`${DIR}/${ID}.nbt`);
