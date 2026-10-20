import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s Taipei commercial block: plinth, shopfront with red sign band,
// two upper storeys of glazed bays between quartz piers, cornice and parapet,
// flat roof with rooftop plant. Roof at 11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833626";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const TOP = 10;      // last solid course of the walls / parapet
const DECK = 9;      // cornice level, roof deck
const FLOOR = 4;     // slab between ground storey and upper storey
const key = (x, z) => x + "," + z;

// Ground heights relative to the lowest ground under the footprint.
const base = Math.min(...cells.map(([, , gr]) => gr));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.min(Math.round(gr - base), H - 2));
}
const inside = (x, z) => ground.has(key(x, z));

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isPerim = (x, z) => exteriorDirs(x, z).length > 0;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Walls, floor slabs, cornice, parapet.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const perim = isPerim(x, z);

  if (!perim) {
    // Interior: floor slab and roof deck only; air between.
    for (const y of [FLOOR, DECK]) {
      if (y >= gr) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const [dx, dz] = exteriorDirs(x, z)[0];
  const t = dx !== 0 ? z : x; // coordinate along the facade

  for (let y = gr; y <= TOP; y++) {
    let id;
    if (y === gr) {
      id = "polished_andesite";                       // plinth
    } else if (y <= 2) {
      // Shopfront: glass bays with dark frames.
      id = t % 4 === 0 ? "black_concrete" : "light_blue_stained_glass";
    } else if (y === 3) {
      id = "red_terracotta";                          // shop sign band
    } else if (y === FLOOR) {
      id = "smooth_quartz";                           // spandrel
    } else if (y === 5) {
      id = "smooth_quartz";                           // sill course
    } else if (y === 6 || y === 7) {
      // Upper glazing with quartz piers and dark mullions.
      if (t % 4 === 0) id = "smooth_quartz";
      else if (t % 4 === 3) id = "black_concrete";
      else id = "light_blue_stained_glass";
    } else if (y === 8) {
      id = "smooth_quartz";                           // spandrel
    } else if (y === DECK) {
      id = "quartz_slab";                             // cornice course
    } else {
      id = "smooth_quartz";                           // parapet
    }
    g.set(x, y, z, id, id === "quartz_slab" ? { type: "bottom" } : undefined);
  }
}

// 3. Warm light behind some glass: glowstone in the interior cell behind a window.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const gr = ground.get(key(x, z));
  const [dx, dz] = exteriorDirs(x, z)[0];
  const t = dx !== 0 ? z : x;
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  const igr = ground.get(key(ix, iz));

  // Upper storey, window row y=6.
  if (gr <= 6 && igr <= 6 && (t % 4 === 1 || t % 4 === 2) && t % 8 === 1) {
    g.set(ix, 6, iz, "glowstone");
  }
  // Shopfront, row y=1.
  if (gr <= 1 && igr <= 1 && (t % 4 === 1 || t % 4 === 2) && t % 12 === 2) {
    g.set(ix, 1, iz, "shroomlight");
  }
}

// 4. Entrance on the street (north) face, if there is one; otherwise any exterior face.
let door = null;
const northCells = cells
  .filter(([x, z]) => exteriorDirs(x, z).some(([dx, dz]) => dx === 0 && dz === -1))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  door = northCells[Math.floor(northCells.length / 2)];
} else {
  door = cells.find(([x, z]) => isPerim(x, z));
}
if (door) {
  const [x, z] = door;
  const gr = ground.get(key(x, z));
  const [dx, dz, name] = exteriorDirs(x, z)[0];
  const facing = name;
  // Ensure the entrance bay is clear of the shopfront glazing.
  g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern on the cell beside the door, standing on the plinth course.
  const side = dz !== 0 ? [1, 0] : [0, 1];
  const lx = x + side[0], lz = z + side[1];
  if (inside(lx, lz) && ground.get(key(lx, lz)) <= gr + 1 && isPerim(lx, lz)) {
    g.set(lx, gr + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. Rooftop plant on the roof deck of interior cells.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x % 6 === 3 && z % 6 === 3 && ground.get(key(x, z)) <= DECK) {
    g.set(x, TOP, z, "white_concrete");
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
