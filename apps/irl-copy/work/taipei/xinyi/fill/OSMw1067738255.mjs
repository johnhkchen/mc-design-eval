import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738255.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738255.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, D = 9, H = 23;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// outward offsets per face
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null; // interior
}

function paneProps(facade) {
  return facade
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function doorProps(facing, half) {
  return { facing, half, hinge: "left", open: "false", powered: "false" };
}

function buildPerimeter(x, z, gr, face) {
  const facade = face === "north" || face === "south";
  const u = facade ? x : z;
  const len = facade ? W : D;
  const [ox, oz] = DIR[face];
  const ix = x - ox, iz = z - oz; // inward neighbour
  const pillar = u % 4 === 0 || u === len - 1;
  const isFront = face === "north" && u === 11;
  const pane = paneProps(facade);

  // plinth course
  put(x, gr + 1, z, "stone_bricks");

  // ground floor shopfronts and entrance
  for (let y = gr + 2; y <= gr + 4; y++) {
    if (pillar) {
      put(x, y, z, "smooth_quartz");
    } else if (isFront && y <= gr + 3) {
      put(x, y, z, "dark_oak_door", doorProps(face, y === gr + 2 ? "lower" : "upper"));
    } else if (y <= gr + 3) {
      put(x, y, z, "glass_pane", pane);
    } else {
      put(x, y, z, "smooth_quartz"); // head / transom
    }
  }
  // warm light behind a shopfront glass
  if (!pillar && !isFront && u % 8 === 6 && has(ix, iz)) {
    put(ix, gr + 2, iz, "glowstone");
  }

  // spandrel band between storeys
  put(x, gr + 5, z, "smooth_quartz");

  // upper storey windows
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pillar) {
      put(x, y, z, "smooth_quartz");
    } else if (y === gr + 6 || y === gr + 9) {
      put(x, y, z, "smooth_quartz"); // sill / head
    } else {
      put(x, y, z, "glass_pane", pane);
    }
  }
  if (!pillar && u % 8 === 2 && has(ix, iz)) {
    put(ix, gr + 7, iz, "glowstone");
  }

  // cornice / roof edge
  put(x, gr + 10, z, "smooth_quartz");

  // parapet with pillar caps
  put(x, gr + 11, z, pillar ? "smooth_quartz" : "white_terracotta");
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);
  if (face) {
    // walls: white terracotta body, quartz trim, glass bays
    put(x, gr + 1, z, "stone_bricks");
    buildPerimeter(x, z, gr, face);
  } else {
    // interior: floor and roof slabs only, air between
    put(x, gr + 1, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // roof plant box
    if (x % 7 === 3 && z === 4) put(x, gr + 11, z, "gray_concrete");
  }
}

g.save(OUT);
