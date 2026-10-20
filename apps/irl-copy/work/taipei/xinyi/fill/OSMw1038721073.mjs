import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038721073";
const W = 55, H = 23, D = 57;

// Two-storey (5-block bays) low-rise civic/commercial block, pale quartz and concrete
// with glazed bays, stone plinth, cornice and parapet. Flat roof, centre plant box and rod.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = cells.map(([x, z, gr]) => [x, z, Math.max(0, Math.round(gr))]);

const G = new Map();
for (const [x, z, gr] of list) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => N.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function paneProps(n) {
  // pane runs along the wall plane
  return n[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

function facingOf(n) {
  if (n[0] === 1) return "east";
  if (n[0] === -1) return "west";
  if (n[1] === 1) return "south";
  return "north";
}

// ---- entrance: the exposed face with the most cells, centred on its median ----
const faceCount = new Map();
for (const [x, z] of list) {
  const ex = exposed(x, z);
  if (ex.length === 1) {
    const k = ex[0].join(",");
    faceCount.set(k, (faceCount.get(k) || 0) + 1);
  }
}
let entKey = null, best = -1;
for (const [k, c] of faceCount) if (c > best) { best = c; entKey = k; }
const entNormal = entKey ? entKey.split(",").map(Number) : [0, -1];
const entSet = new Set();
if (entKey) {
  const faceCells = list.filter(([x, z]) => {
    const ex = exposed(x, z);
    return ex.length === 1 && ex[0].join(",") === entKey;
  });
  const alongOf = ([x, z]) => (entNormal[0] !== 0 ? z : x);
  const alongs = faceCells.map(alongOf).sort((a, b) => a - b);
  const med = alongs[Math.floor(alongs.length / 2)];
  for (const c of faceCells) if (Math.abs(alongOf(c) - med) <= 1) entSet.add(`${c[0]},${c[1]}`);
}

// ---- pass 1: foundation and decks ----
for (const [x, z, gr] of list) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");          // ground deck
  put(x, gr + 5, z, "smooth_stone");      // storey 2 deck
  put(x, gr + 9, z, "gray_concrete");     // roof deck
}

// ---- pass 2: facade on boundary cells ----
for (const [x, z, gr] of list) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;

  const corner = ex.length > 1;
  const n = ex[0];
  const along = n[0] !== 0 ? z : x;
  const pier = corner || (along % 3 === 0);
  const isEnt = !corner && entSet.has(`${x},${z}`) && n.join(",") === entNormal.join(",");
  const gp = paneProps(n);

  // plinth
  put(x, gr + 1, z, "polished_andesite");

  for (let rel = 2; rel <= 8; rel++) {
    let b;
    if (pier) b = "white_concrete";
    else if (rel === 2 || rel === 3 || rel === 7 || rel === 8) b = "light_blue_stained_glass_pane";
    else if (rel === 4 || rel === 6) b = "smooth_quartz";
    else b = "white_concrete"; // storey string course at rel 5
    if (b === "light_blue_stained_glass_pane") put(x, gr + rel, z, b, gp);
    else put(x, gr + rel, z, b);
  }

  // cornice and parapet
  put(x, gr + 9, z, "smooth_quartz");
  put(x, gr + 10, z, "quartz_block");
  put(x, gr + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  if (isEnt) {
    const f = facingOf(n);
    put(x, gr + 1, z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glowstone");        // lit lintel over the entrance
    put(x, gr + 4, z, "smooth_quartz");
  }
}

// ---- pass 3: warm lamps behind ground-floor glazing ----
for (const [x, z, gr] of list) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const n = ex[0];
  const along = n[0] !== 0 ? z : x;
  if (along % 3 === 0 || along % 6 !== 1) continue;
  const ix = x - n[0], iz = z - n[1];
  if (!has(ix, iz)) continue;
  if (exposed(ix, iz).length !== 0) continue;
  const gi = gnd(ix, iz);
  put(ix, gi + 2, iz, "glowstone");
}

// ---- pass 4: roof plant box and mast on the interior roof ----
let sx = 0, sz = 0;
for (const [x, z] of list) { sx += x; sz += z; }
const xc = Math.round(sx / list.length), zc = Math.round(sz / list.length);

for (const [x, z, gr] of list) {
  if (exposed(x, z).length !== 0) continue;
  if (Math.abs(x - xc) <= 5 && Math.abs(z - zc) <= 5) {
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "light_gray_concrete");
  }
}
if (has(xc, zc) && exposed(xc, zc).length === 0) {
  const gr = gnd(xc, zc);
  put(xc, gr + 12, zc, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
