import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682862.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682862.nbt";

const W = 14, H = 23, D = 10;
const cells = JSON.parse(readFileSync(IN, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);
const gAt = (x, z) => ground.get(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pane connection props for a glass pane on a given face.
// "NS" = face lies on a north/south side (pane runs east-west).
const paneNS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, ground slab, storey floor slabs, roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_quartz");             // ground floor slab
  if (gr < 5) put(x, 5, z, "smooth_quartz");  // first floor slab
  put(x, 10, z, "smooth_quartz");             // second floor / roof-structure slab
  put(x, 11, z, "gray_concrete");             // roof deck
}

// Pass 2: facade walls on the perimeter cells.
// Front (entrance) is the north (z = 0 side) face; door sits at x = 6.
const DOOR_X = 6;
for (const [x, z, gr] of cells) {
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  if (!(nN || nS || nW || nE)) continue; // interior cell: no wall

  const corner = (nN || nS) && (nW || nE);
  // Orientation face used for panes and piers along the wall.
  const onZFace = nN || nS;               // wall runs along x
  const t = onZFace ? x : z;              // position along the face
  const paneP = onZFace ? paneNS : paneEW;
  const isFront = nN && z === 0 && x === DOOR_X;

  for (let y = gr; y <= 11; y++) {
    if (y < gr) continue;
    if (y === gr) { put(x, y, z, "smooth_quartz"); continue; }

    if (y === 11) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (y === 10) { put(x, y, z, "smooth_quartz"); continue; }         // cornice
    if (y === 5) { put(x, y, z, "smooth_quartz"); continue; }          // storey band

    if (corner) { put(x, y, z, "white_concrete"); continue; }          // corner columns

    // Ground storey: base course, shopfront glass, entrance.
    if (y >= gr + 1 && y <= 4) {
      if (y === gr + 1) { put(x, y, z, "polished_andesite"); continue; }
      if (isFront && (y === gr + 2 || y === gr + 3)) {
        const half = y === gr + 2 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneP);
      continue;
    }

    // Upper storey: spandrels top and bottom, glass windows with piers.
    if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9) { put(x, y, z, "light_gray_concrete"); continue; }
      if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      // Warm light behind some glass.
      if ((t + y + gr) % 7 === 0) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneP);
      continue;
    }
  }
}

// Pass 3: rooftop plant: a few AC blocks and a small mast.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3 && x % 4 === 2 && z % 3 === 1) {
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "iron_block");
  }
}
const mastCell = cells.find(([x, z]) => x === 7 && z === 4);
if (mastCell) {
  put(7, 12, 4, "iron_block");
  put(7, 13, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
