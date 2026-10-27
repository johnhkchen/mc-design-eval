import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// MedTech House: a 1970s four-storey precast-concrete office block (Auckland modernism). White concrete piers and
// grey storey bands frame blue-tinted glazing set back one block in a recessed grid; polished-andesite base course;
// a flat roof with a parapet and a plant room. Built on the footprint only; the interior is air with a floor slab per storey.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_28737531.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 41, Y = 32, Z = 29;
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { ground, roof });
const inF = (x, z) => fp.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outs = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz));   // outward directions of an outline cell

// depth: 1 = outer skin, 2 = the next ring in, ... (breadth-first inward from the outline)
const depth = new Map();
let frontier = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (outs(x, z).length) { depth.set(k, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) {
    const k = key(x + dx, z + dz);
    if (inF(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(key(x, z)) ?? 99;

// Storeys: base course y 0-1, then four 4-block storeys (slab, two window rows, spandrel), roof deck at y 18, parapet to y 20.
const FLOORS = [2, 6, 10, 14];
const ROOF = 18;
const BANDS = new Set([2, 5, 6, 9, 10, 13, 14, 17, 18]);   // floor slabs and spandrels, the storey lines
const WIN = new Set([3, 4, 7, 8, 11, 12, 15, 16]);         // window rows
const PIER = "white_concrete", BAND = "light_gray_concrete", GLASS = "light_blue_stained_glass", BASE = "polished_andesite";

const g = new Voxels([X, Y, Z]);

// the vertical bay phase of an outline cell: 0 = pier, 2 = mullion, 1 and 3 = glass panes; corners are always piers
const phase = (x, z) => (x + z) % 4;
const isPier = (x, z) => outs(x, z).length >= 2 || phase(x, z) === 0;

// the skin at height y: depth 1 and 2 only. Window bays are recessed one block (air in front, glass behind, mullions).
function skinAt(x, z, y) {
  const d = dep(x, z);
  if (d > 2) return null;
  if (BANDS.has(y)) return BAND;
  if (!WIN.has(y)) return null;
  if (d === 1) return isPier(x, z) ? PIER : null;
  // d === 2: take the bay from the outer-skin neighbour it sits behind
  const outer = NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([nx, nz]) => inF(nx, nz) && dep(nx, nz) === 1);
  if (outer.some(([nx, nz]) => isPier(nx, nz))) return PIER;
  if (outer.some(([nx, nz]) => phase(nx, nz) === 2)) return PIER;
  return GLASS;
}

// 1. foundation and base course (y 0-1 under the whole footprint), and a solid slab over the footprint at each storey line
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= 1; y++) g.set(x, y, z, BASE);
  for (const f of [...FLOORS, ROOF]) g.set(x, f, z, BAND);
}

// 2. the skin: piers, storey bands, recessed glazing with mullions
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 2; y <= ROOF; y++) {
    const b = skinAt(x, z, y);
    if (b) g.set(x, y, z, b);
  }
}

// 3. warm light behind some ground and upper glazing: a glowstone one block inside the pane
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dep(x, z) !== 2) continue;
  for (const y of [3, 7, 11, 15]) {
    if (skinAt(x, z, y) !== GLASS || (x * 3 + z * 5 + y) % 4 !== 0) continue;
    const inner = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => inF(nx, nz) && dep(nx, nz) === 3);
    if (inner) g.set(inner[0], y, inner[1], "glowstone");
  }
}

// 4. the entrance: the longest straight run of outer-skin cells on one face; its middle cell is the door, under a canopy
const perim = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => dep(x, z) === 1 && outs(x, z).length === 1);
const lines = new Map();
for (const [x, z] of perim) {
  const [[dx, dz]] = outs(x, z);
  const along = dz !== 0 ? x : z, line = dz !== 0 ? z : x;
  const lk = `${dx},${dz}|${line}`;
  if (!lines.has(lk)) lines.set(lk, []);
  lines.get(lk).push([along, x, z]);
}
let best = null;
for (const [lk, arr] of lines) {
  arr.sort((a, b) => a[0] - b[0]);
  let run = [];
  const flush = () => { if (!best || run.length > best.run.length) best = { lk, run: run.slice() }; };
  for (const cur of arr) {
    if (run.length && cur[0] !== run[run.length - 1][0] + 1) { flush(); run = []; }
    run.push(cur);
  }
  flush();
}
const [odx, odz] = best.lk.split("|")[0].split(",").map(Number);           // outward normal of the entrance face
const mid = best.run[Math.floor(best.run.length / 2)];
const [cx, cz] = [mid[1], mid[2]];
const alongStep = odz !== 0 ? [1, 0] : [0, 1];
const inward = [-odx, -odz];
const at = (i) => [cx + alongStep[0] * i, cz + alongStep[1] * i];
const facing = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" }[`${odx},${odz}`];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const i of [-1, 1]) { const [px, pz] = at(i); for (let y = 2; y <= 3; y++) g.set(px, y, pz, PIER); }
const [dx0, dz0] = at(0);
g.set(dx0, 2, dz0, "iron_door", doorState("lower"));
g.set(dx0, 3, dz0, "iron_door", doorState("upper"));
g.set(dx0 + inward[0], 3, dz0 + inward[1], "air");                       // the porch behind the door is open
for (const i of [-2, -1, 0, 1, 2]) {
  const [px, pz] = at(i);
  g.set(px, 4, pz, "smooth_stone");                                       // canopy over the porch, skin and one block in
  if (inF(px + inward[0], pz + inward[1])) g.set(px + inward[0], 4, pz + inward[1], "smooth_stone");
}
const lobbyLight = [dx0 + 2 * inward[0], 3, dz0 + 2 * inward[1]];
if (inF(lobbyLight[0], lobbyLight[2])) g.set(lobbyLight[0], 3, lobbyLight[2], "glowstone");   // the lobby lamp, behind the door

// 5. parapet and coping on the roof edge; a plant room set back from the edge
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dep(x, z) !== 1) continue;
  g.set(x, 19, z, PIER);
  g.set(x, 20, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
const [px0, px1, pz0, pz1] = [12, 21, 10, 17];
for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) {
  if (!inF(x, z)) continue;
  g.set(x, 19, z, "gray_concrete"); g.set(x, 20, z, "gray_concrete");   // a solid plant box, so the lid is never over air
  g.set(x, 21, z, "light_gray_concrete");
}

const out = `${DIR}/way_28737531.nbt`;
const res = g.save(out);
console.log(`MedTech House: ${res.blocks} blocks, ${res.palette} palette entries -> ${out}`);
