// 31 Saint Benedicts Street, Eden Terrace, Auckland: a 1970s reinforced-concrete office block, five storeys at most. A white
// concrete frame with light-grey spandrels, piers every 3 blocks and light-blue glass bands between them; a dark glazed
// ground-floor storefront with a recessed entrance; a stone plinth that shows its extra height on the low north-west side.
// The lidar roof is smoothed into three flat tiers (2, 3 and a 4-storey core) with a 2-cell setback ring, then a plant room
// on the core. Floors are at fixed datum lines (y 7, 11, 15), so each storey stands on the one below. Facade glazing sits
// in front of an air gap; the interior is air except a floor slab per storey, a column grid, and warm lamps behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153403.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153403.nbt";

const X = 32, Z = 54, Y = 33;
const F = 7;                 // ground-floor datum: above the highest ground under the footprint (7)
const BAY = 3;               // pier every 3 blocks along a facade
const COL = 5;               // interior column grid

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => z * X + x;
const info = new Map();      // key -> { g, r, top }
for (const [x, z, g, r] of cells) info.set(key(x, z), { g, r });
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && info.has(key(x, z));
const at = (x, z) => info.get(key(x, z));

// Dirs: N = -z, S = +z, W = -x, E = +x. `facing` is what a door's facing state takes (the way it faces outward).
const DIRS = [
  { dx: 0, dz: -1, name: "N", facing: "north", axis: "z" },
  { dx: 0, dz: 1, name: "S", facing: "south", axis: "z" },
  { dx: -1, dz: 0, name: "W", facing: "west", axis: "x" },
  { dx: 1, dz: 0, name: "E", facing: "east", axis: "x" },
];

// 1. Roof tiers: smooth lidar roof (15-20 above y 0) into flat tops at storey lines.
//    <=16 -> 15 (two storeys + cornice); 17-19 -> 19 (three storeys); 20 -> 20 (the core, four storeys with a parapet).
const tierOf = (r) => (r <= 16 ? 15 : r <= 19 ? 19 : 20);
for (const v of info.values()) v.top0 = tierOf(v.r);

// 2. Setback: 20-cells within 2 cells of a lower cell or the outside step down to 19 (a 3-cell ring), so the core rises
//    from a terrace ring. Distance is a BFS from every cell that is not 20 or touches the outside.
const dist = new Map();
const queue = [];
for (const [k, v] of info) {
  const x = k % X, z = Math.floor(k / X);
  const edge = DIRS.some(({ dx, dz }) => !inside(x + dx, z + dz) || at(x + dx, z + dz).top0 < 20);
  if (v.top0 < 20 || edge) { dist.set(k, 0); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], x = k % X, z = Math.floor(k / X);
  for (const { dx, dz } of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz)) continue;
    const nk = key(nx, nz);
    if (!dist.has(nk)) { dist.set(nk, dist.get(k) + 1); queue.push(nk); }
  }
}
for (const [k, v] of info) if (v.top0 === 20 && dist.get(k) <= 2) v.top = 19;
for (const v of info.values()) v.top ??= v.top0;
// A lone 20-cell is a spike, not a core: drop any core cell with fewer than two core neighbours to the 19 tier.
for (const [k, v] of info) {
  if (v.top !== 20) continue;
  const x = k % X, z = Math.floor(k / X);
  const n = DIRS.filter(({ dx, dz }) => inside(x + dx, z + dz) && at(x + dx, z + dz).top === 20).length;
  if (n < 2) v.top = 19;
}

// Core bounds (for the plant room).
const core = [...info].filter(([, v]) => v.top === 20).map(([k]) => [k % X, Math.floor(k / X)]);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length;
const cz = core.reduce((s, [, z]) => s + z, 0) / core.length;

// 3. Entrance: a ground-level (ground 7, so no plinth) boundary cell on the face with the most candidates, mid-face.
const exposedDirs = (x, z, y) => DIRS.filter(({ dx, dz }) => {
  if (!inside(x + dx, z + dz)) return true;
  return at(x + dx, z + dz).top <= y;
});
const doorCands = [];
for (const [k, v] of info) {
  const x = k % X, z = Math.floor(k / X);
  if (v.g !== 7 || v.top < 15) continue;
  for (const d of exposedDirs(x, z, F)) doorCands.push({ x, z, d });
}
const byFace = {};
for (const c of doorCands) (byFace[c.d.name] ??= []).push(c);
const faceName = Object.keys(byFace).sort((a, b) => byFace[b].length - byFace[a].length)[0];
const face = byFace[faceName];
const along = (c) => (c.d.axis === "z" ? c.x : c.z);
face.sort((a, b) => along(a) - along(b));
const door = face[face.length >> 1];
console.log(`entrance: ${door.d.name} face, cell (${door.x},${door.z}), ${face.length} ground-level candidates`);

