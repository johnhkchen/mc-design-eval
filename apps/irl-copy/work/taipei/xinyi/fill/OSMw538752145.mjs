import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era: 1970s-80s Taipei mid-rise commercial block. Two storeys in a concrete frame,
// white-tiled piers and spandrels, tinted-glass shopfront and office bands,
// a cast-stone base and storey line, a smooth cornice and a stone parapet,
// with a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw538752145.cells.json`, "utf8"));

const W = 13, H = 23, D = 15;
const FLOOR = 5;   // storey line / second floor slab
const ROOF = 10;   // roof deck (top surface at y=11)
const TOP = 11;    // parapet course

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const missing = (x, z) => ({
  w: !has(x - 1, z),
  e: !has(x + 1, z),
  n: !has(x, z - 1),
  s: !has(x, z + 1),
});
const isPer = (x, z) => {
  const m = missing(x, z);
  return m.w || m.e || m.n || m.s;
};

// Street face is the minimum-z edge (north). Pick the door cell near its middle.
const minZ = Math.min(...cells.map(([, z]) => z));
const streetXs = cells
  .filter(([x, z]) => z === minZ && missing(x, z).n)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = streetXs.length ? streetXs[Math.floor(streetXs.length / 2)] : null;
const doorZ = minZ;

// Pass 1: foundations, slabs, roof, cornice, parapet
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (FLOOR >= gr) put(x, FLOOR, z, "smooth_stone");          // floor slab / storey line
  if (ROOF >= gr) put(x, ROOF, z, isPer(x, z) ? "smooth_stone" : "light_gray_concrete");
  if (isPer(x, z)) put(x, TOP, z, "stone_brick_wall");          // parapet
}

// Pass 2: perimeter walls
for (const [x, z, gr] of cells) {
  if (!isPer(x, z)) continue;
  const m = missing(x, z);
  const xFace = m.w || m.e;
  const zFace = m.n || m.s;
  const corner = xFace && zFace;
  const along = zFace ? x : z;
  const pier = corner || along % 3 === 0;
  const isDoor = x === doorX && z === doorZ;

  for (let y = gr; y < ROOF; y++) {
    if (y === FLOOR) continue;             // storey line already placed
    if (y === gr) {
      if (gr < FLOOR) put(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (y < FLOOR) {
      put(x, y, z, pier ? "white_concrete" : "tinted_glass");
    } else {
      if (y === ROOF - 1) put(x, y, z, "white_concrete");  // upper spandrel
      else put(x, y, z, pier ? "white_concrete" : "tinted_glass");
    }
  }

  if (isDoor) {
    put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "tinted_glass");
  }
}

// Pass 3: warm lights behind some upper-floor windows (one cell inside the air gap)
for (const [x, z] of cells) {
  if (!isPer(x, z)) continue;
  const m = missing(x, z);
  if ((m.w || m.e) && (m.n || m.s)) continue; // corners
  if (x === doorX && z === doorZ) continue;
  const zFace = m.n || m.s;
  const along = zFace ? x : z;
  if (along % 3 === 0 || along % 6 !== 1) continue;
  let ix = x, iz = z;
  if (m.n) iz = z + 1;
  else if (m.s) iz = z - 1;
  else if (m.w) ix = x + 1;
  else if (m.e) ix = x - 1;
  if (has(ix, iz) && !isPer(ix, iz)) put(ix, 7, iz, "glowstone");
}

// Rooftop water tank on the interior of the roof
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) {
  if (!has(x, z)) continue;
  for (let y = TOP; y <= TOP + 2; y++) put(x, y, z, "white_concrete");
  put(x, TOP + 3, z, "smooth_stone");
}

g.save(`${DIR}/OSMw538752145.nbt`);
