import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 玫瑰欣欣大樓: 1980s-90s Xinyi residential-commercial tower, 11 storeys on a
// podium of two storeys. Tan/white tiled spandrels, quartz piers, tinted glass,
// brown tiled podium with shopfronts, flat roof with a parapet and a penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099775";
const W = 29, H = 71, D = 17;
const ROOF = 55;          // top of the 11th storey; parapet adds 4 more (59 total)
const PODIUM_TOP = 10;    // first two storeys are the podium
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const keyOf = (x, y, z) => `${x},${y},${z}`;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Per-cell record: ground level (clamped so the roof stays at ROOF) and exposed sides.
const info = new Map();
for (const [k, gr0] of ground) {
  const [x, z] = k.split(",").map(Number);
  const gr = clamp(Math.round(gr0), 0, ROOF);
  const sides = Object.keys(DIRS).filter(n => !has(x + DIRS[n][0], z + DIRS[n][1]));
  info.set(k, { x, z, gr, sides });
}

// Pre-pass: warm lights in interior cells directly behind some upper-floor windows.
const lights = new Set();
for (const c of info.values()) {
  if (!c.sides.length) continue;
  for (let y = Math.max(c.gr + 1, PODIUM_TOP); y < ROOF; y++) {
    if (y % 5 !== 2) continue;
    if ((c.x + c.z + y) % 4 !== 0) continue;
    for (const s of c.sides) {
      const [dx, dz] = DIRS[s];
      const ix = c.x - dx, iz = c.z - dz;
      const ik = `${ix},${iz}`;
      if (info.has(ik) && info.get(ik).sides.length === 0) lights.add(keyOf(ix, y, iz));
    }
  }
}

// Pre-pass: main entrance on the south face, nearest the middle of the front.
let entrance = null;
{
  let best = Infinity;
  for (const c of info.values()) {
    if (!c.sides.includes("south")) continue;
    const score = Math.abs(c.x - Math.floor(W / 2)) + c.gr * 0.5;
    if (score < best) { best = score; entrance = c; }
  }
  if (!entrance) {
    for (const c of info.values()) {
      if (!c.sides.length) continue;
      const score = Math.abs(c.x - Math.floor(W / 2)) + c.gr * 0.5;
      if (score < best) { best = score; entrance = c; }
    }
  }
}

// Pre-pass: penthouse centred on the interior cell nearest the middle of the plan.
let penthouse = new Set();
let antenna = null;
{
  let best = Infinity, centre = null;
  for (const c of info.values()) {
    if (c.sides.length) continue;
    const d = Math.abs(c.x - W / 2) + Math.abs(c.z - D / 2);
    if (d < best) { best = d; centre = c; }
  }
  if (centre) {
    antenna = centre;
    for (const c of info.values()) {
      if (c.sides.length) continue;
      if (Math.abs(c.x - centre.x) <= 4 && Math.abs(c.z - centre.z) <= 2) {
        penthouse.add(`${c.x},${c.z}`);
      }
    }
  }
}

for (const c of info.values()) {
  const { x, z, gr, sides } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exposed = sides.length > 0;

  if (!exposed) {
    // Interior: floor slabs only, air between them (no interiors modelled).
    const rows = new Set([gr, ROOF]);
    for (let y = 0; y <= ROOF; y += 5) if (y >= gr) rows.add(y);
    for (const y of rows) put(x, y, z, "light_gray_concrete");
    for (let y = gr + 1; y < ROOF; y++) {
      if (lights.has(keyOf(x, y, z))) put(x, y, z, "glowstone");
    }
    continue;
  }

  // Facade cell.
  const corner = sides.length >= 2;
  const wallAlongX = sides.includes("north") || sides.includes("south");
  const along = wallAlongX ? x : z;

  for (let y = gr; y <= ROOF; y++) {
    const podium = y < PODIUM_TOP;
    const band = podium ? "brown_terracotta" : "white_terracotta";
    const pier = podium ? "brown_terracotta" : "smooth_quartz";
    const glass = podium ? "cyan_stained_glass" : "light_blue_stained_glass";

    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }
    if (y % 5 === 0 || y === gr || y % 5 === 4) { put(x, y, z, band); continue; }

    // Window band, rows 1..3 of each storey.
    const isPier = corner || along % 3 === 0;
    put(x, y, z, isPier ? pier : glass);
  }

  // Parapet and cap above the roof line (top at y 59).
  for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "white_terracotta");
  put(x, ROOF + 4, z, "smooth_quartz");
}

// Entrance: double doors facing south with a lintel above, in the podium shopfront.
if (entrance) {
  const { x, z, gr } = entrance;
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "smooth_quartz");
}

// Penthouse with louvred screen walls, cap slab and a lightning rod.
for (const c of info.values()) {
  if (!penthouse.has(`${c.x},${c.z}`)) continue;
  const edge = Math.abs(c.x - antenna.x) === 4 || Math.abs(c.z - antenna.z) === 2;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (y === ROOF + 2 && edge) put(c.x, y, c.z, "iron_bars");
    else put(c.x, y, c.z, "light_gray_concrete");
  }
  put(c.x, ROOF + 4, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
if (antenna) {
  for (let y = ROOF + 5; y <= ROOF + 9; y++) put(antenna.x, y, antenna.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
