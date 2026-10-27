import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 608167751: a 1960s-70s concrete-and-glass office block, seven storeys on the lidar roof (29-32 blocks), with
// lower wings (1-6 storeys) stepping down to the north-east and south-east. Solid concrete core, a plinth of stone
// bricks at street level, light-gray storey lines and piers framing a grid of tinted glass panes, one air cell behind
// each window (warm glowstone in some), a shopfront and a canopied entrance on the north face, parapets, roof plant.
// Storeys: a ground storey 4 rows tall plus a plinth row, then 4 rows per storey (3 window rows and a line). The
// lidar roof gives the storey count, smoothed by a 3x3 mode so tier edges are clean.

const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const ORDER = ["north", "south", "east", "west"];                // the corner priority of facade faces
const KEY = (x, z) => `${x},${z}`;
const POS = (x, y, z) => `${x},${y},${z}`;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167751.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167751.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([37, 47, 68]);
const plan = new Map();                                            // "x,y,z" -> { block, state }: the facade, roof and details
const P = (x, y, z, block, state) => plan.set(POS(x, y, z), { block, state });

const roof = new Map(cells.map(([x, z, ground, r]) => [KEY(x, z), { ground, r }]));

// 1. Storeys per cell from the lidar roof, then the 3x3 mode of the storey counts (ties keep the cell's own count).
const rawS = (r) => Math.min(7, Math.max(1, Math.floor((r - 1) / 4)));
const S = new Map();
for (const [key, { r }] of roof) {
  const [x, z] = key.split(",").map(Number);
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = roof.get(KEY(x + dx, z + dz)); if (!o) continue;
    count.set(rawS(o.r), (count.get(rawS(o.r)) || 0) + 1);
  }
  let best = rawS(r), n = count.get(best) || 0;
  for (const [s, c] of count) if (c > n) { best = s; n = c; }
  S.set(key, best);
}

// 2. Top row per cell: 4s for a plain roof, 4s + 2 where the cell is at the edge of its tier (a parapet ring).
const isEdge = (x, z, s) => ORDER.some((d) => {
  const [dx, dz] = DIR[d]; const n = S.get(KEY(x + dx, z + dz)); return n === undefined || n < s;
});
const top = new Map();
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number); const s = S.get(key);
  top.set(key, 4 * s + (isEdge(x, z, s) ? 2 : 0));
}
const solidAt = (x, y, z) => { const t = top.get(KEY(x, z)); return t !== undefined && t >= y && y >= 0; };

// 3. Solid core from the foundation (ground is 0 everywhere, so nothing below it) to the top row.
for (const [key, { ground }] of roof) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "white_concrete");
  for (let y = 0; y <= top.get(key); y++) g.set(x, y, z, "white_concrete");
}

// 4. The entrance: the north (or other) face with the most usable street-level bays; door in the middle of them.
const cand = Object.fromEntries(ORDER.map((d) => [d, []]));
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number);
  for (const d of ORDER) {
    const [dx, dz] = DIR[d];
    if (solidAt(x + dx, 1, z + dz)) continue;                     // not exposed at street level
    const u = dx !== 0 ? z : x; if (u % 3 === 0) continue;         // a pier, not a bay
    if (!solidAt(x - dx, 1, z - dz) || !solidAt(x - 2 * dx, 1, z - 2 * dz)) continue;
    cand[d].push({ x, z, u });
  }
}
const door = ORDER.map((d) => ({ d, list: cand[d].sort((a, b) => a.u - b.u) })).sort((a, b) => b.list.length - a.list.length)[0];
const doorDir = door.d, [ddx, ddz] = DIR[doorDir];
const D = door.list[Math.floor(door.list.length / 2)];
const alongU = (off) => (ddx !== 0 ? { x: D.x, z: D.z + off } : { x: D.x + off, z: D.z });   // the facade cell at u offset
const doorU = ddx !== 0 ? D.z : D.x;

