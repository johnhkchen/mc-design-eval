import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001591.cells.json`, "utf8"));

const W = 10, H = 20, D = 3;
const g = new Voxels([W, H, D]);

const clampY = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));

const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, c);

const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const STAIR_STOOP = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };

// Pass 1: foundations, tops and per-cell records
const rec = {};
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cellMap.get(`${x},${z}`);
    const groundRaw = c ? c[2] : 0;
    const roofRaw = c && c[3] != null ? c[3] : groundRaw + 8;
    const gr = clampY(groundRaw, 0, H - 10);
    const top = clampY(Math.max(roofRaw, gr + 8), gr + 8, H - 2);
    rec[`${x},${z}`] = { gr, top };
  }
}

// Pass 2: massing and facades
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const { gr, top } = rec[`${x},${z}`];

    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const front = z === 0;
    const rear = z === D - 1;
    // Windows on front and rear, between piers at x = 0,3,6,9
    const windowCol = (front || rear) && x > 0 && x < W - 1 && x % 3 !== 0;
    // Entrance on the front at x=4 (stoop cell is in front row)
    const doorCol = front && x === 4;

    // Foundation below grade
    for (let y = 0; y < gr; y++) {
      g.set(x, y, z, "stone_bricks");
    }

    // Ground storey: base course at gr, window row at gr+1
    if (perim) {
      if (doorCol) {
        g.set(x, gr, z, "stone_bricks");        // stoop/threshold
        g.set(x, gr + 1, z, "dark_oak_door", DOOR_LOWER);
        g.set(x, gr + 2, z, "dark_oak_door", DOOR_UPPER);
      } else {
        g.set(x, gr, z, "brown_terracotta");
        g.set(x, gr + 1, z, windowCol ? "glass_pane" : "brown_terracotta", windowCol ? GLASS_EW : undefined);
      }
    } else {
      g.set(x, gr, z, "spruce_planks");         // ground floor slab
    }

    // Upper storeys: spandrel row (even offset) and window row (odd offset)
    for (let s = 1; gr + 2 * s + 1 <= top - 3; s++) {
      const ySpan = gr + 2 * s;
      const yWin = gr + 2 * s + 1;

      if (perim) {
        g.set(x, ySpan, z, "brick");
        g.set(x, yWin, z, windowCol ? "glass_pane" : "brick", windowCol ? GLASS_EW : undefined);
      } else {
        g.set(x, ySpan, z, "spruce_planks");   // floor slab
        if (z === 1 && x % 3 === 2 && s % 2 === 1) {
          g.set(x, yWin, z, "glowstone");      // warm light behind front window
        }
      }
    }

    // Roof: cornice course, then a parapet of full blocks; flat tar roof inside
    if (perim) {
      g.set(x, top - 2, z, "chiseled_stone_bricks");
      g.set(x, top - 1, z, "stone_bricks");
    } else {
      g.set(x, top - 2, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/NYC3001591.nbt`);
