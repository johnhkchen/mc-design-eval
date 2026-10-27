// Pitt Street Methodist Church, Auckland CBD: a late-19th-century stone church (grey basalt-type walls with pale stone
// dressings, slate roofs, a stepped Gothic tower with a hipped spire). The lidar roof is snapped to 4-block storey lines
// (a 3x3 median first, to drop the noise), so the massing reads as flat tiers: a tall crossing tower on a podium, the
// nave one or two storeys lower, the parish hall and side wings lower again. Every column stands on solid foundation
// to its ground, and the shell is one block thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_53536809.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const g = new Voxels([54, 44, 25]);

// ---- footprint and massing ----------------------------------------------------------------------------------------
const fp = new Map();                                    // "x,z" -> { g, r }
for (const [x, z, gr, r] of cells) fp.set(`${x},${z}`, { g: gr, r });
const inFp = (x, z) => fp.has(`${x},${z}`);
const groundAt = (x, z) => fp.get(`${x},${z}`).g;

const topOf = new Map();                                 // the roof level T (exclusive top of the solid volume)
for (const [x, z, gr] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(fp.get(`${x + dx},${z + dz}`).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const snapped = Math.round(med / 4) * 4;                          // storey lines: 4 blocks
  const t = Math.max(snapped, Math.ceil((gr + 4) / 4) * 4);         // at least one storey above its ground
  topOf.set(`${x},${z}`, Math.min(t, 32));
}
const T = (x, z) => (inFp(x, z) ? topOf.get(`${x},${z}`) : -1);
const vol = (x, y, z) => y >= 0 && y < T(x, z);
const shell = (x, y, z) => vol(x, y, z) && (!vol(x + 1, y, z) || !vol(x - 1, y, z) || !vol(x, y, z + 1) || !vol(x, y, z - 1) || !vol(x, y + 1, z) || !vol(x, y - 1, z));
const exposedN = (x, y, z) => !vol(x, y, z - 1);
const exposedS = (x, y, z) => !vol(x, y, z + 1);
const exposedW = (x, y, z) => !vol(x - 1, y, z);
const exposedE = (x, y, z) => !vol(x + 1, y, z);

// the tallest tier gets a hipped spire: the cells of the top level, distance from their outer edge
const Tmax = Math.max(...topOf.values());
const hipCells = new Map();                              // "x,z" -> distance from the tier's edge (1 at the eave)
if (Tmax >= 28) {
  const isTop = (x, z) => inFp(x, z) && topOf.get(`${x},${z}`) === Tmax;
  let frontier = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) if (isTop(x, z) && !(isTop(x + 1, z) && isTop(x - 1, z) && isTop(x, z + 1) && isTop(x, z - 1))) { hipCells.set(`${x},${z}`, 1); frontier.push([x, z]); }
  for (let d = 2; frontier.length; d++) {
    const next = [];
    for (const [x, z] of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${z + dz}`;
      if (isTop(x + dx, z + dz) && !hipCells.has(k)) { hipCells.set(k, d); next.push([x + dx, z + dz]); }
    }
    frontier = next;
  }
}

// ---- articulation ----------------------------------------------------------------------------------------------------
const STONE = "stone_bricks", DRESS = "polished_andesite", ROOF = "deepslate_tiles", DECK = "deepslate_tile_stairs";
const over = new Map();                                  // "x,y,z" -> [block, state] for doors, canopy, rods
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR_X = 39;                                       // the north (z = 0) front, on the nave's bay
const lit = [];                                          // interior cells behind windows that get a warm light

for (const [x, z, gr] of cells) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { set(x, y, z, STONE); continue; }                   // solid foundation to its ground
    if (!shell(x, y, z)) {
      if (y > gr && y % 4 === 0) set(x, y, z, STONE);                 // a floor slab per storey, air between
      continue;
    }
    const top = !vol(x, y + 1, z);
    const eN = exposedN(x, y, z), eS = exposedS(x, y, z), eW = exposedW(x, y, z), eE = exposedE(x, y, z);
    const horiz = eN || eS || eW || eE;
    if (top) { set(x, y, z, ROOF); continue; }                        // slate roof on the solid top
    if (!horiz) { set(x, y, z, STONE); continue; }
    const corner = (eN || eS) && (eW || eE);
    const along = eN || eS ? x : z;                                   // the bay index along this face
    const bay = along % 4 === 1 || along % 4 === 2;
    const r = y % 4;
    if (corner) { set(x, y, z, DRESS); continue; }                    // dressed quoins
    if (y === gr || r === 0) { set(x, y, z, DRESS); continue; }        // plinth and string courses
    if (r === 3) { set(x, y, z, bay ? DRESS : STONE); continue; }      // the transom band over the window bays
    if (!bay) { set(x, y, z, STONE); continue; }                       // piers
    // a window: two-high glass in its frame, a warm light behind some panes
    const ns = eN || eS;
    set(x, y, z, "glass_pane", ns ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" });
    if (r === 1) {
      const idx = Math.floor(along / 4) + Math.floor(y / 4) * 2;
      if (idx % 4 === 0) {
        const ix = eW ? x + 1 : eE ? x - 1 : x, iz = eN ? z + 1 : eS ? z - 1 : z;
        if (!shell(ix, y, iz)) lit.push([ix, y, iz, idx % 8 === 0 ? "glowstone" : "shroomlight"]);
      }
    }
  }
}
// the tower's hipped roof, its eave on the top roof layer, a spire and a rod on the peak
const peak = [...hipCells.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, d] of hipCells) {
  const [x, z] = k.split(",").map(Number);
  const dirs = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
  // the way down: towards the neighbour one step nearer the edge
  const down = dirs.find(([dx, dz]) => hipCells.get(`${x + dx},${z + dz}`) === d - 1)
    || dirs.find(([dx, dz]) => !inFp(x + dx, z + dz))
    || dirs.find(([dx, dz]) => topOf.get(`${x + dx},${z + dz}`) !== Tmax);
  const base = Tmax;
  for (let y = base; y < base + d - 1; y++) set(x, y, z, STONE);      // solid under the stair
  set(x, base + d - 1, z, DECK, { facing: down[2], half: "bottom", shape: "straight", waterlogged: "false" });
}
if (peak.length) {
  const [k, d] = peak[0];
  const [x, z] = k.split(",").map(Number);
  for (let y = Tmax + d; y < Tmax + d + 3; y++) set(x, y, z, STONE);
  over.set(`${x},${Tmax + d + 3},${z}`, ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }]);
}

// the crenellated parapet on the eaves of each lower tier (every other cell, the gaps are the battlements)
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = T(x, z);
  if (hipCells.has(`${x},${z}`) || (x + z) % 2) continue;
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => T(x + dx, z + dz) < t);   // outside, or a step down
  if (edge) over.set(`${x},${t},${z}`, ["stone_brick_wall", {}]);
}
// roof plant on the lower tiers: a few lightning rods (the Victorian kind) on the flat roofs
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = T(x, z);
  if (hipCells.has(`${x},${z}`) || t >= Tmax || (x * 7 + z * 3) % 29 !== 0) continue;
  // only on the flat tier's middle: every neighbour on the same roof level, clear of the parapet
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => T(x + dx, z + dz) === t)) over.set(`${x},${t},${z}`, ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }]);
}

// ---- the front: a dark-oak door in the nave bay, a hood over it on the north (z = 0) face --------------------------
const dg = groundAt(DOOR_X, 0);
over.set(`${DOOR_X},${dg},0`, ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]);
over.set(`${DOOR_X},${dg + 1},0`, ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]);
for (const dx of [-1, 0, 1]) over.set(`${DOOR_X + dx},${dg + 2},0`, ["polished_andesite_slab", { type: "top", waterlogged: "false" }]);
for (const dx of [-1, 1]) over.set(`${DOOR_X + dx},${dg + 3},0`, ["stone_bricks", {}]);

// ---- write: overrides win, then the lit cells --------------------------------------------------------------------
for (const [k, [block, st]] of over) { const [x, y, z] = k.split(",").map(Number); set(x, y, z, block, st); }
for (const [x, y, z, block] of lit) set(x, y, z, block);

const info = g.save(`${DIR}/way_53536809.nbt`);
console.log(JSON.stringify({ tiers: [...new Set(topOf.values())].sort((a, b) => a - b), hipCells: hipCells.size, lit: lit.length, ...info }));
