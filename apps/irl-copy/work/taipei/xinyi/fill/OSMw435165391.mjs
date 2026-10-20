import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw435165391";
const W = 28, H = 23, D = 26;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward neighbour directions: [dx, dz, facing name, inward dx, inward dz]
const SIDES = {
  n: { dx: 0, dz: -1, facing: "north", ix: 0, iz: 1 },
  s: { dx: 0, dz: 1, facing: "south", ix: 0, iz: -1 },
  e: { dx: 1, dz: 0, facing: "east", ix: -1, iz: 0 },
  w: { dx: -1, dz: 0, facing: "west", ix: 1, iz: 0 },
};
const facesOf = (x, z) =>
  Object.keys(SIDES).filter((k) => !has(x + SIDES[k].dx, z + SIDES[k].dz));

// Roof sits about 11 blocks above the lowest ground: parapet top at y 10.
const TOP = 10;
const BAND_END = 4;      // ground storey runs y gr..4
const LINE_LOW = 5;      // storey line / floor slab
const LINE_HIGH = 9;     // cornice line under parapet

// Door on the south-facing side, at the median x of that face.
const southTs = cells
  .filter(([x, z]) => facesOf(x, z).includes("s"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorT = southTs.length ? southTs[Math.floor(southTs.length / 2)] : null;

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fs = facesOf(x, z);

  if (fs.length === 0) {
    // Interior: floor slab per storey, roof deck, air between. No fit-out.
    const floorY = Math.max(LINE_LOW, gr);
    if (floorY < H) g.set(x, floorY, z, "light_gray_concrete");
    if (gr <= TOP) g.set(x, TOP, z, "light_gray_concrete");

    // Roof plant: a small plinth and housing on the roof deck.
    if (x >= 10 && x <= 16 && z >= 9 && z <= 15) g.set(x, TOP + 1, z, "light_gray_concrete");
    if (x >= 11 && x <= 15 && z >= 10 && z <= 14) g.set(x, TOP + 2, z, "smooth_quartz");
    continue;
  }

  // Perimeter: pick the primary face and bay index along it.
  const primary = fs.includes("s") ? "s" : fs.includes("n") ? "n" : fs[0];
  const t = primary === "n" || primary === "s" ? x : z;
  const isDoor = fs.includes("s") && t === doorT;
  const bay = t % 4;
  const win = bay === 1 || bay === 2; // two-wide glazing, one-wide piers

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y <= BAND_END) {
      // Ground storey: shopfront glazing, stone piers, entrance on the south face.
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === gr + 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (isDoor && y >= gr + 4) {
        g.set(x, y, z, "white_concrete");
      } else if (win) {
        g.set(x, y, z, "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else if (y === LINE_LOW) {
      g.set(x, y, z, "light_gray_concrete"); // storey line
    } else if (y === LINE_HIGH) {
      g.set(x, y, z, "smooth_quartz"); // cornice line
    } else if (y === TOP) {
      g.set(x, y, z, "white_concrete"); // parapet
    } else {
      // Upper storey (y 6..8): glazing in bays, piers between.
      g.set(x, y, z, win ? "light_blue_stained_glass" : "white_concrete");
    }
  }

  // Warm light behind some glazing, placed in the adjacent interior cell.
  if (win) {
    const side = SIDES[primary];
    const ix = x + side.ix, iz = z + side.iz;
    if (has(ix, iz) && facesOf(ix, iz).length === 0) {
      if (t % 8 === 1) g.set(ix, 7, iz, "glowstone");
      if (t % 8 === 2 && gr + 2 <= BAND_END) g.set(ix, gr + 2, iz, "shroomlight");
    }
  }
}

g.save(`${SRC}/${ID}.nbt`);
