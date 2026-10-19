// DC70862: 101 F St NW, an Educational building read from the lidar record. A flat-roofed, brick-and-limestone academic
// block about two storeys high on most of its footprint, low wings (6 blocks) at the east end, and two three-storey
// cores (10 blocks), squared off from the lidar and set back at least one cell from the outer edge, so the massing
// steps in as it rises.
// Red brick fields, pale limestone piers, cornice and spandrels, a stone-brick plinth, glass in every storey with
// one entrance on the street (north) face under a stone hood, and roof plant on the core.
//
// Each column fills solid from y 0 to its roof tier, so the downhill cells show their extra foundation courses and
// nothing hangs. Storeys follow an absolute 3-block rhythm: a spandrel row, then two window rows. Exposure is per row:
// a wall faces outward wherever a neighbour is outside the footprint or stands lower, so the setbacks get windows too.
// Rooms are one cell deep behind the glass: air at the window rows, a floor slab and a ceiling per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70862.cells.json`, "utf8"));
const W = 28, D = 26, H = 22;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);

// Lidar roof: the mean over a 5x5 neighbourhood (cell-by-cell readings alternate 8 and 10 on the core; the regional
// mean gives the two pavilions as whole blocks), then flat tiers.
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) { s += byXZ.get(key(x + dx, z + dz)).r; n++; }
  return s / n;
};

// Distance in cells from the outer edge (edge cells are 1): the core must sit at least one cell in to rise to 10.
const dist = new Map(); const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (faces(x, z).length) { dist.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(key(x, z));
  for (const [, dx, dz] of FACES) { const n = key(x + dx, z + dz); if (inside(x + dx, z + dz) && !dist.has(n)) { dist.set(n, d + 1); queue.push([x + dx, z + dz]); } }
}

// Roof tiers: low wings 6, main block 8, core 10 (only inside the one-cell inset, else 8).
const info = new Map();
for (const [x, z, G] of cells) {
  const s = smoothRoof(x, z);
  const T = s < 7.5 ? 6 : s < 9 ? 8 : (dist.get(key(x, z)) >= 2 ? 10 : 8);
  info.set(key(x, z), { x, z, g: G, T, fs: faces(x, z) });
}
// Each core is squared off to the bounding box of its lidar blob (a lozenge), still one cell in from the edge.
const seen = new Set();
for (const c0 of [...info.values()]) {
  if (c0.T !== 10 || seen.has(key(c0.x, c0.z))) continue;
  const comp = [c0]; seen.add(key(c0.x, c0.z));
  for (let i = 0; i < comp.length; i++) for (const [, dx, dz] of FACES) {
    const n = info.get(key(comp[i].x + dx, comp[i].z + dz));
    if (n && n.T === 10 && !seen.has(key(n.x, n.z))) { seen.add(key(n.x, n.z)); comp.push(n); }
  }
  const [x0, x1] = [Math.min(...comp.map((p) => p.x)), Math.max(...comp.map((p) => p.x))];
  const [z0, z1] = [Math.min(...comp.map((p) => p.z)), Math.max(...comp.map((p) => p.z))];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const n = info.get(key(x, z));
    if (n && dist.get(key(x, z)) >= 2) n.T = 10;
  }
}

const topOf = (x, z) => (info.has(key(x, z)) ? info.get(key(x, z)).T : 0);

// A wall row is exposed where some side neighbour is outside the footprint or stands below that row.
const exposed = (x, z, y) => FACES.some(([, dx, dz]) => topOf(x + dx, z + dz) <= y);

// Piers: corners, and every third cell along each street-facing face. Calcite, full height.
const isPier = (c) => c.fs.length >= 2 || c.fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);

// Storey rhythm: spandrel at y%3==1, glass at y=2,3 / 5,6 / 8,9 below the coping (the top row, T-1).
const isSpandrel = (y) => y % 3 === 1;
const isWindowRow = (y, T) => [2, 3, 5, 6, 8, 9].includes(y) && y <= T - 2;

