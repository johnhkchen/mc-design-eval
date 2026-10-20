import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1334986652: single-storey low-rise commercial block, 1960s-80s Xinyi
// reinforced-concrete shophouse. Roof deck 5 blocks up, parapet to y 6 (7 blocks above lowest ground).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334986652";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 19, D = 7;
const g = new Voxels([W, H, D]);

const ROOF = 5;      // roof deck / ceiling slab
const CORNICE = 4;   // cornice course under the deck
const TOP = 6;       // parapet top (7 blocks above lowest ground)

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const doorState = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// ---- Pass 1: foundations, floors, walls, cornice, deck, parapet ----
for (const [x, z, gr] of cells) {
  const northOpen = !have.has(key(x, z - 1));
  const southOpen = !have.has(key(x, z + 1));
  const westOpen = !have.has(key(x - 1, z));
  const eastOpen = !have.has(key(x + 1, z));
  const edge = northOpen || southOpen || westOpen || eastOpen;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr >= ROOF) continue; // guard: ground above roof level

  if (edge) {
    put(x, gr, z, "stone_bricks");                 // base course
    for (let y = gr + 1; y < CORNICE; y++) put(x, y, z, "white_concrete");
    put(x, CORNICE, z, "smooth_stone");            // cornice
  } else {
    put(x, gr, z, "smooth_stone");                 // floor slab
    // air gap above the floor, no interior
    if (z === 3 && (x === 6 || x === 21)) {
      put(x, TOP, z, "light_gray_concrete");       // roof plant on the deck
      put(x, TOP, z + 0, "light_gray_concrete");
    }
  }

  put(x, ROOF, z, "smooth_stone");                 // roof deck / ceiling slab
  if (edge) put(x, TOP, z, "stone_brick_wall");    // parapet
}

// ---- Pass 2: facades (windows, shopfront, door, lights) ----
for (const [x, z, gr] of cells) {
  if (gr >= CORNICE - 1) continue;
  const northOpen = !have.has(key(x, z - 1));
  const southOpen = !have.has(key(x, z + 1));
  const westOpen = !have.has(key(x - 1, z));
  const eastOpen = !have.has(key(x + 1, z));
  if (!(northOpen || southOpen || westOpen || eastOpen)) continue;

  const corner = (x === 0 || x === W - 1);
  const glassTop = CORNICE - 2;   // glass rows gr+1 .. CORNICE-2
  const transom = CORNICE - 1;    // transom row above glass

  if (northOpen) {
    // Shopfront on the street (north) face, z = edge
    if (corner || x % 4 === 0) {
      for (let y = gr + 1; y <= transom; y++) put(x, y, z, "white_concrete");
    } else {
      for (let y = gr + 1; y <= glassTop; y++) put(x, y, z, "glass_pane");
      if (x >= 11 && x <= 16) {
        put(x, transom, z, "red_concrete");        // awning band over entrance
      } else {
        put(x, transom, z, "white_concrete");
      }
    }
    // entrance door at centre
    if (x === 13) {
      put(x, gr + 1, z, "dark_oak_door", doorState("lower"));
      put(x, gr + 2, z, "dark_oak_door", doorState("upper"));
      put(x, transom, z, "red_concrete");
    }
    // warm light behind some shop glass
    if (!corner && x % 4 === 2 && have.has(key(x, z + 1))) {
      put(x, gr + 2, z + 1, "glowstone");
    }
  } else if (southOpen) {
    // Back (south) face: plain window grid
    if (corner || x % 4 === 0) {
      for (let y = gr + 1; y <= transom; y++) put(x, y, z, "white_concrete");
    } else {
      for (let y = gr + 1; y <= glassTop; y++) put(x, y, z, "glass_pane");
      put(x, transom, z, "white_concrete");
    }
    if (!corner && x % 4 === 2 && have.has(key(x, z - 1))) {
      put(x, gr + 2, z - 1, "shroomlight");
    }
  } else {
    // End walls (west / east)
    if (z >= 2 && z <= 4) {
      for (let y = gr + 1; y <= glassTop; y++) put(x, y, z, "glass_pane");
      put(x, transom, z, "white_concrete");
      const inX = westOpen ? x + 1 : x - 1;
      if (have.has(key(inX, z)) && z === 3) {
        put(inX, gr + 2, z, "lantern");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
