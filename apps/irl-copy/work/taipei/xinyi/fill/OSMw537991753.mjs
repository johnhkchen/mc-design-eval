import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 20 x 13 footprint, roof ~11 blocks above lowest ground.
// Reading: a 1990s-era two-storey commercial block in Xinyi (cream tile/quartz
// facade, granite plinth, grey-glass ribbon windows, shopfront ground floor,
// cornice and parapet, rooftop plant), with lit upper-storey windows at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991753";
const W = 20, H = 23, D = 13;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Normalise ground so the lowest cell sits at y 0.
let minG = Infinity;
for (const [, , gr] of raw) minG = Math.min(minG, Math.round(gr));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of raw) {
  let g = Math.round(gr) - minG;
  g = Math.max(0, Math.min(g, H - 11)); // keep roof (g+10) inside the volume
  G.set(key(x, z), g);
}
const has = (x, z) => G.has(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
// Position along a face: x for north/south walls, z for east/west walls.
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the main entrance: the exposed face with the most single-face edge cells.
const faceCount = { N: 0, S: 0, E: 0, W: 0 };
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  const ds = exposed(x, z);
  if (ds.length === 1) faceCount[ds[0]]++;
}
const mainDir = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const mainCells = [];
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const ds = exposed(x, z);
  if (ds.length === 1 && ds[0] === mainDir) mainCells.push({ x, z, g: gr, a: along(mainDir, x, z) });
}
mainCells.sort((p, q) => p.a - q.a);
const doorCell = mainCells.length ? mainCells[Math.floor(mainCells.length / 2)] : null;

// Build every footprint cell.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const dirs = exposed(x, z);
  const edge = dirs.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs per storey, roof deck, and rooftop AC plant.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 9, z, "light_gray_concrete");
    if ((x * 3 + z * 5) % 11 === 0) put(x, gr + 10, z, "iron_block");
    continue;
  }

  // Edge: plinth, storey lines, cornice and parapet cap.
  put(x, gr, z, "polished_granite");
  put(x, gr + 4, z, "smooth_quartz");
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 9, z, "smooth_quartz");
  put(x, gr + 10, z, "quartz_slab", { type: "top", waterlogged: "false" });

  const corner = dirs.length > 1;
  // Each exposed face gets its own bay pattern; corners are solid piers.
  const bayFace = dirs.length === 1 ? dirs[0] : null;
  const a = bayFace ? along(bayFace, x, z) : -1;
  const pier = corner || a % 3 === 0;

  const bands = [[gr + 1, gr + 3], [gr + 6, gr + 8]];
  for (const [y0, y1] of bands) {
    for (let y = y0; y <= y1; y++) {
      if (pier) {
        put(x, y, z, "quartz_pillar");
      } else {
        // Pane connects along the wall it sits in.
        const alongX = bayFace === "N" || bayFace === "S";
        put(x, y, z, "light_blue_stained_glass_pane", {
          north: alongX ? "false" : "true",
          south: alongX ? "false" : "true",
          east: alongX ? "true" : "false",
          west: alongX ? "true" : "false",
          waterlogged: "false",
        });
      }
    }
  }

  // Warm light behind some upper-storey windows, on the storey-2 floor slab.
  if (!pier && bayFace && a % 6 === 3) {
    const [dx, dz] = DIRS[bayFace];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && G.get(key(ix, iz)) === gr && exposed(ix, iz).length === 0) {
      put(ix, gr + 6, iz, "glowstone");
    }
  }
}

// Main entrance: door in the chosen edge cell, facing outward.
if (doorCell) {
  const { x, z, g: gr } = doorCell;
  const facing = mainDir === "N" ? "north" : mainDir === "S" ? "south" : mainDir === "E" ? "east" : "west";
  put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
