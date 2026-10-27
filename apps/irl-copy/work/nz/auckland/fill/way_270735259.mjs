// Way 270735259: a two-storey brick commercial block with a single-storey wing, 1920s-30s Auckland (Mt Eden / Eden Terrace
// main street). Brick walls on a polished andesite base, stone bands at each floor line, white-framed sash windows over
// shopfronts with dark oak fascias, a recessed-look entrance under a canopy band, and a flat roof with parapet, HVAC and a lift housing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735259.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..15, z 0..13

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const cellOf = new Map();
// Roof heights are lidar noise around two tiers: the main body at 10 and a single-storey wing at 5-7. Cells at 9+ are main, below that wing.
for (const [x, z, g, r] of cells) cellOf.set(key(x, z), { x, z, g, r, tier: r >= 9 ? "main" : "wing" });
const at = (x, z) => cellOf.get(key(x, z));

// Exposed faces: a neighbour outside the footprint, or in the other tier (a party wall where the wing meets the body).
for (const c of cellOf.values()) {
  c.exp = DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier !== c.tier; });
  c.perim = c.exp.length > 0;
}

// Bays: each face's cells numbered from the face's first cell, so piers and windows line up along every wall.
// A notched footprint has no true corners, so each perimeter cell is numbered on its first exposed face and there are no quoins.
const runs = new Map();
for (const c of cellOf.values()) {
  if (!c.perim) continue;
  const [dx, dz] = c.exp[0];
  const k = dx ? `ew:${dx}:${c.x}` : `ns:${dz}:${c.z}`;
  if (!runs.has(k)) runs.set(k, []);
  runs.get(k).push(c);
}
for (const [k, run] of runs) {
  const along = (c) => (k.startsWith("ew") ? c.z : c.x);
  const min = Math.min(...run.map(along));
  for (const c of run) c.bay = along(c) - min;
}
for (const c of cellOf.values()) c.corner = false;

// Entrance: the north-facing main-body window bay nearest the middle of its face, with the lowest z.
const northFace = [...cellOf.values()].filter((c) => c.tier === "main" && c.perim && c.exp[0][1] === -1 && c.exp.length === 1 && c.bay % 3 === 1);
let door = null;
if (northFace.length) {
  const xs = northFace.map((c) => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const zMin = Math.min(...northFace.map((c) => c.z));
  door = northFace.filter((c) => c.z === zMin).sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid))[0];
}

// The plan: every block by "x,y,z", written at the end (so pane connections can be read off the plan).
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => plan.get(`${x},${y},${z}`);
const FACING = { "0,-1": "south", "0,1": "north", "1,0": "west", "-1,0": "east" };   // a door faces into the building: the inward side

const WING_TOP = 6;   // the wing's parapet top, one tier (its lidar roof is 5-7)
const WALL = "bricks", QUOIN = "stone_bricks", BASE = "polished_andesite", FRAME = "white_concrete", FASCIA = "dark_oak_planks";

