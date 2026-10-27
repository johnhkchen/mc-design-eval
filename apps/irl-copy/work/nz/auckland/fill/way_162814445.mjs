// Q Central Apartments (way 162814445): a 1990s-2000s Auckland apartment block, 5 storeys on a solid 6-block podium
// (the lidar's flat 26-block roof, a 6-cell lower wing at the west edge). Massing: podium, main block, a 2-cell terrace
// setback (outline dist 1..2) with a 1-block railing, and 3 AC units on the main roof.
// Facades: stone base course, white piers between 2-wide light-blue glass, light-grey storey bands, glowstone and
// shroomlight behind some glass, a canopied entrance on the south (+z) side at the lowest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162814445.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [44, 39, 21];
const g = new Voxels(SIZE);

// ---- footprint, outline distance ----
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dist = new Map();                                   // 1 on the outline, +1 per step inward
let frontier = [];
for (const c of F.values()) if (NB.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
while (frontier.length) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (inF(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, dist.get(key(c.x, c.z)) + 1); next.push(F.get(k)); }
  }
  frontier = next;
}
const d = (c) => dist.get(key(c.x, c.z));

// ---- massing: top block index T per cell (the roof sits at T) ----
// lidar roofs under 21 are the west wing's edge (the 8/10/19/20 cells), smoothed to one lower tier at 17;
// the rest is the 26 roof; the setback (outline dist 1..2) stops at the 22 terrace; the plant tier (dist >= 6) rises to 27
function topOf(c) {
  if (c.roof <= 20) return 17;
  return d(c) <= 2 ? 22 : 25;
}
// the solid rows above the podium: slab rows (6, 10, 14, ...) and the roof cap
function solidAt(c, y) {
  const T = topOf(c);
  if (y <= 5) return true;
  if (y % 4 === 2 && y <= T) return true;                 // floor slabs, storey lines
  if (y === T) return true;                               // roof / terrace paving / cap
  return false;
}
// the envelope: where the building is at height y (solid, or the air inside its walls)
const env = (x, z, y) => {
  const c = F.get(key(x, z)); if (!c) return false;
  return y <= 5 || y <= topOf(c);
};
// an exposed face at (x,z,y): a side with no building in it (the outside, or a lower tier)
const sides = (x, z, y) => NB.filter(([dx, dz]) => !env(x + dx, z + dz, y)).map(([dx, dz]) => [dx, dz]);
const exposed = (x, z, y) => sides(x, z, y).length > 0;

// ---- the entrance: a 3-cell bay on the south (+z) outline at the lowest ground ----
const outlineSouth = [...F.values()].filter((c) => d(c) === 1 && !inF(c.x, c.z + 1)).sort((a, b) => a.x - b.x);
let entrance = null;
for (const c of outlineSouth) {
  const run = [c.x - 1, c.x, c.x + 1].every((x) => inF(x, c.z) && !inF(x, c.z + 1) && d(F.get(key(x, c.z))) === 1);
  if (!run) continue;
  const score = F.get(key(c.x - 1, c.z)).ground + F.get(key(c.x, c.z)).ground + F.get(key(c.x + 1, c.z)).ground;
  if (!entrance || score < entrance.score) entrance = { x: c.x, z: c.z, score };
}
const entranceCells = new Set();
if (entrance) for (const x of [entrance.x - 1, entrance.x, entrance.x + 1]) entranceCells.add(key(x, entrance.z));

// ---- build ----
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const hash = (x, y, z) => ((x * 13 + z * 7 + y * 3) % 9 + 9) % 9;
const litBehind = new Set();                              // interior cells that take a warm light behind glass
const ACs = [];

for (const c of F.values()) {
  const { x, z } = c;
  const T = topOf(c);
  // podium: the solid base, from y 0 up to the first floor deck, under every cell (no floating over slopes)
  for (let y = 0; y <= 5; y++) {
    const ext = exposed(x, z, y);
    const block = !ext ? "stone" : y === 0 ? "polished_andesite" : y === 5 ? "chiseled_stone_bricks" : "stone_bricks";
    g.set(x, y, z, block);
  }
  // railing round the terrace (outline cells, above the 22 paving)
  if (d(c) === 1 && T === 22) g.set(x, 23, z, "white_concrete");
  // the envelope above the podium
  for (let y = 6; y <= T; y++) {
    if (!env(x, z, y)) continue;
    if (solidAt(c, y)) {
      const ext = exposed(x, z, y);
      if (y % 4 === 2) {                                    // floor deck or storey line
        g.set(x, y, z, ext ? "light_gray_concrete" : "smooth_stone");
      } else {                                              // roof cap or terrace paving
        if (ext) g.set(x, y, z, "smooth_stone");           // cornice
        else g.set(x, y, z, T === 22 ? "smooth_stone" : "gray_concrete");
      }
      continue;
    }
    // storey air: window bays with piers at the corners and every third bay
    const s = sides(x, z, y);
    if (!s.length) continue;
    if (entranceCells.has(key(x, z)) && (y === 7 || y === 8 || y === 9)) continue;
    const corner = s.length === 2;
    const pierBay = corner ? true : (s[0][0] !== 0 ? z : x) % 3 === 0;
    g.set(x, y, z, pierBay ? "white_concrete" : "light_blue_stained_glass");
    if (!pierBay && y % 4 === 0 && hash(x, y, z) === 0) {  // lit room behind the glass
      const ix = x - s[0][0], iz = z - s[0][1];
      if (inF(ix, iz) && env(ix, iz, y) && !exposed(ix, iz, y)) litBehind.add(`${ix},${y},${iz}`);
    }
  }
}

// the entrance: a door bay with lobby glass, a canopy slab at y 9, and warm light inside
if (entrance) {
  const { x, z } = entrance;
  g.set(x, 7, z, "dark_oak_door", DOOR("lower"));
  g.set(x, 8, z, "dark_oak_door", DOOR("upper"));
  for (const dx of [-1, 1]) for (const y of [7, 8]) g.set(x + dx, y, z, "light_blue_stained_glass");
  for (const dx of [-1, 0, 1]) g.set(x + dx, 9, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  for (const dx of [-1, 1]) if (inF(x + dx, z - 1)) litBehind.add(`${x + dx},8,${z - 1}`);
}

// warm lights behind some glass: glowstone mostly, a shroomlight now and then
for (const k of litBehind) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, hash(x, y, z) === 0 && (x + z) % 2 === 0 ? "shroomlight" : "glowstone");
}

// terrace planting on the setback (a few oak trees' leaves above the paving, not in the way of the railing)
for (const c of F.values()) {
  if (topOf(c) === 22 && d(c) === 2 && (c.x * 5 + c.z * 3) % 7 === 0) g.set(c.x, 23, c.z, "oak_leaves", { persistent: "true" });
}

// roof plant: three AC units on the main roof, two blocks high
for (const c of F.values()) {
  if (ACs.length >= 3) break;
  const right = F.get(key(c.x + 1, c.z));
  if (topOf(c) === 25 && d(c) >= 3 && (c.x * 7 + c.z * 11) % 17 === 0 && right && topOf(right) === 25 && d(right) >= 3) {
    ACs.push(c);
    for (const [x, z] of [[c.x, c.z], [c.x + 1, c.z]]) { g.set(x, 26, z, "light_gray_concrete"); g.set(x, 27, z, "iron_block"); }
  }
}

const out = `${DIR}/way_162814445.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ cells: F.size, entrance, acs: ACs.length, litBehind: litBehind.size, ...stats }));
