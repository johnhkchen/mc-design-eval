import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986977";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Record: roof surface about 11 blocks above lowest ground.
// Two storeys of ~5 blocks: ground storey y gr..4, floor slab y5, upper storey y6..8,
// cornice y9, roof deck y10 (top surface at y11). Rooftop plant to y12.
const ROOF_TOP = 10;

const key = (x, z) => x + "," + z;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const midX = Math.round((minX + maxX) / 2);

const set = (x, y, z, b, s) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (s) g.set(x, y, z, b, s); else g.set(x, y, z, b);
};

// Which outward face a perimeter cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", t: x, normal: "north" };
  if (!has(x, z + 1)) return { face: "S", t: x, normal: "south" };
  if (!has(x - 1, z)) return { face: "W", t: z, normal: "west" };
  if (!has(x + 1, z)) return { face: "E", t: z, normal: "east" };
  return null;
}

// Facade block for a perimeter wall cell at height y.
function facade(y, t, gr) {
  if (y === 9 || y === 5) return "smooth_quartz";
  if (y <= 4) {
    if (y === gr) return "polished_andesite";   // base course
    if (y === 4) return "smooth_quartz";        // ground-storey lintel
    if (t % 3 === 0) return "white_concrete";   // pillars
    return "light_blue_stained_glass";          // shopfront glass
  }
  // upper storey y6..8
  if (t % 3 === 0) return "white_concrete";
  if (y === 7 && t % 6 === 2) return "glowstone"; // lit office
  return "light_blue_stained_glass";
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, gr0);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  // Building levels from ground up to cornice.
  for (let y = gr; y <= 9; y++) {
    if (f) {
      set(x, y, z, facade(y, f.t, gr));
    } else {
      if (y === gr) set(x, y, z, "smooth_stone");     // ground floor slab
      else if (y === 5) set(x, y, z, "smooth_quartz"); // upper floor slab
      // else interior air
    }
  }

  // Roof deck y10 with coping on the perimeter.
  if (ROOF_TOP >= gr) {
    set(x, ROOF_TOP, z, f ? "smooth_quartz" : "gray_concrete");
  }
}

// Rooftop plant: 5x5 base, 3x3 cap.
for (const [x, z] of cells) {
  if (x >= 4 && x <= 8 && z >= 4 && z <= 8) set(x, 11, z, "light_gray_concrete");
  if (x >= 5 && x <= 7 && z >= 5 && z <= 7) set(x, 12, z, "stone_bricks");
}

// Warm lanterns on the four roof corners.
for (const [x, z] of cells) {
  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  if (corner) set(x, 11, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Entrance: centre of the north face, two blocks tall, glass door.
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  if (!f || f.face !== "N" || x !== midX || gr > 3) continue;
  const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(x, gr + 1, z, "oak_door", { ...base, half: "lower" });
  set(x, gr + 2, z, "oak_door", { ...base, half: "upper" });
}

g.save(`${DIR}/${ID}.nbt`);
