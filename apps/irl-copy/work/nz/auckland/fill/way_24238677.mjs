// Way 24238677, Eden Terrace / Newton side of Mt Eden: a 1960s-70s concrete-and-glass office block.
// A five-storey podium (lidar roof 19-21) with a six-storey tower (lidar roof 22-23) on its east half, set back
// to a two-cell terrace ring at the tower's outer edge. Precast piers and storey bands in pale concrete, ribbon
// glass in blue, a shopfront ground floor, a recessed entrance on the west face under a lintel, and warm lights
// behind some glass at dusk. Solid foundation from y 0 to each cell's ground; storeys are 4 blocks with a floor
// slab at each storey line (y = 4k); the deck is y 20 (podium) or y 24 (tower).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238677.cells.json", "utf8"));
const SIZE = [41, 36, 35];

const fp = new Map();                                                 // "x,z" -> { g, r }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, z) => `${x},${z}`;

// distance in cells from the outside of the footprint (1 = on the edge)
const dist = new Map(), queue = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) { dist.set(key(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}

// the top of each cell: tower 24 beyond a two-cell terrace ring, podium 20 everywhere else (lidar roof 22+ is the tower)
const top = new Map();
for (const [k, { r }] of fp) {
  const tower = r >= 22;
  top.set(k, tower && dist.get(k) > 2 ? 24 : 20);
}

// the directions in which a cell at layer L faces open air: off the footprint, or beside a shorter neighbour's deck
function exposed(x, z, L) {
  const out = [];
  for (const [n, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) out.push({ n, outside: true });
    else if (top.get(key(nx, nz)) < L) out.push({ n, outside: false });
  }
  return out;
}

const blocks = new Map();                                             // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const del = (x, y, z) => blocks.delete(`${x},${y},${z}`);
const solidAt = (x, y, z) => blocks.has(`${x},${y},${z}`);
const bays = [];                                                      // glass bays on the facade, for the lights

for (const [k, { g }] of fp) {
  const [x, z] = k.split(",").map(Number), T = top.get(k);
  for (let L = 0; L <= T + 1; L++) {
    const ex = exposed(x, z, L), exp = ex.length > 0;
    if (L < g) { put(x, L, z, "polished_andesite"); continue; }        // foundation under the ground
    if (L === 0) { put(x, 0, z, exp ? "polished_andesite" : "smooth_stone"); continue; }
    if (L === T) { put(x, L, z, exp ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet or roof deck
    if (L === T + 1) { if (ex.some(e => e.outside)) put(x, L, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (L > T + 1) continue;
    if (!exp) { if (L % 4 === 0) put(x, L, z, "smooth_stone"); continue; }   // interior: floor slab per storey, air above
    if (L % 4 === 0 || L % 4 === 3) { put(x, L, z, "smooth_stone"); continue; }   // storey line and spandrel
    // glass rows: a pier every third bay and at every corner, otherwise a glazed bay
    const onNS = ex.every(e => e.n === "N" || e.n === "S");
    const pier = ex.length >= 2 || (onNS ? x : z) % 3 === 0;
    if (pier) { put(x, L, z, "smooth_quartz"); continue; }
    put(x, L, z, L < 4 ? "glass" : "light_blue_stained_glass");
    bays.push({ x, z, L, ex });
  }
}

// the entrance: a recess in the west face at (0,15), a lintel over it, the door in the hall behind
del(0, 1, 15); del(0, 2, 15);
put(1, 1, 15, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 2, 15, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
put(0, 2, 15, "lantern", { hanging: "true", waterlogged: "false" });

// warm lights in some bays, standing on the floor just inside the glass
const hash = (x, z, L) => ((((x * 73856093) ^ (z * 19349663) ^ (L * 83492791)) >>> 0) % 100);
for (const { x, z, L, ex } of bays) {
  if (L % 4 !== 1 || (x === 0 && z === 15)) continue;
  const h = hash(x, z, L), ground = L < 4;
  if (h >= (ground ? 35 : 18)) continue;
  const [dx, dz] = DIRS[ex[0].n], ix = x - dx, iz = z - dz;      // one step inward
  if (!has(ix, iz) || L < (fp.get(key(ix, iz)).g) || solidAt(ix, L, iz)) continue;
  if (top.get(key(ix, iz)) < L + 1) continue;
  const pick = h % 3;
  if (pick === 0 || ground) put(ix, L, iz, "glowstone");
  else if (pick === 1) put(ix, L, iz, "shroomlight");
  else put(ix, L, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant on the podium deck, a stair and lift core with a lightning rod on the tower
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (top.get(k) === 20 && dist.get(k) >= 2 && x >= 12 && x <= 16 && z >= 9 && z <= 12) {
    put(x, 21, z, "light_gray_concrete"); put(x, 22, z, "light_gray_concrete");
    put(x, 23, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  if (top.get(k) === 24 && dist.get(k) >= 3 && x >= 30 && x <= 32 && z >= 12 && z <= 14) {
    put(x, 25, z, "smooth_quartz"); put(x, 26, z, "smooth_quartz"); put(x, 27, z, "smooth_quartz");
    put(x, 28, z, "smooth_stone");
  }
}
put(31, 29, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const g = new Voxels(SIZE);
for (const [k, { block, state }] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24238677.nbt";
const stats = g.save(out);
console.log(`way_24238677: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
