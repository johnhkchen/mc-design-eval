import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690437";

// Footprint: [x, z, ground] per cell. Footprint 19 x 23; roof ~11 above lowest ground.
// Read as a low-rise two-storey commercial block: stone foundation, cream
// smooth-quartz walls with white-concrete piers, glass window bays, stone
// storey lines and cornice, parapet, rooftop plant. Two storeys of ~5 blocks
// plus parapet gives the ~11 block roof height.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const g = new Voxels([19, 23, 23]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const corner = (x, z) => (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

// Front = the +z face. Door sits at the middle of that face.
let zmax = -Infinity;
for (const [, z] of cells) zmax = Math.max(zmax, z);
const frontXs = cells.filter(([, z]) => z === zmax).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

// Window bays: every third column along a wall is a white-concrete pier.
const isPier = (x, z) => corner(x, z) || (x + z) % 3 === 0;
const isDoor = (x, z, gr) => x === doorX && z === zmax && gr + 2 <= 4;

const winProps = {};
const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };

for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Storey floor slab at y=5 (interior) and roof deck at y=10.
  if (gr <= 5) g.set(x, 5, z, "smooth_quartz");
  if (gr <= 10) g.set(x, 10, z, "smooth_quartz");

  if (!perim(x, z)) {
    // Interior: air behind glass, only floor slabs. Shroomlight behind some upper windows.
    if (gr <= 6 && x % 5 === 2 && z % 7 === 3) g.set(x, 7, z, "shroomlight");
    // Rooftop plant room in the middle of the roof.
    if (x >= 5 && x <= 8 && z >= 8 && z <= 11) {
      g.set(x, 11, z, "light_gray_concrete");
      g.set(x, 12, z, "light_gray_concrete");
    }
    continue;
  }

  // ----- Perimeter (facade) -----

  // Ground floor: base course, shopfront glass in window bays, door on front.
  if (gr <= 4) {
    g.set(x, gr, z, "polished_andesite");
    for (let y = gr + 1; y <= 4; y++) {
      if (y === 5) continue;
      if (isDoor(x, z, gr)) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { ...doorProps, half: "lower" });
        } else if (y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", { ...doorProps, half: "upper" });
        } else {
          g.set(x, y, z, "smooth_quartz");
        }
      } else if (isPier(x, z)) {
        g.set(x, y, z, "white_concrete");
      } else if (y <= 3 && y >= gr + 1) {
        g.set(x, y, z, "glass_pane", winProps);
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
    }
    // Door canopy header: keep lintel above door as a stone block.
    if (isDoor(x, z, gr) && gr + 3 <= 4) g.set(x, gr + 3, z, "stone_bricks");
  }

  // Storey line at y=5.
  if (5 >= gr) g.set(x, 5, z, "stone_bricks");

  // Second floor: sill at 6, glass at 7-8, lintel at 9.
  if (gr <= 6) {
    g.set(x, 6, z, "smooth_quartz");
    for (const y of [7, 8]) {
      if (isPier(x, z)) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane", winProps);
    }
    g.set(x, 9, z, "smooth_quartz");
  }

  // Cornice band and parapet.
  g.set(x, 10, z, "stone_bricks");
  g.set(x, 11, z, "white_concrete");
}

// Warm lantern hung in the interior behind the entrance.
if (doorX >= 0) {
  const lz = zmax - 1;
  const gr = ground.get(key(doorX, zmax)) ?? 0;
  if (has(doorX, lz) && !perim(doorX, lz) && gr + 3 <= 4) {
    g.set(doorX, gr + 3, lz, "lantern", { hanging: "true" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
