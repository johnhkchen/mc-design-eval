// Vocabulary helpers from plan.md VOCABULARY (first group): crown_band, portal_bay, emblem, shop_bay, plinth, ring_circle,
// pylon, roof_garden, ledge_planter. Palette ids are literals; nothing is imported from vocab.mjs or the other vocab/ files.
// Every helper takes the grid first, then its position (and facing, where it has one), then an optional opts object, and
// returns { placed, skipped, clipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may write, and skipped counts
// cells it left alone because they were not air (opts.replace: true overwrites them, still inside the footprint). A write
// outside the footprint throws, so nothing is ever placed under it: ground, sand and floors an earlier part owns stay as
// they are. Helpers whose position is an object take `replace` inside that object.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Leaves never decay (persistent) and keep the distance state the toolkit writes (tools/src/terrain.mjs).
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const SLAB = (type = "bottom") => ({ type, waterlogged: "false" });

// The writer: the only way a helper writes. Air only unless replace; a write outside the box throws; a cell outside the
// grid itself is clipped (counted), since the plan's own edges can run past the site.
function writer(g, box, { replace = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const w = { placed: 0, skipped: 0, clipped: 0, box };
  w.set = (x, y, z, block, state) => {
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) throw new Error(`write outside footprint ${box}: ${x},${y},${z} ${block}`);
    if (!g.inBounds(x, y, z)) { w.clipped++; return; }
    if (!replace && !g.isAir(x, y, z)) { w.skipped++; return; }
    g.set(x, y, z, block, state);
    w.placed++;
  };
  return w;
}

const done = (w) => ({ placed: w.placed, skipped: w.skipped, clipped: w.clipped, box: w.box });

// Visit every cell of the box; fn(x, y, z) returns [block, state] to place, or null to leave the cell alone.
function paint(g, box, fn, opts) {
  const w = writer(g, box, opts);
  const [x0, y0, z0, x1, y1, z1] = box;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const want = fn(x, y, z);
    if (want) w.set(x, y, z, ...want);
  }
  return done(w);
}

// Deterministic pseudo-random int from a cell, so the same call always gives the same garden (no Math.random).
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// FACADES pier rhythm on a mass's perimeter cell: 2-wide corners; north/south faces piers on x ≡ 0 (mod 3), east/west
// faces piers on z ≡ 2 (mod 3) (the tower's east face: z 20, 23 ... 35).
function pierCell(x, z, [x0, , z0, x1, , z1]) {
  if (z === z0 || z === z1) return x - x0 <= 1 || x1 - x <= 1 || x % 3 === 0;
  return z - z0 <= 1 || z1 - z <= 1 || z % 3 === 2;
}

/**
 * Crown band of a tower mass: smooth_sandstone round the perimeter of box, y0..y1, no windows; cut_sandstone pier heads on
 * the bottom course y0. Interior cells are not touched (the hollow shell stays as the mass built it).
 */
export function crown_band(g, box, opts = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  return paint(g, box, (x, y, z) => {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) return null;
    if (y === y0 && pierCell(x, z, box)) return ["cut_sandstone"];
    return ["smooth_sandstone"];
  }, opts);
}

/**
 * Entrance portal bay on the face plane x (the E portal sits on x 62), spanning z0..z0+15 from y0. smooth_sandstone piers
 * over y0..y0+13 at the pier columns (z0+0..1, +4..6, +9..11, +14..15); the door and window columns (+2..3, +7..8, +12..13)
 * stay air for the later parts. A 2-high lintel over the whole span (y0+14..15): chiseled_sandstone over the pier heads,
 * cut_sandstone elsewhere. A smooth_sandstone_slab coping at y0+16. Defaults (z0 20, y0 2) are the plan's E portal.
 */
export function portal_bay(g, { x, z0 = 20, y0 = 2, replace = false } = {}) {
  const box = [x, y0, z0, x, y0 + 16, z0 + 15];
  const PIERS = [0, 1, 4, 5, 6, 9, 10, 11, 14, 15];
  return paint(g, box, (_x, y, z) => {
    const dz = z - z0;
    if (y === y0 + 16) return ["smooth_sandstone_slab", SLAB("bottom")];
    if (y >= y0 + 14) return [(dz >= 4 && dz <= 6) || (dz >= 9 && dz <= 11) ? "chiseled_sandstone" : "cut_sandstone"];
    if (PIERS.includes(dz)) return ["smooth_sandstone"];
    return null;
  }, { replace });
}

