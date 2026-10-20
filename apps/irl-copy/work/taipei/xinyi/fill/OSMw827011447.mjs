import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Taipei commercial block: pale concrete frame, tinted glazing bands,
// a shopfront ground storey with a dark-oak entrance, and a plant penthouse on a
// flat roof with a parapet. Storeys are 5 blocks; roof deck sits at y 25, parapet to 27.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011447";
const W = 22, H = 38, D = 19;
const ROOF = 26;          // top of roof deck (deck block at y 25)
const DECK = ROOF - 1;    // y 25

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint map: "x,z" -> ground (foundation top)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 3, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const deep = (x, z) => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const xs = keys.map((c) => c[0]), zs = keys.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) =>
  props ? g.set(x, y, z, id, props) : g.set(x, y, z, id);

// entrance: south-facing edge cell nearest the middle
const edges = keys.filter(([x, z]) => isEdge(x, z));
const edgeMaxZ = Math.max(...edges.map((e) => e[1]));
const doorCell = edges
  .filter((e) => e[1] === edgeMaxZ)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF + 1; y++) {
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }

    if (y === DECK) { put(x, y, z, "light_gray_concrete"); continue; }   // roof deck
    if (y >= ROOF) {
      if (edge) {
        put(x, y, z, y === ROOF ? "white_concrete" : "light_gray_concrete"); // parapet + cap
      }
      continue;
    }

    const k = Math.floor(y / 5);
    const r = y % 5;

    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }     // floor line / slab
    if (!edge) continue;                                                // interior: air

    if (r === 4) { put(x, y, z, "white_concrete"); continue; }          // spandrel
    // r = 1..3: window zone
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // pier
    const lit = r === 2 && (x * 7 + z * 5 + k * 3) % 11 === 0;
    put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
  }
}

// rooftop plant penthouse with a mast, on deep interior cells only
for (const [x, z] of keys) {
  if (!deep(x, z)) continue;
  if (Math.abs(x - cx) > 4 || Math.abs(z - cz) > 3) continue;
  put(x, ROOF, z, "smooth_stone");
  put(x, ROOF + 1, z, "smooth_stone");
  put(x, ROOF + 2, z, "light_gray_concrete");
}
if (deep(cx, cz)) {
  for (let y = ROOF + 3; y <= ROOF + 6; y++) put(cx, y, cz, "iron_bars");
  put(cx, ROOF + 7, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// entrance door on the south facade with a concrete lintel above
if (doorCell && (ground.get(`${doorCell[0]},${doorCell[1]}`) ?? 99) <= 20) {
  const [dx, dz] = doorCell;
  const gr = ground.get(`${dx},${dz}`);
  const doorState = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr, dz, "dark_oak_door", doorState("lower"));
  put(dx, gr + 1, dz, "dark_oak_door", doorState("upper"));
  put(dx, gr + 2, dz, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
