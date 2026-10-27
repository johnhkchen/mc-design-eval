// way 269467854: a 1930s Art Deco-era three-storey commercial block on a sloping site, Auckland
// interwar style: cream plastered masonry walls, a dark polished-andesite plinth, orange terracotta
// string courses at every storey line, steel-framed windows in pier-and-spandrel bays, a black-
// pier shopfront on the ground floor, and a stepped roof. The lidar roof steps from 12 (west,
// the taller bulk) down to 9 (east wing), with 11 and 10 bands between: the massing follows it.
// Each cell's ground is its third number: foundation fill from y 0 up to it, the floor stands on it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467854.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467854.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const XZ = (key) => key.split(",").map(Number);
const ground = new Map(), roofAt = new Map();
for (const [x, z, g, r] of cells) { ground.set(K(x, z), g); roofAt.set(K(x, z), r); }
const inF = (x, z) => roofAt.has(K(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces into the building
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Roof: the lidar roof's 3x3 median, which the lidar already steps into tiers (12 west bulk,
// 11 and 10 bands, 9 east wing). Snapped to whole blocks.
const median = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
const roofS = new Map();
for (const key of roofAt.keys()) {
  const [x, z] = XZ(key), n = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) n.push(roofAt.get(K(x + dx, z + dz)));
  roofS.set(key, median(n));
}

// Storey lines follow each cell's own ground: floor slabs at g + 4k (terrain-following on the slope).
// Within a storey: rel 0 is the band (base course or terracotta string course), rel 1-2 the glazing,
// rel 3 the spandrel. Ground floor: the same, with a black-pier shopfront and the entrance.
const relOf = (y, g) => y - g;

// Entrances: the longest street-facing run gets the main door mid-face, the next longest a side door.
function pickEntrances() {
  const faces = { N: [], S: [], W: [], E: [] };
  for (const key of roofAt.keys()) {
    const [x, z] = XZ(key);
    const outs = outsOf(x, z);
    if (outs.length === 1) faces[outs[0]].push({ x, z });
  }
  const ranked = Object.entries(faces).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
  return ranked.map(([d, cs]) => {
    const vertical = d === "N" || d === "S";
    cs.sort((a, b) => (vertical ? a.x - b.x : a.z - b.z));
    const mid = Math.floor(cs.length / 2);
    return { d, door: cs[mid], bays: [cs[mid - 1], cs[mid + 1]].filter(Boolean) };
  });
}
const entranceAt = new Map();
const entrances = pickEntrances();
for (const e of entrances) {
  entranceAt.set(K(e.door.x, e.door.z), { kind: "door", d: e.d });
  for (const b of e.bays) entranceAt.set(K(b.x, b.z), { kind: "bay", d: e.d });
}

// A pane joins the wall cells beside it on its own face (solid, glass or pier), so the grid reads as one wall.
function paneState(d, x, z, y) {
  const wallAt = (xx, zz) => inF(xx, zz) && (ground.get(K(xx, zz)) ?? 0) <= y && roofS.get(K(xx, zz)) > y;
  const c = (dx, dz) => (wallAt(x + dx, z + dz) ? "true" : "false");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (d === "N" || d === "S") { st.east = c(1, 0); st.west = c(-1, 0); }
  else { st.north = c(0, -1); st.south = c(0, 1); }
  return st;
}

const g = new Voxels([33, 25, 30]);
const glassCells = [];   // windows that may get a warm light set behind them (the air cell inside)

for (const [key, gr] of ground) {
  const [x, z] = XZ(key);
  const r = roofS.get(key);
  const outs = outsOf(x, z);
  const skin = outs.length > 0;
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  for (let y = gr; y < r; y++) {
    const rel = relOf(y, gr), ground0 = rel < 4;   // ground floor storey (shopfront)
    const m = rel % 4, k = Math.floor(rel / 4);   // phase within the storey, and the storey's index
    if (!skin) {
      // interior: floor slabs at each storey line, a tar roof on top, air between; no rooms furnished
      if (rel % 4 === 0) g.set(x, y, z, "smooth_quartz");
      if (y === r - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const d = outs[0] ?? outs[outs.length - 1];   // corners take their first outward face
    const along = d === "N" || d === "S" ? x : z;
    const pier = outs.length > 1 || along % 3 === 0;   // corners and every third cell
    const entry = entranceAt.get(K(x, z));
    let block = null, state = null;

    if (entry && ground0 && rel <= 3) {
      if (rel === 3) block = "black_concrete";                                 // canopy over the entrance bays
      else if (rel === 1) block = entry.kind === "door" ? "dark_oak_door" : "polished_andesite";
      else if (rel === 2 && entry.kind === "door") block = "dark_oak_door";
      else if (rel === 2) { block = "lantern"; state = { hanging: "true", waterlogged: "false" }; }
      if (block === "dark_oak_door") state = { facing: FACING[entry.d], half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    if (!block) {
      if (r - 1 === y) { block = "smooth_quartz_slab"; state = { type: "bottom", waterlogged: "false" }; }  // cornice cap
      else if (m === 0) block = ground0 ? "polished_andesite" : "orange_terracotta";                        // plinth / string course
      else if (m === 3) block = "smooth_quartz";                                                            // spandrel
      else if (pier) block = ground0 ? "dark_oak_planks" : "quartz_pillar";                                 // timber shop piers / stone piers
      else { block = "glass_pane"; state = paneState(d, x, z, y); glassCells.push({ x, y, z, d, along, ground0, k }); }
    }
    g.set(x, y, z, block, state);
  }

  // roof: the cornice caps the skin; the interior is a tar roof with low plant boxes on the highest tier
  if (!skin && (x * 5 + z * 3) % 11 === 0 && r === 12) g.set(x, r, z, "light_gray_concrete");
}

// Warm light behind some glass: glowstone in the ground floor and first storeys, shroomlight higher up.
// The cell behind the pane is interior air, so the glow shows through without an opening.
for (const c of glassCells) {
  if ((c.along * 3 + c.y + c.k) % 7 !== 0) continue;
  const [dx, dz] = DIRS[c.d];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || outsOf(ix, iz).length) continue;
  g.set(ix, c.y, iz, c.ground0 ? "glowstone" : "shroomlight");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, entrances: entrances.map((e) => `${e.d}@${e.door.x},${e.door.z}`), ...stats }));
