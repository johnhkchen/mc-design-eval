import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise Xinyi commercial block, c. 1990s: two storeys on a granite
// base, cream quartz-clad piers, tinted glazing, a recessed glass entrance and a
// roofline about 11 blocks above the lowest ground. The street face is the z-min side.
const ID = "OSMw543059915";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 31, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const FOUNDATION = "stone_bricks";
const FLOOR = "smooth_stone";
const BASE = "polished_granite";
const LINE = "smooth_stone";
const WALL = "quartz_block";
const PARAPET = "quartz_block";
const ROOF = "light_gray_concrete";
const PLANT = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const LAMP = "glowstone";

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};

const isFront = (x, z) => !inFp(x, z - 1);

for (const [x, z, g] of cells) {
  const xFace = !inFp(x - 1, z) || !inFp(x + 1, z);
  const zFace = !inFp(x, z - 1) || !inFp(x, z + 1);
  const perim = xFace || zFace;
  const corner = xFace && zFace;

  // Level plan (absolute y, relative to the lowest ground).
  const R = Math.max(10, g + 4);                     // roof deck / parapet base
  const F2 = Math.min(Math.max(g + 3, 5), R - 2);    // second-storey floor line

  // Foundation under every cell so nothing floats on the slope.
  for (let y = 0; y < g; y++) put(x, y, z, FOUNDATION);

  // Interior floors (ground and first-floor slabs), roof deck.
  if (!perim) {
    put(x, g, z, FLOOR);
    if (F2 > g) put(x, F2, z, FLOOR);
    put(x, R, z, ROOF);
  }

  if (!perim) continue;

  // Along-facade index selects the bay rhythm: piers every third cell.
  const u = zFace && !xFace ? x : z;
  const pier = corner || u % 3 === 0;
  const front = isFront(x, z);
  const entranceU = front && zFace && !xFace && x >= 11 && x <= 15;

  for (let y = g; y <= R; y++) {
    if (y === g) {
      put(x, y, z, BASE);
    } else if (y === R) {
      put(x, y, z, PARAPET);
    } else if (y === R - 1) {
      put(x, y, z, LINE);
    } else if (y === F2) {
      put(x, y, z, LINE);
    } else {
      // Window zones: ground storey (g+1..F2-1) and upper storey (F2+1..R-2).
      if (entranceU && y <= g + 2 && x === 13) {
        const half = y === g + 1 ? "lower" : "upper";
        if (y <= g + 2) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
      }
      if (entranceU && x !== 11 && x !== 15) {
        put(x, y, z, GLASS, zFace && !xFace
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        continue;
      }
      if (pier) {
        put(x, y, z, WALL);
      } else {
        const paneProps = zFace && !xFace
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, GLASS, paneProps);
      }
    }
  }

  // Warm lamps just inside a few windows, standing on the floor slab.
  if (!corner && !pier && (x + z) % 3 === 0) {
    let ix = x, iz = z;
    if (zFace && !xFace) iz = inFp(x, z + 1) ? z + 1 : z - 1;
    else ix = inFp(x + 1, z) ? x + 1 : x - 1;
    if (inFp(ix, iz) && !(!inFp(ix - 1, iz) || !inFp(ix + 1, iz) || !inFp(ix, iz - 1) || !inFp(ix, iz + 1))) {
      const lampY = (x + z) % 2 === 0 ? g + 1 : F2 + 1;
      if (lampY < R - 1) put(ix, lampY, iz, LAMP);
    }
  }
}

// Rooftop plant: a stone-clad mechanical room with a lower plant screen.
for (const [x, z, g] of cells) {
  const R = Math.max(10, g + 4);
  if (x >= 9 && x <= 13 && z >= 6 && z <= 11 && inFp(x, z)) {
    put(x, R + 1, z, ROOF);
    if (x >= 10 && x <= 12 && z >= 7 && z <= 10) put(x, R + 2, z, PLANT);
  }
}

// Entrance-side stone plinth marker and rooftop sign lights (warm, not interior).
for (const [x, z, g] of cells) {
  const R = Math.max(10, g + 4);
  if (isFront(x, z) && x === 13 && inFp(x, z)) {
    // Lintel above the doorway is the storey band; a hanging lantern sits under it.
    if (g + 3 < R - 1) put(x, g + 3, z, LINE);
  }
}

g3.save(`${DIR}/${ID}.nbt`);
