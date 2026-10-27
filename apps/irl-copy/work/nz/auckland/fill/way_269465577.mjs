// A two-storey brick shop block with a shopfront, from the 1920s-30s main-street type of Mt Eden and Eden Terrace:
// red brick facade, white_concrete string courses, lintels and cornice, pane windows over the shop glass, a flat roof
// on the lidar tiers (9 wings, 10, 11 the tallest part), and a lift overrun on the top tier. Solid core, one-block air
// niches behind the glass (no interiors), and a floor line of solid course at every storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465577.cells.json`, "utf8"));
const W = 42, H = 24, D = 36;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];             // east, west, south, north
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const at = (x, z) => raw.get(key(x, z));
const xz = (k) => k.split(",").map(Number);

// Lidar roof heights become flat tiers: each cell takes the most common roof height among its 3x3 footprint cells
const roof = new Map();
for (const [k, c] of raw) {
  const [x, z] = xz(k), votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at(x + dx, z + dz); if (n) votes.set(n.r, (votes.get(n.r) || 0) + 1);
  }
  let best = c.r, bv = -1;
  for (const [v, n] of votes) if (n > bv || (n === bv && v === c.r)) { best = v; bv = n; }
  roof.set(k, best);
}
const R = (x, z) => roof.get(key(x, z));
const G = (x, z) => at(x, z).g;

// Distance in from the outside edge: 0 = facade, 1 = behind it (the niche), 2+ = core
const dist = new Map(), q = [];
for (const k of raw.keys()) {
  const [x, z] = xz(k);
  if (NB.some(([dx, dz]) => !at(x + dx, z + dz))) { dist.set(k, 0); q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nk = key(x + dx, z + dz);
    if (raw.has(nk) && !dist.has(nk)) { dist.set(nk, d + 1); q.push([x + dx, z + dz]); }
  }
}
const dAt = (x, z) => dist.get(key(x, z));
const outward = (x, z) => NB.filter(([dx, dz]) => !at(x + dx, z + dz));
const inward = (x, z) => NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([nx, nz]) => dAt(nx, nz) === 1);

// Each facade reads along one axis: a pier every third bay, windows between
const along = (x, z) => (outward(x, z).some(([, dz]) => dz !== 0) ? x : z);
const isPier = (x, z) => along(x, z) % 3 === 0;

// The entrance: the middle of the longest street face, on a shop bay that has room for a storey above
const faceCount = new Map();
for (const [k] of raw) {
  const [x, z] = xz(k);
  if (dAt(x, z) !== 0) continue;
  const o = outward(x, z)[0].join(",");
  faceCount.set(o, (faceCount.get(o) || 0) + 1);
}
const [faceOut] = [...faceCount].sort((a, b) => b[1] - a[1])[0];
const [ox, oz] = faceOut.split(",").map(Number);
const doorCands = [...raw.keys()].map(xz).filter(([x, z]) => dAt(x, z) === 0
  && outward(x, z).some(([dx, dz]) => dx === ox && dz === oz)
  && !isPier(x, z) && R(x, z) - G(x, z) - 1 >= 3);
doorCands.sort((a, b) => along(...a) - along(...b));
const [dx0, dz0] = doorCands[Math.floor(doorCands.length / 2)];
const doorKey = key(dx0, dz0);
// facing = the way the door faces, i.e. back into the building (opposite the street)
const doorFacing = ox === 1 ? "west" : ox === -1 ? "east" : oz === 1 ? "north" : "south";

const g = new Voxels([W, H, D]);
const panes = new Set();

