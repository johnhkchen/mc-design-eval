// H2 vocabulary (plan.md VOCABULARY): pierRhythm, dish, komoSign, lobbyGlazing, apertureBay, doorPair, tree, ceilingLamp.
// Each helper takes its own position as arguments and returns { placed, refused }. It writes only inside its footprint,
// and only into air, unless an option names the blocks it may replace (`over`). A refused write is listed, never thrown.
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["air", "cave_air", "void_air"]);
const bare = (id) => id.replace(/^minecraft:/, "");

// Applies [x, y, z, block, state] writes (a later write to the same cell wins) into air or into `over` blocks.
function commit(g, writes, { over = [] } = {}) {
  const cells = new Map();
  for (const w of writes) cells.set(w.slice(0, 3).join(","), w);
  const res = { placed: 0, refused: [] };
  for (const [x, y, z, block, state] of cells.values()) {
    if (!g.inBounds(x, y, z)) { res.refused.push([x, y, z, "outside"]); continue; }
    const cur = bare(g.blockAt(x, y, z));
    if (!AIR.has(cur) && !over.includes(cur)) { res.refused.push([x, y, z, cur]); continue; }
    const before = g.refused?.length ?? 0;      // a guard() wrapper refuses protected cells
    g.set(x, y, z, block, state);
    if ((g.refused?.length ?? 0) > before) { res.refused.push([x, y, z, cur]); continue; }
    res.placed++;
  }
  return res;
}

// A wall run along x (at z) or along z (at x): { x0, x1, z } or { x, z0, z1 }, also the box form {x0,x1,z0,z1}.
function runCells({ x0 = undefined, x1, z0, z1, x, z }) {
  const xa = x0 ?? x, xb = x1 ?? x, za = z0 ?? z, zb = z1 ?? z;
  const cells = [];
  if (xb - xa >= zb - za) for (let i = xa; i <= xb; i++) cells.push([i, za]);
  else for (let k = za; k <= zb; k++) cells.push([xa, k]);
  return cells;
}

// The wall's own axis for a face: north/south walls run along x, east/west walls along z.
const alongOf = (face) => (face === "north" || face === "south" ? [1, 0] : [0, 1]);

/**
 * Mullion piers in a ribbon of glass: over the glass rows slab+1..slab+3, a 1-wide pier every `every` columns
 * (6 glass, 1 pier), measured from the corner's edge; 2-wide solid corners. Replaces the ribbon's glass only.
 */
export function pierRhythm(g, run, { every = 7, block = "light_gray_concrete", inset = 1, corner = "white_concrete", over = ["gray_stained_glass_pane"] } = {}) {
  const cells = runCells(run), n = cells.length, writes = [];
  cells.forEach(([x, z], i) => {
    const edge = i < 2 || i >= n - 2;
    const pier = !edge && (i - inset) % every === 0;
    for (const y of [run.slab + 1, run.slab + 2, run.slab + 3]) {
      if (edge) writes.push([x, y, z, corner]);
      else if (pier) writes.push([x, y, z, block]);
    }
  });
  return commit(g, writes, { over });
}

/**
 * Satellite dish on a deck at deckY: a 3x3 polished_andesite pedestal 2 high, an iron_block yoke above it, a bowl of
 * stacked one-thick discs (white_concrete, smooth_quartz on the upper rim) rising toward +z, and an iron_bars feed arm
 * ending in an end_rod. d is the bowl diameter; nothing rises above deckY + d, and the deck itself is never written.
 */
export function dish(g, { cx, cz, deckY, d }) {
  const R = Math.floor(d / 2), K = R - 1, yc = deckY + 4, top = deckY + d;
  const writes = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = deckY + 1; y <= deckY + 2; y++) writes.push([cx + dx, y, cz + dz, "polished_andesite"]);
  writes.push([cx, deckY + 3, cz, "iron_block"]);
  for (let k = 1; k <= K; k++) {
    const rk = Math.max(1, Math.round(R * Math.sqrt(k / K))), yk = yc + Math.floor(k / 2), z = cz + k;
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
      const r2 = i * i + j * j, y = yk + j;
      if (r2 > rk * rk || r2 < (rk - 1) * (rk - 1) || y <= deckY || y > top) continue;   // one-thick ring, under the top
      writes.push([cx + i, y, z, k === K && j >= 0 ? "smooth_quartz" : "white_concrete"]);
    }
  }
  for (let i = 1; i <= R; i++) {
    const y = yc + Math.floor(i / 2), z = cz + i;
    if (y > top) continue;
    if (i < R) writes.push([cx, y, z, "iron_bars", { north: "true", south: "true", east: "false", west: "false" }]);
    else writes.push([cx, y, z, "end_rod", { facing: "south" }]);
  }
  return commit(g, writes);
}

