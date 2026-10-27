import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 293020926, Eden Terrace fringe, Auckland: a 1960s-70s reinforced-concrete office and flats block. A basalt
// plinth, white concrete piers with light-grey storey lines, aluminium-framed tinted glazing with air behind it, a
// recessed entrance under a canopy, and a flat parapet roof with plant. Four tiers (2.5, 2 and 3 storeys stepping up
// to a 4-storey core) from the lidar roof heights, which are median-smoothed into clean flat tiers.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020926.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020926.nbt";
const W = 54, H = 31, D = 57;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const OUTWARD = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // north, south, west, east
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const tierOf = (r) => (r <= 6 ? 5 : r <= 10 ? 9 : r <= 14 ? 13 : 17);   // roof heights snapped to flat tiers (cap at T-1)

// --- footprint and tiers --------------------------------------------------------------------------------------------
const foot = new Map();
for (const [x, z, G, R] of cells) foot.set(`${x},${z}`, { x, z, G, R, T: tierOf(R) });
const at = (x, z) => foot.get(`${x},${z}`);
for (let pass = 0; pass < 2; pass++) {                       // mode filter over the 8 neighbours: the commonest tier wins, so no lone spikes
  const next = new Map();
  for (const [k, c] of foot) {
    const votes = new Map([[c.T, 1]]);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const o = at(c.x + dx, c.z + dz); if (o) votes.set(o.T, (votes.get(o.T) || 0) + 1);
    }
    let best = c.T, bv = votes.get(c.T);
    for (const [t, v] of [...votes].sort((a, b) => a[0] - b[0])) if (v > bv) { best = t; bv = v; }
    next.set(k, best);
  }
  for (const [k, t] of next) foot.get(k).T = t;
}
// facade: a cell with a missing 4-neighbour; n = the outward normal (first missing side)
for (const c of foot.values()) c.n = OUTWARD.find(([dx, dz]) => !at(c.x + dx, c.z + dz)) || null;

// --- blocks, keyed x,y,z so the air gaps and the door can overwrite what the first pass placed ---------------------
const blk = new Map();
const put = (x, y, z, b, s) => blk.set(`${x},${y},${z}`, { b, s });
const del = (x, y, z) => blk.delete(`${x},${y},${z}`);

for (const c of foot.values()) {
  const { x, z, G, T, n } = c;
  const idx = n ? (n[0] ? z : x) : 0;                        // position along the facade, for the pier rhythm
  for (let y = 0; y < T; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }                 // basalt foundation
    if (y === T - 1) { put(x, y, z, n ? "light_gray_concrete" : "stone"); continue; }   // parapet / roof covering
    if (!n) { put(x, y, z, "smooth_stone"); continue; }                     // interior, never seen
    if (y === G) { put(x, y, z, "polished_andesite"); continue; }           // base course
    const row = y % 4;
    if (row === 0 || row === 3) { put(x, y, z, "light_gray_concrete"); continue; }   // storey line and lintel
    const pier = y >= 4 && idx % 3 === 0;                                  // ground floor is all shopfront glass
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
  }
}

// air gap behind each window, a floor-slab-thick solid behind that; a few warm lamps inside the gap
const panes = [];
for (const c of foot.values()) {
  if (!c.n) continue;
  const ix = c.x - c.n[0], iz = c.z - c.n[1];                  // inward cell
  const inner = at(ix, iz);
  for (let y = c.G; y < c.T - 1; y++) {
    const isPane = blk.get(`${c.x},${y},${c.z}`)?.b === "light_blue_stained_glass_pane";
    if (!isPane) continue;
    panes.push([c.x, y, c.z, c.n]);
    if (!inner || inner.n || y % 4 === 0 || y % 4 === 3) continue;   // keep solid where the back is a facade or a line
    del(ix, y, iz);
  }
  // warm lamp in the gap behind some windows, lantern-tinted glow on the glass at dusk
  if (inner && !inner.n) {
    for (let y = c.G; y < c.T - 1; y++) {
      if (y % 4 !== 1 || !blk.has(`${c.x},${y},${c.z}`)) continue;
      const h = (c.x * 3 + c.z * 5 + y * 7) % 13;
      if (h === 0) put(ix, y, iz, "glowstone");
      else if (h === 5) put(ix, y, iz, "shroomlight");
    }
  }
}

