import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618831";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Footprint and ground per cell
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(x + "," + z, gg);
  minG = Math.min(minG, gg);
}
const base = minG;          // lowest ground under the footprint (0 by rule)
const T = base + 11;        // parapet top, roof about 11 blocks above lowest ground

const inF = (x, z) => ground.has(x + "," + z);
const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
// Outward facing direction for an edge cell, or null for interior cells
function outward(x, z) {
  if (!inF(x, z - 1)) return "north";
  if (!inF(x, z + 1)) return "south";
  if (!inF(x - 1, z)) return "west";
  if (!inF(x + 1, z)) return "east";
  return null;
}
const opposite = { north: "south", south: "north", west: "east", east: "west" };

// Pick the entrance: an edge cell facing south, nearest the middle; fallback any edge cell
let doorKey = null;
{
  let best = Infinity;
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    const o = outward(x, z);
    if (o === "south") {
      const score = Math.abs(x - 7);
      if (score < best) { best = score; doorKey = k; }
    }
  }
  if (doorKey === null) {
    for (const k of ground.keys()) {
      const [x, z] = k.split(",").map(Number);
      if (outward(x, z)) { doorKey = k; break; }
    }
  }
}

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const pillarUpper = (idx) => idx % 3 === 0;
const pillarShop = (idx) => idx % 4 === 0;

const glowCells = []; // [x, z] interior cells to light

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const edge = outward(x, z);
  const idx = x + z;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= T; y++) {
    const L = y - base;
    let b = null;
    let props = null;

    if (L === 0) {
      b = edge ? "polished_andesite" : "smooth_stone";            // base course / ground floor slab
    } else if (L === 5) {
      b = "smooth_quartz";                                        // floor slab between storeys
    } else if (L === 10) {
      b = "light_gray_concrete";                                  // roof slab
    } else if (edge) {
      if (L === 11) {
        b = "smooth_quartz";                                      // parapet
      } else if (L >= 1 && L <= 4) {
        if (L === 4) b = "red_concrete";                          // shop awning band
        else if (pillarShop(idx)) b = "smooth_quartz";
        else { b = "light_blue_stained_glass_pane"; props = PANE; }
      } else if (L >= 6 && L <= 9) {
        if (L === 6 || L === 9 || pillarUpper(idx)) b = "smooth_quartz";
        else { b = "light_blue_stained_glass_pane"; props = PANE; }
      } else {
        b = "smooth_quartz";
      }
    }

    // Entrance door on the chosen south-facing edge cell
    if (k === doorKey && edge && (L === 1 || L === 2)) {
      const facing = edge;
      const hinge = "left";
      if (L === 1) {
        g.set(x, y, z, "oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
      }
      continue;
    }

    if (b !== null) {
      if (props) g.set(x, y, z, b, props);
      else g.set(x, y, z, b);
    }
  }

  // Warm light behind some upper-floor windows
  if (edge && idx % 6 === 2) {
    const [dx, dz] = DIRS[opposite[edge]];
    const ix = x + dx, iz = z + dz;
    if (inF(ix, iz) && !outward(ix, iz)) glowCells.push([ix, iz]);
  }
}

// Interior glowstone at the upper floor level, behind selected windows
for (const [ix, iz] of glowCells) {
  g.set(ix, base + 7, iz, "glowstone");
}

// Roof water tank on a 3x3 interior block near the middle, if it fits
{
  const cx = 7, cz = 11;
  let fits = true;
  for (let x = cx - 1; x <= cx + 1 && fits; x++) {
    for (let z = cz - 1; z <= cz + 1; z++) {
      if (!inF(x, z) || outward(x, z)) { fits = false; break; }
    }
  }
  if (fits) {
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let z = cz - 1; z <= cz + 1; z++) {
        g.set(x, T, z, "iron_block");
        g.set(x, T + 1, z, "iron_block");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
