// Volt Apartments, Auckland (way 243876091): a mid-rise residential tower of about 15 storeys (4 blocks each) on a
// two-storey basalt podium. Lidar roofs are median-smoothed and snapped to the storey grid (60 on the bulk, 64 on the
// west core); the rim steps back one storey within 4 blocks of the edge, so the core rises above a roof terrace with an
// iron balustrade, and a plant box sits on the core. The facade is a 3-block bay: white-concrete piers (basalt on the
// podium), a light-grey spandrel, a dark lintel, and a ribbon of glass panes; glowstone sits behind some panes. The
// entrance is a double dark-oak door under a black canopy on the lowest street side, with a half step at the threshold.
// Interiors are air behind a one-block shell, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_243876091.cells.json`, "utf8"));
const W = 72, D = 70, H = 77;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                  // ground (-1 = outside), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// distance from the outside edge (1 on the rim), through the footprint
const dist = grid(0), queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (SIDES.some(([, dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [, dx, dz] of SIDES) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// per cell: F = the first storey's floor (the next multiple of 4 above the ground under it, so the downhill side has
// the extra storeys), FULL = the lidar roof snapped to the storey grid, TOP = FULL with the rim stepped back one storey
const F = grid(0), FULL = grid(0), TOP = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b);
  const f = 4 * Math.ceil(G[x][z] / 4);
  const full = Math.min(64, Math.max(f + 8, 4 * Math.round(v[v.length >> 1] / 4)));
  F[x][z] = f; FULL[x][z] = full;
  TOP[x][z] = dist[x][z] <= 4 && full - 4 >= f + 8 ? full - 4 : full;
}

// solid at y: the footprint's column up to its top (the plinth below F is solid too)
const body = (x, y, z) => inside(x, z) && y >= 0 && y < TOP[x][z];
// air inside the one-block shell, below the roof cover
const interior = (x, y, z) => inside(x, z) && y >= F[x][z] && y <= TOP[x][z] - 2 && SIDES.every(([, dx, dz]) => body(x + dx, y, z + dz));

const paneState = (ew) => ({
  north: ew ? "false" : "true", south: ew ? "false" : "true",
  east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false",
});
// the outside skin of a shell cell at height y, facing the sides in exp (more than one side = a corner pier)
function skin(x, y, z, exp, f) {
  const k = (y - f) >> 2, j = (y - f) & 3;                       // storey and row within the storey
  const pier = k < 2 ? "polished_basalt" : "white_concrete";     // the podium is basalt, the tower white concrete
  const corner = exp.some((n) => n === "N" || n === "S") && exp.some((n) => n === "E" || n === "W");
  if (corner) return { block: pier };                            // a corner of the outline, not a thin wall's two faces
  const ew = exp[0] === "N" || exp[0] === "S", along = ew ? x : z;
  if (k === 0 && j === 0) return { block: "polished_basalt" };   // the ground storey's base band
  if (along % 3 === 0) return { block: pier };                   // a pier every third block
  if (j === 0) return { block: "light_gray_concrete" };          // spandrel
  if (j === 3 && k > 0) return { block: "gray_concrete" };       // dark lintel
  return { block: "light_blue_stained_glass_pane", state: paneState(ew), glass: true };
}
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };    // from the outside face to the room behind it

// the entrance: a north-facing run of the lowest ground, nearest the footprint's middle, with a pair of cells
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const north = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && !inside(x, z - 1) && inside(x + 1, z) && !inside(x + 1, z - 1)) north.push([x, z]);
}
north.sort((a, b) => G[a[0]][a[1]] - G[b[0]][b[1]] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const entrance = north.length ? { x0: north[0][0], zE: north[0][1] } : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glazed = [];                                                 // glass cells that may hold a warm light
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const f = F[x][z], top = TOP[x][z];
  for (let y = 0; y < f; y++) put(x, y, z, "polished_basalt");   // foundation and plinth
  for (let y = f; y < top; y++) {
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }                  // roof cover
    if (interior(x, y, z)) { if ((y - f) % 4 === 0) put(x, y, z, "smooth_stone"); continue; }  // floor slab per storey
    const exp = SIDES.filter(([, dx, dz]) => !body(x + dx, y, z + dz)).map(([n]) => n);
    const s = skin(x, y, z, exp, f);
    put(x, y, z, s.block, s.state);
    const j = (y - f) & 3;
    if (s.glass && (j === 1 || j === 2) && (x * 5 + y * 7 + z * 3) % 11 === 0) glazed.push([x, y, z, exp[0]]);
  }
}

// cornice on the step edges (a balustrade on the terrace's outer edge)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const top = TOP[x][z];
  if (!SIDES.some(([, dx, dz]) => !inside(x + dx, z + dz) || TOP[x + dx][z + dz] < top)) continue;
  const outer = SIDES.some(([, dx, dz]) => !inside(x + dx, z + dz));
  if (top < FULL[x][z] && outer) put(x, top, z, "iron_bars");
  else put(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// warm light in the room behind some panes
for (const [x, y, z, side] of glazed) {
  const [ix, iz] = IN[side];
  if (interior(x + ix, y, z + iz)) put(x + ix, y, z + iz, "glowstone");
}

// the entrance: a double dark-oak door, a glass transom and a lintel, a black canopy, and a half step at the threshold
if (entrance) {
  const { x0, zE } = entrance, x1 = x0 + 1, f = F[x0][zE];
  for (const [x, hinge] of [[x0, "left"], [x1, "right"]]) {
    put(x, f, zE, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, f + 1, zE, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    put(x, f + 2, zE, "light_blue_stained_glass_pane", paneState(true));
    put(x, f + 3, zE, "gray_concrete");
    for (let x2 = x0 - 1; x2 <= x1 + 1; x2++) for (const zc of [zE - 1, zE - 2]) {
      if (!inside(x2, zc)) put(x2, f + 4, zc, "black_concrete");
    }
    const gy = G[x][zE];
    if (gy < f) {
      for (let y = gy; y <= f - 2; y++) put(x, y, zE - 1, "polished_basalt");
      put(x, f - 1, zE - 1, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// rooftop plant: a solid box on the core, four blocks high, set in from the terrace
const maxTop = Math.max(...cells.map(([x, z]) => TOP[x][z]));
const core = cells.filter(([x, z]) => TOP[x][z] === maxTop && dist[x][z] >= 8);
if (core.length) {
  const bx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length);
  const bz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
  const box = [];
  for (let x = bx - 4; x <= bx + 4; x++) for (let z = bz - 3; z <= bz + 3; z++) box.push([x, z]);
  if (box.every(([x, z]) => inside(x, z) && TOP[x][z] === maxTop && dist[x][z] >= 6)) {
    for (const [x, z] of box) {
      for (let y = maxTop; y < maxTop + 3; y++) put(x, y, z, "light_gray_concrete");
      put(x, maxTop + 3, z, "smooth_stone");
    }
  }
}

const out = `${FILL}/way_243876091.nbt`;
const r = g.save(out);
console.log(`way_243876091: ${r.blocks} blocks, ${r.palette} palette entries, roofs ${maxTop} max`);
