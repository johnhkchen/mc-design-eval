import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no entry. Decided from the lidar roof height (~21 above lowest ground):
// a 1990s Xinyi-style four-storey office/retail block. Cream quartz-clad facade
// with pier-and-spandrel rhythm, tinted glazing, granite base, shopfront at grade,
// dark-oak entrance under a canopy, a plant box on the roof, and warm light behind
// some windows for dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw644319439";
const W = 23, H = 33, D = 8;
const STOREY = 5;
const STOREYS = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS = "light_blue_stained_glass_pane";
const PIER = "quartz_block";
const BAND = "smooth_quartz";
const FOUND = "stone_bricks";

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
}

// 2. Storeys.
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const onZFace = !has(x, z - 1) || !has(x, z + 1); // long facade (north/south)
  const u = onZFace ? x : z;                          // index along the face
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pier = corner || (u % 3 === 0);
  const frontEdge = z === D - 1;
  const entranceCols = frontEdge && x >= 10 && x <= 12;
  const canopyCols = frontEdge && x >= 9 && x <= 13;

  for (let s = 0; s < STOREYS; s++) {
    const b = gr + STOREY * s;
    // Floor slab per storey (every footprint cell).
    put(x, b, z, s === 0 && edge ? "polished_granite" : BAND);

    if (!edge) continue;

    // Window rows 1..3 of each storey.
    for (let r = 1; r <= 3; r++) {
      const y = b + r;
      if (s === 0 && r === 3 && canopyCols) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (s === 0 && entranceCols && x === 11) {
        if (r === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) {
        put(x, y, z, PIER);
        continue;
      }
      const props = onZFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, GLASS, props);

      // Warm light behind some windows (interior cell adjacent, inside footprint).
      if (r === 2 && (u + s * 2) % 5 === 1) {
        const ix = onZFace ? x : (x === 0 ? 1 : (x === W - 1 ? W - 2 : x));
        const iz = onZFace ? (z === 0 ? 1 : (z === D - 1 ? D - 2 : z)) : z;
        if (has(ix, iz) && !isEdge(ix, iz)) {
          put(ix, y, iz, (u + s) % 2 === 0 ? "glowstone" : "shroomlight");
        }
      }
    }

    // Storey line band at row 4.
    put(x, b + 4, z, BAND);
  }

  // Roof: cornice at gr+20 on the edge, tar/stone deck inside, parapet at gr+21.
  const top = gr + STOREY * STOREYS;
  if (edge) {
    put(x, top, z, BAND);
    put(x, top + 1, z, PIER);
  } else {
    put(x, top, z, "stone");
  }
}

// 3. Roof plant room, centred on the roof.
for (const [x, z, gr] of cells) {
  if (x < 8 || x > 14 || z < 2 || z > 5) continue;
  const top = gr + STOREY * STOREYS;
  const ring = x === 8 || x === 14 || z === 2 || z === 5;
  if (ring) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "light_gray_concrete");
  } else {
    put(x, top + 1, z, "stone");
  }
  // Cap over the plant room.
  put(x, top + 3, z, "stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
