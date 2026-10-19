// NEWMARK TOWER CONDOMINIUM, 1415 2nd Ave (1991): a residential tower of about 21 storeys (roof 108 blocks above the
// lowest ground, five blocks a storey) on a granite-based, five-storey podium with street shopfronts and a lobby door
// on the longest street face. Two setbacks: the podium terrace at row 24, the tower's stepped terrace at row 79 and a
// narrower crown above it. Blue-green tinted glass in light concrete frames (spandrel rows, piers every four blocks),
// a parapet cornice at 105-107, a penthouse with a glazed band and a lightning rod. Warm lights sit one block behind
// some glass. Interiors are hollow: air behind the glass and a floor slab every storey. Footprint cells are filled from
// y 0 to their own ground, so the uphill side is buried and the downhill side shows its storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270106906.cells.json`, "utf8"));

const SIZE = [58, 120, 41];
const ROOF = 108;                 // building top surface: blocks up to y 107
const SHOP = 5;                   // storey 0 is the shopfront storey (rows 0-4)
const PODIUM = 25;                // the podium roof is row 24; tower from 25
const CROWN = 80;                 // the tower's stepped terrace is row 79; the crown from 80
const PARAPET = 105;

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFP = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// Depth from the outside: 1 = outer ring, 2 = one in, and so on. Each setback keeps the cells deep enough inside.
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (!inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1)) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(`${x},${z}`);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (inFP(x + dx, z + dz) && !depth.has(`${x + dx},${z + dz}`)) { depth.set(`${x + dx},${z + dz}`, d + 1); next.push([x + dx, z + dz]); }
    }
  }
  frontier = next;
}
const depthOf = (x, z) => depth.get(`${x},${z}`) ?? 0;

const minDepth = (y) => (y < PODIUM ? 1 : y < CROWN ? 4 : 8);
const solid = (x, z, y) => inFP(x, z) && y >= 0 && y < ROOF && depthOf(x, z) >= minDepth(y);

const OUT = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACES = ["W", "S", "E", "N"];                          // preference when a corner shows two faces
const exposed = (x, y, z) => FACES.filter((f) => !solid(x + OUT[f][0], z + OUT[f][1], y));
const along = (f, x, z) => (f === "W" || f === "E" ? z : x);  // the coordinate running along that face

// What a solid block is: the foundation, the roof, the shell (window grid, shopfront, parapet) or a floor slab.
function blockAt(x, y, z) {
  const g = ground(x, z);
  if (y < g) return { block: "granite" };                     // foundation under the uphill side
  const faces = exposed(x, y, z);
  if (!solid(x, z, y + 1)) return faces.length ? { block: "white_concrete" } : { block: "gray_concrete" };
  if (faces.length) {
    const f = faces[0], a = along(f, x, z);
    const light = { light: true, face: f };
    if (y >= PARAPET) return { block: "white_concrete" };
    if (y < SHOP) {                                           // shopfront storey
      if (y === g) return { block: "polished_granite" };      // base course at the street
      if (y === SHOP - 1) return { block: "dark_oak_planks" }; // sign band
      if (a % 4 === 0) return { block: "dark_oak_planks" };   // timber post
      return { block: "glass", ...light };
    }
    const r = y % 5;
    if (r === 0 || r === 4) return { block: "white_concrete" };   // spandrel rows: sill and head
    if (a % 4 === 0) return { block: "white_concrete" };          // pier
    return { block: "cyan_stained_glass_pane", axis: f === "W" || f === "E" ? "ns" : "ew", ...light };
  }
  if (y % 5 === 0 || y === g) return { block: "white_concrete" };  // floor slab in the hollow interior
  return null;
}

const plan = new Map();          // "x,y,z" -> { block, state?, ... }
const lights = [];
for (const [x, z] of cells) {
  for (let y = 0; y < ROOF; y++) {
    if (!solid(x, z, y)) continue;
    const b = blockAt(x, y, z);
    if (!b) continue;
    plan.set(key(x, y, z), b);
    if (b.light) lights.push({ x, y, z, face: b.face });
  }
}

// Warm light: a block one step inside a glass cell, in the air gap, on some windows only.
const lightHash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const { x, y, z, face } of lights) {
  const [dx, dz] = OUT[face];
  const bx = x - dx, bz = z - dz;
  if (!solid(bx, bz, y) || exposed(bx, y, bz).length || plan.has(key(bx, y, bz))) continue;
  const h = lightHash(x, y, z) % 7;
  if (h === 0) plan.set(key(bx, y, bz), { block: "glowstone" });
  else if (h === 1) plan.set(key(bx, y, bz), { block: "shroomlight" });
}