// Street entrance on the north face, at x 8: a hall cell behind it, a door, and a stone hood over it.
const ENTRY = { x: 8, z: 0 };

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { type: "top", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

// Hash for the lamps: which pockets get light, stable across runs.
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// Pass 1: the solid shell and the glass, per cell.
for (const c of info.values()) {
  const { x, z, g: G, T } = c;
  const pier = isPier(c);
  const door = x === ENTRY.x && z === ENTRY.z;
  for (let y = 0; y < T; y++) {
    const outer = exposed(x, z, y);
    if (y === T - 1) { put(x, y, z, outer ? "calcite" : "smooth_stone"); continue; }        // limestone coping / roof deck
    if (y === 0 && outer) { put(x, y, z, "stone_bricks"); continue; }                       // base course, foundation
    if (y < G) { put(x, y, z, "stone"); continue; }                                         // foundation under a slope
    if (!outer) {                                                                             // interior: floor slabs, solid bricks
      put(x, y, z, isSpandrel(y) ? "smooth_stone" : "bricks");
      continue;
    }
    if (pier) { put(x, y, z, "calcite"); continue; }
    if (isSpandrel(y)) { put(x, y, z, "smooth_stone"); continue; }
    if (door && y === 1) { put(x, y, z, "dark_oak_door", DOOR("lower")); continue; }
    if (door && y === 2) { put(x, y, z, "dark_oak_door", DOOR("upper")); continue; }
    if (door && y === 3) { put(x, y, z, "stone_brick_slab", HOOD); continue; }
    if (isWindowRow(y, T)) { put(x, y, z, "glass_pane", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" }); continue; }
    put(x, y, z, "bricks");
  }
}

// The entrance hall: one cell behind the door, air for the two rows of the door, under the solid spandrel.
blocks.delete(`${ENTRY.x},1,${ENTRY.z + 1}`); blocks.delete(`${ENTRY.x},2,${ENTRY.z + 1}`);

// Pass 2: rooms one cell deep behind the glass, air at window rows, with a floor slab and a ceiling per storey.
for (const c of info.values()) {
  if (c.fs.length) continue;
  const { x, z, T } = c;
  for (let y = 2; y < T; y++) {
    if (!isWindowRow(y, T)) continue;
    const behindGlass = FACES.some(([, dx, dz]) => has(x + dx, y, z + dz) && blocks.get(`${x + dx},${y},${z + dz}`).block === "glass_pane");
    if (!behindGlass) continue;
    blocks.delete(`${x},${y},${z}`);
    const top = y % 3 === 0;                                  // the upper row of each pair: a hanging lantern under the spandrel
    if (top && hash(x, y, z) % 3 === 0) put(x, y, z, "lantern", LANTERN);
    else if (!top && hash(x, y, z) % 4 === 0) put(x, y, z, "glowstone");   // a lamp on the floor behind the glass
  }
}

// Roof plant on the core: a few air-handling units on the roof deck, spaced out.
for (const c of info.values()) {
  if (c.T !== 10 || c.fs.length) continue;
  if (c.x % 4 === 1 && c.z % 4 === 1) put(c.x, 10, c.z, "iron_block");
}

// Glass panes connect to neighbours: to other panes and to solid blocks, as vanilla does.
const solidAt = (x, y, z) => { const b = blocks.get(`${x},${y},${z}`); return !!b && b.block !== "glass_pane" && b.block !== "lantern"; };
for (const b of blocks.values()) {
  if (b.block !== "glass_pane") continue;
  const link = (dx, dz) => (has(b.x + dx, b.y, b.z + dz) && (blocks.get(`${b.x + dx},${b.y},${b.z + dz}`).block === "glass_pane" || solidAt(b.x + dx, b.y, b.z + dz))) ? "true" : "false";
  b.state = { north: link(0, -1), east: link(1, 0), south: link(0, 1), west: link(-1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.block, b.state);
g.save(`${DIR}/DC70862.nbt`);
