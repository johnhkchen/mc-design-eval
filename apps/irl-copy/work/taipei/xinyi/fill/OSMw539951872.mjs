import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Taipei commercial block: stone-clad shopfront at street level,
// two upper storeys of white-concrete bays with blue-tinted glass, flat roof with a
// smooth-stone parapet and a few rooftop units. Roof sits 11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951872";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const has = (x, z) => ground.has(`${x},${z}`);
const inBounds = (y) => y >= 0 && y < H;
const set = (x, y, z, id, props) => {
  if (!inBounds(y)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Walls running east-west (front/back faces) vs north-south (side faces)
const frontBack = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const sideFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const perimeter = (x, z) => frontBack(x, z) || sideFace(x, z);
const corner = (x, z) => frontBack(x, z) && sideFace(x, z);

// Entrance on the street (z = minZ) face, centred
const doorX = Math.floor((minX + maxX) / 2);

const pane = (x, z, id) => {
  if (frontBack(x, z)) {
    return [id, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];
  }
  return [id, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");

  const perim = perimeter(x, z);
  const bay = frontBack(x, z) ? x - minX : z - minZ;
  const pillar = corner(x, z) || bay % 3 === 0;
  const isDoor = frontBack(x, z) && z === minZ && x === doorX;

  for (let k = 0; k <= 10; k++) {
    const y = gr + k;

    if (k === 0) {
      set(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (k <= 3) {
      if (!perim) {
        // Interior ground floor: air, with occasional warm lanterns behind the glass
        if (k === 2 && (x + z) % 4 === 0) set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }
      if (isDoor) {
        if (k === 1) set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (k === 2) set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else set(x, y, z, "glass");
        continue;
      }
      if (pillar) {
        set(x, y, z, k === 3 ? "chiseled_stone_bricks" : "polished_andesite");
      } else {
        const [id, p] = pane(x, z, "light_blue_stained_glass_pane");
        set(x, y, z, id, p);
      }
      continue;
    }

    if (k === 4) {
      if (perim) {
        if (isDoor) set(x, y, z, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
        else set(x, y, z, "light_gray_concrete");
      } else {
        set(x, y, z, "smooth_quartz");
      }
      continue;
    }

    if (k >= 5 && k <= 8) {
      if (!perim) {
        // Interior upper floors: air, a few shroomlights behind windows
        if (k === 6 && (x * 3 + z) % 7 === 0) set(x, y, z, "shroomlight");
        continue;
      }
      if (corner(x, z)) {
        set(x, y, z, "white_concrete");
      } else if (pillar) {
        set(x, y, z, "white_concrete");
      } else if (k === 5 || k === 8) {
        set(x, y, z, "white_concrete"); // head and sill frames
      } else {
        const [id, p] = pane(x, z, "light_blue_stained_glass_pane");
        set(x, y, z, id, p);
      }
      continue;
    }

    if (k === 9) {
      set(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (k === 10) {
      if (perim) {
        set(x, y, z, "smooth_stone"); // parapet / cornice
      } else if (x % 5 === 2 && z % 4 === 1) {
        set(x, y, z, "iron_block"); // rooftop unit
      }
      continue;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