// Ground storey (rows g+1..3) and upper storey (rows 5..7) on a perimeter cell, by the bay pattern.
function facadeRow(c, y) {
  if (c.corner) return { block: QUOIN };
  const isGround = y <= 3;
  if (isGround && door && c.x === door.x && c.z === door.z) {
    if (y === c.g + 1) return { block: "dark_oak_door", state: { facing: FACING[`${-c.exp[0][0]},${-c.exp[0][1]}`], half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (y === c.g + 2) return { block: "dark_oak_door", state: { facing: FACING[`${-c.exp[0][0]},${-c.exp[0][1]}`], half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (y === 3 && c.g === 0) return { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };   // canopy band over the door
  }
  if (c.bay % 3 === 0) return { block: WALL };   // pier
  if (isGround) {
    if (y === 3) return { block: FASCIA };
    if (y === c.g + 1 && c.g === 0) return { block: FASCIA };   // kickplate
    return { block: "glass_pane" };
  }
  if (y === 5 || y === 7) return { block: FRAME };
  return { block: "glass_pane" };
}

for (const c of cellOf.values()) {
  const { x, z, g } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);   // foundation under a raised cell
  if (c.perim) put(x, g, z, BASE); else put(x, g, z, "stone_bricks");   // base course / ground floor
  for (let y = g + 1; y <= 3; y++) {
    if (c.perim) { const f = facadeRow(c, y); put(x, y, z, f.block, f.state); }
  }
  // Floor line at y=4: the storey band on the outside, the floor slab (main) or the wing's roof inside.
  if (c.perim) put(x, 4, z, "stone_bricks");
  else put(x, 4, z, c.tier === "main" ? "stone_bricks" : "smooth_stone");
  if (c.tier === "main") {
    for (let y = 5; y <= 7; y++) if (c.perim) { const f = facadeRow(c, y); put(x, y, z, f.block, f.state); }
    if (c.perim) put(x, 8, z, "stone_bricks");   // cornice
    else put(x, 8, z, "smooth_stone");           // roof membrane
    if (c.perim) put(x, 9, z, c.corner ? QUOIN : WALL);   // parapet
  } else if (c.perim) {
    for (let y = 5; y <= WING_TOP; y++) put(x, y, z, WALL);   // wing parapet: one clean height across the wing, not the lidar's 5-7 noise
  }
}

// Upper-storey windows and ground shop glass: lights behind some panes, in the air gap one cell inside the wall.
for (const c of cellOf.values()) {
  if (!c.perim || c.bay % 3 === 0) continue;
  const [dx, dz] = c.exp[0];
  const inner = at(c.x - dx, c.z - dz);
  if (!inner || inner.perim || inner.tier !== c.tier) continue;
  const h = (c.x * 5 + c.z * 3) % 7;
  if (c.tier === "main" && h === 0) put(inner.x, 6, inner.z, "glowstone");
  if (c.tier === "main" && h === 3) put(inner.x, 6, inner.z, "glowstone");
  if (h === 5 && get(c.x, c.g + 2, c.z)?.block === "glass_pane") put(inner.x, c.g + 2, inner.z, "shroomlight");
}

// Roof equipment on the main roof: a lift housing (2x2) and a few HVAC units, all on the roof membrane.
const mainInterior = (x, z) => { const c = at(x, z); return c && c.tier === "main" && !c.perim; };
let housing = null;
for (const c of cellOf.values()) {
  if (housing) break;
  if (mainInterior(c.x, c.z) && mainInterior(c.x + 1, c.z) && mainInterior(c.x, c.z + 1) && mainInterior(c.x + 1, c.z + 1)) housing = c;
}
if (housing) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(housing.x + dx, 9, housing.z + dz, WALL);
    put(housing.x + dx, 10, housing.z + dz, WALL);
    put(housing.x + dx, 11, housing.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
let units = 0;
for (const c of cellOf.values()) {
  if (units >= 4) break;
  if (!mainInterior(c.x, c.z) || (housing && c.x >= housing.x - 1 && c.x <= housing.x + 2 && c.z >= housing.z - 1 && c.z <= housing.z + 2)) continue;
  if ((c.x * 3 + c.z) % 11 === 0) { put(c.x, 9, c.z, "iron_block"); units++; }
}

// Panes join along their wall: a neighbour in the wall's own direction that is any block connects, so windows meet piers and planks.
for (const [k, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = at(x, z);
  const axisEW = c.exp[0][1] !== 0;   // a pane on a north/south face runs east-west
  const conn = (dx, dz) => (plan.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  const east = axisEW ? conn(1, 0) : "false", west = axisEW ? conn(-1, 0) : "false";
  const north = axisEW ? "false" : conn(0, -1), south = axisEW ? "false" : conn(0, 1);
  v.state = { north, south, east, west, waterlogged: "false" };
}

const g = new Voxels([16, 23, 14]);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735259.nbt";
const r = g.save(out);
console.log(`way_270735259: ${r.blocks} blocks, ${r.palette} palette entries, door ${door ? `${door.x},${door.z}` : "none"}, housing ${housing ? `${housing.x},${housing.z}` : "none"}`);
