import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3395701.cells.json`, "utf8"));

const W = 5, H = 17, D = 5;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  cellMap.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cellMap.get(`${x},${z}`);
    if (!c) continue;

    const gr = c.gr;
    // Keep at least 5 courses above ground so the storey, sills and cornice all fit
    const top = Math.max(c.rf, gr + 5);
    const cap = Math.min(top - 1, H - 2);
    const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const frontFace = z === 0;
    const doorCell = frontFace && x === 2;
    const eastWest = z === 0 || z === D - 1;

    // Foundation: solid stone from y 0 up to this cell's ground
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
    // Base course
    put(x, gr, z, "stone_bricks");

    if (!perimeter) {
      // Interior mass (no interiors): brick up to the roof deck
      for (let y = gr + 1; y < cap; y++) put(x, y, z, "bricks");
    } else {
      for (let y = gr + 1; y < cap; y++) {
        // Door, two blocks tall, centred on the front face
        if (doorCell && (y === gr + 1 || y === gr + 2)) continue;

        // Window row with a stone sill below and a stone lintel above
        if (!corner && !doorCell && (y === gr + 2 || y === gr + 1 || y === gr + 3)) {
          if (y === gr + 2) {
            put(x, y, z, "glass_pane", eastWest
              ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
              : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
          } else if (y === gr + 1) {
            // Sill: bottom slab, sits on the brick course below
            put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
          } else {
            // Lintel: top slab, a horizontal band over the glass
            put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
          }
          continue;
        }

        // Hanging lanterns flanking the entrance, under the top course
        if (frontFace && (x === 1 || x === 3) && y === gr + 3 && cap >= gr + 4) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }

        // Cornice band: stone slab just below the roof deck
        if (y === cap - 1) {
          put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
          continue;
        }

        put(x, y, z, "bricks");
      }
    }

    // Roof deck course over every cell
    put(x, cap, z, "smooth_stone");

    // Coping on the perimeter edge of the roof
    if (perimeter && cap + 1 < H) {
      put(x, cap + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// Door on the front (north, z = 0) face, centred at x = 2
const doorBase = cellMap.get("2,0");
if (doorBase) {
  const gr = doorBase.gr;
  put(2, gr + 1, 0, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, gr + 2, 0, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/NYC3395701.nbt`);
