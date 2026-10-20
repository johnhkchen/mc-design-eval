import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456408";
const W = 17, H = 23, D = 13;
const ROOF_SLAB_Y = 10;   // roof deck, top surface at y=11
const PARAPET_Y = 11;     // parapet course, top at y=12
const CORNICE_Y = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup
const fp = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  fp.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, name, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// perimeter description
function edges(x, z) {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const zFace = missN || missS;
  const xFace = missW || missE;
  return { missN, missS, missW, missE, zFace, xFace, corner: zFace && xFace, perim: zFace || xFace };
}

// front door: southern face (max z), nearest the middle of its length
const cx = (minX + maxX) / 2;
let doorKey = null, bestD = Infinity;
for (const [x, z] of fp.keys().map ? [] : []) {} // placeholder for lint-safe iteration below
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const e = edges(x, z);
  if (e.missS && z === maxZ) {
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; doorKey = `${x},${z}`; }
  }
}

// pass 1: build every footprint cell
for (const [x, z, gr] of cells) {
  const e = edges(x, z);
  const isDoor = doorKey === `${x},${z}`;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (e.perim) {
    // window indexing along the face
    const idx = e.zFace ? x - minX : z - minZ;
    const isWindow = !e.corner && idx % 3 === 1;

    for (let y = gr; y <= PARAPET_Y; y++) {
      if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
      if (y === CORNICE_Y) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
      if (y === PARAPET_Y) { put(x, y, z, "stone_bricks"); continue; }

      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // storey bands: ground-storey lintel, floor belt, upper lintel
      if (y === 4 || y === 5 || y === 9) { put(x, y, z, "gray_concrete"); continue; }

      const groundStorey = y >= gr + 1 && y <= 3;
      const upperStorey = y >= 6 && y <= 8;
      if (groundStorey || upperStorey) {
        if (isWindow) {
          const props = e.zFace
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          put(x, y, z, "glass_pane", props);
        } else {
          put(x, y, z, "light_gray_concrete");
        }
        continue;
      }

      // remaining wall course: pilaster / spandrel
      put(x, y, z, "light_gray_concrete");
    }
  } else {
    // interior: floor slabs and roof deck only, air elsewhere
    for (let y = gr; y < H; y++) {
      if (y === 5) put(x, y, z, "light_gray_concrete");
      else if (y === ROOF_SLAB_Y) put(x, y, z, "stone");
      else if (y === 7 && (x + z) % 4 === 0) put(x, y, z, "glowstone");
    }
  }
}

// pass 2: roof plant on a central 3x3 of interior cells (sits on the roof deck)
const mx = Math.round(cx), mz = Math.round((minZ + maxZ) / 2);
for (let x = mx - 1; x <= mx + 1; x++) {
  for (let z = mz - 1; z <= mz + 1; z++) {
    const gr = fp.get(`${x},${z}`);
    if (gr === undefined || gr > ROOF_SLAB_Y) continue;
    if (edges(x, z).perim) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
