// Helpers for plan.md's VOCABULARY: fluteFace, portalStrut, fenderRing, deckSection, deckLamp, suspender.
// Each takes its position as arguments (module-local coordinates) and writes only its own footprint, only into air:
// a cell that is already built is refused, never overwritten. Every helper returns { placed, refused: [[x, y, z], ...] }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STEEL = "orange_terracotta";
const STEEL_ID = `minecraft:${STEEL}`;
const BACK = "red_terracotta";

const cellKey = (x, y, z) => `${x},${y},${z}`;

// One cell: into air, or over a block id listed in `over` (fluteFace's skin pass only).
function put(g, x, y, z, block, state, over = []) {
  if (!g.inBounds(x, y, z)) return false;
  if (!g.isAir(x, y, z) && !over.includes(g.blockAt(x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
}

// A planned footprint: a later entry for the same cell replaces an earlier one, and a dropped cell is never written.
function flush(g, cells) {
  const out = { placed: 0, refused: [] };
  for (const [x, y, z, block, state] of cells.values()) {
    if (put(g, x, y, z, block, state)) out.placed++;
    else out.refused.push([x, y, z]);
  }
  return out;
}

/**
 * Fluted leg face (plan.md FACADES). face: the outward side of the leg box x0..x1, z0..z1 ("north" / "south" / "east" /
 * "west"). ribs and recesses are the columns (x for north/south, z for east/west) on that face. A rib stays steel; a
 * recess leaves its front cell air and puts red_terracotta one cell behind it. Pass y0..y1 between two band courses.
 * skin: true when the leg's own steel is already built (legStage): the recess front is carved out of it and the back
 * is written over it. Without skin, cells must be air.
 */
export function fluteFace(g, face, y0, y1, x0, x1, z0, z1, ribs, recesses, { skin = false } = {}) {
  const span = face === "north" || face === "south" ? [x0, x1] : [z0, z1];
  // [front, behind] cells of column c at height y
  const cellsOf = {
    north: (c, y) => [[c, y, z0], [c, y, z0 + 1]],
    south: (c, y) => [[c, y, z1], [c, y, z1 - 1]],
    west: (c, y) => [[x0, y, c], [x0 + 1, y, c]],
    east: (c, y) => [[x1, y, c], [x1 - 1, y, c]],
  }[face];
  if (!cellsOf) throw new Error(`fluteFace: face must be north, south, east or west, got ${face}`);
  for (const c of [...ribs, ...recesses]) {
    if (c < span[0] || c > span[1]) throw new Error(`fluteFace: ${c} is off the ${face} face (${span})`);
  }
  const over = skin ? [STEEL_ID] : [];
  const out = { placed: 0, refused: [] };
  const write = (x, y, z, block, o) => {
    if (put(g, x, y, z, block, undefined, o)) out.placed++;
    else out.refused.push([x, y, z]);
  };
  for (let y = y0; y <= y1; y++) {
    for (const c of ribs) {
      const [[x, , z]] = cellsOf(c, y);
      write(x, y, z, STEEL, [STEEL_ID]);
    }
    for (const c of recesses) {
      const [[fx, , fz], [bx, , bz]] = cellsOf(c, y);
      if (skin && g.blockAt(fx, y, fz) === STEEL_ID) g.set(fx, y, fz, "air");
      write(bx, y, bz, BACK, over);
    }
  }
  return out;
}

/**
 * Portal strut (plan.md VOCABULARY): steel box x0..x0+8, z0..z0+3, yBottom..yTop. haunches: the stepped corners in the
 * two rows under it. frame: a recessed frame on both z faces (x0+2..x0+6 over the inner rows; front cells left out, red
 * behind; an orange_concrete panel at the face over x0+3..x0+5 in the middle rows) and a shroomlight flush in the top
 * at x0+4. opts.frame false: a plain steel box (the lower strut). opts.light: the y of the top shroomlight (default
 * yTop; the top strut's crown sits above it, at 114).
 */
export function portalStrut(g, x0, z0, yBottom, yTop, haunches, { frame = true, light = yTop } = {}) {
  const cells = new Map();
  const set = (x, y, z, block, state) => cells.set(cellKey(x, y, z), [x, y, z, block, state]);
  for (let x = x0; x <= x0 + 8; x++) for (let y = yBottom; y <= yTop; y++) for (let z = z0; z <= z0 + 3; z++) set(x, y, z, STEEL);
  if (haunches) {
    for (let z = z0; z <= z0 + 3; z++) {
      for (const x of [x0, x0 + 1, x0 + 7, x0 + 8]) set(x, yBottom - 1, z, STEEL);
      for (const x of [x0, x0 + 8]) set(x, yBottom - 2, z, STEEL);
    }
  }
  if (frame) {
    for (const [zf, zb] of [[z0, z0 + 1], [z0 + 3, z0 + 2]]) {
      for (let y = yBottom + 1; y <= yTop - 1; y++) {
        for (let x = x0 + 2; x <= x0 + 6; x++) {
          set(x, y, zb, BACK);
          const panel = y >= yBottom + 2 && y <= yTop - 2 && x >= x0 + 3 && x <= x0 + 5;
          if (panel) set(x, y, zf, "orange_concrete");
          else cells.delete(cellKey(x, y, zf));
        }
      }
    }
    set(x0 + 4, light, z0 + 1, "shroomlight");
    set(x0 + 4, light, z0 + 2, "shroomlight");
  }
  return flush(g, cells);
}

/**
 * Elliptical fender ring (plan.md): centre (cx, cz); outer half-axes 23.5 x 12, inner 21.5 x 10. Cells between the two
 * ellipses: light_gray_concrete at y 1..2, polished_andesite at y 3. Nothing at y 0.
 */
export function fenderRing(g, cx, cz) {
  const cells = new Map();
  for (let x = Math.floor(cx - 23.5); x <= Math.ceil(cx + 23.5); x++) {
    for (let z = Math.floor(cz - 12); z <= Math.ceil(cz + 12); z++) {
      const outer = ((x - cx) / 23.5) ** 2 + ((z - cz) / 12) ** 2 <= 1;
      const inner = ((x - cx) / 21.5) ** 2 + ((z - cz) / 10) ** 2 <= 1;
      if (!outer || inner) continue;
      for (let y = 1; y <= 2; y++) cells.set(cellKey(x, y, z), [x, y, z, "light_gray_concrete"]);
      cells.set(cellKey(x, 3, z), [x, 3, z, "polished_andesite"]);
    }
  }
  return flush(g, cells);
}

// Lateral bracing line A (plan.md): its x at local z (z mod 16). Line B is 14 - A.
const lateralA = (zl) => (zl <= 7 ? 1 + Math.round((zl * 12) / 7) : 13 - Math.round(((zl - 8) * 12) / 7));

/**
 * Deck cross-section (plan.md SITE) for z0..z1 at x offset xOff (plot 1: 0, the tower's deck: 16). Rows: railing and
 * lamp level y 39 (red_sandstone_wall, connected to its neighbours); road y 38 x 3..11 (gray_concrete, yellow centre
 * line at x 7, white dashes at x 5 and 9 on z 0..3 and 8..11); sidewalks y 38 x 1..2 and 12..13; edge girders and
 * truss top chords at x 0 and 14; deck plate y 37 x 1..13; Warren diagonals at x 0 and 14 on z mod 4 (open at 0);
 * floor beams y 35 x 1..13 on z mod 4 = 0 with a shroomlight at x 7; bottom chord y 34 at x 0 and 14 and the two
 * lateral bracing lines; brackets orange_concrete at x 0 and 14 on z mod 4 = 0.
 * opts.portal: the stretch through the tower's portal, road and floor beams only, x 3..11 (plan.md).
 */
export function deckSection(g, xOff, z0, z1, { portal = false } = {}) {
  const cells = new Map();
  const set = (x, y, z, block, state) => cells.set(cellKey(xOff + x, y, z), [xOff + x, y, z, block, state]);
  const inSection = (z) => z >= z0 && z <= z1;
  // a railing post connects to a neighbour that is railing or bracket in this section, or any block already built there
  const connects = (x, z, dz) => inSection(z + dz) || !g.isAir(xOff + x, 39, z + dz);
  const [bx0, bx1] = portal ? [3, 11] : [1, 13];
  for (let z = z0; z <= z1; z++) {
    const m4 = z % 4, zl = z % 16;
    for (let x = 3; x <= 11; x++) set(x, 38, z, "gray_concrete");
    set(7, 38, z, "yellow_concrete");
    if (zl <= 3 || (zl >= 8 && zl <= 11)) {
      set(5, 38, z, "white_concrete");
      set(9, 38, z, "white_concrete");
    }
    if (m4 === 0) {
      for (let x = bx0; x <= bx1; x++) set(x, 35, z, STEEL);
      set(7, 35, z, "shroomlight");
    }
    if (portal) continue;

    for (const x of [1, 2, 12, 13]) set(x, 38, z, "light_gray_concrete");
    for (const x of [0, 14]) set(x, 38, z, STEEL);
    for (let x = 1; x <= 13; x++) set(x, 37, z, BACK);
    for (const x of [0, 14]) set(x, 37, z, STEEL);
    if (m4 === 1 || m4 === 3) for (const x of [0, 14]) set(x, 35, z, BACK);
    if (m4 === 2) for (const x of [0, 14]) set(x, 36, z, BACK);
    for (const x of [0, 14]) set(x, 34, z, STEEL);

    // lateral bracing: each z fills from the previous z's position, so each line is unbroken
    const prev = lateralA((zl + 15) % 16), cur = lateralA(zl);
    const [lo, hi] = [Math.min(prev, cur), Math.max(prev, cur)];
    for (let x = lo; x <= hi; x++) set(x, 34, z, BACK);
    for (let x = 14 - hi; x <= 14 - lo; x++) set(x, 34, z, BACK);

    if (m4 === 0) {
      for (const x of [0, 14]) {
        set(x, 38, z, "orange_concrete");
        set(x, 39, z, "orange_concrete");
      }
    } else {
      for (const x of [0, 14]) {
        const n = connects(x, z, -1), s = connects(x, z, 1);
        set(x, 39, z, "red_sandstone_wall", {
          up: n && s ? "false" : "true",
          ...(n ? { north: "low" } : {}),
          ...(s ? { south: "low" } : {}),
        });
      }
    }
  }
  return flush(g, cells);
}

/** Street lamp (plan.md): orange_terracotta base at y 39, red_sandstone_wall shaft y 40..41, lantern standing at y 42. */
export function deckLamp(g, x, z) {
  const cells = new Map();
  const set = (y, block, state) => cells.set(cellKey(x, y, z), [x, y, z, block, state]);
  set(39, STEEL);
  for (let y = 40; y <= 41; y++) set(y, "red_sandstone_wall", { up: "true" });
  set(42, ...B.lantern(false));
  return flush(g, cells);
}

/** Suspender rope (plan.md): red_stained_glass_pane column from yBottom to yTop, no side connections (a thin post). */
export function suspender(g, x, z, yBottom, yTop) {
  const cells = new Map();
  for (let y = yBottom; y <= yTop; y++) {
    cells.set(cellKey(x, y, z), [x, y, z, "red_stained_glass_pane", { north: "false", east: "false", south: "false", west: "false" }]);
  }
  return flush(g, cells);
}
