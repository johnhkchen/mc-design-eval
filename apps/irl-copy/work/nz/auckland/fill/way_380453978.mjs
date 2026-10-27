// Ramada Suites, Mt Eden / Eden Terrace: a late-1980s precast-concrete hotel block. Light concrete storey lines and
// spandrels, tinted blue-green glazing in aluminium-style piers, a dark awning over the street door, and a stepped
// tower on the east side. Built from the lidar roof record: each cell's roof is snapped to whole 4-block storeys, with
// a 2-block parapet from four storeys up, so every tier is flat and stands on the tier below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_380453978.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([33, 66, 20]);

const key = (x, z) => `${x},${z}`;
const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// Lidar noise out first: each roof is the mean of its 3x3 neighbourhood, so a thin fin of lidar height tapers
// instead of standing as a spike, then massing: storeys of 4 blocks; S = top of the last storey, H = top with parapet.
const raw = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { x, z, gr, r }]));
const rec = new Map();
for (const c of raw.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const nb = raw.get(key(c.x + dx, c.z + dz)); if (nb) near.push(nb.r); }
  const mean = near.reduce((s, v) => s + v, 0) / near.length;
  const r = c.r >= 45 ? c.r : mean;                              // the tower keeps its lidar height (about 54 blocks)
  const n = r <= 8 ? 2 : Math.round((r - 2) / 4);
  const S = 4 * n, H = n >= 4 ? S + 2 : S;
  rec.set(key(c.x, c.z), { x: c.x, z: c.z, gr: c.gr, n, S, H });
}

// Exposed faces: an open side (no cell) first, then a side that drops to a lower neighbour (a setback).
for (const c of rec.values()) {
  const open = [], lower = [];
  for (const [d, [dx, dz]] of Object.entries(OFF)) {
    const nb = rec.get(key(c.x + dx, c.z + dz));
    if (!nb) open.push(d); else if (nb.H < c.H) lower.push(d);
  }
  c.dirs = [...open, ...lower];
  c.face = c.dirs[0] ?? null;          // null = interior cell (no exposed side)
  c.corner = c.dirs.length >= 2;
}