/**
 * Coat of arms on the face plane x, 3 wide (z0..z2) by 2 tall (y0..y1). kind "british": a gold cross column with red and
 * blue terracotta quarters. kind "french": a blue_terracotta field with a gold fleur-de-lis (centre column and two side
 * petals on the top row).
 */
export function emblem(g, { x, z0, z2, y0, y1, kind, replace = false } = {}) {
  if (kind !== "british" && kind !== "french") throw new Error(`emblem: unknown kind ${kind}`);
  const mid = z0 + Math.floor((z2 - z0) / 2);
  const top = y1;
  return paint(g, [x, y0, z0, x, y1, z2], (_x, y, z) => {
    if (z === mid) return ["gold_block"];
    if (kind === "british") {
      // quarters: top-left and bottom-right red, top-right and bottom-left blue
      const redQuarter = (z === z0) === (y === top);
      return [redQuarter ? "red_terracotta" : "blue_terracotta"];
    }
    if (y === top && (z === z0 || z === z2)) return ["gold_block"];
    return ["blue_terracotta"];
  }, { replace });
}

/**
 * A shopfront on one face of a ground storey. face is the wall's outward direction; plane is the face coordinate (z for
 * north/south, x for east/west); a..b is the bay's span along the face, inclusive (x for north/south, z for east/west).
 * Depth 1 (recessed one cell): glass_pane y2..5 on the strip columns (pier(t) columns stay as they are), joined to the
 * neighbouring strip panes; a waxed_exposed_cut_copper fascia at y6. Depth 2 (behind): an ochre_froglight ceiling at y6 and
 * a display row at y2 of lit candles alternating with smooth_stone. Nothing is written above the display row, so a 2-high
 * lane stays clear in front of it.
 */
export function shop_bay(g, { face, plane, a, b, y0 = 2, pier = (t) => t % 3 === 0, replace = false } = {}) {
  if (!["north", "south", "east", "west"].includes(face)) throw new Error(`shop_bay: face ${face}`);
  if (b < a) throw new Error(`shop_bay: span ${a}..${b}`);
  const alongX = face === "north" || face === "south";
  // [x, z] of the cell at depth d (1 or 2, inward from the face) and along-face position t.
  const xz = (d, t) => {
    if (face === "north") return [t, plane + d];
    if (face === "south") return [t, plane - d];
    if (face === "east") return [plane - d, t];
    return [plane + d, t];
  };
  const strip = (t) => t >= a && t <= b && !pier(t);
  const pane = (t) => {
    const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    const [lo, hi] = alongX ? ["west", "east"] : ["north", "south"];
    s[lo] = strip(t - 1) ? "true" : "false";
    s[hi] = strip(t + 1) ? "true" : "false";
    return s;
  };
  const cells = [];
  for (let t = a; t <= b; t++) cells.push(xz(1, t), xz(2, t));
  const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
  const box = [Math.min(...xs), y0, Math.min(...zs), Math.max(...xs), y0 + 4, Math.max(...zs)];
  const w = writer(g, box, { replace });
  for (let t = a; t <= b; t++) {
    const [gx, gz] = xz(1, t), [bx, bz] = xz(2, t);
    if (!pier(t)) for (let y = y0; y <= y0 + 3; y++) w.set(gx, y, gz, "glass_pane", pane(t));
    w.set(gx, y0 + 4, gz, "waxed_exposed_cut_copper");
    w.set(bx, y0 + 4, bz, "ochre_froglight", { axis: "y" });
    if ((t - a) % 2 === 0) w.set(bx, y0, bz, "candle", { candles: "1", lit: "true" });
    else w.set(bx, y0, bz, "smooth_stone");
  }
  return done(w);
}

/**
 * Atlas plinth c = { x0, z0, x1, z1, y0 = 2 }: polished_deepslate base course at y0, polished_andesite body at y0+1..2, and
 * the cap at y0+3: smooth_stone inside (the figure stands on it), a smooth_stone_slab ring round the edge.
 */
export function plinth(g, { x0, z0, x1, z1, y0 = 2, replace = false } = {}) {
  return paint(g, [x0, y0, z0, x1, y0 + 3, z1], (x, y, z) => {
    if (y === y0) return ["polished_deepslate"];
    if (y < y0 + 3) return ["polished_andesite"];
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    return rim ? ["smooth_stone_slab", SLAB("bottom")] : ["smooth_stone"];
  }, { replace });
}

