// 920 R St NW (Shaw, Washington DC): a red-brick school, the Victorian-era kind with limestone string courses,
// a dark slate roof and a copper-capped central tower over the entrance bay. Massing follows the lidar roof
// (median-smoothed into flat tiers); walls are a one-block skin, rooms are air rows behind glass, floors are slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73465.cells.json`, "utf8"));
const [W, H, D] = [50, 19, 37];

// footprint: ground g (lowest-ground relative), t = top layer index (roof height r above y0, minus one)
const F = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) F[x][z] = { g, r, t: r - 1 };
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && F[x][z] !== null;

// lidar noise to flat tiers: median of the in-footprint 3x3 block
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!F[x][z]) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(F[x + dx][z + dz].r);
  vals.sort((a, b) => a - b);
  F[x][z].t = vals[(vals.length - 1) >> 1] - 1;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// OUT = street-facing skin; STEP = a wall above a lower neighbour's roof; INT = hollow room cell (floors + ceiling only)
const kindOf = (x, z) => {
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) return "OUT";
  if (DIRS.some(([dx, dz]) => inF(x + dx, z + dz) && F[x + dx][z + dz].t < F[x][z].t)) return "STEP";
  return "INT";
};

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { x, y, z, block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// pass 1: the columns. rel = height above the cell's own ground; even rows are stone floor/string lines, odd rows brick
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = F[x][z]; if (!c) continue;
  c.k = kindOf(x, z);
  const { g, t } = c;
  if (t < g) { put(x, 0, z, "smooth_stone"); continue; }          // a one-block paved terrace
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");        // foundation to the lowest ground
  const tr = t - g;
  if (tr === 0) { put(x, g, z, "smooth_stone"); continue; }
  for (let y = g; y <= t; y++) {
    const rel = y - g;
    let b = null;
    if (y === t) b = c.k === "OUT" ? "smooth_stone" : c.t === 6 ? "waxed_oxidized_copper" : "deepslate_tiles";
    else if (rel === 0) b = c.k === "INT" ? "smooth_stone" : tr >= 2 ? "stone_bricks" : "bricks";
    else if (c.k === "INT") b = rel % 2 === 0 || y === t - 1 ? "smooth_stone" : null;
    else b = rel % 2 === 0 ? "smooth_stone" : "bricks";
    if (b) put(x, y, z, b);
  }
}

// pass 2: windows on the skin, in 2-wide bays on a 4-block rhythm, only where a room cell behind is air
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = F[x][z]; if (!c || c.k !== "OUT" || c.t - c.g < 3) continue;
  const out = DIRS.find(([dx, dz]) => !inF(x + dx, z + dz));
  const [dx, dz] = out;
  const along = dx !== 0 ? z : x;
  if (!(along % 4 === 1 || along % 4 === 2)) continue;
  for (let rel = 1; rel <= c.t - c.g - 2; rel += 2) {
    const y = c.g + rel;
    if (!inF(x - dx, z - dz) || at(x - dx, y, z - dz)) continue;
    put(x, y, z, "glass_pane");
    if ((x + z + y) % 5 === 0) put(x - dx, y, z - dz, "glowstone");   // warm light behind some panes
  }
}

// pass 3: the entrance bay on the north face (z 0), a double dark-oak door with a stone surround
for (const x of [12, 13]) {
  const g = F[x][0].g;
  const hinge = x === 12 ? "left" : "right";
  const st = (half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
  put(x, g, 0, "dark_oak_door", st("lower"));
  put(x, g + 1, 0, "dark_oak_door", st("upper"));
}

// pass 4: glass panes connect to the neighbours that are there, so the frames run unbroken
const link = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
for (const b of B.values()) {
  if (b.block !== "glass_pane") continue;
  b.state = Object.fromEntries(Object.entries(link).map(([side, [dx, dz]]) => [side, at(b.x + dx, b.y, b.z + dz) ? "true" : "false"]));
}

// pass 5: the tower's stone drum and copper cap, centred on the tallest tier
const tower = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (F[x][z]?.t === 6) tower.push([x, z]);
if (tower.length) {
  const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  const ok = ([x, z]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => F[x + a]?.[z + b]?.t === 6);
  const [px, pz] = tower.filter(ok).sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0] ?? [];
  if (px !== undefined) {
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(px + a, 7, pz + b, "smooth_stone");
    put(px, 8, pz, "waxed_oxidized_copper");
  }
}

const v = new Voxels([W, H, D]);
for (const b of B.values()) v.set(b.x, b.y, b.z, b.block, b.state);
const out = `${DIR}/DC73465.nbt`;
const res = v.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
