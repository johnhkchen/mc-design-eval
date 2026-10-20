import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414169.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414169.nbt";

// 17 x 20 footprint, lidar roof ~11 blocks above lowest ground.
// Read as a 1980s-90s concrete-frame shophouse block: two storeys (~5 blocks each),
// white tiled concrete facade, shopfront glass at street level, red sign band,
// light grey storey lines and cornice, flat roof with a small plant box.
const W = 17, H = 23, D = 20;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const base = Math.min(...ground.values());

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const missingOf = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inF(x + dx, z + dz))
    .map(([n]) => n);

const isEdge = (x, z) => missingOf(x, z).length > 0;

// Pick the entrance: street-side (south) edge cell nearest the centre line.
const cx = (Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0]))) / 2;
let entranceCell = null;
{
  const southEdge = cells.filter(([x, z]) => missingOf(x, z).includes("south"));
  const pool = southEdge.length ? southEdge : cells.filter(([x, z]) => isEdge(x, z));
  let best = Infinity;
  for (const [x, z] of pool) {
    const d = Math.abs(x - cx);
    if (d < best) {
      best = d;
      entranceCell = [x, z];
    }
  }
}
const entranceFacing = missingOf(entranceCell[0], entranceCell[1]).includes("south")
  ? "south"
  : missingOf(entranceCell[0], entranceCell[1])[0];

for (const [x, z, gr] of cells) {
  const T = Math.max(base + 10, gr + 10); // roof slab level for this cell
  const missing = missingOf(x, z);
  const edge = missing.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Floor slabs at each storey line (interior cells only; facade is solid shell).
  if (!edge) {
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
  }

  // Roof slab on every cell, parapet ring on the edge.
  if (!edge) {
    put(x, T, z, "gray_concrete");
  } else {
    put(x, T, z, "white_concrete");
  }

  if (!edge) continue;

  const corner = missing.length >= 2;
  const isPillar = (x0, z0) => corner || (x0 + z0) % 3 === 0;

  // Inward neighbour for lights behind glass.
  const outward = missing[0];
  const inwardDir = OPP[outward];
  const [idx, idz] = DIRS[inwardDir];
  const inwardInterior = inF(x + idx, z + idz) && !isEdge(x + idx, z + idz);

  const isEntrance = x === entranceCell[0] && z === entranceCell[1];

  for (let y = gr; y < T; y++) {
    const rel = y - gr;
    let id;
    let props;

    if (rel === 0) {
      id = "stone_bricks"; // plinth course
    } else if (rel <= 3) {
      // Shopfront band
      id = isPillar(x, z) ? "white_concrete" : "glass_pane";
      if (!isPillar(x, z)) props = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
    } else if (rel === 4) {
      id = "red_concrete"; // sign band
    } else if (rel === 5) {
      id = "light_gray_concrete"; // storey line
    } else if (rel <= 8) {
      id = isPillar(x, z) ? "white_concrete" : "glass_pane";
      if (!isPillar(x, z)) props = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
    } else if (y === T - 1) {
      id = "light_gray_concrete"; // cornice
    } else {
      id = "white_concrete";
    }

    if (isEntrance && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: entranceFacing,
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntrance && rel === 3) {
      put(x, y, z, "white_concrete");
      continue;
    }

    put(x, y, z, id, props);
  }

  // Warm light behind some upper-storey windows.
  if (inwardInterior && (x + z) % 6 === 1 && !isPillar(x, z)) {
    put(x + idx, gr + 7, z + idz, "glowstone");
  }
  // Warm light behind a ground-floor shop window.
  if (inwardInterior && (x + z) % 4 === 2 && !isPillar(x, z) && !isEntrance) {
    put(x + idx, gr + 2, z + idz, "shroomlight");
  }
}

// Roof plant box in the middle of the roof (interior cells only).
const roofLevel = Math.max(base + 10, ...cells.map(([, , gr]) => gr + 10));
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 7 || x > 9 || z < 8 || z > 10) continue;
  const gr = gAt(x, z);
  const T = Math.max(base + 10, gr + 10);
  put(x, T + 1, z, "light_gray_concrete");
  put(x, T + 2, z, "light_gray_concrete");
}

g.save(OUT);