// --- entrance: ground-floor 2-storey face, recessed one block, door + canopy + hanging lantern --------------------
const solidInside = (c) => { const inner = at(c.x - c.n[0], c.z - c.n[1]); return !!inner && !inner.n; };
const entryCands = [...foot.values()].filter((c) => c.n && c.G === 0 && c.T === 9 && solidInside(c));
const westFace = entryCands.filter((c) => c.n[0] === -1);
const pool = westFace.length ? westFace : entryCands;
const zMid = pool.reduce((s, c) => s + c.z, 0) / pool.length;
const entry = pool.sort((a, b) => Math.abs(a.z - zMid) - Math.abs(b.z - zMid))[0];
if (!entry) throw new Error("no entrance candidate");
const [ex, ez] = [entry.x, entry.z], [nx, nz] = entry.n;
const [ix, iz] = [ex - nx, ez - nz];
const facing = FACE[`${nx},${nz}`];
for (const y of [1, 2]) {
  del(ex, y, ez);                                              // porch: open air on the outside
  const half = y === 1 ? "lower" : "upper";
  put(ix, y, iz, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
}
// canopy: three plates on the lintel row, the centre one a full block, the flanks slabs, all tied to the solid behind
const along = nx ? [0, 1] : [1, 0];
for (const s of [-1, 0, 1]) {
  const cx = ex + along[0] * s, cz = ez + along[1] * s;
  if (s === 0) put(cx, 3, cz, "smooth_stone");
  else put(cx, 3, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
put(ex, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the canopy, in the porch

// --- roof: plant on the tier-13 and tier-17 roofs, a stair/lift overrun on the core ------------------------------------
for (const c of foot.values()) {
  if (c.n || c.T < 13) continue;
  if ((c.x % 8 === 3 && c.z % 8 === 3) || (c.x % 8 === 4 && c.z % 8 === 4)) put(c.x, c.T, c.z, "iron_block");
}
const core = [...foot.values()].filter((c) => c.T === 17);
const cx0 = core.reduce((s, c) => s + c.x, 0) / core.length, cz0 = core.reduce((s, c) => s + c.z, 0) / core.length;
const coreBox = [];
for (const c of core) {
  if (c.n) continue;
  if (Math.abs(c.x - cx0) <= 1.5 && Math.abs(c.z - cz0) <= 1.5) {
    const ok = [[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dz]) => at(c.x + dx, c.z + dz)?.T === 17);
    if (ok) coreBox.push(c);
  }
}
for (const c of coreBox) {
  put(c.x, c.T, c.z, "smooth_stone");
  put(c.x, c.T + 1, c.z, "light_gray_concrete");
}

// --- pane connections: each pane joins its in-plane neighbours only (air behind, so no depth arms) -----------------
for (const [x, y, z, n] of panes) {
  if (!blk.has(`${x},${y},${z}`)) continue;                      // the porch opened this one
  const has = (dx, dz) => blk.has(`${x + dx},${y},${z + dz}`);
  const st = n[0] ? { north: has(0, -1), south: has(0, 1), east: false, west: false }
                  : { north: false, south: false, east: has(1, 0), west: has(-1, 0) };
  const s = Object.fromEntries(Object.entries({ ...st, waterlogged: false }).map(([k, v]) => [k, String(v)]));
  blk.get(`${x},${y},${z}`).s = s;
}

// --- write the volume ------------------------------------------------------------------------------------------------
const g = new Voxels([W, H, D]);
for (const [k, { b, s }] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const res = g.save(OUT);
console.log(`way_293020926: ${cells.length} footprint cells, tiers ${[...new Set([...foot.values()].map((c) => c.T))].sort((a, b) => a - b)}, ` +
  `entrance (${ex},${ez}) facing ${facing}, ${res.blocks} blocks, ${res.palette} palette`);
