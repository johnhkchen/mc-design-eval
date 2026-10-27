import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s reinforced-concrete office block in stripped classical dress, five storeys on a slope: a stone plinth,
// plastered (smooth quartz) piers and spandrels, a string course at every floor, a stone cornice and parapet, a
// shopfront on the downhill (lowest-ground) street face with a recessed door, and a stair/lift core with plant on
// the roof. The walls are a one-block shell with an air gap behind each window; the floors are slabs per storey.
const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737175";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));
const g = new Voxels([35, 33, 32]);

const K = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [K(x, z), { x, z, ground, roof }]));
const at = (x, z) => cell.get(K(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const neighbours = (c) => NB.map(([dx, dz]) => at(c.x + dx, c.z + dz)).filter(Boolean);
const isEdge = (c) => neighbours(c).length < 4;
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };     // outward step of each face
const OPP = { N: "south", S: "north", W: "east", E: "west" };      // a door's facing: the way a visitor enters
const faces = (c) => Object.entries(OUT).filter(([, [dx, dz]]) => !at(c.x + dx, c.z + dz)).map(([f]) => f);
const ceil4 = (v) => 4 * Math.ceil(v / 4);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Massing: lidar roof heights (median-filled where zero) quantised to 4-block storeys, then a majority vote over
// each cell and its neighbours so the lidar noise becomes flat tiers; never below two storeys over the ground.
for (const c of cell.values()) {
  let r = c.roof;
  if (r <= 0) { const rs = neighbours(c).map((n) => n.roof).filter((v) => v > 0).sort((a, b) => a - b); r = rs.length ? rs[rs.length >> 1] : 20; }
  c.q = Math.min(20, Math.max(8, 4 * Math.round(r / 4)));
}
for (const c of cell.values()) {
  const votes = new Map();
  for (const n of [c, ...neighbours(c)]) votes.set(n.q, (votes.get(n.q) || 0) + 1);
  let best = null;
  for (const [t, v] of votes) if (!best || v > best[1] || (v === best[1] && t > best[0])) best = [t, v];
  c.T = Math.min(20, Math.max(best[0], ceil4(c.ground + 4)));   // top of the roof (the first empty layer)
  c.floors = [c.ground];                                         // storey lines: the ground, then every 4 blocks
  for (let f = 4; f <= c.T - 4; f += 4) if (f > c.ground) c.floors.push(f);
}

// Entrance: the face with the lowest ground (the street), its middle cell.
const faceCells = (f) => [...cell.values()].filter((c) => isEdge(c) && faces(c).length === 1 && faces(c)[0] === f);
const entranceFace = Object.keys(OUT).filter((f) => faceCells(f).length)
  .sort((a, b) => avg(faceCells(a).map((c) => c.ground)) - avg(faceCells(b).map((c) => c.ground)))[0];
function avg(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
const fIdx = (c, f) => (f === "N" || f === "S" ? c.x : c.z);
const ef = faceCells(entranceFace);
const mid = Math.round((Math.min(...ef.map((c) => fIdx(c, entranceFace))) + Math.max(...ef.map((c) => fIdx(c, entranceFace)))) / 2);

// Shell, column by column.
for (const c of cell.values()) {
  for (let y = 0; y < c.ground; y++) put(c.x, y, c.z, "stone_bricks");          // foundation up to this cell's ground
  const edge = isEdge(c), fc = faces(c), face = fc.length === 1 ? fc[0] : null;   // corners carry no window
  const idx = face ? fIdx(c, face) : 0;
  const window = face && idx % 3 !== 0;                                         // two windows, then a pier
  for (let y = c.ground; y < c.T; y++) {
    const F = c.floors.filter((f) => f <= y).pop(), rel = y - F, ground = F === c.ground;
    if (!edge) {                                                                  // interior: slabs and the roof deck only
      if (y === c.T - 1) put(c.x, y, c.z, "gray_concrete");
      else if (c.floors.includes(y)) put(c.x, y, c.z, "smooth_quartz");
      continue;
    }
    let b, st;
    if (y === c.T - 1) b = "smooth_stone";                                        // parapet cap
    else if (y === c.T - 2) b = "stone_bricks";                                   // cornice
    else if (rel === 0) b = ground ? "stone_bricks" : "light_gray_concrete";      // plinth or string course
    else if (rel === 3) b = ground ? "dark_oak_planks" : "smooth_quartz";         // shop fascia or spandrel
    else if (window) { b = "glass_pane"; st = pane(face); }
    else b = ground ? "stone_bricks" : "smooth_quartz";                           // pier
    put(c.x, y, c.z, b, st);
  }
}

// Entrance bay on the street face: door in the centre, glass either side, a stone reveal, a lintel canopy.
const eg = ef.find((c) => fIdx(c, entranceFace) === mid);
if (eg) {
  const gY = eg.ground;
  for (const c of ef) {
    const d = Math.abs(fIdx(c, entranceFace) - mid);
    if (d > 2) continue;
    for (let y = gY + 1; y <= gY + 2; y++) {
      if (d === 0) put(c.x, y, c.z, "oak_door", { facing: OPP[entranceFace], half: y === gY + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (d === 1) put(c.x, y, c.z, "glass_pane", pane(entranceFace));
      else put(c.x, y, c.z, "stone_bricks");
    }
    put(c.x, gY + 3, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Warm light: glowstone just inside some lit windows (the air gap behind the glass), and the core and roof plant.
for (const c of cell.values()) {
  const fc = faces(c); if (!isEdge(c) || fc.length !== 1) continue;
  const f = fc[0], idx = fIdx(c, f);
  if (idx % 6 !== 2 || (f === entranceFace && Math.abs(idx - mid) <= 2)) continue;
  const [dx, dz] = OUT[f], inner = at(c.x - dx, c.z - dz);
  if (!inner || isEdge(inner)) continue;
  const fl = c.floors[1] ?? c.floors[0];                          // the first storey above the shopfront
  if (c.T - 4 > fl) put(inner.x, fl + 2, inner.z, "glowstone");
}

// Stair/lift core: a 5 x 5 box on the roof, its centre the most-enclosed roof cell; plant on the deck beside it.
const roofOK = (x, z, t = 20) => at(x, z) && at(x, z).T === t;
let core = null, bestScore = -1;
for (const c of cell.values()) {
  if (c.T !== 20) continue;
  let ok = true, score = 0;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2; dz++) if (!roofOK(c.x + dx, c.z + dz)) { ok = false; break; }
  if (!ok) continue;
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (at(c.x + dx, c.z + dz)) score++;
  if (score > bestScore) { bestScore = score; core = c; }
}
if (core) {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const ring = Math.abs(dx) === 2 || Math.abs(dz) === 2, x = core.x + dx, z = core.z + dz;
    for (let y = 20; y <= 22; y++) {
      if (!ring) continue;
      const midFace = (Math.abs(dx) === 2 && dz === 0) || (Math.abs(dz) === 2 && dx === 0);
      if (y === 21 && midFace) put(x, y, z, "glass_pane", Math.abs(dx) === 2 ? pane("E") : pane("N"));
      else put(x, y, z, "smooth_quartz");
    }
    put(x, 23, z, "smooth_stone");
  }
}
for (const [x, z] of [[-8, -6], [8, 6], [-8, 7]]) {
  const bx = (core?.x ?? 17) + x, bz = (core?.z ?? 16) + z;
  if ([0, 1].every((i) => [0, 1].every((j) => roofOK(bx + i, bz + j)))) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) put(bx + i, 20, bz + j, "iron_block");
}

g.save(`${FILE}.nbt`);
console.log("entrance", entranceFace, "mid", mid, "core", core && [core.x, core.z], "blocks", g.count());