// 5. The facade: each exposed face at rows 0..4s gets the plinth, storey line, pier or window of its row and bay.
const panes = new Map();                                          // "x,y,z" -> the facade's normal axis, for pane connections
const gaps = new Set();                                           // air cells behind a window, lit or not
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number); const s = S.get(key); const t = top.get(key);
  // roof and parapet: a flat roof (gray) inside, a light cap on the parapet ring
  if (t === 4 * s + 2) P(x, t, z, "light_gray_concrete");
  else P(x, 4 * s, z, "smooth_stone");                           // a pale roof inside the parapet, not a dark well
  for (let y = 0; y <= 4 * s; y++) {
    const dirs = ORDER.filter((d) => !solidAt(x + DIR[d][0], y, z + DIR[d][1]));
    if (!dirs.length) continue;
    const [dx, dz] = DIR[dirs[0]];
    const ground = y < 4, plinth = y === 0, line = y > 0 && y % 4 === 0;
    const u = dx !== 0 ? z : x, pier = u % 3 === 0;
    const i1 = [x - dx, z - dz], i2 = [x - 2 * dx, z - 2 * dz];
    const bayOK = solidAt(i1[0], y, i1[1]) && solidAt(i2[0], y, i2[1]);
    let block;
    if (plinth) block = "stone_bricks";
    else if (line) block = "light_gray_concrete";
    else if (pier || !bayOK) block = ground ? "stone_bricks" : "light_gray_concrete";
    else {
      block = ground ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
      panes.set(POS(x, y, z), dx !== 0 ? "x" : "z");
      gaps.add(POS(i1[0], y, i1[1]));
    }
    P(x, y, z, block);
  }
}

// 6. The entrance: a door (lower and upper), a lintel and canopy over it, and steps up from the street.
const doorState = (half) => ({ facing: doorDir, half, hinge: "left", open: "false", powered: "false" });
const [ex, ez] = [D.x, D.z];
P(ex, 1, ez, "dark_oak_door", doorState("lower"));
P(ex, 2, ez, "dark_oak_door", doorState("upper"));
for (const off of [-1, 0, 1]) {
  const f = alongU(off);
  P(f.x, 3, f.z, "light_gray_concrete");                          // the lintel is solid, so the canopy has something to carry it
  for (let t = 1; t <= 2; t++) P(f.x + ddx * t, 3, f.z + ddz * t, "light_gray_concrete");
}
P(ex + ddx, 0, ez + ddz, "stone_brick_stairs", { facing: doorDir, half: "bottom", shape: "straight", waterlogged: "false" });
const hall = [1, 2].map((dy) => POS(ex - ddx, dy, ez - ddz));    // the entrance hall's air: walkable, never lit
for (const p of hall) gaps.add(p);

// 7. Roof plant: a pair of 2-high plant boxes on some interior roofs.
for (const [key] of roof) {
  const [x, z] = key.split(",").map(Number); const s = S.get(key);
  if (s >= 2 && top.get(key) === 4 * s && x % 6 === 3 && z % 6 === 3) {
    P(x, 4 * s + 1, z, "smooth_stone"); P(x, 4 * s + 2, z, "smooth_stone");
  }
}

// 8. Air behind the glass, with warm light (glowstone) behind about one window in nine; the entrance hall stays clear.
for (const p of gaps) {
  if (plan.has(p)) continue;
  const [x, y, z] = p.split(",").map(Number);
  const lit = !hall.includes(p) && (x * 7 + y * 13 + z * 5) % 9 === 0;
  g.set(x, y, z, lit ? "glowstone" : "air");
}

// 9. The facade and detail blocks.
for (const [p, { block, state }] of plan) {
  const [x, y, z] = p.split(",").map(Number);
  g.set(x, y, z, block, state);
}

// 10. Pane connections: a pane joins the neighbouring panes, piers and door in its own plane only.
const occupied = (x, y, z) => g.val(x, y, z) !== 0;
for (const [p, axis] of panes) {
  const [x, y, z] = p.split(",").map(Number);
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (axis === "x") { st.north = String(occupied(x, y, z - 1)); st.south = String(occupied(x, y, z + 1)); }
  else { st.east = String(occupied(x + 1, y, z)); st.west = String(occupied(x - 1, y, z)); }
  const block = plan.get(p).block;
  g.set(x, y, z, block, st);
}

const res = g.save(OUT);
console.log(`way_608167751: ${res.blocks} blocks, ${res.palette} palette entries; ${panes.size} panes, ${gaps.size} gap cells, door on ${doorDir}`);
