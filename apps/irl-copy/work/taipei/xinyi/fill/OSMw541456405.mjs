import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no match in the registry. Read as a 2-storey commercial block with a
// parapet, a granite plinth, a glazed street front, and a small roof penthouse.
// Storeys are 5 blocks, roof is 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456405";
const W = 17, D = 13, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const minZ = Math.min(...cells.map((c) => c[1]));
const roofY = minG + 11;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Edge classification from the footprint itself
const xEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const zEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isEdge = (x, z) => xEdge(x, z) || zEdge(x, z);
const isCorner = (x, z) => xEdge(x, z) && zEdge(x, z);

// Entrance: the front (lowest z) cell nearest the middle of the width
const frontCells = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = frontCells.reduce((best, x) =>
  Math.abs(x - W / 2) < Math.abs(best - W / 2) ? x : best, frontCells[0]);
const doorZ = minZ;

// Footprint columns
for (const [x, z, gr] of cells) {
  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  for (let y = gr; y <= roofY; y++) {
    const rel = y - gr;

    if (y === roofY) {
      // Parapet cap on edges, flat roof deck inside
      if (edge) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else put(x, y, z, "gray_concrete");
      continue;
    }

    if (!edge) {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (rel % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Street and perimeter facades
    if (y === roofY - 1) { put(x, y, z, "smooth_stone"); continue; } // cornice band
    if (rel === 0) { put(x, y, z, "polished_granite"); continue; }   // base course
    if (rel % 5 === 0) { put(x, y, z, "smooth_stone"); continue; }   // storey line
    if (rel % 5 === 4) { put(x, y, z, "white_concrete"); continue; } // spandrel

    // Window zone (rel % 5 in 1..3)
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    // Pillars every third bay along the wall
    const i = zEdge(x, z) && !xEdge(x, z) ? x : z;
    if (i % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }

    // Entrance door on the front face, glazing elsewhere
    if (x === doorX && z === doorZ) {
      if (rel === 1) { put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3) { put(x, y, z, "white_concrete"); continue; } // lintel over door
    }

    put(x, y, z, "glass_pane");
  }
}

// Warm lights behind some street-front glass (dusk read)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  const dx = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const dz = !has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let y = gr; y < roofY - 1; y++) {
    const rel = y - gr;
    if (rel % 5 !== 2) continue;           // middle of each window
    if ((x + y) % 6 !== 0) continue;        // sparse
    if (x === doorX && z === doorZ) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Roof penthouse on the central deck (if it fits in the volume)
if (roofY + 3 < H) {
  const px0 = 6, px1 = 10, pz0 = 4, pz1 = 8;
  const onDeck = (x, z) => has(x, z) && !isEdge(x, z);
  let ok = true;
  for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) if (!onDeck(x, z)) ok = false;
  if (ok) {
    for (let x = px0; x <= px1; x++) {
      for (let z = pz0; z <= pz1; z++) {
        const wall = x === px0 || x === px1 || z === pz0 || z === pz1;
        if (wall) {
          put(x, roofY + 1, z, "glass_pane");
          put(x, roofY + 2, z, "light_gray_concrete");
        }
        put(x, roofY + 3, z, "smooth_stone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
