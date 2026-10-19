// 1400 Alaskan Way: an 1951 brick loft warehouse on the Pike Place waterfront slope. Brick shell, granite plinth,
// stone storey courses on a 5-block rhythm (rows 3, 8, ... 33), steel-sash windows in 4-block bays (pier, glass,
// muntin, glass), a shopfront band on the Alaskan Way (west) face, one recessed door with an awning, a cornice and
// parapet at row 38-42, a roof with a penthouse, two cooling units and a chimney. Warm light sits in some windows,
// one block behind the glass. Interiors are hollow (floor slab per storey, air behind the glass); the footprint
// cells are filled from y 0 to their own ground so the uphill side is buried and the downhill side shows its storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270106546.cells.json", "utf8"));

const ROOF = 40, CORNICE = 38, PARAPET = 39, CAP = 42;
const storeyLine = (k) => 3 + 5 * k;                     // course rows 3, 8, ... 33; shopfront band is k = 0
const TOP_BAND = 6;                                       // storeys 0..6 are windowed bands; 38 is the cornice
const SHOP_ROWS = [4, 5, 6], SHOP_HEADER = 7;

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

// Which way a wall cell faces: W is Alaskan Way (the low side, toward the bay).
function faceOf(x, z) {
  const out = [];
  if (!inside(x - 1, z)) out.push("W");
  if (!inside(x + 1, z)) out.push("E");
  if (!inside(x, z - 1)) out.push("N");
  if (!inside(x, z + 1)) out.push("S");
  return out;
}
const OUT = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };

const V = new Voxels([64, 52, 43]);
const put = (x, y, z, block, state) => { if (inside(x, z) && y >= 0 && y < 52) V.set(x, y, z, block, state); };
const onGround = (x, z, y) => y >= ground(x, z);

const PANE_CONN = (axis) => (axis === "ns" ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });

// Warm light in some windows: a block one step inside the glass, in the air gap.
const lightHash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
function warmBehind(x, z, y, faces) {
  const f = faces[0];
  const [dx, dz] = OUT[f];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || depthOf(ix, iz) < 2 || y < ground(ix, iz)) return;
  const h = lightHash(x, y, z) % 7;
  if (h === 0) put(ix, y, iz, "glowstone");
  else if (h === 1) put(ix, y, iz, "shroomlight");
}

// Door on the Alaskan Way face, at the middle of the low ground, with an awning over it and its neighbours.
const westCells = cells.filter(([x, z, g]) => g <= 4 && !inside(x - 1, z) && inside(x + 1, z) && faceOf(x, z).length === 1 && z % 4 !== 0);
westCells.sort((a, b) => a[1] - b[1]);
const door = westCells[Math.floor(westCells.length / 2)] ?? westCells[0];
const [doorX, doorZ, doorG] = door;

// Find a footprint location where a box w x d fits on the roof (depth >= 2 everywhere) away from what is placed.
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

// Foundation and walls. Every footprint cell is solid from 0 up to its own ground.
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, "cobblestone");     // rubble foundation, as the old Alaskan Way walls were
}

