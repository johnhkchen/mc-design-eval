// Way 270516077: a 1960s-70s concrete-and-tinted-glass office block on a lidar-stepped massing. The lower east
// half is a three-storey podium; the rest is four storeys, stepping up from the podium with a plain cornice and
// parapet. Each storey is a 4-block module: a sill band, two rows of glass in white concrete piers, and a head band.
// The interior is solid except one air gap behind each window (glowstone or shroomlight in some of them).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516077.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516077.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const SIZE = [51, 31, 51];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const P = (b, s) => ({ b, s });

const foot = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inF = (x, z) => foot.has(k2(x, z));

// The lidar roof, median-smoothed over each cell's 3x3 footprint neighbours (one-cell spikes and noise go).
const smoothRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const f = foot.get(k2(x + dx, z + dz)); if (f) v.push(f.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// Distance in cells from the footprint's outer edge (1 = on the edge).
const dEdge = new Map(); const queue = [];
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) { dEdge.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dEdge.get(k2(x, z));
  for (const [dx, dz] of DIRS) {
    const nk = k2(x + dx, z + dz);
    if (foot.has(nk) && !dEdge.has(nk)) { dEdge.set(nk, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// Massing tiers: podium (smoothed roof <= 15, three storeys, roof slab at y 12) or main (four storeys, roof slab at y 16).
const info = new Map();
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const podium = smoothRoof(x, z) <= 15;
  info.set(k, { x, z, podium, R: podium ? 12 : 16, nStor: podium ? 3 : 4, edge: dEdge.get(k) === 1, d: dEdge.get(k) });
}
const at = (x, z) => info.get(k2(x, z));

// Outward directions a cell at height y faces: the footprint's edge, or a step down to a lower tier above that tier's roof.
function exposures(ci, y) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const n = at(ci.x + dx, ci.z + dz);
    if (!n) out.push([dx, dz]);
    else if (n.R < ci.R && y >= n.R + 1) out.push([dx, dz]);
  }
  return out;
}

// Facade kind at height y (1..R): a sill or head band, a pier, or a window (the two middle rows of each storey).
function facadeKind(ci, y, ex) {
  if (!ex.length) return null;
  const ph = (y - 1) % 4;
  if (ph === 0 || ph === 3) return "band";
  const u = ex[0][0] ? ci.z : ci.x;
  if (u % 4 === 0) return "pier";                  // jagged outline cells (two outside sides) take their first face
  return "window";
}

// The entrance: the middle non-pier cell of the longest street-facing run, on the ground storey.
const runs = {};
for (const ci of info.values()) {
  if (!ci.edge) continue;
  const ex = exposures(ci, 2);
  if (ex.length !== 1) continue;
  (runs[ex[0].join()] ||= []).push(ci);
}
const runKey = Object.keys(runs).sort((a, b) => runs[b].length - runs[a].length)[0];
const [edx, edz] = runKey.split(",").map(Number);
const uOf = (ci) => (edx ? ci.z : ci.x);
const entList = runs[runKey].filter((ci) => uOf(ci) % 4 !== 0).sort((a, b) => uOf(a) - uOf(b));
const ent = entList[entList.length >> 1];
const FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };   // a door faces back toward the outside wall
const isDoor = (x, y, z) => x === ent.x && z === ent.z && (y === 1 || y === 2);

// Air gap behind every window (and the lobby behind the entrance); lamps sit in some of them.
const gap = new Set();
for (const ci of info.values()) for (let y = 1; y <= ci.R; y++) {
  const ex = exposures(ci, y);
  if (ex.length && facadeKind(ci, y, ex) === "window") gap.add(k3(ci.x - ex[0][0], y, ci.z - ex[0][1]));
}
const lobby = new Set([k3(ent.x - edx, 1, ent.z - edz), k3(ent.x - edx, 2, ent.z - edz)]);

// Whatever is at a cell, with no pane connections yet (a pane's arms read its neighbours, which must not recurse).
function base(x, y, z) {
  const ci = at(x, z);
  if (!ci) return null;
  if (y === 0) return P("polished_andesite");                                          // plinth under every cell
  if (isDoor(x, y, z)) return P("iron_door", { facing: FACING[`${edx},${edz}`], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  // main-roof plant room: a box of concrete on the roof, back from the edge
  if (!ci.podium && ci.d >= 3 && x >= 22 && x <= 27 && z >= 20 && z <= 24 && (y === 17 || y === 18)) return P("light_gray_concrete");
  if (y > ci.R + 2) return null;
  if (y > ci.R) return ci.edge ? P(y === ci.R + 1 ? "white_concrete" : "light_gray_concrete") : null;   // parapet + coping
  const ex = exposures(ci, y);
  if (ex.length && ent.x === x && ent.z === z && y === 4) return P("black_concrete");   // canopy fascia over the entrance
  if (y === ci.R) return P(ex.length ? "light_gray_concrete" : "smooth_stone");        // cornice or roof covering
  if (gap.has(k3(x, y, z)) && !ex.length) return lamp(x, y, z);
  if (lobby.has(k3(x, y, z)) && !ex.length) return y === 1 ? P("lantern", { hanging: "false", waterlogged: "false" }) : null;
  if (!ex.length) return P("stone");
  const kind = facadeKind(ci, y, ex);
  if (kind === "band") return P(y === 1 ? "polished_andesite" : "light_gray_concrete");   // dark base course, then head bands
  if (kind === "pier") return P("white_concrete");
  return P("light_blue_stained_glass");   // glazing reads as glass at street distance; the concrete piers and bands are the frame
}

// Some windows get a lamp behind the glass: glowstone on the ground storey, the odd shroomlight above.
function lamp(x, y, z) {
  const h = (x * 7 + z * 5 + y * 3) % 7;
  if (y <= 4) return h < 2 ? P("glowstone") : null;
  return h === 0 ? P("shroomlight") : null;
}

const g = new Voxels(SIZE);
let placed = 0;
for (const ci of info.values()) for (let y = 0; y <= 18; y++) {
  const b = base(ci.x, y, ci.z);
  if (b) { g.set(ci.x, y, ci.z, b.b, b.s); placed++; }
}
const res = g.save(OUT);
console.log(JSON.stringify({ cells: info.size, placed, ...res, entrance: [ent.x, ent.z, edx, edz] }));
