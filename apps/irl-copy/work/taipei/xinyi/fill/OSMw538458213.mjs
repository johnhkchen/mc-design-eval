import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 8 x 16 footprint, roof about 11 blocks above lowest ground.
// Read as a small 1980s Taipei commercial block: two storeys over a shopfront,
// white tiled concrete walls, stone base, red sign band, flat roof with parapet,
// a rooftop water tank and condenser units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458213";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const fp = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  fp.add(`${x},${z}`);
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && fp.has(`${x},${z}`);

const ROOF = 11;   // parapet top
const DECK = 10;   // roof deck slab
const SLAB = 5;    // storey line between the two storeys
const SIGN = 4;    // red sign band over the shopfront

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nN = !inFp(x, z - 1);
  const nS = !inFp(x, z + 1);
  const nW = !inFp(x - 1, z);
  const nE = !inFp(x + 1, z);
  const edge = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const front = nN; // street-facing wall

  for (let y = gr; y <= ROOF; y++) {
    // Ground course of the building body
    if (y === gr) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Floor slabs at storey line and roof deck, full footprint
    if (y === SLAB || y === DECK) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // Interior: air, with warm light behind the north windows
    if (!edge) {
      const lightRow = (y === gr + 1 || y === 6);
      if (lightRow && z === 1 && (x === 2 || x === 5)) {
        put(x, y, z, "shroomlight");
      }
      continue;
    }

    // Corner columns run the full height
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const p = (nN || nS) ? x : z; // position along the wall

    // Parapet on the exposed edge
    if (y === ROOF) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Ground storey: shopfront
    if (y < SLAB) {
      if (y === SIGN) {
        put(x, y, z, front ? "red_terracotta" : "white_concrete");
        continue;
      }
      if (front) {
        if (y === gr + 3) { put(x, y, z, "smooth_stone"); continue; } // lintel
        if (p === 3) {
          // Entrance door, two blocks high
          if (y === gr + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === gr + 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "white_concrete");
          continue;
        }
        put(x, y, z, (y === gr + 1 || y === gr + 2) ? "glass" : "white_concrete");
        continue;
      }
      // Side walls of the ground storey: glazing on odd bays
      if (p % 2 === 1 && (y === gr + 1 || y === gr + 2)) put(x, y, z, "glass");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // Upper storey: window grid with frames
    if (y === 6 || y === 9) {
      put(x, y, z, "smooth_quartz"); // head and sill bands
      continue;
    }
    // y = 7 or 8: glass in odd bays, mullions in even bays
    if (p % 2 === 1) put(x, y, z, "glass");
    else put(x, y, z, "white_concrete");
  }
}

// Rooftop equipment on the deck (y 11 upward)
// Water tank: 2 x 2 drum with a cap
for (const x of [2, 3]) for (const z of [4, 5]) {
  if (!inFp(x, z)) continue;
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "white_concrete");
  put(x, 13, z, "smooth_stone");
}
// Condenser units
for (const x of [5, 6]) for (const z of [9, 10]) {
  if (!inFp(x, z)) continue;
  put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
