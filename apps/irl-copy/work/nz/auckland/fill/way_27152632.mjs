import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Auckland Central Fire Station (way 27152632). A mid-century reinforced-concrete block: brick ground storey with the
// apparatus bays, white render above, a brick hose-drying tower on the tallest tier. Storey slabs sit at y = 3 + 4k, so
// every roof cap is a slab line and every tier is a whole number of 4-block storeys.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_27152632.cells.json", "utf8"));

const FLOOR0 = 3;                                   // the ground-storey slab; storey k's slab is at FLOOR0 + 4k
const DOOR = 1;                                     // index along the front run of the pedestrian door
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const key = (x, z) => `${x},${z}`;

// ---- massing: lidar roof -> median -> 4-block tiers -> mode filter, so the tiers come out flat
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { x, z, g: ground, raw: roof, H: 0, next: 0 });
const cell = (x, z) => foot.get(key(x, z));
const height = (x, z) => cell(x, z)?.H ?? 0;

for (const c of foot.values()) {
  const v = [c.raw];
  for (const [dx, dz] of NB8) { const n = cell(c.x + dx, c.z + dz); if (n) v.push(n.raw); }
  v.sort((a, b) => a - b);
  c.H = Math.min(28, Math.max(8, 4 * Math.round(v[v.length >> 1] / 4)));
}
const RING2 = [];
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx || dz) RING2.push([dx, dz]);
for (let pass = 0; pass < 3; pass++) {
  const reach = pass < 2 ? NB8 : RING2;                  // the last pass looks 2 cells out, so the tiers come out flat
  for (const c of foot.values()) {
    const n = new Map(); const bump = (h) => n.set(h, (n.get(h) ?? 0) + 1);
    bump(c.H);
    for (const [dx, dz] of reach) { const o = cell(c.x + dx, c.z + dz); if (o) bump(o.H); }
    let best = c.H;                                  // ties keep the cell's own tier
    for (const [h, k] of n) if (k > (n.get(best) ?? 0)) best = h;
    c.next = best;
  }
  for (const c of foot.values()) c.H = c.next;
}

// ---- envelope helpers
const S0 = (x, y, z) => y >= 0 && y < height(x, z);                  // inside the massing before walls are cut
const base = (c) => Math.max(c.g, FLOOR0);                             // plinth top: the ground, or the ground slab if lower
const isSlab = (y) => y >= FLOOR0 && (y - FLOOR0) % 4 === 0;
const exposed = (x, y, z) => NB.filter(([dx, dz]) => !S0(x + dx, y, z + dz));   // outward faces at this height

// ---- the front: the longest straight run of single-face ground-storey cells is the apparatus frontage
const lines = new Map();
for (const c of foot.values()) {
  if (c.g > FLOOR0) continue;
  const ex = exposed(c.x, FLOOR0 + 1, c.z);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0];
  const k = `${dx},${dz},${dx ? c.x : c.z}`;
  if (!lines.has(k)) lines.set(k, []);
  lines.get(k).push({ c, dx, dz, u: dx ? c.z : c.x });
}
let front = [];
for (const list of lines.values()) {
  list.sort((a, b) => a.u - b.u);
  let run = [];
  for (const e of list) {
    if (run.length && e.u !== run[run.length - 1].u + 1) { if (run.length > front.length) front = run; run = []; }
    run.push(e);
  }
  if (run.length > front.length) front = run;
}
const slot = new Map(front.map((e, i) => [key(e.c.x, e.c.z), i]));
const bayAt = (i) => i >= 3 && (i - 3) % 6 < 4;                        // apparatus bays: 4 wide, 2-wide piers between

// ---- the hose-drying tower: a 3x3 on the tallest tier nearest its centroid
const tallest = [...foot.values()].filter((c) => c.H === 28);
const cx = tallest.reduce((s, c) => s + c.x, 0) / tallest.length, cz = tallest.reduce((s, c) => s + c.z, 0) / tallest.length;
let tower = null;
for (const c of tallest) {
  const flat = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => height(c.x + dx, c.z + dz) === 28));
  if (!flat) continue;
  const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
  if (!tower || d < tower.d) tower = { x: c.x, z: c.z, d };
}

// ---- materials
const BRICK = "bricks", RENDER = "white_concrete", STONE = "stone_bricks", SLAB = "smooth_stone", RED = "red_concrete";
const pane = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const facing = (dx, dz) => (dx > 0 ? "east" : dx < 0 ? "west" : dz > 0 ? "south" : "north");

