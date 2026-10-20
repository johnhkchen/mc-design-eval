import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610188.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610188.nbt";
const W = 18, H = 23, D = 16;

const g = new Voxels([W, H, D]);
const cells = JSON.parse(readFileSync(IN, "utf8"));

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gOf = (x, z) => G.get(`${x},${z}`);

// Lowest ground under the building; 2-storey (about 11 block) low-rise commercial block
const base = Math.min(...G.values());
const TOP = base + 10;   // last solid course (cornice)
const PARA = base + 11;  // parapet course on perimeter

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Which faces of a cell are outward (missing neighbour in footprint)
function facesOf(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("north");
  if (!has(x, z + 1)) m.push("south");
  if (!has(x - 1, z)) m.push("west");
  if (!has(x + 1, z)) m.push("east");
  return m;
}
const isPerim = (x, z) => facesOf(x, z).length > 0;

// Along-wall coordinate and door position per face
const uOf = (f, x, z) => (f === "north" || f === "south" ? x : z);
const facesU = { north: [], south: [], west: [], east: [] };
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  const fs = facesOf(x, z);
  if (fs.length === 1) facesU[fs[0]].push(uOf(fs[0], x, z));
}
const doorU = {};
for (const f of Object.keys(facesU)) {
  const arr = facesU[f].sort((a, b) => a - b);
  doorU[f] = arr.length ? arr[Math.floor(arr.length / 2)] : -999;
}

const OUTWARD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pass 1: foundations, walls, floors, roof
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = facesOf(x, z);

  if (fs.length === 0) {
    // Interior cell: floor slabs and roof deck only, air between
    put(x, gr, z, "smooth_stone");
    if (base + 5 >= gr) put(x, base + 5, z, "smooth_stone");
    if (TOP >= gr) put(x, TOP, z, "smooth_stone");
    // Roof plant: small AC housings in a loose pattern
    if (((x * 3 + z * 5) % 7 === 0) && TOP >= gr) put(x, PARA, z, "light_gray_concrete");
    continue;
  }

  // Facade cell
  const corner = fs.length >= 2;
  const f = fs[0];
  const u = corner ? (fs.includes("north") || fs.includes("south") ? x : z) : uOf(f, x, z);
  const pier = corner || u % 3 === 0;
  const door = !corner && u === doorU[f];
  const ns = f === "north" || f === "south";

  // Base course at ground, solid wall to cornice
  put(x, gr, z, "polished_granite");
  for (let y = gr + 1; y <= TOP; y++) put(x, y, z, "smooth_quartz");

  // Ground storey: shopfront glass, piers, entrance
  for (let y = base + 1; y <= base + 4; y++) {
    if (y <= gr) continue;
    if (door && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: f, half, hinge: "left", open: "false", powered: "false"
      });
    } else if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (door) {
      put(x, y, z, "glass");
    } else {
      put(x, y, z, "glass");
    }
  }
  // Ground storey transom above the entrance
  if (door) put(x, base + 4, z, "smooth_quartz");

  // Floor line between storeys
  put(x, base + 5, z, "smooth_quartz");

  // Upper storey: window grid with pane frames
  for (let y = base + 6; y <= base + 9; y++) {
    if (y <= gr) continue;
    if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
    else {
      const p = ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", p);
    }
  }

  // Cornice and parapet with alternating crenels
  put(x, TOP, z, "smooth_quartz");
  if (corner || u % 2 === 0) put(x, PARA, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light behind some windows (interior cells only)
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  const fs = facesOf(x, z);
  if (fs.length === 0 || fs.length >= 2) continue;
  const f = fs[0];
  const u = uOf(f, x, z);
  if (u === doorU[f]) continue;
  const [dx, dz] = INWARD[f];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  if (u % 6 === 1) put(ix, base + 7, iz, "glowstone");
  if (u % 6 === 4) put(ix, base + 2, iz, "glowstone");
}

g.save(OUT);
