// MARKET PLACE ONE & TWO, 2001 Western Ave: a 1981 office building on the slope from Pike Place down to Elliott Bay.
// Six storeys on a 5-block rhythm (courses at rows 2, 7, ... 27, the roof deck at 32), a glazed street storey on the
// north face with a striped awning and a lobby door, a precast grid of piers and tinted glass bands above, a cornice
// and a parapet. The footprint is solid from 0 up to each cell's own ground, so the uphill east end is set into the
// hill and the downhill west end shows all six storeys over the bay. Warm light sits in some windows, one block
// behind the glass. Interiors are hollow (a floor slab per storey, air behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270120146.cells.json", "utf8"));

const ROOF = 32, PARAPET = 33, CAP = 34;          // roof deck, top of the parapet, cap slab
const LINES = [2, 7, 12, 17, 22, 27];             // storey courses; the first is the street storey (rows 3..6)
const SHOP = 2, AWNING = 6;

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

// Depth from the outside: 1 = wall cell, 2 = one in (air behind the wall), and so on.
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(`${x},${z}`);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${z + dz}`;
      if (inside(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
    }
  }
  frontier = next;
}
const depthOf = (x, z) => depth.get(`${x},${z}`) ?? 0;

// Which way a wall cell faces: N is the street (Pike Place side), W the downhill elevation toward the bay.
function faceOf(x, z) {
  const out = [];
  if (!inside(x - 1, z)) out.push("W");
  if (!inside(x + 1, z)) out.push("E");
  if (!inside(x, z - 1)) out.push("N");
  if (!inside(x, z + 1)) out.push("S");
  return out;
}
const OUT = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };

const V = new Voxels([60, 44, 17]);
const put = (x, y, z, block, state) => { if (inside(x, z) && y >= 0 && y < 44) V.set(x, y, z, block, state); };

const PANE = (axis) => (axis === "ew" ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });
const AXIS = { N: "ew", S: "ew", W: "ns", E: "ns" };

// Pier bays: a column every three cells along the face; corners are piers too.
const along = (x, z, face) => (face === "N" || face === "S" ? x : z);
const isPier = (x, z, faces) => faces.length > 1 || along(x, z, faces[0]) % 3 === 0;

// Warm light in some windows: a block one step inside the glass, in the air gap.
const lightHash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
function warmBehind(x, z, y, face) {
  const [dx, dz] = OUT[face];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || depthOf(ix, iz) < 2 || y < ground(ix, iz)) return;
  const h = lightHash(x, y, z) % 3;
  if (h === 0) put(ix, y, iz, "glowstone");
  else put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Entrances: a lobby door on the street (north) face near the middle of the low end, a side door on the bay face.
const wallCells = cells.filter(([x, z]) => depthOf(x, z) === 1 && faceOf(x, z).length === 1);
const pickDoor = (face, target) => wallCells
  .filter(([x, z, g]) => faceOf(x, z)[0] === face && !isPier(x, z, [face]) && g <= 3)
  .sort((a, b) => Math.abs(along(a[0], a[1], face) - target) - Math.abs(along(b[0], b[1], face) - target))[0];
const doors = [pickDoor("N", 5), pickDoor("W", 8)].filter(Boolean).map(([x, z, g]) => ({ x, z, g, face: faceOf(x, z)[0] }));

// Foundation: every footprint cell is solid from 0 up to its own ground.
for (const [x, z, g] of cells) for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

for (const [x, z, g] of cells) {
  const d = depthOf(x, z);

  // Interior: a floor slab on each storey line and the roof deck, air between them.
  if (d >= 2) {
    for (const L of LINES) if (L > g) put(x, L, z, "smooth_stone");
    if (ROOF > g) put(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Wall: light precast to the parapet, granite under the street, a course on every storey line, cornice and cap.
  const faces = faceOf(x, z), face = faces[0];
  const pier = isPier(x, z, faces);
  for (let y = g; y <= PARAPET; y++) put(x, y, z, "light_gray_concrete");
  for (let y = g; y <= 1; y++) put(x, y, z, "polished_granite");
  for (const L of LINES) if (L >= g) put(x, L, z, "polished_andesite");
  if (ROOF >= g) put(x, ROOF, z, "stone_bricks");
  put(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  if (faces.length > 1) continue;                  // corners stay solid piers

  for (const L of LINES) {
    if (pier) { for (let y = L + 1; y <= L + 4; y++) put(x, y, z, "polished_andesite"); continue; }
    // Street storey: clear shopfront glass under an awning on the north face. Office storeys: a spandrel on the sill
    // line, then three rows of tinted glass under the next course.
    const shop = L === SHOP;
    const from = shop ? L + 1 : L + 2, to = shop ? L + 3 : L + 4;
    for (let y = from; y <= to; y++) {
      if (y < g) continue;
      put(x, y, z, shop ? "glass_pane" : "gray_stained_glass_pane", PANE(AXIS[face]));
      if (!shop && lightHash(x, y, z) % 6 === 0) warmBehind(x, z, y, face);
      if (shop && lightHash(x, y, z) % 4 === 0) warmBehind(x, z, y, face);
    }
    if (shop && face === "N" && AWNING >= g) put(x, AWNING, z, x % 2 === 0 ? "red_wool" : "white_wool");
  }
}

// Doors go in last, over the glass of their bay.
for (const { x, z, g, face } of doors) {
  const facing = face === "N" ? "north" : "west";
  put(x, 3, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  if (face === "N") for (const dx of [-1, 1]) if (inside(x + dx, z) && AWNING >= g) put(x + dx, AWNING, z, "red_wool");
}

// Roof: a penthouse (the lift and stair core) and two cooling units, all set on the roof deck.
const occupied = new Set();
function fitsBox(x0, z0, w, d) {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!inside(x, z) || depthOf(x, z) < 2 || occupied.has(`${x},${z}`)) return false;
  return true;
}
function placeBox(prefX, prefZ, w, d) {
  let best = null, bestDist = Infinity;
  for (const [x, z] of cells) {
    if (!fitsBox(x, z, w, d)) continue;
    const dist = Math.hypot(x + w / 2 - prefX, z + d / 2 - prefZ);
    if (dist < bestDist) { bestDist = dist; best = [x, z]; }
  }
  if (!best) return null;
  for (let x = best[0]; x < best[0] + w; x++) for (let z = best[1]; z < best[1] + d; z++) occupied.add(`${x},${z}`);
  return best;
}

const penthouse = placeBox(40, 8, 5, 3);
if (penthouse) {
  const [px, pz] = penthouse;
  for (let x = px; x < px + 5; x++) for (let z = pz; z < pz + 3; z++) {
    const edge = x === px || x === px + 4 || z === pz || z === pz + 2;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) if (edge) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  put(px + 2, ROOF + 1, pz, "iron_bars", PANE("ew"));       // a vent in the penthouse wall
  put(px + 2, ROOF + 2, pz, "iron_bars", PANE("ew"));
}
for (const [prefX, prefZ] of [[18, 12], [52, 6]]) {
  const box = placeBox(prefX, prefZ, 3, 2);
  if (!box) continue;
  for (let x = box[0]; x < box[0] + 3; x++) for (let z = box[1]; z < box[1] + 2; z++) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "iron_trapdoor", { facing: "north", half: "top", open: "false", powered: "false" });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270120146.nbt";
console.log(V.save(out));