const g = new Voxels([41, 41, 93]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// ---- the cut envelope: plinth, storey slabs, roof caps, a one-block wall shell, air behind it
for (const c of foot.values()) {
  for (let y = 0; y < c.H; y++) {
    if (y < base(c)) { put(c.x, y, c.z, STONE); continue; }
    if (isSlab(y)) { put(c.x, y, c.z, y === FLOOR0 && exposed(c.x, y, c.z).length ? STONE : SLAB); continue; }
    const ex = exposed(c.x, y, c.z);
    if (!ex.length) continue;                                           // interior air
    const storey = Math.floor((y - FLOOR0) / 4), r = (y - FLOOR0) % 4;  // r: 1 sill row, 2 glass, 3 lintel
    const wall = storey === 0 ? BRICK : RENDER;
    if (ex.length > 1) { put(c.x, y, c.z, wall); continue; }             // corners stay piers
    const [dx, dz] = ex[0], u = dx ? c.z : c.x;
    const i = storey === 0 ? slot.get(key(c.x, c.z)) : undefined;
    if (i !== undefined) {
      if (i === DOOR) {
        if (r <= 2) put(c.x, y, c.z, "oak_door", { facing: facing(dx, dz), half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else put(c.x, y, c.z, wall);
        continue;
      }
      if (bayAt(i)) { put(c.x, y, c.z, r === 3 ? RENDER : RED); continue; }
    }
    if (r === 3 || u % 4 === 0 || u % 4 === 3) { put(c.x, y, c.z, wall); continue; }   // lintel row and piers
    put(c.x, y, c.z, "glass_pane", pane(dx));
    if (r === 1) {                                                       // warm light inside, standing on the slab
      const ix = c.x - dx, iz = c.z - dz, inner = cell(ix, iz);
      if (inner && y >= base(inner) && !exposed(ix, y, iz).length) {
        const h = (c.x * 31 + c.z * 17 + y * 7) % 9;
        if (h === 0) put(ix, y, iz, "glowstone");
        else if (h === 4) put(ix, y, iz, "lantern", { hanging: "false" });
      }
    }
  }
}

// ---- entrance canopy over the pedestrian door, cantilevered from the lintel
if (front.length > DOOR) {
  const e = front[DOOR], u0 = e.dx ? e.c.z : e.c.x;
  for (let k = 1; k <= 2; k++) for (let j = -1; j <= 1; j++) {
    const x = e.dx ? e.c.x + e.dx * k : u0 + j, z = e.dx ? u0 + j : e.c.z + e.dz * k;
    if (!S0(x, 6, z)) put(x, 6, z, STONE);
  }
}

// ---- parapet: a half-slab on every roof edge (any neighbour lower or missing)
for (const c of foot.values()) {
  if (NB.some(([dx, dz]) => height(c.x + dx, c.z + dz) < c.H)) put(c.x, c.H, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- hose tower: brick, louvred at mid-height, capped, with a lantern on top
if (tower) {
  const T = 28, TOP = 36;
  for (let y = T; y < TOP; y++) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    const x = tower.x + dx, z = tower.z + dz, mid = dx === 0 || dz === 0;
    if (mid && (y === 30 || y === 31)) put(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    else put(x, y, z, BRICK);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(tower.x + dx, TOP, tower.z + dz, SLAB);
  put(tower.x, TOP + 1, tower.z, "lantern", { hanging: "false" });
}

// ---- roof plant: light-grey boxes on the plateaus of the mid tiers, kept clear of the tower
const plateau = (c) => NB8.every(([dx, dz]) => height(c.x + dx, c.z + dz) === c.H);
const boxes = [];
for (const c of foot.values()) {
  if (boxes.length >= 4 || c.H === 28 || c.H < 12) continue;
  if (!plateau(c) || !cell(c.x + 1, c.z + 1) || !plateau(cell(c.x + 1, c.z + 1))) continue;
  if (tower && Math.abs(c.x - tower.x) <= 3 && Math.abs(c.z - tower.z) <= 3) continue;
  if (boxes.some((b) => Math.abs(b.x - c.x) < 6 && Math.abs(b.z - c.z) < 6)) continue;
  boxes.push(c);
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = c.H; y < c.H + 2; y++) put(c.x + dx, y, c.z + dz, "light_gray_concrete");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_27152632.nbt");
console.log(JSON.stringify({ footprint: foot.size, front: front.length, tower: !!tower, boxes: boxes.length, ...info }));
