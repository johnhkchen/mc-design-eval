import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1047494578.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1047494578.nbt";

const W = 19, H = 23, D = 30;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals per face
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Pass 1: foundations, floors, belt course, roof deck, parapet, walls, windows
const edgeCells = new Set();
const interiorCells = [];
const exposed = new Map(); // "x,z" -> array of exposed dir names

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const key = `${x},${z}`;
  const ex = Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
  if (ex.length) {
    edgeCells.add(key);
    exposed.set(key, ex);
  }
}

for (const [x, z, gr] of cells) {
  const key = `${x},${z}`;
  const isEdge = edgeCells.has(key);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  put(x, gr, z, isEdge ? "stone_bricks" : "smooth_stone");

  // Second floor slab / belt course
  put(x, gr + 5, z, isEdge ? "light_gray_concrete" : "smooth_stone");

  // Roof deck
  put(x, gr + 10, z, isEdge ? "white_concrete" : "gray_concrete");

  if (!isEdge) {
    interiorCells.push([x, z, gr]);
    continue;
  }

  // Parapet cap
  put(x, gr + 11, z, "smooth_stone");

  // Walls: piers in concrete, then window bands
  for (let y = gr + 1; y <= gr + 9; y++) {
    if (y === gr + 5) continue;
    put(x, y, z, "white_concrete");
  }

  const faces = exposed.get(key) || [];
  for (const face of faces) {
    const [dx, dz] = DIRS[face];
    const isNS = face === "north" || face === "south";
    const windowHere = isNS ? (x % 3 !== 1) : (z % 3 !== 1);
    if (windowHere) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "glass_pane");
      for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "glass_pane");

      // Warm light behind some glass
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && (x * 5 + z * 3 + gr) % 4 === 0) {
        put(ix, gr + 2, iz, "glowstone");
      }
    }
  }
}

// Pass 2: entrance on the southern street face, near the middle of that face
const southEdges = [];
for (const [x, z, gr] of cells) {
  if (edgeCells.has(`${x},${z}`) && !has(x, z + 1)) southEdges.push([x, z, gr]);
}
if (southEdges.length) {
  const maxZ = Math.max(...southEdges.map(c => c[1]));
  const front = southEdges.filter(c => c[1] === maxZ);
  const meanX = front.reduce((s, c) => s + c[0], 0) / front.length;
  front.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  const [dx0, dz0, dg] = front[0];

  // Door (two halves) on the wall
  put(dx0, dg + 1, dz0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, dg + 2, dz0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

  // Lintel above the door
  put(dx0, dg + 3, dz0, "white_concrete");
  put(dx0, dg + 4, dz0, "white_concrete");
}

// Pass 3: roof plant, a small mechanical box near the roof centre
if (interiorCells.length) {
  const cx = Math.round(interiorCells.reduce((s, c) => s + c[0], 0) / interiorCells.length);
  const cz = Math.round(interiorCells.reduce((s, c) => s + c[1], 0) / interiorCells.length);
  for (const [x, z, gr] of interiorCells) {
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
  }
}

g.save(OUT);
