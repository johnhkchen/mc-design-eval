import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265964";

// Reading: a 1980s Taipei mid-rise office block, seven storeys, white tiled
// concrete piers and spandrels, continuous glass bays, a stone plinth, and a
// small mechanical penthouse with a lightning rod on the roof.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 6, D = 6, H = 46;
const ROOF = 34;        // main roof slab top (about 34 blocks above lowest ground)
const PARAPET = 35;
const PH_TOP = 38;      // penthouse roof slab
const ROD_TOP = 39;

const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Glass pane orientation: alongX means the pane runs east-west.
const pane = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Which direction a face cell looks out to (for face-normal placement).
const faceAlongX = (x, z) => z === 0 || z === D - 1;   // north/south faces run along X

// 1. Foundation fill from y 0 up to each cell's ground, plus the ground floor slab.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floors, walls and the window grid, storey by storey.
for (const [x, z, gr] of cells) {
  for (let y = gr; y <= ROOF - 1; y++) {
    // Storey slabs: at the ground line and at every 5-block storey line.
    if (y === gr || y % 5 === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!isEdge(x, z)) continue;   // interior: air, no interiors
    const rel = y % 5;             // 1..3 glazing band, 4 spandrel
    if (isCorner(x, z)) {
      g.set(x, y, z, "white_concrete");           // piers
    } else if (rel >= 1 && rel <= 3) {
      g.set(x, y, z, "glass_pane", pane(faceAlongX(x, z)));
    } else {
      g.set(x, y, z, "light_gray_concrete");      // spandrel
    }
  }
}

// 3. Stone base course at the ground line on the perimeter.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) g.set(x, gr, z, "stone_bricks");
}

// 4. Warm light behind some glazing on the middle storeys (glowstone inside the ring).
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  const along = faceAlongX(x, z) ? x : z;
  if (along !== 2) continue;
  const dx = x === 0 ? 1 : x === W - 1 ? -1 : 0;
  const dz = z === 0 ? 1 : z === D - 1 ? -1 : 0;
  for (const k of [2, 4, 6]) {
    const y = k * 5 + 2;
    if (y <= gr || y > ROOF - 1) continue;
    if (has(x + dx, z + dz)) g.set(x + dx, y, z + dz, "glowstone");
  }
}

// 5. Entrance on the south face: door at x=2, shopfront glazing beside it.
if (has(2, D - 1)) {
  const gr = groundAt(2, D - 1);
  g.set(2, gr + 1, D - 1, "birch_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, gr + 2, D - 1, "birch_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(2, gr + 3, D - 1, "lantern", { hanging: "true", waterlogged: "false" });
  // Door surround
  if (has(1, D - 1)) g.set(1, gr + 1, D - 1, "stone_bricks");
  if (has(1, D - 1)) g.set(1, gr + 2, D - 1, "stone_bricks");
}

// 6. Roof: full slab, quartz parapet cornice on the perimeter.
for (const [x, z] of [...gmap.keys()].map(k => k.split(",").map(Number))) {
  g.set(x, ROOF, z, "light_gray_concrete");
  if (isEdge(x, z)) g.set(x, PARAPET, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 7. Mechanical penthouse on the inner 4x4 of the roof.
for (let x = 1; x <= 4; x++) {
  for (let z = 1; z <= 4; z++) {
    const ring = x === 1 || x === 4 || z === 1 || z === 4;
    if (!ring) continue;
    const corner = (x === 1 || x === 4) && (z === 1 || z === 4);
    for (let y = PARAPET; y <= PH_TOP - 1; y++) {
      if (y === PARAPET) { g.set(x, y, z, "white_concrete"); continue; }
      if (corner) g.set(x, y, z, "white_concrete");
      else if (y === 36 || y === 37) g.set(x, y, z, "glass_pane", pane(z === 1 || z === 4));
      else g.set(x, y, z, "white_concrete");
    }
  }
}
for (let x = 1; x <= 4; x++) for (let z = 1; z <= 4; z++) {
  g.set(x, PH_TOP, z, "light_gray_concrete");
}

// 8. Lightning rod on the penthouse roof.
g.set(2, PH_TOP + 1, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