// Shell, solid core and the facade rows
for (const [k] of raw) {
  const [x, z] = xz(k), gr = G(x, z), r = R(x, z), d = dAt(x, z);
  if (d >= 1) {
    for (let y = 0; y < r - 1; y++) g.set(x, y, z, "stone");
    g.set(x, r - 1, z, "light_gray_concrete");                  // the flat roof membrane, light so it reads from the air
    continue;
  }
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");  // plinth down to the ground
  const cap = r - gr - 1;
  for (let y = gr; y < r; y++) {
    const rel = y - gr;
    if (rel === cap) { g.set(x, y, z, "smooth_stone"); continue; }                  // cornice cap
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }                    // base course
    if (k === doorKey && rel <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (rel <= 2) { if (isPier(x, z)) g.set(x, y, z, "bricks"); else g.set(x, y, z, "glass"); continue; }  // shopfront
    if (rel === 3) { g.set(x, y, z, along(x, z) % 2 ? "red_concrete" : "white_concrete"); continue; }    // striped awning
    if (rel === 4 || rel === 7 || rel === 8) { g.set(x, y, z, "white_concrete"); continue; }            // string courses, lintel
    if (isPier(x, z)) g.set(x, y, z, "bricks");
    else { g.set(x, y, z, "glass_pane"); panes.add(`${x},${y},${z}`); }
  }
}

// One-block air niches behind every glass opening (the shop and the upper windows), and the warm lights in some of them
for (const [k] of raw) {
  const [x, z] = xz(k);
  if (dAt(x, z) !== 0) continue;
  const gr = G(x, z), cap = R(x, z) - gr - 1, pier = isPier(x, z), s = along(x, z);
  for (let rel = 1; rel < cap; rel++) {
    const shop = rel <= 2, win = !pier && (rel === 5 || rel === 6 || rel >= 9);
    if (!shop && !win) continue;
    if (k === doorKey && rel > 2) continue;
    for (const [nx, nz] of inward(x, z)) g.set(nx, gr + rel, nz, "air");
    let light = null;
    if (shop && rel === 1 && s % 2 === 0 && k !== doorKey) light = "glowstone";
    else if (win && rel === 5 && s % 4 === 1) light = "shroomlight";
    else if (win && rel === 9 && s % 5 === 2) light = "glowstone";
    if (light) for (const [nx, nz] of inward(x, z)) g.set(nx, gr + rel, nz, light);
  }
}

// Pane connections: each pane joins the neighbouring panes and solid walls in its plane
for (const p of panes) {
  const [x, y, z] = p.split(",").map(Number);
  const link = (nx, nz) => { const n = g.get(nx, y, nz); return n && n.block !== "minecraft:glass" ? "true" : "false"; };
  g.set(x, y, z, "glass_pane", { north: link(x, z - 1), south: link(x, z + 1), east: link(x + 1, z), west: link(x - 1, z), waterlogged: "false" });
}

// The lift overrun: a 3x3x3 box on the tallest tier, interior, nearest the middle of the roof
const top = Math.max(...[...roof.values()]);
const cx = [...raw.keys()].map(xz).reduce((a, [x]) => a + x, 0) / raw.size, cz = [...raw.keys()].map(xz).reduce((a, [, z]) => a + z, 0) / raw.size;
let lift = null, lbest = Infinity;
for (const [k] of raw) {
  const [x, z] = xz(k);
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
    const nk = key(x + dx, z + dz);
    ok = raw.has(nk) && roof.get(nk) === top && dist.get(nk) >= 2;
  }
  if (ok && Math.hypot(x - cx, z - cz) < lbest) { lbest = Math.hypot(x - cx, z - cz); lift = [x, z]; }
}
if (lift) {
  const [lx, lz] = lift;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = top; y < top + 2; y++) g.set(lx + dx, y, lz + dz, "white_concrete");
    g.set(lx + dx, top + 2, lz + dz, "smooth_stone");
  }
}

// Two plant units on the lower wings
let units = 0;
for (const [k] of raw) {
  if (units === 2) break;
  const [x, z] = xz(k);
  if (roof.get(k) !== top - 2 || dist.get(k) < 3 || (lift && Math.abs(x - lift[0]) < 3 && Math.abs(z - lift[1]) < 3)) continue;
  if (units === 1 && (x + z) % 5 !== 0) continue;
  g.set(x, roof.get(k), z, "iron_block"); units++;
}

const out = g.save(`${DIR}/way_269465577.nbt`);
console.log(JSON.stringify({ cells: raw.size, top, door: doorKey, facing: doorFacing, lift, units, ...out }));