/**
 * The KOMO 4 sign on the north wall. `at` is plaque's origin on the wall line (z of the wall, the lettering's east end and
 * bottom row): 11 wide, 5 high, so at x 38 the letters fill plan.md's x 28..38, y 30..34, one cell in front of the wall.
 * The 4x4 blue and red checker sits at x at+2..at+5 on the same plane (plan.md's x 40..43, y 30..33).
 */
export function komoSign(g, { at, width = 11, height = 5 }) {
  const sign = plaque(g, "KOMO 4", { at, face: "north", width, height, material: null });
  const writes = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    writes.push([at[0] + 2 + i, at[1] + j, at[2] - 1, (i + j) % 2 === 0 ? "blue_concrete" : "red_concrete"]);
  }
  const emblem = commit(g, writes);
  return { placed: sign.cells + emblem.placed, refused: emblem.refused, notes: sign.notes };
}

/**
 * Ground-storey glazing along a run: glass at y0..y1 between 1-wide light_gray_concrete columns every `every`
 * blocks, with a smooth_quartz_slab band at y=band across the run.
 */
export function lobbyGlazing(g, { run, every = 4, y0 = 1, y1 = 5, band = 6, over = [] }) {
  const writes = [];
  runCells(run).forEach(([x, z], i) => {
    const column = i % every === 0;
    for (let y = y0; y <= y1; y++) writes.push([x, y, z, column ? "light_gray_concrete" : "glass"]);
    writes.push([x, band, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]);
  });
  return commit(g, writes, { over });
}

/**
 * One 5-wide storey bay on a wall, starting at (x, z) and running along the face (north/south: +x; east/west: +z),
 * rows slab+1..slab+4. Window 3x3 glass_pane, centred. Dark: gray_concrete frame, polished_deepslate spandrel.
 * Light: white_concrete. The wall plane is the coordinate given by the face (z for north/south, x for east/west).
 */
export function apertureBay(g, { x, z, face, dark = false, slab, over = [] }) {
  const [ax, az] = alongOf(face), alongX = ax === 1;
  const pane = alongX ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" };
  const writes = [];
  for (let p = 0; p < 5; p++) for (let r = 1; r <= 4; r++) {
    const px = x + p * ax, pz = z + p * az, y = slab + r;
    if (r === 4) writes.push([px, y, pz, dark ? "polished_deepslate" : "white_concrete"]);
    else if (p >= 1 && p <= 3 && r <= 3) writes.push([px, y, pz, "glass_pane", pane]);
    else writes.push([px, y, pz, dark ? "gray_concrete" : "white_concrete"]);
  }
  return commit(g, writes, { over });
}

/**
 * A pair of iron_door doors side by side at (x, y, z) on the given face: both halves of each, facing out, the
 * first hinged left and the second right. y is the lower half's y (the walk level, 1 in plan.md).
 */
export function doorPair(g, { x, y, z, face, over = [] }) {
  const [ax, az] = alongOf(face), writes = [];
  [[0, "left"], [1, "right"]].forEach(([s, hinge]) => {
    for (const [half, dy] of [["lower", 0], ["upper", 1]]) {
      writes.push([x + s * ax, y + dy, z + s * az, "iron_door", { facing: face, half, hinge, open: "false", powered: "false" }]);
    }
  });
  return commit(g, writes, { over });
}

/**
 * An oak tree rooted at (x, y, z), y being the first cell above the paving (1 in plan.md): an oak_log trunk of 4-6
 * and a persistent oak_leaves crown 5 wide. The crown starts two blocks above the trunk base, so a 2-high lane stays clear.
 */
export function tree(g, x, z, { y = 1, height = 5 } = {}) {
  const h = Math.min(6, Math.max(4, height)), LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
  const writes = [];
  for (let k = 0; k < h; k++) writes.push([x, y + k, z, "oak_log", { axis: "y" }]);
  for (let dy = h - 2; dy <= h + 1; dy++) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    const corner = Math.abs(i) === 2 && Math.abs(j) === 2, trunk = i === 0 && j === 0 && dy < h;
    const inCrown = dy <= h - 1 ? !corner : dy === h ? Math.abs(i) <= 1 && Math.abs(j) <= 1 && !corner : Math.abs(i) + Math.abs(j) <= 1;
    if (inCrown && !trunk) writes.push([x + i, y + dy, z + j, "oak_leaves", LEAF]);
  }
  return commit(g, writes);
}

/**
 * Flush sea_lanterns in a ceiling at height y, one every 6 blocks over the room box [x0, y0, z0, x1, y1, z1] (the rooms.json
 * form), offset 3 in from its edges. Replaces the ceiling block (`over`), otherwise air only.
 */
export function ceilingLamp(g, [x0, , z0, x1, , z1], y, { over = ["polished_diorite", "birch_planks"] } = {}) {
  const writes = [];
  for (let x = x0 + 3; x <= x1; x += 6) for (let z = z0 + 3; z <= z1; z += 6) writes.push([x, y, z, "sea_lantern"]);
  return commit(g, writes, { over });
}