for (const [x, z, g] of cells) {
  const d = depthOf(x, z);
  const faces = faceOf(x, z);
  const corner = faces.length > 1;
  const isWall = d === 1;

  // Floor slabs per storey and the roof deck, inside the shell.
  if (!isWall) {
    for (let k = 0; k <= TOP_BAND; k++) {
      const y = storeyLine(k);
      if (y > g) put(x, y, z, "oak_planks");
    }
    if (ROOF - 1 > g) put(x, PARAPET, z, "smooth_stone");
  }
  if (!isWall) continue;

  // Plinth: granite under the street, the base course up to row 2.
  for (let y = g; y <= 2; y++) put(x, y, z, "polished_granite");

  // Walls: brick from the ground to the parapet, cap on top.
  for (let y = Math.max(g, 3); y <= PARAPET + 2; y++) put(x, y, z, "bricks");   // windows and shopfronts are cut back in below
  if (CAP >= g) put(x, CAP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Storey courses (stone) and the cornice, all round.
  for (let k = 0; k <= TOP_BAND; k++) {
    const y = storeyLine(k);
    if (y >= g) put(x, y, z, "stone_bricks");
  }
  if (CORNICE >= g) put(x, CORNICE, z, "stone_bricks");
  if (corner) continue;

  // Bays along the face: pier (brick), glass, muntin (iron bars), glass.
  const face = faces[0];
  const along = face === "W" || face === "E" ? z : x;
  const p = along % 4;
  if (p === 0) continue;
  const axis = face === "W" || face === "E" ? "ns" : "ew";
  const conn = PANE_CONN(axis);

  for (let k = 0; k <= TOP_BAND; k++) {
    const L = storeyLine(k);
    const sill = L + 1, pane1 = L + 2, pane2 = L + 3, head = L + 4;
    if (face === "W" && k === 0) {
      // Shopfront on the street: full glass, awning and door below.
      for (const y of SHOP_ROWS) if (y >= g) put(x, y, z, "glass");
      if (SHOP_HEADER >= g) put(x, SHOP_HEADER, z, "bricks");
      continue;
    }
    if (sill < g) {                                       // the sill is under the ground: blind wall
      if (head >= g) put(x, head, z, "bricks");
      continue;
    }
    if (sill >= g) put(x, sill, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    const glassCell = p === 1 || p === 3;
    for (const y of [pane1, pane2]) {
      if (y < g) continue;
      if (glassCell) put(x, y, z, "glass_pane", conn);
      else put(x, y, z, "iron_bars", conn);
      if (glassCell && lightHash(x, y, z) % 4 === 0) warmBehind(x, z, y, faces);
    }
    if (head >= g) put(x, head, z, "bricks");
  }
}

// Shop lights on the street: a warm block behind some storefront glass.
for (const [x, z, g] of cells) {
  if (depthOf(x, z) !== 1 || !faceOf(x, z).includes("W") || faceOf(x, z).length !== 1) continue;
  if (lightHash(x, 5, z) % 3 === 0 && (z % 4 === 1 || z % 4 === 3)) warmBehind(x, z, 5, ["W"]);
}

// The entrance: a recessed door (two cells tall) with an awning across the bay.
if (doorG <= 4) {
  put(doorX, doorG, doorZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, doorG + 1, doorZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dz of [-1, 0, 1]) {
    const z = doorZ + dz;
    if (inside(doorX - 1, z) && faceOf(doorX, z).includes("W")) {
      put(doorX, doorG + 2, z, "dark_oak_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
    }
  }
}

// Roof: parapet rows, the penthouse, two cooling units and a chimney, all set on the roof deck.
const penthouse = placeBox(40, 22, 5, 3);
if (penthouse) {
  const [px, pz] = penthouse;
  for (let x = px; x < px + 5; x++) for (let z = pz; z < pz + 3; z++) {
    const edge = x === px || x === px + 4 || z === pz || z === pz + 2;
    for (let y = ROOF; y <= ROOF + 3; y++) if (edge) put(x, y, z, "bricks");
    put(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  put(px + 2, ROOF, pz, "iron_bars", PANE_CONN("ew"));       // a vent in the penthouse wall
  put(px + 2, ROOF + 1, pz, "iron_bars", PANE_CONN("ew"));
}
for (const [prefX, prefZ] of [[24, 30], [54, 32]]) {
  const box = placeBox(prefX, prefZ, 3, 2);
  if (!box) continue;
  for (let x = box[0]; x < box[0] + 3; x++) for (let z = box[1]; z < box[1] + 2; z++) {
    for (let y = ROOF; y <= ROOF + 1; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "iron_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false" });
  }
}
const chimneySpot = placeBox(30, 12, 1, 1);
if (chimneySpot) {
  const [cx, cz] = chimneySpot;
  for (let y = ROOF; y <= ROOF + 9; y++) put(cx, y, cz, "bricks");
  put(cx, ROOF + 10, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = V.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270106546.nbt");
console.log(JSON.stringify({ cells: cells.length, ...stats, door: [doorX, doorG, doorZ], penthouse, hvacOrChimney: chimneySpot }));