// 4. Materials.
const PLINTH = "stone_bricks";
const FRAME = "white_concrete";
const SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "gray_stained_glass_pane";
const SLAB_LINE = "white_concrete";
const FLOOR = "smooth_stone";
const CORNICE = { block: "stone_brick_slab", state: { type: "top", waterlogged: "false" } };
const ROOF = "gray_concrete";
const COLUMN = "polished_andesite";
const PLANT = "light_gray_concrete";

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 5. Plinth: solid from y 0 up to the storey datum under every cell. Cells on the low ground read as a stone base course.
for (const [k] of info) {
  const x = k % X, z = Math.floor(k / X);
  for (let y = 0; y < F; y++) put(x, y, z, PLINTH);
}

// 6. Storeys, caps, columns, window grids.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const [k, v] of info) {
  const x = k % X, z = Math.floor(k / X);
  const T = v.top;
  for (let y = F; y < T; y++) {
    const dirs = exposedDirs(x, z, y);
    const j = (y - F) % 4;
    const s = Math.floor((y - F) / 4);           // storey index: 0 = ground floor
    if (y === T - 1) {                            // the cap: cornice on the outside, roof deck inside
      if (dirs.length) put(x, y, z, CORNICE.block, CORNICE.state);
      else put(x, y, z, ROOF);
      continue;
    }
    if (!dirs.length) {                           // interior air, with a floor slab and columns
      if (j === 0) put(x, y, z, FLOOR);
      else if (x % COL === 2 && z % COL === 2 && y < T - 1) put(x, y, z, COLUMN);
      continue;
    }
    if (j === 0) { put(x, y, z, SLAB_LINE); continue; }      // string course at each storey line
    if (j === 3) { put(x, y, z, SPANDREL); continue; }       // spandrel under the window band
    // window band (j = 1, 2): piers along the facade, glass between
    const d = dirs[0];
    const along = d.axis === "z" ? x : z;
    const corner = dirs.some((e) => e.axis === "z") && dirs.some((e) => e.axis === "x");
    if (corner || along % BAY === 0) { put(x, y, z, FRAME); continue; }
    const conn = d.axis === "z"
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    put(x, y, z, s === 0 ? SHOP : GLASS, { ...conn, waterlogged: "false" });
  }
}

// 7. Door and lintel in the storefront; a lamp behind some upper windows (in the air gap, so the glass still reads).
put(door.x, F, door.z, "iron_door", { facing: door.d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, F + 1, door.z, "iron_door", { facing: door.d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
put(door.x, F + 2, door.z, FRAME);
for (const [k, v] of info) {
  const x = k % X, z = Math.floor(k / X);
  if (v.top < 15) continue;
  for (let y = F + 5; y < v.top - 1; y++) {                // upper-storey window rows (j = 1)
    if ((y - F) % 4 !== 1 || (y - F) < 4) continue;
    const dirs = exposedDirs(x, z, y);
    if (!dirs.length || dirs.some((e) => e.axis === "z") && dirs.some((e) => e.axis === "x")) continue;
    const d = dirs[0];
    const along = d.axis === "z" ? x : z;
    if (along % BAY === 0) continue;
    if (hash(x, y, z) % 7 !== 0) continue;
    const ix = x - d.dx, iz = z - d.dz;                  // the cell behind the glass
    if (!inside(ix, iz) || g.get(ix, y, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Roof plant on the core: a one-block plant screen, set in from the core edge (y 19 is the core cap, so it stands on it).
for (const [k, v] of info) {
  const x = k % X, z = Math.floor(k / X);
  if (v.top !== 20) continue;
  if (Math.abs(x - cx) > 2 || Math.abs(z - cz) > 2) continue;
  put(x, 20, z, PLANT);
}

const stats = g.save(OUT);
console.log(`saved ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
