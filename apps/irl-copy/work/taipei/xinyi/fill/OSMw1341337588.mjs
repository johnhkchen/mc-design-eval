import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337588";
const W = 6, H = 19, L = 55;

// Record: no tags. Read as a one-storey, flat-roofed Xinyi-era commercial strip
// (1980s-90s low-rise shop block): white concrete walls, stone plinth, glazed
// shopfront on the street (west) face, storey line, cornice and parapet.
// Roof deck sits at lidar-derived height (~7 blocks above lowest ground).

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

const gnd = new Map();
for (const [x, z, gr] of cells) gnd.set(`${x},${z}`, gr - minG);

const has = (x, z) => gnd.has(`${x},${z}`);
const maxG = Math.max(...gnd.values());

const DECK = Math.max(6, maxG + 2); // flat roof deck (roof about 7 above lowest ground)
const TOP = DECK + 1;               // parapet course on top of the deck
if (TOP >= H) throw new Error(`Roof top ${TOP} exceeds volume height ${H}`);

const g = new Voxels([W, H, L]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= L) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DOOR_Z = [4, 27, 50];

for (const [key, gr] of gnd) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground, then ground-floor slab on top.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Roof deck across the whole footprint.
  put(x, DECK, z, "smooth_stone");

  // Storey line / ceiling slab across the footprint (no interiors, just slabs).
  if (gr + 5 < DECK) put(x, gr + 5, z, "smooth_stone");

  // Exterior faces.
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const exterior = west || east || north || south;
  if (!exterior) continue;

  const ew = west || east;

  for (let y = gr + 1; y <= DECK; y++) {
    const band = y - gr;
    let id = "white_concrete";
    if (y === DECK) {
      id = "smooth_stone"; // cornice
    } else if (band === 1) {
      id = "smooth_stone"; // base course / plinth
    } else if (band >= 2 && band <= 4) {
      let pillar;
      if (ew) pillar = z % 3 === 0;
      else pillar = !(x >= 1 && x <= 4);
      id = pillar ? "white_concrete" : "glass";
    } else if (band === 5) {
      id = "light_gray_concrete"; // storey line
    }
    put(x, y, z, id);
  }

  // Parapet on the perimeter, standing on the roof deck.
  put(x, TOP, z, "light_gray_concrete");
}

// Street-face entrances: doors with a hanging lantern above each.
for (const z of DOOR_Z) {
  const x = 0;
  if (!has(x, z)) continue;
  const gr = gnd.get(`${x},${z}`);
  if (gr + 2 >= DECK) continue;
  const doorState = (half) => ({
    facing: "east",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(x, gr + 1, z, "oak_door", doorState("lower"));
  put(x, gr + 2, z, "oak_door", doorState("upper"));
  if (gr + 4 < DECK) put(x, gr + 4, z, "lantern", { hanging: "true" });
}

// Warm lights standing on the interior floor behind the street-face glazing.
for (let z = 0; z < L; z++) {
  if (!has(0, z) || !has(1, z)) continue;
  const gr = gnd.get(`1,${z}`);
  if (gr + 1 >= DECK) continue;
  if (DOOR_Z.includes(z)) continue;
  if (z % 6 === 1) put(1, gr + 1, z, "glowstone");
  else if (z % 6 === 4) put(1, gr + 1, z, "lantern", { hanging: "false" });
}

// Rooftop plant: a few light grey service boxes on the deck.
for (let x = 2; x <= 3; x++) {
  for (let z = 20; z <= 24; z++) {
    if (!has(x, z)) continue;
    put(x, DECK + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
