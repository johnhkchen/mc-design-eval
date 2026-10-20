import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098853";

// Footprint [x, z, ground] per cell (x 0..16, z 0..11)
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Record-driven design: roof about 11 blocks above lowest ground.
// A 1970s-80s Xinyi-style commercial block: two storeys over a shopfront
// base, pale quartz facade with a light-tinted glass band, a cornice and a
// stepped parapet, and a plant box on the roof.
const ROOF_Y = 11;   // roof surface layer
const STOREY_1 = 5;  // storey line / upper floor slab
const STOREY_2 = 10; // storey line under the cornice

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), Math.max(0, Math.min(10, Math.round(gr))));
const has = (x, z) => map.has(key(x, z));
const gAt = (x, z) => map.get(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exterior faces: a cell is on an edge if a neighbour is missing.
const faces = (x, z) => ({
  n: !has(x, z - 1), // front (z = 0 side)
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Entrance: the north-face cell at x = 8, if the footprint has it.
const DOOR_X = 8;
const doorCell = has(DOOR_X, 0) ? DOOR_X : null;

// Pass 1: foundations, base course, facade walls, interior floors.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = gAt(x, z);
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    // Along-face coordinate used for the bay rhythm.
    const along = (f.n || f.s) && !(f.w || f.e) ? x : (f.w || f.e) && !(f.n || f.s) ? z : x + z;
    const cornerLike = (f.n || f.s) && (f.w || f.e);
    const pier = cornerLike || along % 3 === 0;
    const frontBay = f.n && doorCell !== null && x >= 6 && x <= 10;

    for (let y = gr; y <= STOREY_2; y++) {
      let block = null;
      let props;

      if (y === gr) {
        block = "stone_bricks"; // base course
      } else if (y === STOREY_1 || y === STOREY_2) {
        block = "smooth_quartz"; // storey lines
      } else if (frontBay && y < STOREY_1) {
        if (x === DOOR_X) {
          // door handled below; lintel above it
          if (y === gr + 2) block = "smooth_quartz";
          else if (y === gr || y === gr + 1) block = null;
          else block = "glass";
        } else if (y === gr + 3) {
          block = "black_concrete"; // canopy band over the entrance bay
        } else {
          block = "glass";
        }
      } else if (y < STOREY_1) {
        // Shopfront ground floor
        block = pier ? "smooth_quartz" : "glass";
      } else {
        // Upper storey: piers with light-tinted glazing and occasional warm lights
        if (pier) block = "smooth_quartz";
        else if ((along + y) % 4 === 0) block = "shroomlight";
        else block = "light_blue_stained_glass";
      }

      if (block) put(x, y, z, block, props);
    }
  } else {
    // Interior cells: floor slabs only, air elsewhere (no interiors).
    put(x, gr, z, "light_gray_concrete");
    if (gr <= STOREY_1) put(x, STOREY_1, z, "light_gray_concrete");
  }
}

// Pass 2: roof, cornice, parapet and plant equipment.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  const along = (f.n || f.s) && !(f.w || f.e) ? x : (f.w || f.e) && !(f.n || f.s) ? z : x + z;

  if (edge) {
    put(x, ROOF_Y, z, "smooth_quartz"); // cornice
    if (along % 2 === 0) put(x, ROOF_Y + 1, z, "white_concrete"); // stepped parapet
  } else {
    put(x, ROOF_Y, z, "light_gray_concrete"); // roof deck
  }
}

// Rooftop plant box, a small mechanical room set back from the parapet.
for (let x = 5; x <= 11; x++) {
  for (let z = 3; z <= 7; z++) {
    if (!has(x, z)) continue;
    const f = faces(x, z);
    if (f.n || f.s || f.w || f.e) continue;
    put(x, ROOF_Y + 1, z, "gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
  }
}

// Pass 3: entrance door on the front face.
if (doorCell !== null) {
  const gr = gAt(DOOR_X, 0);
  if (gr + 1 < STOREY_1) {
    put(DOOR_X, gr, 0, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(DOOR_X, gr + 1, 0, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
