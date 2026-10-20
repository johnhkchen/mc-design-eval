import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0167-4F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const W = 3, H = 33, D = 7;
const g = new Voxels([W, H, D]);

const ROOF_Y = 20;     // roof slab: 4 storeys of 5 blocks above the lowest ground
const PARAPET_Y = 21;  // parapet course; roof reads ~21 blocks above lowest ground
const TOP_Y = 23;      // roof plant top

const gnd = (x, z) => ground.get(`${x},${z}`) ?? 0;
const isRing = (x, z) => x === 0 || x === 2 || z === 0 || z === 6;
const isPier = (x, z) => (x === 0 || x === 2) && (z === 0 || z === 6);
const isMullion = (x, z) => (x === 0 || x === 2) && z === 3;
const isPlant = (x, z) => x === 1 && z >= 2 && z <= 4;

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const gy = Math.min(gnd(x, z), ROOF_Y);
    const ring = isRing(x, z);

    // Foundation: solid from y=0 up to this cell's ground
    for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

    for (let y = gy; y <= TOP_Y; y++) {
      // Ground floor plinth / floor
      if (y === gy) { g.set(x, y, z, "stone_bricks"); continue; }

      // Roof slab with a cornice course just beneath the parapet line
      if (y === ROOF_Y) { g.set(x, y, z, "light_gray_concrete"); continue; }

      // Parapet and roof plant
      if (y === PARAPET_Y) {
        if (ring) g.set(x, y, z, "white_concrete");
        else if (isPlant(x, z)) g.set(x, y, z, "light_gray_concrete");
        continue;
      }
      if (y > PARAPET_Y) {
        if (isPlant(x, z)) g.set(x, y, z, y === TOP_Y ? "iron_block" : "light_gray_concrete");
        continue;
      }

      // Entrance: iron door on the south face (z=6), stone lintel above
      if (ring && x === 1 && z === 6 && (y === gy + 1 || y === gy + 2)) {
        g.set(x, y, z, "iron_door", {
          facing: "south",
          half: y === gy + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (ring && x === 1 && z === 6 && y === gy + 3) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }

      // Storey lines (floor slabs / spandrels)
      if (y % 5 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }

      // Interior: air behind the glass, with warm glowstone lights
      if (!ring) {
        if (x === 1 && z === 2 && y % 5 === 2) g.set(x, y, z, "glowstone");
        else if (x === 1 && z === 4 && y % 5 === 3) g.set(x, y, z, "glowstone");
        continue;
      }

      // Facade ring: piers and mullions in white, glazing in tinted glass.
      // Ground floor glazing is a cooler shopfront tint so the street level reads apart.
      if (isPier(x, z) || isMullion(x, z)) g.set(x, y, z, "white_concrete");
      else if (y < gy + 4) g.set(x, y, z, "cyan_stained_glass");
      else g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
