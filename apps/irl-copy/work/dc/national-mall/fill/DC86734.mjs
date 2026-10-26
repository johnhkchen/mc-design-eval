import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Luther Place Memorial Church (1226 Vermont Ave NW): a Gothic Revival stone church. A long nave hall with a steep
// hipped roof, a square crossing tower with a belfry, crenellated parapet and a spire at the south-west corner, and a
// small porch in front of the tower door. Stone walls, lancet windows (stained glass with lanterns behind some),
// a chiselled cornice line at the eave, deepslate roof tiers stepped by stairs.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86734.cells.json`, "utf8"));

const W = 16, H = 28, D = 21;
const EAVE = 5;                       // walls run to y 5; the roof starts above the cornice course at y 6
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(key(x, z), { gr, roof });
const inside = (x, z) => cell.has(key(x, z));
const groundOf = (x, z) => cell.get(key(x, z)).gr;

// Parts of the footprint: the tower block (x 2..6, z 16..19), its porch (z 20, x 3..5), and the body (everything else)
const inTower = (x, z) => inside(x, z) && x >= 2 && x <= 6 && z >= 16 && z <= 19;
const inPorch = (x, z) => inside(x, z) && z === 20 && x >= 3 && x <= 5;
const inBody = (x, z) => inside(x, z) && !inTower(x, z) && !inPorch(x, z);

