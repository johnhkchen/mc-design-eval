import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey late-20th-century commercial block, Xinyi district.
// Street frontage is taken as the z=0 side (facing north).
// White tiled facade, red fascia over the shopfront, dark frames,
// flat roof with a cornice, stair housing and rooftop AC units.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888773";
const W = 14, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const minG = Math.min(...cells.map((c) => c[2]));
const R = minG + 11;      // cornice / roof level (about 11 blocks above lowest ground)
const SLAB = minG + 5;    // second-floor slab line
const CAP0 = minG + 4;    // ground-storey head / fascia
const Z0 = [minG + 1, minG + 3]; // ground window zone
const Z1 = [minG + 7, minG + 9]; // upper window zone

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const lights = []; // [x, y, z, id] interior light cells, placed after the shell

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const perim = isPerim(x, z);
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone"); // base course / ground floor

  // Which outward face (if any) this cell sits on, and its position along it.
  let face = null, u = 0, inX = 0, inZ = 0;
  if (perim) {
    if (!has(x, z - 1)) { face = "N"; u = x; inZ = 1; }
    else if (!has(x, z + 1)) { face = "S"; u = x; inZ = -1; }
    else if (!has(x - 1, z)) { face = "W"; u = z; inX = 1; }
    else if (!has(x + 1, z)) { face = "E"; u = z; inX = -1; }
  }

  for (let y = gr + 1; y <= R; y++) {
    if (!perim) {
      // Interior: air gap, with floor slabs and roof deck only.
      if (y === SLAB) put(x, y, z, "smooth_stone");
      else if (y === R) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter shell.
    if (y === R) { put(x, y, z, "quartz_block"); continue; }          // cornice
    if (y === SLAB) { put(x, y, z, "smooth_stone"); continue; }       // storey line
    if (y === CAP0) {
      put(x, y, z, face === "N" ? "red_concrete" : "white_concrete"); // fascia / head
      continue;
    }
    if (y === minG + 10) { put(x, y, z, "smooth_stone"); continue; }  // upper cap line

    const inZ0 = y >= Z0[0] && y <= Z0[1] && y > gr;
    const inZ1 = y >= Z1[0] && y <= Z1[1];
    if (!face || !(inZ0 || inZ1)) { put(x, y, z, "white_concrete"); continue; }

    // Front ground storey: double entrance at u = 6..7.
    if (inZ0 && face === "N" && (u === 6 || u === 7) && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      if (half === "lower" && u === 6) lights.push([x + inX, y + 1, z + inZ, "glowstone"]);
      continue;
    }

    // Glass vs piers. Shopfront uses black frames; upper floors use white piers.
    const pier = u % 3 === 0;
    if (pier) {
      put(x, y, z, inZ0 && face === "N" ? "black_concrete" : "white_concrete");
      continue;
    }
    put(x, y, z, "light_blue_stained_glass");

    // Warm lights behind some panes.
    if (inZ1 && y === minG + 8 && u % 6 === 1) lights.push([x + inX, y, z + inZ, "shroomlight"]);
    if (inZ0 && y === minG + 2 && u % 6 === 4) lights.push([x + inX, y, z + inZ, "glowstone"]);
  }
}

// Lights go behind glass in the interior air gap.
for (const [x, y, z, id] of lights) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  if (!has(x, z) || isPerim(x, z)) continue;
  put(x, y, z, id);
}

// Rooftop: stair housing near the back, AC units scattered over the deck.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 3 && x <= 8 && z >= 15 && z <= 19 && R + 2 < H) {
    put(x, R + 1, z, "white_concrete");
    put(x, R + 2, z, "white_concrete");
  } else if ((x + 2 * z) % 7 === 0 && R + 1 < H) {
    put(x, R + 1, z, "iron_block");
  }
}

g.save(`${SRC}/${ID}.nbt`);
