import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991754";
const W = 21, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let B = Infinity;
let minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < B) B = gr;
  if (z < minZ) minZ = z;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const inside = (x, z) => ground.has(key(x, z));
const perim = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const innerNeighbour = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !perim(nx, nz)) return [nx, nz];
  }
  return null;
};

// Door: on the minimum-z (front) edge, nearest the middle of that edge.
const frontXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ) frontXs.push(x);
}
const midX = frontXs.length ? (Math.min(...frontXs) + Math.max(...frontXs)) / 2 : 0;
frontXs.sort((a, b) => Math.abs(a - midX) - Math.abs(b - midX));
const doorX = frontXs[0];

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SHOPBAY = 3; // pillar every third cell along facades

// Levels (absolute): B = lowest ground under footprint.
// Ground storey: gr+1 .. B+3 shopfront, B+4 lintel, B+5 storey slab,
// upper storey B+6 .. B+9 (band, windows, band), B+10 parapet/roof cap.
const L_LINTEL = B + 4;
const L_SLAB = B + 5;
const L_UP_BAND_LO = B + 6;
const L_UP_WIN_LO = B + 7;
const L_UP_WIN_HI = B + 8;
const L_UP_BAND_HI = B + 9;
const L_ROOF = B + 10;

for (const [x, z, gr] of cells) {
  const per = perim(x, z);

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course at the cell's own ground.
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");

  // Ground-storey shopfront (perimeter only).
  if (per) {
    for (let y = gr + 1; y <= L_LINTEL - 1; y++) {
      put(x, y, z, "white_concrete");
    }
    if (x % SHOPBAY === 0 && (x + z) % 2 === 0) {
      // Stone pillars between shop bays.
      for (let y = gr + 1; y <= L_LINTEL - 1; y++) put(x, y, z, "stone_bricks");
    } else {
      for (let y = gr + 1; y <= L_LINTEL - 1; y++) put(x, y, z, "glass_pane", GLASS);
    }

    // Entrance: door on front edge with a canopy over it.
    if (z === minZ && x === doorX) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }

    // Lintel band over shopfront.
    put(x, L_LINTEL, z, "polished_andesite");
  }

  // Storey line between the two storeys.
  if (L_SLAB > gr) {
    put(x, L_SLAB, z, per ? "light_gray_concrete" : "smooth_stone");
  }

  // Upper storey facade.
  if (per) {
    for (let y = L_UP_BAND_LO; y <= L_UP_BAND_HI; y++) {
      if (y === L_UP_BAND_LO || y === L_UP_BAND_HI) {
        put(x, y, z, "light_gray_concrete");
      } else if ((x + z) % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", GLASS);
      }
    }
  }

  // Parapet / roof cap for every footprint cell.
  if (per) {
    put(x, L_ROOF, z, (x + z) % 3 === 0 ? "stone_bricks" : "smooth_quartz");
  } else {
    put(x, L_ROOF, z, "light_gray_concrete");
  }

  // Warm light behind some windows and shopfronts (interior cells are air).
  if (per) {
    const inner = innerNeighbour(x, z);
    if (inner) {
      const [ix, iz] = inner;
      if ((x * 7 + z * 3) % 5 === 0) put(ix, L_UP_WIN_LO, iz, "glowstone");
      if ((x * 3 + z) % 4 === 0 && x % SHOPBAY !== 0) put(ix, gr + 2, iz, "glowstone");
    }
  }
}

// Rooftop: a small mechanical plant box on the roof deck to break the outline.
const roofCells = cells.filter(([x, z]) => !perim(x, z));
if (roofCells.length) {
  const cx = Math.round(roofCells.reduce((s, c) => s + c[0], 0) / roofCells.length);
  const cz = Math.round(roofCells.reduce((s, c) => s + c[1], 0) / roofCells.length);
  if (inside(cx, cz) && !perim(cx, cz)) {
    put(cx, L_ROOF, cz, "light_gray_concrete");
    put(cx, L_ROOF + 1, cz, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
