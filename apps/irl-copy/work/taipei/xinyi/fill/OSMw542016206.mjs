import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016206";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const gOf = (x, z) => G.get(`${x},${z}`);

// Perimeter: a footprint cell with any neighbour outside the footprint
const isPerim = (x, z) => !inF(x, z - 1) || !inF(x, z + 1) || !inF(x - 1, z) || !inF(x + 1, z);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Glass pane props: connect along the face direction
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, walls, cornice, parapet
for (const [x, z, gr] of cells) {
  const N = !inF(x, z - 1);   // front (street) face at low z
  const S = !inF(x, z + 1);
  const Wf = !inF(x - 1, z);
  const E = !inF(x + 1, z);
  const perim = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);

  // Foundation: solid from 0 up to and including the ground cell
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: ground-floor deck at y=5, roof slab at y=11, air between
    if (5 > gr) put(x, 5, z, "stone");
    if (11 > gr) put(x, 11, z, "light_gray_concrete");
    continue;
  }

  // Perimeter facade
  const horiz = N || S;           // face runs along x
  const t = horiz ? x : z;        // along-face coordinate
  const pillar = corner || t % 3 === 0;
  const props = horiz ? paneNS : paneEW;

  for (let y = gr + 1; y <= 11; y++) {
    if (y === 11) { put(x, y, z, "smooth_quartz"); continue; }     // cornice
    if (y === 5) { put(x, y, z, "light_gray_concrete"); continue; } // string course

    if (y <= 4) {
      // Ground floor: shopfront on the street face, base-course walls elsewhere
      if (N) {
        if (x === 6 && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        put(x, y, z, pillar ? "white_concrete" : "glass");
      } else {
        if (pillar || y < gr + 2) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", props);
      }
      continue;
    }

    // Storey 2 (y 6..10): spandrels top and bottom, window grid between
    if (y === 6 || y === 10) {
      put(x, y, z, pillar ? "white_concrete" : "light_gray_concrete");
    } else {
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", props);
    }
  }

  // Parapet
  put(x, 12, z, "white_concrete");
}

// Pass 2: warm lights standing on the ground-floor deck (behind the glass)
for (const [x, z, gr] of cells) {
  if (isPerim(x, z) || gr >= 5) continue;
  if ([[4, 4], [8, 4], [4, 9], [8, 9]].some(([lx, lz]) => lx === x && lz === z)) {
    put(x, 6, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: roof equipment on interior cells
const interior = (x, z) => inF(x, z) && !isPerim(x, z);

// Water tank, 3x3, three courses
for (let x = 8; x <= 10; x++) for (let z = 8; z <= 10; z++) {
  if (!interior(x, z)) continue;
  for (let y = 12; y <= 14; y++) put(x, y, z, "iron_block");
}

// Mechanical penthouse, 2x3, two courses
for (let x = 2; x <= 3; x++) for (let z = 2; z <= 4; z++) {
  if (!interior(x, z)) continue;
  for (let y = 12; y <= 13; y++) put(x, y, z, "light_gray_concrete");
}

// Lightning rod mast
if (interior(6, 7)) {
  put(6, 12, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
