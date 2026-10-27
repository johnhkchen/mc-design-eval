// Way 440300787: The Whitaker Apartments, a 1960s-70s Modernist concrete apartment block on the Mt Eden hillside.
// Stepped tiers from the lidar roof (3x3 median, bucketed to flat roofs at 12, 16, 24, 32 and 36, with a plant room
// to 38): a solid foundation to each cell's ground, then storeys of white concrete fins, light-grey spandrels, a
// smooth-stone string course at each floor, cyan glass in a 3-block mullion grid, a cornice and parapet. Interiors
// are air behind the glass with a floor slab per storey. A recessed lobby with a canopy faces the notch, and warm
// glowstone and shroomlight sit behind some of the glass for dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_440300787.cells.json`, "utf8"));
const W = 30, D = 36, HEIGHT = 50;

const K = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];           // north, south, east, west (z-, z+, x+, x-)

// the footprint, each cell { x, z, g (ground), T (flat roof tier), outDirs (faces onto the outside) }
const grid = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g] of cells) grid[z][x] = { x, z, g, T: 0, outDirs: [] };
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? grid[z][x] : null);
const all = cells.map(([x, z]) => at(x, z));
const roofOf = new Map(cells.map(([x, z, , r]) => [K(x, 0, z), r]));

// 1. flat tiers: 3x3 median of the lidar roof height, bucketed to 12 / 16 / 24 / 32 / 36 (the core's top is 36 + plant to 38)
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tierOf = (s) => (s <= 13 ? 12 : s <= 19 ? 16 : s <= 27 ? 24 : s <= 33 ? 32 : 36);
for (const c of all) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofOf.get(K(c.x + dx, 0, c.z + dz)); if (r !== undefined) vals.push(r);
  }
  c.T = tierOf(median(vals));
  c.outDirs = DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
}

// the faces of a cell that open to air at height y: the outside, or a lower neighbour's roof (a setback)
const facesAt = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T <= y; });

// a lower neighbour's roof is a floor for the taller cell: the wall above it stands on a solid course
const setback = new Set();
for (const c of all) for (const [dx, dz] of DIRS) {
  const n = at(c.x + dx, c.z + dz);
  if (n && n.T < c.T) setback.add(K(c.x, n.T - 1, c.z));
}

// 2. the block map: every cell from y 0 to its roof, built first so the lights and panes can see their neighbours
const B = new Map();
const put = (x, y, z, name, state) => B.set(K(x, y, z), { name, state });

// one storey of a facade cell: a wall course at the top, the storey string course, spandrels, and the window zone
function facadeBlock(c, y, faces) {
  if (y === c.T - 1) return "smooth_stone";                  // cornice
  if (y === c.T - 2) return "light_gray_concrete";           // top spandrel
  const r = (y - c.g) % 4;                                   // storey = 4 blocks: string course, 2 window rows, spandrel
  if (r === 0) return y === c.g ? "gray_concrete" : "smooth_stone";   // base course at ground, string course above
  if (r === 3) return "light_gray_concrete";
  const fin = faces.length > 1 || (faces[0][0] !== 0 ? c.z % 3 === 0 : c.x % 3 === 0);   // 3-block mullion grid
  return fin ? "white_concrete" : "cyan_stained_glass_pane";
}