/**
 * A hollow ring one block thick: a circle of radius r about centre [cx, cy, cz] (half-integers allowed), lying in the plane
 * normal to `plane` ('x': the y-z plane, 'y': x-z, 'z': x-y). `at` is the normal coordinate of its first layer (default: the
 * centre rounded down) and `thick` the number of layers (the Atlas meridians are 2 thick at z 27..28). Writes exactly the
 * ring's cells; the footprint is their bounding box.
 */
export function ring_circle(g, centre, plane, r, mat, { at, thick = 1, replace = false } = {}) {
  const n = { x: 0, y: 1, z: 2 }[plane];
  if (n === undefined) throw new Error(`ring_circle: plane ${plane}`);
  const [u, v] = [0, 1, 2].filter((i) => i !== n);
  const base = at ?? Math.floor(centre[n]);
  const ring = [];
  for (let i = Math.floor(centre[u] - r - 1); i <= Math.ceil(centre[u] + r + 1); i++)
    for (let j = Math.floor(centre[v] - r - 1); j <= Math.ceil(centre[v] + r + 1); j++)
      if (Math.abs(Math.hypot(i - centre[u], j - centre[v]) - r) <= 0.5) ring.push([i, j]);
  if (!ring.length) throw new Error(`ring_circle: no cells for r ${r}`);
  const us = ring.map(([i]) => i), vs = ring.map(([, j]) => j);
  const lo = [0, 0, 0], hi = [0, 0, 0];
  lo[u] = Math.min(...us); hi[u] = Math.max(...us); lo[v] = Math.min(...vs); hi[v] = Math.max(...vs);
  lo[n] = base; hi[n] = base + thick - 1;
  const w = writer(g, [...lo, ...hi], { replace });
  for (const [i, j] of ring) for (let k = base; k < base + thick; k++) {
    const p = [0, 0, 0];
    p[u] = i; p[v] = j; p[n] = k;
    w.set(p[0], p[1], p[2], mat);
  }
  return done(w);
}

/**
 * Granite pylon, 3 wide (x0..x0+2) by 2 deep (z0..z0+1), from y0 (the plan's y 2..17): polished_deepslate base course at y0,
 * polished_andesite shaft to y0+14, smooth_stone_slab coping at y0+15.
 */
export function pylon(g, x0, z0, y0 = 2, opts = {}) {
  return paint(g, [x0, y0, z0, x0 + 2, y0 + 15, z0 + 1], (_x, y) => {
    if (y === y0) return ["polished_deepslate"];
    if (y === y0 + 15) return ["smooth_stone_slab", SLAB("bottom")];
    return ["polished_andesite"];
  }, opts);
}

/**
 * A planted roof garden on a flat deck. box = [x0, z0, x1, z1] is the deck inside the coping; deckY is the deck's grass top
 * (nothing above deckY+5 is written: 26 gives y 31). Long axis runs along x unless the box is taller than wide. Layout, by
 * inset from the coping: grass with about 1 in 8 moss_block; inset 1 a 1-tall persistent azalea hedge (flowering accents);
 * inset 2 a gravel path ring, plus a 2-wide gravel cross path along the long axis; inset 3 oak fence posts with lanterns
 * every 6 along the long sides; four flower beds in the quadrants (inset 4, clear of the cross path); two small oak trees
 * (3-log trunks, persistent crowns 5 wide) standing in the gap column between the beds. seed varies moss and flowers.
 */
