// Way 292861492, Mt Eden / Newton edge of the CBD. Read from the record: a footprint of 575 cells, lidar roofs
// at 29-33 blocks (about 8 storeys of 4), so a 1970s concrete-frame office block with ribbon glazing: white
// concrete piers and spandrels, a polished-andesite base course, glass in tinted panes, a stone-brick parapet.
// Massing: a tower core at 33 with setbacks stepping down to 31 and 29 at its edges, lower wings at 23 where the
// lidar is low. The south face (z = 27) carries the lobby, a recessed door under a stone canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861492.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861492.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]

const SX = 40, SY = 46, SZ = 28;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const foot = new Map();                                     // "x,z" -> { g, r }
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => foot.has(key(x, z));
const parse = (k) => k.split(",").map(Number);

// 1. smooth the lidar roof: median of the 3x3 footprint neighbourhood (kills the notch and noise cells)
const smooth = new Map();
for (const k of foot.keys()) {
  const [x, z] = parse(k), vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(foot.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b); smooth.set(k, vals[vals.length >> 1]);
}
// 2. quantise to tiers: tower 33, mid mass 31, wing 29, low 23
const tierOf = (s) => (s >= 32 ? 33 : s >= 30 ? 31 : s >= 27 ? 29 : 23);
// 3. setbacks: distance from the tier-33 edge (outside counts as edge); the tower's outer two cells step down to 31
const dist = new Map(), q = [];
for (const k of foot.keys()) {
  const [x, z] = parse(k);
  if (tierOf(smooth.get(k)) !== 33) { dist.set(k, 0); q.push(k); }
  else if (NB.some(([dx, dz]) => !inF(x + dx, z + dz))) { dist.set(k, 1); q.push(k); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = parse(q[i]), d = dist.get(q[i]);
  for (const [dx, dz] of NB) { const k = key(x + dx, z + dz); if (inF(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); q.push(k); } }
}
const topOf = (k) => { const t = tierOf(smooth.get(k)); return t === 33 && dist.get(k) < 3 ? 31 : t; };

// Storey rhythm: slab rows at y = 0 (lower band) and 3, 7, 11 ...; in each 4-row storey the two middle rows are glass,
// the top row a spandrel. Rows at the roof are the parapet.
const slabRow = (y) => y === 0 || (y >= 3 && (y - 3) % 4 === 0);
const phase = (y) => (y < 3 ? y : (y - 3) % 4);           // 0 slab, 1-2 glass, 3 spandrel
const CONNECTS = new Set(["white_concrete", "light_gray_concrete", "stone_bricks", "polished_andesite", "smooth_stone", "light_blue_stained_glass_pane"]);

const M = new Map();                                        // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const T = (x, z) => topOf(key(x, z));
const G = (x, z) => foot.get(key(x, z)).g;
// the outward directions a cell's wall at height y faces: the neighbour is outside the footprint, or its roof is below y
const exposed = (x, z, y) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz) || y >= T(x + dx, z + dz)).map(([dx, dz]) => [dx, dz]);

const lamps = [];
for (const k of foot.keys()) {
  const [x, z] = parse(k), g = G(x, z), top = T(x, z);
  for (let y = 0; y < top; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                     // foundation on the slope
    const ex = exposed(x, z, y), wall = ex.length > 0;
    if (y === top - 1) { put(x, y, z, wall ? "stone_bricks" : "smooth_stone"); continue; }    // parapet and roof deck
    if (slabRow(y)) {
      const mat = !wall ? "smooth_stone" : y === 0 ? "stone_bricks" : y === 3 ? "polished_andesite" : "light_gray_concrete";
      put(x, y, z, mat); continue;
    }
    if (!wall) continue;                                                       // interior air
    if (phase(y) === 3) { put(x, y, z, "white_concrete"); continue; }                  // spandrel
    // stepped outline cells expose two sides: they keep the window rhythm of the first face, not a blank pier
    // window bays: piers every third cell along the face
    const along = ex[0][0] !== 0 ? z : x;
    if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    if (((along * 5 + y * 7 + x * 3 + z * 11) % 13) === 0) lamps.push({ x, y, z, inward: [-ex[0][0], -ex[0][1]] });
  }
}

// 4. warm lights in the air gap behind some panes (glowstone low, shroomlight above)
for (const l of lamps) {
  const ix = l.x + l.inward[0], iz = l.z + l.inward[1];
  if (!inF(ix, iz) || M.has(`${ix},${l.y},${iz}`) || l.y >= T(ix, iz) - 1 || l.y < G(ix, iz)) continue;
  put(ix, l.y, iz, l.y < 8 ? "glowstone" : "shroomlight");
}

// 5. pane connections: a pane joins a neighbour pane or a solid facade block, otherwise stays open
for (const [k, v] of M) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = parse(k);
  const c = (dx, dz) => (M.has(`${x + dx},${y},${z + dz}`) && CONNECTS.has(M.get(`${x + dx},${y},${z + dz}`).block) ? "true" : "false");
  v.state = { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
}

// 6. the lobby on the south face (z = 27): piers either side of a dark oak door, a stone canopy over
const LOBBY_Z = SZ - 1;
for (const x of [31, 33]) for (const y of [4, 5]) put(x, y, LOBBY_Z, "white_concrete");
put(32, 4, LOBBY_Z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(32, 5, LOBBY_Z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [31, 32, 33]) put(x, 6, LOBBY_Z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
put(32, 4, LOBBY_Z - 1, "lantern", { hanging: "false", waterlogged: "false" });

// 7. write it
const g = new Voxels([SX, SY, SZ]);
for (const [k, v] of M) { const [x, y, z] = parse(k); g.set(x, y, z, v.block, v.state); }
const stats = g.save(OUT);
const tiers = {}; for (const k of foot.keys()) tiers[topOf(k)] = (tiers[topOf(k)] || 0) + 1;
console.log(JSON.stringify({ cells: cells.length, tiers, lamps: lamps.length, ...stats }));
