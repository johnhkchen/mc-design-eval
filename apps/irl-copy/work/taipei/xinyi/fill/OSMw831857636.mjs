import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown-era Taipei mid-rise: a two-storey 1970s-80s concrete commercial block
// with a white tiled frame, glazed shopfront at street level, a cornice and parapet,
// and a small rooftop plant room with a lightning rod.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857636";
const W = 12, H = 23, D = 18;
const ROOF_DECK = 10;   // roof slab, interior
const PARAPET_TOP = 11; // roof sits about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const footprint = new Set();
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  footprint.add(`${x},${z}`);
  groundOf.set(`${x},${z}`, Math.max(0, Math.min(4, Math.round(gr))));
}

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!footprint.has(`${x},${z}`)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Position along the facade a cell sits on (for rhythm of pillars and windows).
const alongOf = (x, z) => (z === 0 || z === D - 1 ? x : z);
const faceLen = (x, z) => (z === 0 || z === D - 1 ? W - 1 : D - 1);

// Inner cell behind a perimeter cell (for warm lights behind glass).
const innerOf = (x, z) => {
  if (x === 0) return [1, z];
  if (x === W - 1) return [W - 2, z];
  if (z === 0) return [x, 1];
  return [x, D - 2];
};

for (const key of footprint) {
  const [x, z] = key.split(",").map(Number);
  const b = groundOf.get(key);

  // Foundation from y 0 up to ground, then ground-floor slab.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "smooth_stone");

  // Storey line / second-floor slab.
  put(x, 5, z, "light_gray_concrete");

  // Roof deck.
  put(x, ROOF_DECK, z, "gray_concrete");

  if (!isEdge(x, z)) continue;

  const corner = isCorner(x, z);
  const along = alongOf(x, z);
  const pillar = corner || along % 3 === 0;
  const isFront = z === 0; // street frontage
  const doorHere = isFront && along === 5;
  const [ix, iz] = innerOf(x, z);

  // Ground-floor shopfront (b+1 .. 3), lintel band at 4.
  for (let y = b + 1; y <= 3; y++) {
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else if (doorHere && y <= b + 2) {
      const half = y === b + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
    } else {
      put(x, y, z, "glass");
    }
  }
  if (4 > b) {
    put(x, 4, z, pillar ? "white_concrete" : "stone_bricks");
  }

  // Upper storey (6 .. 9): white frame, spandrels, glazed bays with warm light.
  for (let y = 6; y <= 9; y++) {
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else if (y === 6 || y === 9) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  if (!pillar && along % 2 === 0) {
    put(ix, 7, iz, "glowstone");
  }

  // Cornice and parapet.
  put(x, ROOF_DECK, z, "smooth_stone");
  put(x, PARAPET_TOP, z, "white_concrete");
}

// Rooftop plant room, centred on the roof, with a lightning rod mast.
for (let x = 3; x <= 7; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!footprint.has(`${x},${z}`)) continue;
    put(x, ROOF_DECK + 1, z, "light_gray_concrete");
    put(x, ROOF_DECK + 2, z, "smooth_stone");
  }
}
// Louvred cladding on plant room faces.
for (let x = 3; x <= 7; x++) {
  for (let z of [5, 11]) {
    put(x, ROOF_DECK + 1, z, "iron_bars");
  }
}
put(5, ROOF_DECK + 3, 8, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