const plan = new Map();                // "x,y,z" -> { x, y, z, block, state?, pane? }
const put = (x, y, z, block, state, extra = {}) => plan.set(`${x},${y},${z}`, { x, y, z, block, state, ...extra });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const glassFor = (c) => (c.H >= 44 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane");

// A window row: glass panes between concrete piers; corners and every third cell along the face are piers.
function windowBlock(c) {
  const u = c.face === "north" || c.face === "south" ? c.x : c.z;
  if (c.corner || u % 3 === 0) return { block: "white_concrete" };
  return { block: glassFor(c), pane: c.face };
}

function facadeBlock(c, y) {
  if (y === c.gr) return { block: "polished_andesite" };                       // base course
  if (y >= c.S) return { block: y === c.H - 1 ? "white_concrete" : "light_gray_concrete" };   // parapet + coping
  if (y < 4) return y === 3 ? { block: "light_gray_concrete" } : windowBlock(c); // ground storey: shopfront, fascia
  const r = y % 4;
  if (r === 0) return { block: "white_concrete" };                            // storey line
  if (r === 3) return { block: "gray_concrete" };                             // spandrel (dark band between the glass rows)
  return windowBlock(c);
}

for (const c of rec.values()) {
  for (let y = 0; y < c.gr; y++) put(c.x, y, c.z, "stone_bricks");            // foundation to the ground
  if (!c.face) {                                                              // interior: floor slabs, roof deck, air
    for (let k = 1; k < c.n; k++) put(c.x, 4 * k, c.z, "white_concrete");
    put(c.x, c.S - 1, c.z, "light_gray_concrete");                            // roof membrane, reads as a roof not a pit
    continue;
  }
  for (let y = c.gr; y < c.H; y++) {
    const b = facadeBlock(c, y);
    put(c.x, y, c.z, b.block, undefined, b.pane ? { pane: b.pane } : {});
  }
}

// Entrance: the south street side, lowest ground, nearest the middle of the footprint.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const street = [...rec.values()].filter((c) => c.face && c.dirs.includes("south") && !rec.get(key(c.x, c.z + 1)));
street.sort((a, b) => a.gr - b.gr || Math.abs(a.x - cx) - Math.abs(b.x - cx));
if (street.length) {
  const e = street[0], ex = e.x, ez = e.z;
  const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(ex, e.gr + 1, ez, "dark_oak_door", doorState("lower"));
  put(ex, e.gr + 2, ez, "dark_oak_door", doorState("upper"));
  // dark awning across the entrance bay, lanterns hanging from it either side of the door
  for (let dx = -2; dx <= 2; dx++) {
    const c = rec.get(key(ex + dx, ez));
    if (!c || !c.face || !c.dirs.includes("south") || rec.get(key(ex + dx, ez + 1))) continue;
    put(ex + dx, 3, ez, "black_concrete");
    if (Math.abs(dx) === 2) put(ex + dx, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
  // the lobby behind the door is lit
  const [ix, iz] = INWARD.south;
  if (rec.get(key(ex + ix, ez + iz))) put(ex + ix, e.gr + 2, ez + iz, "glowstone");
}

// Warm light behind some windows: a glowstone in the air cell just inside the glass.
for (const c of rec.values()) {
  if (!c.face) continue;
  for (let y = c.gr; y < c.H; y++) {
    const b = at(c.x, y, c.z);
    if (!b?.pane || (c.x * 31 + c.z * 17 + y * 7) % 8 !== 0) continue;
    const [ix, iz] = INWARD[c.face];
    const inner = rec.get(key(c.x + ix, c.z + iz));
    if (!inner || inner.face || at(inner.x, y, inner.z)) continue;
    put(inner.x, y, inner.z, "glowstone");
  }
}

// Roof plant: a 2x2 housing on the highest interior roof nearest the tower's middle.
const top = Math.max(...[...rec.values()].map((c) => c.S));
const tower = [...rec.values()].filter((c) => c.S === top);
const tcx = tower.reduce((s, c) => s + c.x, 0) / tower.length, tcz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
const plantCand = [...rec.values()].filter((c) => !c.face && c.S === top && rec.get(key(c.x + 1, c.z)) && rec.get(key(c.x, c.z + 1)) && rec.get(key(c.x + 1, c.z + 1)));
plantCand.sort((a, b) => Math.hypot(a.x - tcx, a.z - tcz) - Math.hypot(b.x - tcx, b.z - tcz));
const pl = plantCand.find((c) => [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => { const n = rec.get(key(c.x + dx, c.z + dz)); return n && !n.face && n.S === top; }));
if (pl) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = top; y < top + 2; y++) put(pl.x + dx, y, pl.z + dz, "iron_block");

// Glass panes take their connections from the neighbouring panes on the same face.
const sameFace = (x, y, z, f) => at(x, y, z)?.pane === f ? "true" : "false";
for (const b of plan.values()) {
  if (!b.pane) continue;
  const f = b.pane;
  const alongX = f === "north" || f === "south";
  b.state = alongX
    ? { north: "false", south: "false", east: sameFace(b.x + 1, b.y, b.z, f), west: sameFace(b.x - 1, b.y, b.z, f), waterlogged: "false" }
    : { north: sameFace(b.x, b.y, b.z - 1, f), south: sameFace(b.x, b.y, b.z + 1, f), east: "false", west: "false", waterlogged: "false" };
}

for (const b of plan.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const res = g.save(`${DIR}/way_380453978.nbt`);
console.log("blocks", res.blocks, "palette", res.palette, "tower top", top, "entrance", street[0] ? [street[0].x, street[0].z] : null, "plant", pl ? [pl.x, pl.z] : null);
