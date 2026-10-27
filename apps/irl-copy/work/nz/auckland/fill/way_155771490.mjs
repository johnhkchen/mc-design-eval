// Student Commons A-D (way 155771490), University of Auckland, Symonds St side: a 1970s-80s concrete university block.
// Reads as: a light grey board-formed concrete frame, white piers and string courses, a band of tinted glass between
// each pair of storeys, a dark plinth on stone, a dark-oak entrance on the north (CBD) face, and a stepped tower (5
// storeys) on a 4-storey podium with 3-storey wings. Solid massing (no rooms); each window is a 1-deep air pocket
// behind the pane, and some pockets hold a glowstone or shroomlight so the windows read warm at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_155771490.cells.json`, "utf8"));
const [W, H, D] = [72, 33, 93];
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];      // N (-z, the CBD side), S, W, E: the outward faces
const STOREY = 4;                                   // blocks per storey; string courses at y % 4 == 0

// --- the footprint: smoothed roof tiers, depth in from the outside, the faces that look out ---
const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => C.get(`${x},${z}`);
const nb = (c, dx, dz) => at(c.x + dx, c.z + dz);
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
for (const c of C.values()) {
  const v = [];                                     // 5x5 median kills the lidar's low noise on the edge cells
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  c.rs = median(v);
  c.t = c.rs < 14 ? 12 : c.rs < 18 ? 16 : 20;      // wing (3 storeys), podium (4), tower (5)
  c.out = NB.filter(([dx, dz]) => !nb(c, dx, dz));
}
function bfs(seeds) {
  const d = new Map(seeds.map((c) => [c, 0])); const q = [...seeds];
  for (let i = 0; i < q.length; i++) { const c = q[i];
    for (const [dx, dz] of NB) { const n = nb(c, dx, dz); if (n && !d.has(n)) { d.set(n, d.get(c) + 1); q.push(n); } } }
  return d;
}
const all = [...C.values()];
const depth = bfs(all.filter((c) => c.out.length > 0));      // 0 = on the outline
for (const c of all) c.d = depth.get(c);
// the tower steps in: tower cells within 2 of the podium drop to podium height (a setback at each side)
const podiumDist = bfs(all.filter((c) => c.t < 20));
for (const c of all) if (c.t === 20 && podiumDist.get(c) <= 2) c.t = 16;

// --- the entrance: north-facing outline cell near the middle of that face, ground at most 1 above the lowest ---
const north = all.filter((c) => c.d === 0 && c.out.length === 1 && c.out[0][1] === -1);
const xMid = north.reduce((s, c) => s + c.x, 0) / north.length;
const ent = north.filter((c) => c.g <= 1).sort((a, b) => Math.abs(a.x - xMid) - Math.abs(b.x - xMid))[0];
const entBay = (c) => ent && c.z === ent.z && Math.abs(c.x - ent.x) <= 1;

// --- facade grammar on outline cells, by absolute y ---
// the along-face coordinate: x on the north/south faces, z on the east/west faces; a pier every third cell
function facade(c, y) {
  if (y === 0) return { b: "stone_bricks" };                              // plinth, the dark base course
  if (y === c.t - 1) return { b: "white_concrete" };                      // cornice under the parapet
  if (y % STOREY === 0) return { b: "white_concrete" };                   // storey string course (a floor's edge)
  if (y % STOREY === 3) return { b: "light_gray_concrete" };              // spandrel under each window band
  if (c.out.length > 1) return { b: "white_concrete" };                   // corner pier
  if (entBay(c)) return y === 3 ? { b: "smooth_stone" } : { b: "light_blue_stained_glass_pane", s: pane(c.out[0]) };
  const along = c.out[0][0] === 0 ? c.x : c.z;
  if (along % 3 === 0) return { b: "white_concrete" };                     // window frame (pier)
  return { b: "light_blue_stained_glass_pane", s: pane(c.out[0]), glass: true };
}
const pane = ([dx]) => (dx === 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// --- the massing: solid from the ground (foundation below y=ground) up to each cell's top ---
const vox = new Voxels([W, H, D]);
for (const c of all) {
  for (let y = 0; y < c.t; y++) {
    if (y < c.g) { vox.set(c.x, y, c.z, "stone_bricks"); continue; }     // foundation: nothing floats on a slope
    if (c.d > 0) { vox.set(c.x, y, c.z, y === c.t - 1 ? "smooth_stone" : "light_gray_concrete"); continue; }   // roof membrane reads light, not black
    const f = facade(c, y);
    vox.set(c.x, y, c.z, f.b, f.s);
  }
  if (c.d === 0) vox.set(c.x, c.t, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet coping
}

// --- windows: a 1-deep air pocket behind each pane, some lit by glowstone or shroomlight ---
const lights = [];
for (const c of all) {
  if (c.d !== 0 || c.out.length !== 1) continue;
  const [ox, oz] = c.out[0];
  const inner = nb(c, -ox, -oz);                    // the cell one block in, behind the glass
  if (!inner || inner.d < 1) continue;
  for (let y = c.g; y < c.t - 1; y++) {
    if (y % STOREY === 0 || y % STOREY === 3) continue;
    const f = facade(c, y);
    if (!f.glass) continue;
    const h = (c.x * 31 + c.z * 17 + y * 7) % 13;
    const lit = h === 0 ? "glowstone" : (c.x * 5 + c.z * 3 + y) % 37 === 0 ? "shroomlight" : null;
    vox.set(inner.x, y, inner.z, lit ?? "air");
    if (lit) lights.push([inner.x, y, inner.z, lit]);
  }
}

// --- the entrance: dark oak door, flanked by glass; the canopy is a flush smooth-stone band over the bay ---
if (ent) {
  const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  vox.set(ent.x, ent.g, ent.z, "dark_oak_door", doorState("lower"));
  vox.set(ent.x, ent.g + 1, ent.z, "dark_oak_door", doorState("upper"));
  const inner = nb(ent, 0, 1);                      // vestibule air behind the door
  if (inner) { vox.set(inner.x, ent.g, inner.z, "air"); vox.set(inner.x, ent.g + 1, inner.z, "air"); }
}

// --- roof plant on the tower roof: iron boxes, two blocks high, set on the roof membrane ---
let plant = 0;
for (const c of all) {
  if (c.t !== 20 || c.d < 4 || c.x % 11 !== 5 || c.z % 13 !== 6) continue;
  const east = nb(c, 1, 0);
  if (!east || east.t !== 20) continue;
  vox.set(c.x, 20, c.z, "iron_block"); vox.set(east.x, 20, east.z, "iron_block"); plant++;
}

const out = `${DIR}/way_155771490.nbt`;
const stats = vox.save(out);
const tiers = { 12: 0, 16: 0, 20: 0 };
for (const c of all) tiers[c.t]++;
console.log(JSON.stringify({ footprint: all.length, tiers, entrance: ent && [ent.x, ent.z], lights: lights.length, plant, ...stats }));
