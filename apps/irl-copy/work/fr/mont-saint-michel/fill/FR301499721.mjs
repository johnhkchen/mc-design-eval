import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499721.cells.json", "utf8"));

const W = 13, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => has.has(`${x},${z}`);
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// One flat roof level for the whole building: the mean lidar roof height, clamped.
const meanRoof = cells.reduce((a, c) => a + c[3], 0) / cells.length;
const R = Math.min(Math.max(Math.round(meanRoof), 10), H - 2); // roof surface level (top of block R-1)
const top = R - 1;

// Outward facing for an edge cell (prefer street side = north/south)
function outward(x, z) {
  if (!inFp(x, z - 1)) return "north";
  if (!inFp(x, z + 1)) return "south";
  if (!inFp(x - 1, z)) return "west";
  if (!inFp(x + 1, z)) return "east";
  return null;
}

// Pick a single entrance: the north-facing edge cell nearest the middle of the front
let doorCell = null;
for (const [x, z] of cells) {
  if (outward(x, z) === "north" && (doorCell === null || Math.abs(x - 6) < Math.abs(doorCell[0] - 6))) {
    doorCell = [x, z];
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid granite from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  const edge = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  const s = x + z;
  const facing = outward(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Common roof: cells lower than the roof level get walls up to R-1
  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    if (y === top) {
      g.set(x, y, z, edge ? "smooth_stone" : "stone_bricks");
      continue;
    }
    if (edge) {
      if (rel === 0) {
        if (isDoor) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "stone_bricks");
      } else if (rel === 1 && isDoor) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (rel <= 3) {
        // shopfront: dark oak piers and glazing with a lantern-lit window in the middle
        if (s % 3 === 0) g.set(x, y, z, "dark_oak_log", { axis: "y" });
        else if (rel === 2 && s % 6 === 1 && !isDoor) g.set(x, y, z, "glowstone");
        else g.set(x, y, z, "glass_pane", PANE);
      } else if (rel === 4) {
        // storey line / cornice band
        g.set(x, y, z, "smooth_stone");
      } else {
        // upper storey: window grid with stone mullions and spandrel course
        if (y % 4 === 0) g.set(x, y, z, "smooth_stone");
        else if (s % 3 === 0) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "glass_pane", PANE);
      }
    } else {
      // interior: ground storey air gap behind the shopfront, floor slab at the storey line, solid core above
      if (rel === 4) g.set(x, y, z, "stone_bricks");
      else if (rel >= 5) g.set(x, y, z, "stone_bricks");
      else if (rel === 2 && s % 4 === 0) g.set(x, y, z, "glowstone");
    }
  }
}

// Single chimney on an interior roof cell
for (const [x, z] of cells) {
  const edge = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  if (!edge && x === 3 && z === 8) {
    g.set(x, R, z, "bricks");
    g.set(x, R + 1, z, "bricks");
    break;
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499721.nbt");
