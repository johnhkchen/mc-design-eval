// 1301 Connecticut Ave NW: a 1960s-70s Modernist office block, 4 storeys over a granite plinth, white-concrete belts
// and smooth-quartz cornice, grey-glass window bands in polished-andesite mullions, a penthouse core and two low wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75552.cells.json", "utf8"));
const SIZE = [10, 26, 24];
const BELTS = new Set([4, 7, 10]);             // floor slabs / spandrel belts, solid across the whole footprint
const WINDOW_ROWS = new Set([2, 3, 5, 6, 8, 9, 11]);
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFp = (x, z) => raw.has(key(x, z));
const ring = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
const exX = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z);
const exZ = (x, z) => !inFp(x, z + 1) || !inFp(x, z - 1);

// Lidar roof -> a clean tier: the mean of the footprint cells around (3x3), rounded and held to 11..14 (the 3 m annex stays)
const tier = (x, z) => {
  const c = raw.get(key(x, z));
  if (c.r <= 4) return c.r;
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(x + dx, z + dz));
    if (o && o.r > 4) { s += o.r; n++; }
  }
  return Math.min(14, Math.max(11, Math.round(s / n)));
};

const blocks = new Map();                      // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// Pass 1: every footprint cell from y 0 up to its own top, so every storey stands on the one below
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const H = tier(x, z), top = H - 1, R = ring(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === top) {
      if (!R) put(x, y, z, "light_gray_concrete");                 // roof membrane
      else if (H >= 14) {                                          // penthouse screen: louvres between piers
        const bay = exX(x, z) ? z : x;
        if (bay % 2 === 1) put(x, y, z, "iron_bars");
        else put(x, y, z, "smooth_quartz");
      } else put(x, y, z, "smooth_quartz");                        // parapet cap
    } else if (y <= 1) put(x, y, z, R ? "polished_granite" : "white_concrete");
    else if (BELTS.has(y)) put(x, y, z, "white_concrete");
    else if (y === 12) put(x, y, z, R ? "smooth_quartz" : "white_concrete");   // penthouse floor slab / cornice band
    else if (WINDOW_ROWS.has(y) && R) {
      if (exX(x, z) && exZ(x, z)) put(x, y, z, "smooth_quartz");   // corner pier
      else {
        const bay = exX(x, z) ? z : x;
        if (bay % 2 === 1) put(x, y, z, "polished_andesite");       // mullion
        else put(x, y, z, "gray_stained_glass_pane");               // glass, joined to its neighbours below
      }
    }
    // interior window rows stay air: the gap behind the glass, between the slabs
  }
}

// Entrance: two doors on the east face at z 11..12, glass shopfront either side
for (const z of [11, 12]) {
  const st = (half) => ({ facing: "east", half, hinge: z === 11 ? "left" : "right", open: "false", powered: "false" });
  put(9, 2, z, "dark_oak_door", st("lower"));
  put(9, 3, z, "dark_oak_door", st("upper"));
}

// Warm light behind some glass: a shroomlight or glowstone on the interior cell just inside the pane
for (const [kk, v] of [...blocks]) {
  if (v.block !== "gray_stained_glass_pane") continue;
  const [x, y, z] = kk.split(",").map(Number);
  if (!WINDOW_ROWS.has(y)) continue;
  const inX = !inFp(x + 1, z) ? x - 1 : !inFp(x - 1, z) ? x + 1 : null;
  const inZ = !inFp(x, z + 1) ? z - 1 : !inFp(x, z - 1) ? z + 1 : null;
  const [ix, iz] = inX !== null ? [inX, z] : [x, inZ];
  if (!inFp(ix, iz) || ring(ix, iz) || at(ix, y, iz)) continue;
  const bay = inX !== null ? z : x;
  if ((bay + y) % 4 !== 0) continue;
  put(ix, y, iz, y === 2 ? "glowstone" : "shroomlight");
}

// Penthouse roof plant on the core: a couple of stone boxes with a slab cap
for (const z of [6, 8]) {
  if (tier(4, z) === 14 && !ring(4, z)) {
    put(4, 14, z, "smooth_stone");
    put(4, 15, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Panes and bars join their in-line neighbours, so a band of glass reads as one run of framed panes
const dirs = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [kk, v] of [...blocks]) {
  if (v.block !== "gray_stained_glass_pane" && v.block !== "iron_bars") continue;
  const [x, y, z] = kk.split(",").map(Number);
  const state = {};
  for (const [d, [dx, dz]] of Object.entries(dirs)) state[d] = at(x + dx, y, z + dz) ? "true" : "false";
  v.state = state;
}

const g = new Voxels(SIZE);
for (const [kk, v] of blocks) {
  const [x, y, z] = kk.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75552.nbt";
const r = g.save(out);
console.log("saved", out, r);
