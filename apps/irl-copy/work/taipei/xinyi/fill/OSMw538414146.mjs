import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414146";
const W = 22, H = 23, D = 20;

// Two-storey mid-century commercial block: granite plinth and storey bands,
// cream quartz piers and spandrels, tinted glass bays, a shopfront with a door
// on the street (north, z min) face, and a small rooftop plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Number(gr));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => G.has(`${x},${z}`);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Boundary = footprint cell with a missing neighbour.
const isBoundary = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
// Outward direction along each axis (only for boundary cells).
const outOf = (x, z) => {
  const odx = !has(x - 1, z) ? -1 : !has(x + 1, z) ? 1 : 0;
  const odz = !has(x, z - 1) ? -1 : !has(x, z + 1) ? 1 : 0;
  return [odx, odz];
};

const GLASS = "cyan_stained_glass_pane";
const WALL = "smooth_quartz";
const BASE = "polished_granite";
const FLOOR = "light_gray_concrete";
const FOUND = "stone_bricks";

// Pass 1: foundations, floors, storey bands, walls and windows.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  // Ground floor slab.
  put(x, gr, z, FLOOR);
  // Storey floor slab and roof deck over the interior.
  if (!isBoundary(x, z)) {
    put(x, gr + 5, z, FLOOR);
    put(x, gr + 10, z, FLOOR);
  }
}

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const [odx, odz] = outOf(x, z);
  const corner = odx !== 0 && odz !== 0;
  const faceX = odz !== 0 && odx === 0; // face runs along x, t = x
  const faceZ = odx !== 0 && odz === 0; // face runs along z, t = z
  const t = faceX ? x - minX : faceZ ? z - minZ : 0;
  const pier = corner || (!corner && t % 3 === 0);
  const paneProps = faceX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const winY = (y) => !pier && (y >= gr + 2 && y <= gr + 4 || y >= gr + 7 && y <= gr + 8);

  // Plinth, storey bands, parapet.
  put(x, gr + 1, z, BASE);
  put(x, gr + 5, z, BASE);
  put(x, gr + 10, z, BASE);
  // Wall and spandrel courses.
  for (const y of [gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
    if (winY(y)) put(x, y, z, GLASS, paneProps);
    else put(x, y, z, WALL);
  }
}

// Pass 2: street door and shopfront lantern on the north (z min) face.
const streetCells = [];
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const [odx, odz] = outOf(x, z);
  if (odz === -1 && odx === 0) streetCells.push([x, z, gr]);
}
if (streetCells.length) {
  const mid = (minX + maxX) / 2;
  streetCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  const [dx, dz, dg] = streetCells[0];
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 4, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: warm light in some bays, placed in the air behind the glass.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const [odx, odz] = outOf(x, z);
  if ((odx === 0) === (odz === 0)) continue; // corners and unknowns
  const faceX = odz !== 0;
  const t = faceX ? x - minX : z - minZ;
  const ix = x - odx, iz = z - odz;
  if (!has(ix, iz) || isBoundary(ix, iz)) continue;
  if (t % 6 === 1) put(ix, gr + 3, iz, "shroomlight");
  if (t % 6 === 4) put(ix, gr + 7, iz, "shroomlight");
}

// Pass 4: rooftop plant box on the interior roof deck.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (isBoundary(x, z)) continue;
  if (x >= minX + 6 && x <= minX + 10 && z >= minZ + 5 && z <= minZ + 8) {
    put(x, gr + 11, z, FLOOR);
  }
}

g.save(`${DIR}/${ID}.nbt`);
