import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw540298915: 19 x 19 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey, c.1980s Taipei low-rise commercial block: stone-brick
// plinth, cream quartz walls with a quartz pillar grid, glass shopfronts at
// street level, glazed upper windows with some lit rooms, a centre-bay door,
// a quartz cornice, a stone-brick parapet and a few roof plant boxes.
// Storeys are 5 blocks each: L0 floor/plinth, L1-4 storey 1, L5 band,
// L6-9 storey 2, L10 roof deck/cornice, L11 parapet and plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw540298915.cells.json`, "utf8"));

const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => footprint.has(key(x, z));

const DOOR_X = 9;

for (const [x, z, groundRaw] of cells) {
  const gr = Math.max(0, Math.round(groundRaw));

  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const perim = exW || exE || exN || exS;

  // Position along the exposed facade: z along east/west faces, x along north/south.
  const t = (exW || exE) ? z : x;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  for (let L = 0; L <= 11; L++) {
    const y = gr + L;
    if (y >= H) break;

    if (!perim) {
      // Interior: floor and roof slabs only, air between so glass has a gap behind it.
      if (L === 0 || L === 5 || L === 10) {
        g.set(x, y, z, "smooth_quartz");
      } else if (L === 11 && x % 6 === 3 && z % 6 === 3) {
        // Roof plant boxes on a 6-block grid.
        g.set(x, y, z, "light_gray_concrete");
        if (y + 1 < H) g.set(x, y + 1, z, "light_gray_concrete");
      }
      continue;
    }

    // Perimeter wall.
    if (L === 0) {
      g.set(x, y, z, "stone_bricks");                 // base course
      continue;
    }
    if (L === 5 || L === 10) {
      g.set(x, y, z, "smooth_quartz");                // storey line / cornice
      continue;
    }
    if (L === 11) {
      g.set(x, y, z, "stone_brick_wall");             // parapet
      continue;
    }

    const pillar = t % 3 === 0;

    if (L <= 4) {
      // Storey 1: shopfront.
      const doorBay = exN && x === DOOR_X;
      if (doorBay && L <= 2) {
        const half = L === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (L === 4) {
        g.set(x, y, z, "smooth_quartz");              // spandrel under storey 2
        continue;
      }
      if (pillar) {
        g.set(x, y, z, "quartz_pillar");
      } else {
        g.set(x, y, z, "glass_pane");
      }
      continue;
    }

    // Storey 2 (L 6..9).
    if (L === 6 || L === 9) {
      g.set(x, y, z, "smooth_quartz");                // spandrels
      continue;
    }
    if (pillar) {
      g.set(x, y, z, "quartz_pillar");
    } else if (L === 7 && t % 6 === 1) {
      g.set(x, y, z, "glowstone");                    // lit room behind glass
    } else {
      g.set(x, y, z, "glass_pane");
    }
  }
}

g.save(`${DIR}/OSMw540298915.nbt`);
