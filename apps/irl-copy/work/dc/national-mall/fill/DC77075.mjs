import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1800 G St NW: mid-century (c.1960s-70s) Commercial Office, Foggy Bottom.
// Pale precast/concrete frame, bronze-grey glazing in a regular bay grid,
// a stone base course, a setback tower-on-podium, and a light flat roof with plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77075.cells.json`, "utf8"));

const W = 23, H = 33, D = 34;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(key(x, z), { x, z, gr, rf });
const has = (x, z) => cm.has(key(x, z));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance in cells from the outside of the footprint (1 = facade cell).
const dist = new Map();
const q = [];
for (const c of cm.values()) {
  if (N4.some(([dx, dz]) => !has(c.x + dx, c.z + dz))) {
    dist.set(key(c.x, c.z), 1);
    q.push(c);
  }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of N4) {
    const nx = c.x + dx, nz = c.z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      q.push(cm.get(key(nx, nz)));
    }
  }
}

// Smooth lidar roof over a 3x3 neighbourhood to get clean tiers.
for (const c of cm.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = cm.get(key(c.x + dx, c.z + dz));
    if (k) { s += k.rf; n++; }
  }
  c.sr = Math.round(s / n);
}

const normalOf = (c) => N4.find(([dx, dz]) => !has(c.x + dx, c.z + dz)) || null;

// Per-cell massing: podium with setbacks, nested so every tier is supported.
for (const c of cm.values()) {
  const d = dist.get(key(c.x, c.z));
  const gr = c.gr;
  const roof = Math.min(Math.max(c.sr, gr + STOREY * 2), H - 4);
  const r = c.sr >= 12 ? (d <= 2 ? 6 : d <= 4 ? 3 : 0) : 0;
  c.d = d;
  c.roof = roof;
  c.T = roof - r + (d === 1 ? 1 : 0); // exclusive top; facade cells get a parapet course
}

// Entrance: north-facing (min z) facade cell nearest the centre line.
let doorKey = null;
let doorCell = null;
{
  let best = null;
  for (const c of cm.values()) {
    if (c.d !== 1) continue;
    const nrm = normalOf(c);
    if (!nrm || nrm[0] !== 0 || nrm[1] !== -1) continue;
    const score = [c.z, Math.abs(c.x - Math.floor(W / 2))];
    if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1])) {
      best = { c, score };
    }
  }
  if (best) { doorKey = key(best.c.x, best.c.z); doorCell = best.c; }
}

const glassProps = (dz) =>
  dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, structure, facades, floors, cores and roofs.
for (const c of cm.values()) {
  const { x, z, gr, T, d } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const nrm = d === 1 ? normalOf(c) : null;
  const [ndx, ndz] = nrm || [0, 0];
  const t = ndx !== 0 ? z : x; // position along the facade

  if (d === 1) {
    for (let y = gr; y < T; y++) {
      const rel = y - gr;
      if (y === T - 1) { g.set(x, y, z, "stone_bricks"); continue; }          // parapet cap
      if (rel === 0) { g.set(x, y, z, "smooth_stone"); continue; }             // base course
      if (rel === 2) { g.set(x, y, z, "smooth_stone"); continue; }             // ground-floor lintel line
      if (rel % STOREY === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // spandrel
      if (t % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }        // mullion
      g.set(x, y, z, "gray_stained_glass_pane", glassProps(ndz));
    }
    continue;
  }

  if (d >= 3) {
    // Solid core: carries the setback tiers so nothing floats.
    for (let y = gr; y < T; y++) {
      if (y === T - 1) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // d == 2: one-cell air gap behind the glass, storey slabs, roof on top.
  for (let y = gr; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }
    if ((y - gr) % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
  }
}

// Pass 2: entrance, warm lights in the gap, roof plant.
if (doorCell) {
  const { x, z, gr } = doorCell;
  // Flanking pilasters and a lintel make the entrance read from the street.
  for (const dxp of [-1, 1]) {
    const px = x + dxp;
    if (!has(px, z)) continue;
    for (let rel = 0; rel <= 2; rel++) g.set(px, gr + rel, z, "polished_andesite");
  }
  g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "stone_bricks");
  g.set(x, gr + 3, z, "light_gray_concrete");
}

// Warm light in the air gap behind some windows (shroomlight, only where the inward cell is the air gap).
for (const c of cm.values()) {
  const { x, z, gr, T, d } = c;
  if (d !== 1) continue;
  const nrm = normalOf(c);
  if (!nrm) continue;
  const [ndx, ndz] = nrm;
  const t = ndx !== 0 ? z : x;
  if (key(x, z) === doorKey) continue;
  const inX = x - ndx, inZ = z - ndz;
  if (!has(inX, inZ)) continue;
  const inC = cm.get(key(inX, inZ));
  if (dist.get(key(inX, inZ)) !== 2) continue;
  if (t % 3 === 0) continue;
  if ((t * 5 + gr) % 13 !== 0) continue;
  const y = gr + 1;
  if (y < inC.gr || y >= inC.T - 1) continue;
  g.set(inX, y, inZ, "shroomlight");
}

// Roof plant: 2x2 units on the high core (distance >= 5), standing on the roof.
for (const c of cm.values()) {
  const { x, z, T, d } = c;
  if (d < 5) continue;
  if (x % 8 !== 3 || z % 10 !== 4) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => has(qx, qz) && dist.get(key(qx, qz)) >= 5 && cm.get(key(qx, qz)).T === T)) continue;
  if (T + 1 >= H) continue;
  for (const [qx, qz] of quad) {
    g.set(qx, T, qz, "light_gray_concrete");
    g.set(qx, T + 1, qz, "stone_bricks");
  }
}

g.save(`${DIR}/DC77075.nbt`);
