import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988094";
const W = 15, H = 23, D = 13;
const TOP = 10; // parapet course sits at y=10, roof at y=11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const isBoundary = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const isCorner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

// Southern-most footprint row (max z) carries the entrance.
const maxZ = Math.max(...cells.map(([, z]) => z));
const southXs = cells.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs[Math.floor(southXs.length / 2)];

const g = new Voxels([W, H, D]);

// Storey lines: ground floor g..4, second floor 5..9, parapet at 10.
const SECOND_FLOOR_Y = 5;
const WINDOW_YS_LOW = [1, 2, 3];   // offsets above ground for ground-floor glazing
const WINDOW_YS_UP = [6, 7, 8];    // absolute y for upper glazing

for (const [x, z, gr] of cells) {
  if (gr < 0 || gr >= H) continue;

  // Foundation: solid stone from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const boundary = isBoundary(x, z);

  if (!boundary) {
    // Interior: floor slabs only, air gap between them (no interiors).
    if (gr <= TOP) g.set(x, gr, z, "light_gray_concrete");
    if (SECOND_FLOOR_Y > gr) g.set(x, SECOND_FLOOR_Y, z, "light_gray_concrete");
    g.set(x, TOP, z, "gray_concrete"); // roof deck
    // Warm light behind the glazing on the upper floor.
    if ((x * 3 + z) % 4 === 0) g.set(x, 7, z, "glowstone");
    // Roof plant boxes.
    if (x % 4 === 1 && z % 4 === 1) g.set(x, TOP + 1, z, "iron_block");
    continue;
  }

  const corner = isCorner(x, z);
  const isEntrance = z === maxZ && x === doorX;

  // Walls from this cell's ground up to just below the parapet.
  for (let y = gr; y < TOP; y++) {
    if (y === gr) {
      g.set(x, y, z, "polished_granite"); // base course
      continue;
    }
    if (y === SECOND_FLOOR_Y) {
      g.set(x, y, z, "smooth_quartz"); // storey line
      continue;
    }
    if (isEntrance && y <= gr + 2) {
      g.set(x, y, z, "glass"); // entrance glazing
      continue;
    }
    if (isEntrance && y === gr + 3) {
      g.set(x, y, z, "smooth_quartz"); // entrance lintel
      continue;
    }
    if (corner) {
      g.set(x, y, z, "quartz_pillar");
      continue;
    }
    const upperWindow = WINDOW_YS_UP.includes(y);
    const lowerWindow = WINDOW_YS_LOW.includes(y - gr);
    const bay = (x + z) % 2 === 0;
    if ((upperWindow || lowerWindow) && bay) {
      g.set(x, y, z, "light_blue_stained_glass");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet cornice and cap.
  if (gr <= TOP) g.set(x, TOP, z, "smooth_quartz");
  if (gr <= TOP - 1) g.set(x, TOP - 1, z, "quartz_slab_placeholder".replace("quartz_slab_placeholder", "white_concrete"));
  if (corner && gr <= TOP) g.set(x, TOP + 1, z, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);
