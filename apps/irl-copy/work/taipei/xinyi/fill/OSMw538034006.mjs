import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034006";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward facing direction for an edge cell, or null for interior cells.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Footprint centre for roof plant placement.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Entrance: on the south (max z) edge, cell closest to the middle x.
let entrance = null;
for (const [x, z] of cells) {
  if (outward(x, z) === "south" && z === maxZ) {
    if (!entrance || Math.abs(x - cx) < Math.abs(entrance[0] - cx)) entrance = [x, z];
  }
}
if (!entrance) {
  // Fallback: any edge cell facing outward, nearest the middle.
  for (const [x, z] of cells) {
    if (outward(x, z) && (!entrance || Math.abs(x - cx) + Math.abs(z - cz) < Math.abs(entrance[0] - cx) + Math.abs(entrance[1] - cz))) {
      entrance = [x, z];
    }
  }
}
const entKey = entrance ? key(entrance[0], entrance[1]) : null;

// Storey plan (relative to each cell's own ground g0):
//   0        polished andesite base course (perimeter)
//   1..4     ground floor: shopfront glazing, piers
//   5        storey line band
//   6..9     upper floor: window grid with piers
//   10       parapet / roof slab
//   11..12   roof plant (central)
for (const [x, z, gr] of cells) {
  // Foundation down to the lowest ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const base = gr;
  const out = outward(x, z);

  if (!out) {
    // Interior: floor slabs per storey, roof slab, a few warm lights behind the air.
    put(x, base, z, "smooth_stone");
    put(x, base + 5, z, "smooth_stone");
    put(x, base + 10, z, "smooth_stone");
    if ((x * 3 + z * 5) % 7 === 0) {
      put(x, base + 2, z, "glowstone");
      put(x, base + 7, z, "glowstone");
    }
    // Roof plant on the central part of the roof.
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) {
      put(x, base + 11, z, "light_gray_concrete");
      if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
        put(x, base + 12, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // Perimeter (facade) cell.
  put(x, base, z, "polished_andesite");

  const isEntrance = entKey === key(x, z);
  const pier = (x + z) % 3 === 0;

  // Ground floor, levels 1..4.
  for (let dy = 1; dy <= 4; dy++) {
    if (isEntrance && dy <= 2) {
      put(x, base + dy, z, "oak_door", {
        facing: out,
        half: dy === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (pier) {
      put(x, base + dy, z, "polished_andesite");
    } else {
      put(x, base + dy, z, "glass");
    }
  }

  // Storey line.
  put(x, base + 5, z, "smooth_quartz");

  // Upper floor, levels 6..9: window grid.
  for (let dy = 6; dy <= 9; dy++) {
    if (pier) put(x, base + dy, z, "white_concrete");
    else put(x, base + dy, z, "light_blue_stained_glass");
  }

  // Parapet and roof edge.
  put(x, base + 10, z, "smooth_stone");
}

export { g };
g.save(`${DIR}/${ID}.nbt`);
