import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw541455320";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";

// Low-rise 1970s-80s Xinyi-style commercial block: two storeys, white-tiled
// concrete walls, a tinted-glass shopfront, a blue-glass upper band with
// white concrete mullions, a stone cornice, and a red-tile parapet.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const FLOOR = 5;   // storey line / upper floor slab
const DECK = 10;   // roof deck top layer
const PARA = 11;   // parapet course
const CORN = 9;    // cornice course

// Which side of the footprint a perimeter cell faces, and its along-wall coordinate.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", u: x, dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { face: "south", u: x, dx: 0, dz: -1 };
  if (!has(x - 1, z)) return { face: "west", u: z, dx: 1, dz: 0 };
  return { face: "east", u: z, dx: -1, dz: 0 };
}

const cellsSorted = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return [x, z, gr];
});

// Pass 1: foundations, floor slabs, roof deck, columns, walls.
for (const [x, z, gr] of cellsSorted) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Upper floor slab (only where the ground floor sits below it) and roof deck.
  if (gr < FLOOR) g.set(x, FLOOR, z, "light_gray_concrete");
  if (gr < DECK) g.set(x, DECK, z, "smooth_stone");

  // Interior structural columns on a 5-block grid, so slabs stand on something.
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!edge && x % 5 === 4 && z % 5 === 4) {
    for (let y = gr; y < DECK; y++) {
      if (y === FLOOR) continue;
      g.set(x, y, z, "stone_bricks");
    }
  }

  if (!edge) continue;

  const { face, u, dx, dz } = faceOf(x, z);

  for (let y = gr; y <= CORN - 1; y++) {
    if (y === gr) {
      // Base course.
      g.set(x, y, z, "stone_bricks");
    } else if (y <= 4) {
      // Ground-floor shopfront.
      const isDoor = face === "north" && u === 10 && (y === gr + 1 || y === gr + 2);
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (u % 4 === 0) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === FLOOR) {
      // Storey line.
      g.set(x, y, z, "white_concrete");
    } else {
      // Upper storey window band with concrete mullions.
      if (u % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
    }
  }

  // Stone cornice over the upper storey.
  g.set(x, CORN, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Red-tile parapet on the roof edge.
  g.set(x, PARA, z, "red_terracotta");
}

// Pass 2: warm lights set just inside some upper windows (interior air behind glass).
for (const [x, z, gr] of cellsSorted) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!edge) continue;
  const { u, dx, dz } = faceOf(x, z);
  if (u % 6 !== 2) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Pass 3: rooftop plant box in the middle of the roof.
for (let x = 7; x <= 12; x++) {
  for (let z = 7; z <= 12; z++) {
    if (!has(x, z)) continue;
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}
// A small lantern on the plant box so it reads at dusk.
for (const [x, z] of [[8, 8], [11, 11]]) {
  if (has(x, z)) g.set(x, 13, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
