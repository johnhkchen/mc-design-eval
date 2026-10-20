import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building record. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey, mid-century reinforced-concrete commercial block
// (Xinyi-area shophouse / small office): stone-bricks plinth, white concrete
// piers, light-grey storey lines, glass-pane window bands, ground-floor
// shopfront with a double entrance on the north (street) face, flat deck with
// a stone cap, and a rooftop plant box group.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833563";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...cells.map((c) => c[2]));

// Level plan (indices relative to lowest ground B)
const SLAB1 = B + 5;   // storey line between floors
const DECK = B + 10;   // flat roof deck (top solid layer)
const PARA = B + 11;   // parapet / plant layer on the deck

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell
const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
const outward = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const paneProps = (alongX) => ({
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  north: alongX ? "false" : "true",
  south: alongX ? "false" : "true",
  waterlogged: "false",
});

// Pass 1: foundation, floor slabs, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks"); // ground-floor slab
  if (SLAB1 > gr) put(x, SLAB1, z, "light_gray_concrete");
  if (DECK > gr) put(x, DECK, z, "light_gray_concrete");
}

// Pass 2: facades on edge cells
for (const [x, z, gr] of cells) {
  const dirs = outward(x, z);
  if (dirs.length === 0) continue;
  const corner = dirs.length >= 2;
  const d0 = dirs[0];
  const alongX = d0.dz !== 0; // wall runs east-west when facing north/south
  const coord = alongX ? x : z;
  const isNorth = dirs.some((d) => d.name === "north");
  const pier = corner || coord % 3 === 0;

  for (let y = gr + 1; y <= PARA; y++) {
    if (y === PARA) { put(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === DECK) { put(x, y, z, "smooth_stone"); continue; }      // stone cap
    if (y === SLAB1) { put(x, y, z, "light_gray_concrete"); continue; } // storey line

    if (y <= B + 4) {
      // Storey 1 (commercial)
      if (y === gr + 1) { put(x, y, z, "stone_bricks"); continue; }      // plinth
      if (y === B + 4) { put(x, y, z, "light_gray_concrete"); continue; } // lintel band
      const entrance = isNorth && (x === 8 || x === 9) && (y === gr + 2 || y === gr + 3);
      if (entrance && y <= B + 3) {
        const half = y === gr + 2 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: x === 8 ? "left" : "right",
          open: "false", powered: "false",
        });
        continue;
      }
      if (pier || y < gr + 2) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps(alongX));
    } else if (y <= B + 9) {
      // Storey 2 (office)
      if (y === B + 6 || y === B + 9 || pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps(alongX));
    }
  }
}

// Pass 3: warm lights behind some storey-2 windows (air gap cells inside)
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const dirs = outward(x, z);
  if (dirs.length !== 1) continue;
  const d = dirs[0];
  const coord = d.dz !== 0 ? x : z;
  if (coord % 6 !== 1) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (!has(ix, iz) || outward(ix, iz).length !== 0) continue;
  put(ix, B + 7, iz, (x + z) % 2 === 0 ? "shroomlight" : "glowstone");
}

// Pass 4: rooftop plant boxes on interior deck cells
for (const [x, z, gr] of cells) {
  if (outward(x, z).length !== 0) continue;
  if (x % 5 !== 2 || z % 5 !== 2) continue;
  if (PARA + 1 >= H) continue;
  put(x, PARA, z, "light_gray_concrete");
  put(x, PARA + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
