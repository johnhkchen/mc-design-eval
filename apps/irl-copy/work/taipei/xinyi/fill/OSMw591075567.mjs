import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075567";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 29, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};
const isPerim = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Building: 3 storeys of 5 blocks, parapet to y=17 (roof top).
// Floor lines at y=5 and y=10, roof slab at y=15.
// Mid-rise Taipei office/retail: white tiled concrete, quartz bands,
// blue-tinted glazing, granite base, dark shopfront with a canopy on the north face.
for (const [x, z, gr0] of cells) {
  const gr = clamp(Math.round(gr0), 0, 14);
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const perim = n || s || w || e;
  const corner = (n || s) && (w || e);
  const along = (n || s) ? x : z;
  const faceId = n ? 0 : s ? 1 : w ? 2 : 3;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!perim) {
    // Interior: floor slab at ground and at each storey line, air elsewhere
    put(x, gr, z, "smooth_stone");
    for (const y of [5, 10, 15]) if (y > gr) put(x, y, z, "smooth_stone");
    continue;
  }

  for (let y = gr; y <= 16; y++) {
    let b;
    let p;

    if (y >= 15) {
      // Parapet ring with quartz cap
      b = y === 15 ? "white_concrete" : "smooth_quartz";
    } else if (corner) {
      // Corner pilasters run full height
      b = "smooth_quartz";
    } else if (y === gr) {
      // Granite base course
      b = "polished_andesite";
    } else if (y === 4 || y === 9 || y === 14) {
      // Spandrels between window bands
      b = "light_gray_concrete";
    } else if (y === 5 || y === 10) {
      // Storey floor lines
      b = "smooth_quartz";
    } else if (along % 2 === 0) {
      // Mullions between window bays
      b = "smooth_quartz";
    } else {
      // Glass bay, with some warm lit windows
      b = "light_blue_stained_glass";
      if ((y === 7 || y === 12) && (along * 3 + faceId * 5 + y) % 7 === 0) b = "glowstone";
      if (y === 2 && (along + faceId) % 5 === 0) b = "glowstone";
    }

    // Street-front entrance on the north face: door at x=6, glass at x=7
    if (n && gr <= 1 && (y === 1 || y === 2)) {
      if (along === 6) {
        const half = y === 1 ? "lower" : "upper";
        b = "dark_oak_door";
        p = { facing: "north", half, hinge: "left", open: "false", powered: "false" };
      } else if (along === 7) {
        b = "light_blue_stained_glass";
      }
    }
    // Canopy over the entrance, on the north face
    if (n && gr <= 3 && y === 4 && along >= 5 && along <= 8) {
      b = "dark_oak_slab";
      p = { type: "bottom", waterlogged: "false" };
    }

    put(x, y, z, b, p);
  }
}

// Roof equipment: mechanical boxes on the roof slab (y=15), plus a lightning rod
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!isPerim(x, z) && x >= 4 && x <= 5 && z >= 4 && z <= 5) {
    put(x, 16, z, "light_gray_concrete");
    put(x, 17, z, "light_gray_concrete");
  }
}
if (has(11, 2) && !isPerim(11, 2)) {
  put(11, 16, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(11, 17, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
