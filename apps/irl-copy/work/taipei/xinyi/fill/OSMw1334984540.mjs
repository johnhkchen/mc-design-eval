import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334984540";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

// 司令台: a single-storey, flat-roofed reviewing pavilion (1960s–70s military/civic
// concrete). Solid back and sides with a band of windows, an open colonnade on the
// front (south, z = D-1) under a deep lintel, a central back entrance, a parapet,
// and a flagpole on the roof.
const W = 11, D = 8, H = 19;
const ROOF = 6;          // roof slab sits at y = 6, so the roof is ~7 blocks above the lowest ground
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, ROOF - 3);       // keep the storey clear of the roof slab

  // Foundation up to ground, then the floor slab at ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  const front = z === D - 1;
  const back = z === 0;
  const bandLo = gr + 2;
  const bandHi = Math.min(gr + 3, ROOF - 2);

  for (let y = gr + 1; y < ROOF; y++) {
    if (!edge) {
      // Interior: solid fill (no interiors), with warm light behind back-wall windows.
      if (z === 1 && (x === 3 || x === 7) && y >= bandLo && y <= bandHi) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (front) {
      // Open colonnade: pillars at x = 0, 1, 4, 7, 10; lintel on top; air between.
      if (y === ROOF - 1) {
        g.set(x, y, z, "white_concrete");
      } else if (x === 0 || x === 1 || x === 4 || x === 7 || x === W - 1) {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    // Solid walls (back and sides), with entrance and window band.
    if (back && x === 5 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    let isWindow = false;
    if (y >= bandLo && y <= bandHi) {
      if (back && x % 2 === 1 && x !== 1 + 0 * 0 - 0 + 0 && x > 0 && x < W - 1) isWindow = true;
      if ((x === 0 || x === W - 1) && z >= 2 && z <= 6 && z % 2 === 0) isWindow = true;
    }

    if (isWindow) {
      const props = (x === 0 || x === W - 1) ? GLASS_NS : GLASS_EW;
      g.set(x, y, z, "glass_pane", props);
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Lanterns hanging from the front lintel, in the colonnade bays.
  if (front && (x === 2 || x === 5 || x === 8)) {
    g.set(x, ROOF - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Roof slab over every cell, parapet around the perimeter.
  g.set(x, ROOF, z, "smooth_stone");
  if (edge) g.set(x, ROOF + 1, z, "white_concrete");
}

// Flagpole on the roof, near the centre, with a red flag.
g.set(5, ROOF + 1, 3, "iron_bars");
for (let y = ROOF + 2; y <= ROOF + 5; y++) g.set(5, y, 3, "iron_bars");
g.set(6, ROOF + 4, 3, "red_wool");
g.set(6, ROOF + 5, 3, "red_wool");

g.save(`${BASE}/${ID}.nbt`);
