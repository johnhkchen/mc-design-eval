import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87262.cells.json`, "utf8"));

const W = 12, D = 2, H = 15;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const cm = new Map();
for (const [x, z, gr, roof] of cells) {
  cm.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}

// One-storey brick commercial annex on a stone base: stone pilasters frame a
// glazed shopfront, a polished transom band sits above the glass, a central
// door pair with a lintel course, and a stone cornice over the whole front.
const PILASTER_X = new Set([0, 3, 6, 9, 11]);
const DOOR_X = new Set([4, 5]);
const LANTERN_X = new Set([2, 8]);

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cm.get(`${x},${z}`);
    if (!c) continue;

    const gr = clamp(c.gr, 0, H - 5);
    const roof = clamp(c.roof, gr + 3, H - 2);
    const front = z === 0;

    // Foundation: solid from y0 up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

    // Base course at ground level, slightly proud on the street face
    g.set(x, gr, z, front ? "stone_bricks" : "polished_andesite");

    // Walls from base course to roof
    for (let y = gr + 1; y <= roof - 1; y++) {
      const k = y - gr;

      if (!front) {
        g.set(x, y, z, "bricks");
        continue;
      }

      if (PILASTER_X.has(x)) {
        g.set(x, y, z, "stone_bricks");
      } else if (DOOR_X.has(x)) {
        // Door occupies k=1..2; lintel course above it
        if (k <= 2) {
          g.set(x, y, z, "bricks");
        } else {
          g.set(x, y, z, "polished_andesite");
        }
      } else if (k === 1) {
        // Glazed shopfront band with a dark frame behind the pane
        g.set(x, y, z, "glass_pane", {
          east: "false", west: "false", north: "false", south: "false", waterlogged: "false",
        });
      } else if (k === 2) {
        // Transom course above the glass; warm lanterns hang here
        if (LANTERN_X.has(x)) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          g.set(x, y, z, "polished_andesite");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    }

    // Entrance doors: two-high pair, hinged on the outer leaves
    if (front && DOOR_X.has(x)) {
      const hinge = x === 4 ? "left" : "right";
      g.set(x, gr + 1, z, "oak_door", {
        facing: "north", half: "lower", hinge, open: "false", powered: "false",
      });
      if (roof - 1 >= gr + 2) {
        g.set(x, gr + 2, z, "oak_door", {
          facing: "north", half: "upper", hinge, open: "false", powered: "false",
        });
      }
    }

    // Cornice / roof deck resting directly on the wall tops
    g.set(x, roof, z, front ? "smooth_stone_slab" : "stone_brick_slab", {
      type: "bottom", waterlogged: "false",
    });
  }
}

g.save(`${DIR}/DC87262.nbt`);