// Entrance: the longest run of street-level cells on one outward face (W, then S, E, N). Door in the middle of it,
// a granite step at the threshold, a dark oak canopy over five cells and two hanging lanterns beside the door.
const street = new Map();        // "face|along" -> [x, z], the outer shell cell of that face
for (const [x, z] of cells) for (const f of FACES) {
  if (!inFP(x + OUT[f][0], z + OUT[f][1])) {
    const k = `${f}|${along(f, x, z)}`;
    if (!street.has(k)) street.set(k, [x, z]);
  }
}
let door = null;
for (const f of FACES) {
  const vals = [...street.keys()].filter((k) => k.startsWith(`${f}|`)).map((k) => Number(k.split("|")[1])).sort((a, b) => a - b);
  let run = [];
  for (const v of vals) {
    run = run.length && v === run[run.length - 1] + 1 ? [...run, v] : [v];
    if (!door || run.length > door.run.length) door = { f, run: [...run] };
  }
}
const DOOR_FACING = { W: "east", E: "west", N: "south", S: "north" };
const mid = door.run[Math.floor(door.run.length / 2)];
const [dx0, dz0] = street.get(`${door.f}|${mid}`);
const gd = ground(dx0, dz0);
const doorState = (half) => ({ facing: DOOR_FACING[door.f], half, hinge: "left", open: "false", powered: "false" });
plan.set(key(dx0, gd, dz0), { block: "polished_granite_slab", state: { type: "bottom", waterlogged: "false" } });
plan.set(key(dx0, gd + 1, dz0), { block: "dark_oak_door", state: doorState("lower") });
plan.set(key(dx0, gd + 2, dz0), { block: "dark_oak_door", state: doorState("upper") });
for (let a = mid - 2; a <= mid + 2; a++) {
  const c = street.get(`${door.f}|${a}`);
  if (!c) continue;
  const gc = ground(c[0], c[1]);
  plan.set(key(c[0], gc + 3, c[1]), { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } });
  if (Math.abs(a - mid) === 1) plan.set(key(c[0], gc + 2, c[1]), { block: "lantern", state: { hanging: "true" } });
}

// Crown: a penthouse box and two roof units on the crown's top, placed where the crown is wide enough.
const crownCell = (x, z) => inFP(x, z) && depthOf(x, z) >= 8;
const crown = cells.filter(([x, z]) => crownCell(x, z));
const cx0 = crown.reduce((s, [x]) => s + x, 0) / crown.length, cz0 = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
const fits = (x0, z0, w, d, margin = 0) => {
  for (let x = x0 - margin; x < x0 + w + margin; x++) for (let z = z0 - margin; z < z0 + d + margin; z++) if (!crownCell(x, z)) return false;
  return true;
};
function nearest(tx, tz, w, d, taken) {
  let best = null;
  for (let x0 = 0; x0 < SIZE[0]; x0++) for (let z0 = 0; z0 < SIZE[2]; z0++) {
    if (!fits(x0, z0, w, d) || (taken && taken(x0, z0, w, d))) continue;
    const dist = (x0 + w / 2 - tx) ** 2 + (z0 + d / 2 - tz) ** 2;
    if (!best || dist < best.dist) best = { x0, z0, w, d, dist };
  }
  return best;
}
const pent = nearest(cx0, cz0, 11, 7) ?? nearest(cx0, cz0, 7, 5);
if (pent) {
  const x1 = pent.x0 + pent.w - 1, z1 = pent.z0 + pent.d - 1;
  for (let x = pent.x0; x <= x1; x++) for (let z = pent.z0; z <= z1; z++) {
    const edge = x === pent.x0 || x === x1 || z === pent.z0 || z === z1;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      const band = edge && y === ROOF + 1;
      plan.set(key(x, y, z), { block: band ? "cyan_stained_glass" : "white_concrete" });
    }
    plan.set(key(x, ROOF + 3, z), { block: "gray_concrete" });
  }
  const rx = pent.x0 + Math.floor(pent.w / 2), rz = pent.z0 + Math.floor(pent.d / 2);
  plan.set(key(rx, ROOF + 4, rz), { block: "lightning_rod" });
  plan.set(key(rx, ROOF + 5, rz), { block: "lightning_rod" });
  const inPent = (x0, z0, w, d, m) => x0 + w > pent.x0 - m && x0 < pent.x0 + pent.w + m && z0 + d > pent.z0 - m && z0 < pent.z0 + pent.d + m;
  const unitTaken = (x0, z0, w, d) => inPent(x0, z0, w, d, 1);
  for (const tx of [cx0 - 12, cx0 + 12]) {
    const u = nearest(tx, cz0, 3, 2, unitTaken);
    if (!u) continue;
    for (let x = u.x0; x < u.x0 + 3; x++) for (let z = u.z0; z < u.z0 + 2; z++) for (let y = ROOF; y < ROOF + 2; y++) plan.set(key(x, y, z), { block: "iron_block" });
  }
}

// Podium terrace: lanterns on the open terrace (row 25 above the row-24 roof), a few of them.
for (const [x, z] of cells) {
  if (depthOf(x, z) !== 2 || !solid(x, z, 24) || solid(x, z, 25) || (x + z) % 7 !== 0) continue;
  plan.set(key(x, 25, z), { block: "lantern", state: { hanging: "false" } });
}

// Glass panes take their connections from their neighbours in the same wall plane.
const has = (x, y, z, b) => plan.get(key(x, y, z))?.block === b;
const V = new Voxels(SIZE);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  let state = p.state;
  if (p.axis === "ns") state = { north: String(has(x, y, z - 1, p.block)), south: String(has(x, y, z + 1, p.block)), east: "false", west: "false" };
  if (p.axis === "ew") state = { north: "false", south: "false", east: String(has(x + 1, y, z, p.block)), west: String(has(x - 1, y, z, p.block)) };
  V.set(x, y, z, p.block, state);
}

const out = `${DIR}/SEA1270106906.nbt`;
const { blocks, palette } = V.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries, door on ${door.f} face (run ${door.run.length}), penthouse ${pent ? "placed" : "none"}`);
