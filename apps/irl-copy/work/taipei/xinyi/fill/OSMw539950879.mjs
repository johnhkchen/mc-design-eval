import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950879";
const W = 11, H = 23, L = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, L]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Shared datum: highest cell ground, so every storey sits level across the footprint.
const D = Math.max(0, ...cells.map((c) => c[2]));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= L) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Plinth/foundation: solid from y 0 up to the datum under every footprint cell.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (let y = 0; y < D; y++) put(x, y, z, "gray_concrete");
}

// Floor slabs (interior) at each floor line and the roof slab.
const floorLines = [D, D + 5, D + 10];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const y of floorLines) put(x, y, z, "smooth_stone");
}

// Storey lines and base course on the perimeter.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isEdge(x, z)) continue;
  put(x, D, z, "gray_concrete");       // base course
  put(x, D + 5, z, "gray_concrete");   // storey line
  put(x, D + 10, z, "gray_concrete");  // cornice
  put(x, D + 11, z, "white_concrete"); // parapet
}

// Which perimeter face(s) each edge cell exposes, and its position along that face.
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ f: "north", p: x });
  if (!has(x, z + 1)) out.push({ f: "south", p: x });
  if (!has(x - 1, z)) out.push({ f: "west", p: z });
  if (!has(x + 1, z)) out.push({ f: "east", p: z });
  return out;
}

// Entrance on the north (low z) street front, roughly centred on that face.
const frontXs = cells
  .filter((c) => isEdge(c[0], c[1]) && !has(c[0], c[1] - 1))
  .map((c) => c[0])
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);

// Window grids: two-wide glass bays between gray concrete piers, sills and lintels.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isEdge(x, z)) continue;
  for (const { f, p } of faces(x, z)) {
    for (let s = 0; s < 2; s++) {
      const b = D + 5 * s;
      for (let r = 1; r <= 4; r++) {
        const y = b + r;
        const [cx, cz] = [x, z];
        if (s === 0 && f === "north") {
          if (r === 4) { put(cx, y, cz, "black_concrete"); continue; } // entrance canopy band
          if (p === doorX) {
            if (r === 1) { put(cx, y, cz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
            if (r === 2) { put(cx, y, cz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
            if (r === 3) { put(cx, y, cz, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
          }
          // Shopfront glass with a few warm-lit bays.
          put(cx, y, cz, (p + r) % 5 === 0 ? "orange_stained_glass_pane" : "light_blue_stained_glass_pane");
          continue;
        }
        if (p % 3 === 0) { put(cx, y, cz, "gray_concrete"); continue; }   // pier
        if (r === 1) { put(cx, y, cz, "polished_andesite"); continue; }   // sill
        if (r === 4) { put(cx, y, cz, "white_concrete"); continue; }      // lintel
        const warm = (p * 7 + s * 3 + f.length) % 5 === 0;
        put(cx, y, cz, warm ? "orange_stained_glass_pane" : "light_blue_stained_glass_pane");
      }
    }
  }
}

// Roof equipment: a plant box near the middle of the roof with a warm light on top.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < L; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    if (x >= 4 && x <= 6 && z >= 5 && z <= 8) {
      put(x, D + 11, z, "gray_concrete");
      put(x, D + 12, z, x === 5 && z === 6 ? "shroomlight" : "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
