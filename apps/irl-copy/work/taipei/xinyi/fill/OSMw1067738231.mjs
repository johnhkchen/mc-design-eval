import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738231";
const W = 18, D = 24, H = 33;
const ROOF = 21;          // top block row of cornice / parapet
const DECK = 20;          // roof deck inside parapet
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));

// Choose the south-face (max z) entrance cell nearest the centre line.
const maxZ = Math.max(...cells.map(([, z]) => z));
const southCells = cells.filter(([, z]) => z === maxZ).map(([x]) => x);
const doorX = southCells.length
  ? southCells.reduce((best, x) => (Math.abs(x - 8) < Math.abs(best - 8) ? x : best))
  : null;
const doorZ = maxZ;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  const idx = edgeX ? z : x;              // position along the wall run
  const pier = corner || idx % 3 === 0;

  // Base course / ground floor slab.
  g.set(x, gr, z, perim ? "polished_granite" : "polished_andesite");

  for (let y = gr + 1; y <= ROOF; y++) {
    if (perim) {
      if (y === ROOF) {
        g.set(x, y, z, "smooth_quartz");                 // cornice / parapet cap
      } else if (y === DECK) {
        g.set(x, y, z, "light_gray_concrete");           // parapet course
      } else {
        const r = y % 5;
        if (r === 0 || r === 4) {
          g.set(x, y, z, "light_gray_concrete");         // spandrel / storey line
        } else if (pier) {
          g.set(x, y, z, "white_concrete");              // mullion / frame
        } else if (y < 5) {
          g.set(x, y, z, "light_blue_stained_glass");    // shopfront glazing
        } else {
          const lit = (x * 5 + z * 3 + y) % 13 === 0;
          g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
        }
      }
    } else {
      if (y === DECK) g.set(x, y, z, "gray_concrete");   // roof deck
      else if (y % 5 === 0 && y > gr) g.set(x, y, z, "smooth_stone"); // floor slab
    }
  }

  // Roof terraces and plant equipment on the interior roof deck.
  if (!perim) {
    if (x % 6 === 3 && z % 5 === 2) {
      g.set(x, ROOF + 1, z, "light_gray_concrete");
      g.set(x, ROOF + 2, z, "smooth_stone");
    } else if ((x * 2 + z) % 7 === 0) {
      g.set(x, ROOF + 1, z, "moss_block");
    }
  }
}

// Entrance on the street (south) face: door, lintel and surround.
if (doorX !== null) {
  const gr = Math.max(...cells.filter(([x, z]) => x === doorX && z === doorZ).map(([, , h]) => h));
  for (const dx of [doorX - 1, doorX, doorX + 1]) {
    if (has(dx, doorZ)) g.set(dx, gr + 3, doorZ, "smooth_quartz");
  }
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(doorX, gr + 1, doorZ, "dark_oak_door", { ...props, half: "lower" });
  g.set(doorX, gr + 2, doorZ, "dark_oak_door", { ...props, half: "upper" });
  // Warm shopfront light either side of the door.
  for (const dx of [doorX - 2, doorX + 2]) {
    if (has(dx, doorZ)) g.set(dx, gr + 2, doorZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