export function roof_garden(g, [x0, z0, x1, z1], deckY, seed = 0, opts = {}) {
  const longX = x1 - x0 >= z1 - z0;
  // (u, v) -> [x, z]: u runs along the long axis.
  const at = (u, v) => (longX ? [u, v] : [v, u]);
  const [U0, U1, V0, V1] = longX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
  const inset = (u, v) => Math.min(u - U0, U1 - u, v - V0, V1 - v);
  const uc = U0 + Math.floor((U1 - U0 + 1) / 2);     // tree gap column
  const vc = V0 + Math.floor((V1 - V0 + 1) / 2) - 1; // cross path at vc and vc+1
  const w = writer(g, [x0, deckY, z0, x1, deckY + 5, z1], opts);
  const put = (u, v, dy, ...spec) => { const [x, z] = at(u, v); w.set(x, deckY + dy, z, ...spec); };
  const h = (u, v, k = 0) => hash(at(u, v)[0] + seed * 131 + k, deckY, at(u, v)[1]);
  const FLOWERS = ["poppy", "allium", "cornflower", "oxeye_daisy", "red_tulip", "white_tulip"];

  // deck: gravel path ring and cross path, grass with moss elsewhere
  for (let u = U0; u <= U1; u++) for (let v = V0; v <= V1; v++) {
    const i = inset(u, v);
    if (i === 2 || ((v === vc || v === vc + 1) && i >= 2)) put(u, v, 0, "gravel");
    else put(u, v, 0, h(u, v) % 8 === 0 ? "moss_block" : "grass_block");
  }
  // hedge along the inner side of the coping
  for (let u = U0; u <= U1; u++) for (let v = V0; v <= V1; v++) {
    if (inset(u, v) === 1) put(u, v, 1, h(u, v, 1) % 5 === 0 ? "flowering_azalea_leaves" : "azalea_leaves", LEAF);
  }
  // flower beds in the four quadrants
  const beds = [
    [U0 + 4, uc - 1, V0 + 4, vc - 2], [uc + 1, U1 - 4, V0 + 4, vc - 2],
    [U0 + 4, uc - 1, vc + 3, V1 - 4], [uc + 1, U1 - 4, vc + 3, V1 - 4],
  ];
  for (const [a, b, c, d] of beds) for (let u = a; u <= b; u++) for (let v = c; v <= d; v++) {
    if (h(u, v, 2) % 3 !== 0) put(u, v, 1, FLOWERS[h(u, v, 3) % FLOWERS.length]);
  }
  // two small oak trees in the gap column, one in each half of the garden
  const trees = [Math.floor((V0 + 4 + vc - 2) / 2), Math.floor((vc + 3 + V1 - 4) / 2)];
  for (const vt of trees) {
    for (let dy = 1; dy <= 3; dy++) put(uc, vt, dy, ...B.log("oak", "y"));
    for (let dy = 2; dy <= 5; dy++) for (let du = -2; du <= 2; du++) for (let dv = -2; dv <= 2; dv++) {
      const keep = dy <= 3 ? !(Math.abs(du) === 2 && Math.abs(dv) === 2)
        : dy === 4 ? Math.abs(du) <= 1 && Math.abs(dv) <= 1
          : Math.abs(du) + Math.abs(dv) <= 1;
      const trunk = du === 0 && dv === 0 && dy <= 3;
      if (keep && !trunk) put(uc + du, vt + dv, dy, "oak_leaves", LEAF);
    }
  }
  // fence-post lanterns every 6 along the long sides of the path ring (inset 3)
  for (let u = U0; u <= U1; u++) for (const v of [V0 + 3, V1 - 3]) {
    if (inset(u, v) === 3 && (u - U0) % 6 === 3) {
      put(u, v, 1, ...B.fence("oak"));
      put(u, v, 2, ...B.fence("oak"));
      put(u, v, 3, ...B.lantern(false));
    }
  }
  return done(w);
}

/**
 * A planted ledge: box = [x0, y0, z0, x1, y0+3, z1] with y0 the ledge's deck. grass_block at y0 over the box; a 1-tall
 * persistent azalea hedge at y0+1 on the row one in from the edge the coping runs along (edge: "north" = low z, "south" =
 * high z, "west" = low x, "east" = high x); a lantern post (oak_fence x2, lantern on top) every 6 along that row.
 */
export function ledge_planter(g, [x0, y0, z0, x1, y1, z1], { edge = "north", replace = false } = {}) {
  const w = writer(g, [x0, y0, z0, x1, y1, z1], { replace });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.set(x, y0, z, "grass_block");
  const alongX = edge === "north" || edge === "south";
  const row = edge === "north" ? z0 + 1 : edge === "south" ? z1 - 1 : edge === "west" ? x0 + 1 : x1 - 1;
  const [t0, t1] = alongX ? [x0, x1] : [z0, z1];
  const cell = (t) => (alongX ? [t, row] : [row, t]);
  for (let t = t0; t <= t1; t++) {
    const [x, z] = cell(t);
    if ((t - t0) % 6 === 3) {
      w.set(x, y0 + 1, z, ...B.fence("oak"));
      w.set(x, y0 + 2, z, ...B.fence("oak"));
      w.set(x, y0 + 3, z, ...B.lantern(false));
    } else {
      w.set(x, y0 + 1, z, "azalea_leaves", LEAF);
    }
  }
  return done(w);
}
