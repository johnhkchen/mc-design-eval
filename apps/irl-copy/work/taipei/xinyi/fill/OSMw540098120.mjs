import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098120";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey mid-century concrete shophouse: stone base, cream quartz-clad walls,
// shopfronts at street level, a band course, a window grid above, flat roof with parapet.
const W = 23, H = 23, D = 20;
const ROOF = 11;          // parapet top (roof about 11 blocks above lowest ground)
const SLAB_1 = 5;         // storey line between floors
const DECK = 10;          // roof deck / cornice level
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Pass 1: classify cells and build the shell.
const info = [];
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const missing = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const ext = missing.length > 0;
  const corner = missing.length >= 2;
  // Outward face direction from the first missing neighbour; inward is opposite.
  const [odx, odz] = missing[0] ?? [0, 0];
  const inx = -odx, inz = -odz;
  // Position along the facade used for the bay rhythm.
  const u = odz !== 0 ? x : z;
  const pier = ext && (corner || u % 4 === 0);
  info.push({ x, z, gr, ext, corner, odx, odz, inx, inz, u, pier });

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (ext) {
    // Base course at ground level.
    if (gr <= DECK) put(x, gr, z, "stone_bricks");
    // Wall body from above the base to the parapet course.
    for (let y = gr + 1; y <= 9; y++) put(x, y, z, "smooth_quartz");
    // Cornice band at deck level.
    if (DECK >= gr + 1) put(x, DECK, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
    // Parapet cap.
    put(x, ROOF, z, "smooth_quartz");
    // Storey line.
    if (SLAB_1 >= gr) put(x, SLAB_1, z, "light_gray_concrete");
    // Piers run the full height of the facade.
    if (pier) for (let y = Math.max(gr + 1, 0); y <= 9; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
  } else {
    // Interior cells: floor slabs only, air between, no interior fit-out.
    if (gr <= DECK) put(x, gr, z, "light_gray_concrete");
    if (SLAB_1 >= gr) put(x, SLAB_1, z, "light_gray_concrete");
  }
  // Roof deck over every footprint cell.
  put(x, DECK, z, ext ? "quartz_slab" : "light_gray_concrete",
    ext ? { type: "bottom", waterlogged: "false" } : undefined);
  if (!ext) put(x, DECK, z, "light_gray_concrete");
}

// Pass 2: the entrance on the north face (missing z-1), nearest the middle.
let door = null;
const northFace = info.filter(c => c.ext && c.odz === -1 && c.gr + 2 <= 3);
if (northFace.length) {
  northFace.sort((a, b) => Math.abs(a.x - 11) - Math.abs(b.x - 11));
  door = northFace[0];
}

// Pass 3: facade articulation.
for (const c of info) {
  if (!c.ext) continue;
  const { x, z, gr, pier, inx, inz, u } = c;

  // Ground storey shopfronts (y gr+1 .. 3), lintel at y 4.
  for (let y = gr + 1; y <= 3; y++) {
    if (pier) continue;
    if (door && door.x === x && door.z === z && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    put(x, y, z, "light_blue_stained_glass");
  }
  if (!pier) put(x, 4, z, "gray_concrete");
  else put(x, 4, z, "quartz_pillar", { axis: "y" });

  // Warm light inside some shopfront bays.
  if (!pier && u % 4 === 2 && has(x + inx, z + inz) && gr + 2 <= 3) {
    put(x + inx, gr + 2, z + inz, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Second storey window grid (y 6 .. 9): frame, glass at 7-8.
  if (!pier) {
    put(x, 6, z, "gray_concrete");
    put(x, 7, z, "light_blue_stained_glass");
    put(x, 8, z, "light_blue_stained_glass");
    put(x, 9, z, "gray_concrete");
    // Glowstone behind every third window, inside the air gap.
    if (u % 3 === 0 && has(x + inx, z + inz)) {
      put(x + inx, 7, z + inz, "glowstone");
    }
  }
}

// Pass 4: roof equipment on interior cells of the deck.
for (const c of info) {
  if (c.ext) continue;
  if (c.x % 6 === 3 && c.z % 6 === 3) {
    put(c.x, DECK + 1, c.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
