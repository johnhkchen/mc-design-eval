// Part 1: Economy Market shell + roofs (plot 0). Masses are the plan's, trimmed one cell on street faces (wall plane = edge-1).
// Walls are the exposed cells of the union of masses: a cell column is a wall at height y when a 4-neighbour has no mass at y.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { groundAt, onFootprint, skylightGable, rooftopPlanter } from "../vocab.mjs";

// [name, x0, x1, z0, z1, deckY, topY, parapetMaterial]
const MASSES = [
  ["E1", 9, 52, 12, 38, 35, 37, "bricks"],
  ["E1b", 53, 55, 12, 29, 35, 37, "bricks"],
  ["E2", 51, 55, 0, 11, 42, 44, "bricks"],
  ["E3", 3, 49, 39, 47, 35, 37, "bricks"],
  ["E4", 3, 32, 48, 56, 17, 19, "bricks"],
  ["E5", 42, 47, 48, 59, 26, 28, "smooth_sandstone"],
];
const massAt = (x, z) => MASSES.find((m) => x >= m[1] && x <= m[2] && z >= m[3] && z <= m[4] && onFootprint(x, z));
const topAt = (x, z) => { const m = massAt(x, z); return m ? m[6] : -1; };

// air boxes [x0,y0,z0,x1,y1,z1]: windows and openings (walls skip these cells)
const OPEN = [];
const box = (...b) => OPEN.push(b);
for (const z of [3, 9, 15, 21, 27]) { box(55, 19, z, 55, 23, z + 2); if (z >= 12) box(55, 28, z, 55, 32, z + 1); }
box(52, 19, 32, 52, 23, 34); box(52, 28, 32, 52, 32, 33);
box(52, 18, 36, 52, 21, 37);
box(49, 19, 41, 49, 23, 43); box(49, 28, 41, 49, 32, 42);
box(55, 28, 4, 55, 33, 7);                                   // E2 tall arched window (arch top y34 sandstone)
for (const x of [9, 15, 21, 27, 33]) { box(x, 11, 47, x + 1, 15, 47); box(x, 28, 47, x + 1, 32, 47); }
const ROWS = [[4, 7], [11, 15], [19, 24], [28, 32]];
for (let z = 12; z <= 36; z += 6) for (const [a, b] of ROWS) box(9, a, z, 9, b, z + 1);
for (let z = 39; z <= 45; z += 6) for (const [a, b] of ROWS) box(3, a, z, 3, b, z + 1);
for (const z of [50, 54]) for (const [a, b] of [[3, 7], [10, 14]]) box(3, a, z, 3, b, z + 1);
for (const x of [6, 12, 18, 24]) for (const [a, b] of [[3, 7], [10, 14]]) box(x, a, 56, x + 1, b, 56);
box(45, 13, 59, 46, 22, 59);                                 // atrium doorway (frame and fan built below)
const OPEN_OK = OPEN.filter((b) => {                          // drop windows that would sit under the ground
  for (let x = b[0]; x <= b[3]; x++) for (let z = b[2]; z <= b[5]; z++) { const gr = groundAt(x, z); if (gr !== null && gr >= b[1]) return false; }
  return true;
});
const isOpenOk = (x, y, z) => OPEN_OK.some((b) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5]);
const inSky = (x, z) => x >= 23 && x <= 41 && z >= 19 && z <= 31;
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function build(g) {
  const cols = [];
  for (const m of MASSES) for (let x = m[1]; x <= m[2]; x++) for (let z = m[3]; z <= m[4]; z++) if (onFootprint(x, z)) cols.push([x, z, m]);
  for (const [x, z, m] of cols) {
    const gr = groundAt(x, z), deck = m[5], top = m[6], pmat = m[7];
    const anyOpenSide = NEIGH.some(([dx, dz]) => topAt(x + dx, z + dz) < gr + 1);
    for (let y = gr + 1; y <= top; y++) {
      if (!NEIGH.some(([dx, dz]) => topAt(x + dx, z + dz) < y)) continue;
      if (isOpenOk(x, y, z)) continue;
      const plinthTop = x >= 49 ? 17 : 9;
      let blk = "bricks";
      if (y <= plinthTop) {
        blk = y < 6 && (x * 7 + z * 3 + y * 5) % 10 === 0 ? "mossy_stone_bricks" : "stone_bricks";
        if (x <= 12 && y > 6 && (x * 5 + z) % 9 === 0) blk = "cracked_stone_bricks";
      } else if (y === 26) blk = "smooth_sandstone";
      else if (y < 26 && (5 * x + 7 * y + 3 * z) % 12 === 0) blk = "granite";
      else if (y > deck) blk = pmat;
      if (y === top) {
        if (m[0] === "E4") g.set(x, y, z, "iron_bars");
        else g.set(x, y, z, ...B.slab(m[0] === "E5" ? "smooth_sandstone" : "smooth_stone", "bottom"));
      } else g.set(x, y, z, blk);
    }
    if (anyOpenSide) g.set(x, gr, z, "stone_bricks");
  }
  // name panel on E2's street face (cream), arch head for the tall window
  for (let z = 1; z <= 10; z++) for (let y = 36; y <= 41; y++) g.set(55, y, z, "smooth_sandstone");
  for (let z = 4; z <= 7; z++) g.set(55, 34, z, "smooth_sandstone");

  // floors (y > ground only) and the roof deck, on interior cells
  const FLOORS = { E1: [2, 9, 17, 26], E1b: [9, 17, 26], E3: [2, 9, 17, 26], E2: [19, 26, 35], E4: [1, 9], E5: [12] };
  for (const [x, z, m] of cols) {
    const gr = groundAt(x, z), deck = m[5];
    if (!NEIGH.every(([dx, dz]) => topAt(x + dx, z + dz) >= deck)) continue;
    for (const y of FLOORS[m[0]]) {
      if (y <= gr) continue;
      if (y >= 26 && inSky(x, z) && m[0] !== "E2") continue;
      if (y === 2 && x > 30) continue;
      g.set(x, y, z, y === 17 || y === 19 || y === 12 ? "spruce_planks" : "smooth_sandstone");
    }
    if (deck <= gr) continue;
    if (["E1", "E1b", "E3"].includes(m[0]) && x >= 24 && x <= 40 && z >= 20 && z <= 30) continue; // skylight void
    g.set(x, deck, z, (x + z) % 2 ? "stone_bricks" : "polished_andesite");
  }

  // cornice on the three east faces: upside-down brick stairs +1 proud, dentils under every other block
  for (const [x, z0, z1] of [[55, 0, 29], [52, 30, 38], [49, 39, 47]]) for (let z = z0; z <= z1; z++) {
    if (!onFootprint(x + 1, z)) continue;
    g.set(x + 1, 34, z, ...B.stairs("brick", "west", "top"));
    if (z % 2 === 0) g.set(x + 1, 33, z, "bricks");
  }

  // E5 atrium entrance: sandstone piers, glazed fan, arch, keystone, cream band, parapet pediment step
  for (let y = 10; y <= 22; y++) for (const x of [44, 47]) g.set(x, y, 59, "smooth_sandstone");
  for (let y = 10; y <= 12; y++) for (const x of [45, 46]) g.set(x, y, 59, "stone_bricks");
  for (let y = 16; y <= 20; y++) for (const x of [45, 46]) g.set(x, y, 59, "glass_pane");
  g.set(45, 21, 59, ...B.stairs("smooth_sandstone", "east", "top"));
  g.set(46, 21, 59, ...B.stairs("smooth_sandstone", "west", "top"));
  for (const x of [45, 46]) g.set(x, 22, 59, "quartz_block");
  for (let y = 23; y <= 25; y++) for (let x = 42; x <= 47; x++) g.set(x, y, 59, "smooth_sandstone");

  // E6 skylight on a stone curb, E2 lantern flagpole, E4 terrace planter
  for (let x = 23; x <= 41; x++) for (const z of [19, 31]) g.set(x, 35, z, "stone_bricks");
  for (let z = 19; z <= 31; z++) for (const x of [23, 41]) g.set(x, 35, z, "stone_bricks");
  skylightGable(g, { x0: 23, x1: 41, z0: 19, z1: 31, y0: 36, ridgeZ: 25, ribEvery: 4 });
  for (let y = 43; y <= 46; y++) g.set(53, y, 5, "spruce_fence");
  g.set(53, 47, 5, ...B.lantern(false));
  rooftopPlanter(g, { box: [4, 18, 49, 31, 19, 49] });
}
