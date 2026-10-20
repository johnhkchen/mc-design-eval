import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587028";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 6, H = 19, D = 14;
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Single low-rise commercial storey (~5 blocks) with flat roof and parapet.
const TOP = minG + 5;   // cornice band on walls / solid roof deck over interiors
const PAR = minG + 6;   // parapet on perimeter, roof plant on interior
const SHOP_X = 0;       // west face is the street shopfront
const DOOR_Z = 2;

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const doorProps = (half) => ({
  facing: "west", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");
  // Floor slab
  set(x, gr, z, "smooth_stone");

  const isEdge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const onZFace = z === 0 || z === D - 1;
  const idx = onZFace ? x : z;
  const shopFace = x === SHOP_X && isEdge;

  if (isEdge) {
    for (let y = gr + 1; y <= TOP - 1; y++) {
      const rel = y - gr;
      if (shopFace) {
        if (rel === 1) {
          if (z === DOOR_Z) set(x, y, z, "oak_door", doorProps("lower"));
          else set(x, y, z, "stone_bricks");
        } else if (rel === 2 && z === DOOR_Z) {
          set(x, y, z, "oak_door", doorProps("upper"));
        } else if (rel === 2 || rel === 3) {
          set(x, y, z, "glass_pane");
        } else if (rel === 4) {
          set(x, y, z, "red_concrete");   // shopfront fascia band
        }
        continue;
      }
      if (rel === 1) {
        set(x, y, z, "stone_bricks");     // base course
      } else if (rel === 2 || rel === 3) {
        if (isCorner || idx % 3 === 0) set(x, y, z, "light_gray_concrete"); // pillars
        else set(x, y, z, "glass_pane");                                   // ribbon windows
      } else if (rel === 4) {
        set(x, y, z, "light_gray_concrete"); // spandrel
      }
    }
    // Cornice and parapet on the perimeter
    set(x, TOP, z, "smooth_stone");
    set(x, PAR, z, "stone_bricks");
  } else {
    // Interior: solid roof deck, air gap below (no interiors modelled)
    set(x, TOP, z, "smooth_stone");
  }
}

// Warm light behind glass in a few windows
const lightSpots = [[1, 3], [1, 8], [4, 5], [4, 10]];
for (const [x, z] of lightSpots) {
  const gr = ground.get(`${x},${z}`);
  if (gr !== undefined) set(x, gr + 2, z, "glowstone");
}

// Roof plant: small AC condenser blocks on the roof surface
for (const [x, z] of [[2, 4], [3, 4], [2, 9], [3, 9]]) {
  if (inside(x, z)) set(x, PAR, z, "white_concrete");
}

vox.save(`${BASE}/${ID}.nbt`);
