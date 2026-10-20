import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343711";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Record: 19x19 footprint, roof ~11 blocks above lowest ground, 2 storeys of ~5 blocks.
// Era: late-1990s Xinyi mid-rise, pale concrete frame, tinted blue glazing,
// stone-clad plinth, light-grey concrete pillars, flat roof with parapet and plant.
const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const S = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => S.has(key(x, z));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const doorX = Math.floor((minX + maxX) / 2);

const ROOF = 10;      // roof slab level (top of storey 2)
const PARAPET = 11;   // parapet / plant level, ~11 above lowest ground
const FLOOR = 5;      // storey line between floors

const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

for (const [x, z, ground] of cells) {
  const gr = Math.max(0, Math.round(ground));
  const perim = isPerim(x, z);
  const onEdge = (z === minZ || z === maxZ) || (x === minX || x === maxX);
  const pillar =
    ((z === minZ || z === maxZ) && x % 3 === 0) ||
    ((x === minX || x === maxX) && z % 3 === 0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys, roof and walls from the cell's ground up to the roof slab.
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!perim) {
      if (y === FLOOR || y === gr) put(x, y, z, "light_gray_concrete");
      // Warm glow behind the front-row glass on the upper storey.
      if (y === 7 && z === minZ + 1 && (x - minX) % 6 === 2) put(x, y, z, "glowstone");
      continue;
    }

    // Perimeter facade.
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }      // plinth course
    if (y === FLOOR) { put(x, y, z, "white_concrete"); continue; } // storey line

    // Front entrance on the lower-left-centre of the south (min z) face.
    if (z === minZ && x === doorX && y < FLOOR && y === gr + 1) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (z === minZ && x === doorX && y < FLOOR && y === gr + 2) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // Entrance lanterns flanking the door, hung under the lintel.
    if (z === minZ && Math.abs(x - doorX) === 2 && y === gr + 3 && y < FLOOR) {
      put(x, y, z, "lantern", { hanging: "true" });
      continue;
    }

    if (y < FLOOR) {
      // Ground floor: shopfront glazing with lintel at the top.
      if (pillar) put(x, y, z, "light_gray_concrete");
      else if (y === FLOOR - 1) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    } else {
      // Upper storey: sill at 6, glazing 7-8, lintel at 9.
      if (pillar) put(x, y, z, "light_gray_concrete");
      else if (y === 6 || y === 9) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet and roof plant above the roof slab.
  if (perim) {
    put(x, PARAPET, z, pillar || (onEdge && (x === minX || x === maxX) && (z === minZ || z === maxZ))
      ? "light_gray_concrete" : "white_concrete");
  } else if ((x - minX) % 7 === 3 && (z - minZ) % 7 === 3) {
    put(x, PARAPET, z, "iron_block"); // rooftop air handling unit
  }
}

g.save(`${dir}/${id}.nbt`);