// Body roof: lidar noise is smoothed into three hipped tiers by distance from the body's edge (eave 6, then 7, then the
// ridge at 8). Where the lidar's 3x3 mean stays high (the north-west turret, 9+), the tier is kept as a turret at 10.
const body3Mean = (x, z) => {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++)
      if (inBody(x + dx, z + dz)) { sum += cell.get(key(x + dx, z + dz)).roof; n++; }
  return sum / n;
};
const dist = new Map();
const queue = [];
for (let z = 0; z < D; z++)
  for (let x = 0; x < W; x++)
    if (inBody(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inside(x + dx, z + dz))) {
      dist.set(key(x, z), 1); queue.push([x, z]);
    }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(x + dx, z + dz);
    if (inBody(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const TOP = new Map();
for (let z = 0; z < D; z++)
  for (let x = 0; x < W; x++) {
    if (!inBody(x, z)) continue;
    const tier = Math.min(8, 5 + dist.get(key(x, z)));
    TOP.set(key(x, z), body3Mean(x, z) >= 9.5 ? 10 : tier);
  }

const occ = new Map();
const put = (x, y, z, b, s) => occ.set(`${x},${y},${z}`, { x, y, z, b, s });
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const windows = [];

// ---- body: walls on the footprint's edge, a closed hall inside, a stepped roof on top ----
for (const k of TOP.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g = groundOf(x, z), T = TOP.get(k);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks", null);       // foundation

  const outX = !inside(x - 1, z) || !inside(x + 1, z);
  const outZ = !inside(x, z - 1) || !inside(x, z + 1);
  const exposed = outX || outZ;

  if (exposed) {
    for (let y = g; y <= EAVE; y++) put(x, y, z, "stone_bricks", null);
    put(x, g, z, "polished_andesite", null);                             // plinth
    // lancets on the long faces: one pane per three cells, pillars of stone between
    const onLongFace = (outZ && !outX && x % 3 === 1) || (outX && !outZ && z % 3 === 1);
    if (onLongFace) {
      windows.push({ x, z, outZ, outX, g });
      for (let y = g + 1; y <= g + 3; y++) put(x, y, z, "light_gray_stained_glass_pane", null);
    }
    put(x, EAVE, z, "chiseled_stone_bricks", null);                      // cornice course
  } else {
    // interior: a floor slab, air, and a ceiling slab that carries the roof
    put(x, g, z, "smooth_stone", null);
    put(x, EAVE, z, "smooth_stone", null);
  }

  // roof: deepslate tiers from the eave to the smoothed top; the top course is stairs down to any lower neighbour
  let lowest = null, lowestH = Infinity;
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    const h = inBody(nx, nz) ? TOP.get(key(nx, nz)) : inside(nx, nz) ? Infinity : 0;
    if (h < lowestH) { lowestH = h; lowest = dir; }
  }
  for (let y = EAVE + 1; y < T; y++) put(x, y, z, "deepslate_tiles", null);
  if (lowestH < T) put(x, T, z, "deepslate_tile_stairs", { facing: lowest, half: "bottom", shape: "straight", waterlogged: "false" });
  else put(x, T, z, "deepslate_tiles", null);
}

// lanterns hang from the ceiling just behind some windows, so the hall glows through the glass
for (const w of windows) {
  if ((w.x + w.z) % 2) continue;
  let ix = w.x, iz = w.z;
  if (w.outZ) iz = !inside(w.x, w.z - 1) ? w.z + 1 : w.z - 1;
  else ix = !inside(w.x - 1, w.z) ? w.x + 1 : w.x - 1;
  if (!inBody(ix, iz) || TOP.get(key(ix, iz)) === undefined) continue;
  const interior = !(!inside(ix - 1, iz) || !inside(ix + 1, iz) || !inside(ix, iz - 1) || !inside(ix, iz + 1));
  if (!interior) continue;
  for (let y = w.g + 1; y <= w.g + 3; y++) put(w.x, y, w.z, "yellow_stained_glass_pane", null);
  put(ix, EAVE - 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- tower: a square block on the south-west, belfry openings, crenellated parapet, a core rising to the spire ----
for (let z = 16; z <= 19; z++)
  for (let x = 2; x <= 6; x++) {
    if (!inside(x, z)) continue;
    const g = groundOf(x, z);
    for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks", null);
    const ring = x === 2 || x === 6 || z === 16 || z === 19;
    if (!ring) continue;
    const corner = (x === 2 || x === 6) && (z === 16 || z === 19);
    for (let y = g; y <= 10; y++) put(x, y, z, "stone_bricks", null);
    if (!corner) for (let y = 3; y <= 6; y++) put(x, y, z, "light_gray_stained_glass_pane", null);  // lancets
    if (corner) for (let y = 11; y <= 12; y++) put(x, y, z, "stone_bricks", null);
    put(x, 12, z, "chiseled_stone_bricks", null);                         // belfry sill (openings at y 11)
    if (corner || (x + z) % 2 === 0) put(x, 13, z, "stone_brick_wall", { east: "none", north: "none", south: "none", west: "none", up: "true", waterlogged: "false" });
  }
for (let z = 17; z <= 18; z++)
  for (let x = 3; x <= 5; x++) for (let y = 0; y <= 16; y++) put(x, y, z, "stone_bricks", null);   // core
put(4, 17, 17, "pointed_dripstone", { vertical_direction: "up", thickness: "tip", waterlogged: "false" });  // spire tip

// the tower door faces the porch; the porch has two posts, a canopy and a lantern
put(4, 1, 19, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(4, 2, 19, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let y = 0; y <= 3; y++) for (const x of [3, 5]) put(x, y, 20, "stone_bricks", null);
for (const x of [3, 4, 5]) put(x, 4, 20, "chiseled_stone_bricks", null);
put(4, 3, 20, "lantern", { hanging: "true", waterlogged: "false" });

// ---- write: panes connect to the solid or pane neighbours around them ----
const PANE_NEIGHBOUR = /stone|brick|andesite|tiles|chiseled|wall|glass_pane/;
const paneState = (x, y, z) => {
  const st = {};
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    const n = occ.get(`${x + dx},${y},${z + dz}`);
    st[dir] = n && PANE_NEIGHBOUR.test(n.b) ? "true" : "false";
  }
  st.waterlogged = "false";
  return st;
};
const g = new Voxels([W, H, D]);
for (const e of occ.values()) {
  const s = /glass_pane$/.test(e.b) ? paneState(e.x, e.y, e.z) : e.s;
  g.set(e.x, e.y, e.z, e.b, s ?? undefined);
}
const out = `${DIR}/DC86734.nbt`;
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