for (const c of all) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, c.outDirs.length ? "stone_bricks" : "stone");   // foundation to the ground
  for (let y = g; y < T; y++) {
    const r = (y - g) % 4;
    if (setback.has(K(x, y, z))) { put(x, y, z, "smooth_stone"); continue; }
    const faces = facesAt(c, y);
    if (faces.length) { put(x, y, z, facadeBlock(c, y, faces)); continue; }
    if (y === T - 1 || y === T - 2) put(x, y, z, "stone");   // interior roof deck and surface
    else if (r === 0 && y <= T - 4) put(x, y, z, "smooth_stone");   // a floor slab per storey; air behind the glass
  }
  if (c.outDirs.length) put(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// 3. the lobby: two doors facing north off the notch, a transom, and a canopy on two posts into the porch
const lobby = at(13, 1);
const y0 = lobby.g;
put(13, y0, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(13, y0 + 1, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(14, y0, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
put(14, y0 + 1, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [12, 15]) for (let y = at(x, 2).g; y < y0 + 3; y++) put(x, y, 2, "white_concrete");   // porch posts
for (let x = 12; x <= 15; x++) for (let z = 1; z <= 2; z++) put(x, y0 + 3, z, "smooth_stone");   // canopy

// 4. warm light behind some glass: in the air gap behind a first window row, on the building's inside
const lit = (x, y, z) => (x * 31 + y * 17 + z * 7) % 9;
for (const c of all) for (let y = c.g + 1; y < c.T - 2; y++) {
  const b = B.get(K(c.x, y, c.z));
  if (!b || b.name !== "cyan_stained_glass_pane" || (y - c.g) % 4 !== 1) continue;
  const faces = facesAt(c, y); if (!faces.length) continue;
  const [dx, dz] = faces[0], ix = c.x - dx, iz = c.z - dz;
  const inner = at(ix, iz); if (!inner || facesAt(inner, y).length || B.has(K(ix, y, iz))) continue;
  const h = lit(c.x, y, c.z);
  if (h < 2 || (c.T >= 24 && h < 4)) put(ix, y, iz, (c.x + c.z) % 3 === 0 ? "shroomlight" : "glowstone");
}

// 5. the plant room on the 36 tier: a penthouse 3 cells in from the edge, two blocks high (top 38)
function depthIn(tier) {
  const dist = new Map(), q = [];
  for (const c of all) if (c.T === tier) {
    const edge = DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T !== tier; });
    if (edge) { dist.set(K(c.x, 0, c.z), 1); q.push(c); }
  }
  for (let i = 0; i < q.length; i++) {
    const c = q[i], d = dist.get(K(c.x, 0, c.z));
    for (const [dx, dz] of DIRS) {
      const n = at(c.x + dx, c.z + dz), k = K(c.x + dx, 0, c.z + dz);
      if (n && n.T === tier && !dist.has(k)) { dist.set(k, d + 1); q.push(n); }
    }
  }
  return dist;
}
const d36 = depthIn(36);
for (const [k, d] of d36) {
  if (d < 3) continue;
  const [x, , z] = k.split(",").map(Number);
  if (d === 3) {
    put(x, 36, z, x % 3 === 0 || z % 3 === 0 ? "white_concrete" : "cyan_stained_glass_pane");
    put(x, 37, z, "white_concrete");
  } else {
    put(x, 36, z, "light_gray_concrete");
    put(x, 37, z, "light_gray_concrete");
  }
}

// 6. air-conditioning plant on the 24 and 32 tiers, sparse and set in from the edge
for (const tier of [24, 32]) {
  const d = depthIn(tier);
  for (const c of all) if (c.T === tier && (d.get(K(c.x, 0, c.z)) ?? 0) >= 2 && (c.x * 5 + c.z * 3) % 9 === 0)
    put(c.x, tier, c.z, "iron_block");
}

// 7. panes connect to their neighbours like vanilla: to glass or any solid block in the same plane
const isGlass = (b) => !!b && b.name.endsWith("stained_glass_pane");
const solidAt = (x, y, z) => { const b = B.get(K(x, y, z)); return !!b && (isGlass(b) || !/_slab$|_door$/.test(b.name)); };
const tf = (b) => (b ? "true" : "false");
for (const [k, b] of B) {
  if (!isGlass(b)) continue;
  const [x, y, z] = k.split(",").map(Number);
  b.state = {
    north: tf(solidAt(x, y, z - 1)), south: tf(solidAt(x, y, z + 1)),
    east: tf(solidAt(x + 1, y, z)), west: tf(solidAt(x - 1, y, z)), waterlogged: "false",
  };
}

// 8. write the structure
const vox = new Voxels([W, HEIGHT, D]);
let top = 0;
for (const [k, b] of B) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, b.name, b.state);
  if (y > top) top = y;
}
const out = `${DIR}/way_440300787.nbt`;
const res = vox.save(out);
const tiers = {};
for (const c of all) tiers[c.T] = (tiers[c.T] ?? 0) + 1;
console.log(`way_440300787: ${res.blocks} blocks, ${res.palette} palette, top y ${top + 1} (roof ${Math.max(...all.map((c) => c.T))} + plant), cells by tier ${JSON.stringify(tiers)}`);
