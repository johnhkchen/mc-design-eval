import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296179";
const W = 21, H = 23, D = 14;

// Two-storey mid-century commercial block: stone-based shopfront, cream concrete
// upper storey with a window grid, stone cornice and parapet, flat roof with plant.
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, Math.round(g));
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

const F_LINE = 5;     // storey line / upper floor slab
const ROOF = 10;      // roof deck level
const PARAPET = 11;   // parapet top (roof ~11 above lowest ground)

const vox = new Voxels([W, H, D]);

const isPerimeter = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const missingDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: on the north (lowest z) edge if there is one, centred along it.
let door = null;
{
  const northCells = [];
  for (const [x, z] of ground.keys().toArray?.() ?? []) {}
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!has(x, z - 1)) northCells.push([x, z]);
  }
  if (northCells.length) {
    northCells.sort((a, b) => a[0] - b[0]);
    const [x, z] = northCells[Math.floor(northCells.length / 2)];
    door = { x, z, facing: "north" };
  } else {
    for (const k of ground.keys()) {
      const [x, z] = k.split(",").map(Number);
      const m = missingDirs(x, z);
      if (m.length) { door = { x, z, facing: m[0][2] }; break; }
    }
  }
}

let minG = Infinity;
for (const v of ground.values()) minG = Math.min(minG, v);

// Foundations: solid from y=0 up to each cell's ground.
for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gc; y++) vox.set(x, y, z, "stone_bricks");
}

for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerimeter(x, z);
  const idx = x + z;

  if (!perim) {
    // Interior: floor slabs and roof deck only; air between them.
    vox.set(x, F_LINE, z, "light_gray_concrete");
    vox.set(x, ROOF, z, "gray_concrete");
    // Rooftop plant units.
    if (x % 6 === 3 && z % 5 === 2) vox.set(x, PARAPET, z, "iron_block");
    continue;
  }

  const isDoorCell = door && door.x === x && door.z === z;

  for (let y = gc; y <= PARAPET; y++) {
    if (y === gc) {
      // Base course.
      vox.set(x, y, z, "polished_andesite");
    } else if (y < F_LINE) {
      // Ground-floor shopfront.
      if (y === 4) {
        vox.set(x, y, z, "smooth_quartz");                 // fascia band
      } else if (isDoorCell && (y === gc + 1 || y === gc + 2)) {
        const half = y === gc + 1 ? "lower" : "upper";
        vox.set(x, y, z, "dark_oak_door", {
          facing: door.facing, half, hinge: "left", open: "false", powered: "false",
        });
      } else if (idx % 3 === 0) {
        vox.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        vox.set(x, y, z, "light_blue_stained_glass_pane", {
          north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
        });
      }
    } else if (y === F_LINE) {
      vox.set(x, y, z, "smooth_stone");                    // storey line
    } else if (y <= 9) {
      // Upper storey window grid.
      if (y === 6 || y === 9) {
        vox.set(x, y, z, "light_gray_concrete");          // spandrels / head
      } else if (idx % 2 === 0) {
        vox.set(x, y, z, "light_blue_stained_glass_pane", {
          north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        vox.set(x, y, z, "white_concrete");               // mullion
      }
    } else if (y === ROOF) {
      vox.set(x, y, z, "stone_bricks");                    // cornice
    } else if (y === PARAPET) {
      vox.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Warm light: glowstone on interior cells behind some upper-floor windows.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;
  if ((x + z) % 4 !== 0) continue;
  const inward = DIRS
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([qx, qz]) => has(qx, qz) && !isPerimeter(qx, qz));
  if (inward) vox.set(inward[0], 7, inward[1], "glowstone");
}

// Ground-floor warm light behind a few shop windows.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;
  if ((x * 2 + z) % 7 !== 0) continue;
  const inward = DIRS
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([qx, qz]) => has(qx, qz) && !isPerimeter(qx, qz));
  if (inward) vox.set(inward[0], 2, inward[1], "shroomlight");
}

vox.save(`${BASE}/${ID}.nbt`);
