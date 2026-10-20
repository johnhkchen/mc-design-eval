import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 19 x 37 footprint, roof ~35 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi commercial/office block: 7 storeys of 5 blocks,
// white-clad edges with light-blue glass bays, a granite shopfront base,
// a parapet and a plant box with an aviation mast on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw480983681";
const W = 19, H = 47, D = 37;
const STOREYS = 7, STOREY_H = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Entrance: two cells wide on the north (min z) face, near the middle of the footprint.
const isEntranceCell = (x, z) => (x === cx || x === cx - 1) && !has(x, z - 1);

// Pass 1: foundation, storeys, parapet, interior roof slab.
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const onXFace = x === minX || x === maxX;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let s = 0; s < STOREYS; s++) {
    const base = gr + s * STOREY_H;
    const entrance = s === 0 && edge && isEntranceCell(x, z);
    const mullion = edge && (onXFace ? z % 3 === 0 : x % 3 === 0);

    // Floor slab / storey line at offset 0.
    if (edge) {
      put(x, base, z, s === 0 ? "polished_granite" : "white_concrete");
    } else {
      put(x, base, z, "light_gray_concrete");
    }

    // Window band, offsets 1..3.
    if (edge) {
      for (let off = 1; off <= 3; off++) {
        const y = base + off;
        if (entrance) continue; // open doorway
        if (mullion) {
          put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane");
        }
      }
    }

    // Spandrel / cornice band at offset 4.
    if (edge) {
      put(x, base + 4, z, entrance ? "smooth_stone" : "white_concrete");
    }
  }

  // Parapet on the roof line and interior roof slab.
  const roofY = gr + STOREYS * STOREY_H;
  if (edge) {
    put(x, roofY, z, "white_concrete");
    put(x, roofY + 1, z, "white_concrete");
  } else {
    put(x, roofY, z, "gray_concrete");
  }
}

// Pass 2: warm lights behind some glass, one block inside the facade.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const onXFace = x === minX || x === maxX;
  const mullion = onXFace ? z % 3 === 0 : x % 3 === 0;
  if (mullion) continue;
  for (let s = 1; s < STOREYS; s++) {
    if ((x * 5 + z * 3 + s * 7) % 9 !== 0) continue;
    const y = gr + s * STOREY_H + 2;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (has(nx, nz) && !isEdge(nx, nz)) {
        put(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// Pass 3: rooftop plant box and aviation mast on the interior roof.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) > 4 || Math.abs(z - cz) > 7) continue;
  const base = gr + STOREYS * STOREY_H + 1;
  for (let y = base; y <= base + 2; y++) put(x, y, z, "light_gray_concrete");
  if (x === cx && z === cz) {
    for (let y = base + 3; y <= base + 8; y++) put(x, y, z, "iron_bars");
    put(x, base + 9, z, "redstone_lamp");
  }
}

g.save(`${DIR}/${ID}.nbt`);
