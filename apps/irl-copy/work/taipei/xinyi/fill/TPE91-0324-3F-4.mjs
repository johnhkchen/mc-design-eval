import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0324-3F-4";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 11, H = 28, D = 8;

// Footprint lookup: "x,z" -> ground offset (blocks above y 0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const g = new Voxels([W, H, D]);

// Place a block only inside the grid and on footprint cells
function put(x, y, z, id, props) {
  if (!has(x, z)) return;
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward faces does this edge cell expose, and where along the face is it?
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ name: "n", front: true, i: x - minX, len: maxX - minX + 1 });
  if (!has(x, z + 1)) out.push({ name: "s", front: false, i: x - minX, len: maxX - minX + 1 });
  if (!has(x - 1, z)) out.push({ name: "w", front: false, i: z - minZ, len: maxZ - minZ + 1 });
  if (!has(x + 1, z)) out.push({ name: "e", front: false, i: z - minZ, len: maxZ - minZ + 1 });
  return out;
}

const isEdge = (x, z) => faces(x, z).length > 0;

const DOOR_FACE_INDEX = 5; // middle of the 11-block north (front) face

// Facade block for one edge cell at height y, given one exposed face
function facadeBlock(x, z, y, gr, f) {
  const pil = f.i === 0 || f.i === f.len - 1 || f.i % 3 === 0;
  const base = y >= 10 ? 10 : y >= 5 ? 5 : 0;
  const rel = y - base; // 1..4 within a storey, 0 is the slab line

  if (pil) return { id: "white_concrete" };
  if (rel === 4) return { id: y === 4 ? "red_concrete" : "white_concrete" }; // fascia / spandrel

  // window zone rel 1..3
  if (base === 0 && f.front && f.i === DOOR_FACE_INDEX && gr <= 2 && y > gr && y <= gr + 2 && y <= 3) {
    const half = y === gr + 1 ? "lower" : "upper";
    return {
      id: "oak_door",
      props: { facing: "north", half, hinge: "left", open: "false", powered: "false" },
    };
  }
  // a few warm-lit windows, shroomlight in the window plane
  if (((x * 7 + z * 3 + y * 5) % 5 === 0) && (y === 2 || y === 7 || y === 12)) {
    return { id: "shroomlight" };
  }
  return { id: "glass" };
}

// ---- Foundation, base course, floor slabs, walls ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // base course / ground floor slab
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // storey slabs at 5 and 10 across the whole footprint
  for (const y of [5, 10]) {
    if (y > gr) put(x, y, z, "light_gray_concrete");
  }

  // roof slab at 15 across the whole footprint
  if (gr < 15) put(x, 15, z, "light_gray_concrete");

  // walls on the perimeter
  if (edge) {
    for (const f of faces(x, z)) {
      for (let y = gr + 1; y <= 14; y++) {
        if (y === 5 || y === 10) continue; // slab lines already placed
        const b = facadeBlock(x, z, y, gr, f);
        put(x, y, z, b.id, b.props);
      }
    }
    // parapet and cornice on the roof edge
    put(x, 16, z, "white_concrete");
    put(x, 17, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- Roof penthouse and antenna (interior of the roof) ----
for (let x = 3; x <= 7; x++) {
  for (let z = 2; z <= 5; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    put(x, 16, z, "white_concrete");
    put(x, 17, z, "white_concrete");
    put(x, 18, z, "light_gray_concrete");
  }
}
if (has(5, 3) && !isEdge(5, 3)) {
  put(5, 19, 3, "lightning_rod");
  put(5, 20, 3, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
