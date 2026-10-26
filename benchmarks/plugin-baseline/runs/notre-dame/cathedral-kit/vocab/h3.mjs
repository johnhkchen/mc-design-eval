// Seven plan.md VOCABULARY helpers: lancetOpening, kingNiche, setoffButtress, flyer, octagonRing, glazeOpening, pavePatch.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint, and only into
// air unless { overwrite: true }. Returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for every
// write that was not air (or was out of the grid). Block ids are literals from plan.md's PALETTE.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PANE = "blue_stained_glass_pane";
const PANE_HEAD = "purple_stained_glass_pane";

// Unit vector across a wall whose outward face is `face` (the direction a viewer steps when walking along it).
const acrossOf = (face) => (face === "west" || face === "east" ? DIRS.south : DIRS.east);

// Stairs with no waterlogged key: the tool's states list for these blocks has none.
const stairs = (facing, half) => ["smooth_sandstone_stairs", { facing, half, shape: "straight" }];

function newOut() { return { cells: 0, refused: [] }; }

function put(g, out, [x, y, z], block, state, overwrite) {
  if (!g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) { out.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  out.cells++;
}

function minMax(box) {
  return [[Math.min(box[0], box[3]), Math.min(box[1], box[4]), Math.min(box[2], box[5])],
    [Math.max(box[0], box[3]), Math.max(box[1], box[4]), Math.max(box[2], box[5])]];
}

/**
 * Pointed lancet in a wall. (x, y, z) = the sill's centre cell in the front layer; face = outward direction of the wall;
 * w = width, h = height (sill row included); glass = a stained pane id (the head rows are purple).
 * Front layer: a sill slab, then upside-down smooth_sandstone_stairs (lip out) round the arch, a 1-block reveal.
 * Recessed 1: the glass sits one block behind the front, and the front cells inside the arch stay air.
 */
export function lancetOpening(g, x, y, z, face, w, h, glass = PANE, { overwrite = false } = {}) {
  if (w < 1 || h < 3) throw new Error(`lancetOpening: needs w >= 1 and h >= 3 (got ${w} x ${h})`);
  const out = newOut();
  const into = DIRS[OPPOSITE[face]], across = acrossOf(face);
  const at = (u, v, d) => [x + u * across[0] + d * into[0], y + v, z + u * across[2] + d * into[2]];
  const uMin = -Math.floor((w - 1) / 2), uMax = uMin + w - 1;
  const spring = Math.max(1, h - 1 - Math.floor(w / 2));       // straight rows below, the arch narrows above
  const span = (v) => { const k = Math.max(0, v - spring); return [uMin + k, uMax - k]; };
  const inVoid = (u, v) => { const [lo, hi] = span(v); return v >= 1 && v <= h - 1 && u >= lo && u <= hi; };
  const plus = across[0] === 1 ? "east" : "south", minus = OPPOSITE[plus];

  // Top-half sill: the arch's upside-down stairs sit one row up, so a bottom slab would leave half a block of air under them.
  for (let u = uMin - 1; u <= uMax + 1; u++) put(g, out, at(u, 0, 0), "cut_sandstone_slab", { type: "top" }, overwrite);
  for (let v = 1; v <= h; v++) {
    const [lo, hi] = span(v);
    for (let u = lo - 1; u <= hi + 1; u++) if (!inVoid(u, v)) put(g, out, at(u, v, 0), ...stairs(OPPOSITE[face], "top"), overwrite);
  }
  for (let v = 1; v <= h - 1; v++) {
    const [lo, hi] = span(v);
    for (let u = lo; u <= hi; u++) {
      const state = { north: "false", east: "false", south: "false", west: "false",
        [plus]: String(inVoid(u + 1, v)), [minus]: String(inVoid(u - 1, v)) };
      put(g, out, at(u, v, 1), v >= h - 2 ? PANE_HEAD : glass, state, overwrite);
    }
  }
  return out;
}

/**
 * One statue niche in a Gallery of Kings wall. (x, y, z) = the front cell at the niche's foot; face = outward direction.
 * Recess by omission: the front cells y..y+2 stay air. The king sits one block back: smooth_sandstone body (y, y+1),
 * chiseled_sandstone head (y+2); a cut_sandstone_slab hood at the front, y+3.
 */
export function kingNiche(g, x, y, z, face, { overwrite = false } = {}) {
  const out = newOut();
  const into = DIRS[OPPOSITE[face]];
  const back = (dy) => [x + into[0], y + dy, z + into[2]];
  put(g, out, back(0), "smooth_sandstone", undefined, overwrite);
  put(g, out, back(1), "smooth_sandstone", undefined, overwrite);
  put(g, out, back(2), "chiseled_sandstone", undefined, overwrite);
  put(g, out, [x, y + 3, z], "cut_sandstone_slab", { type: "bottom" }, overwrite);
  return out;
}

/**
 * Buttress block with set-offs. box = [x0, y0, z0, x1, y1, z1] (the base extent); face = the outward direction it
 * projects toward. yList = the set-off heights: at each one the outer layer becomes an upside-down stair course (lip
 * out), and every layer above is one shorter, so the buttress narrows by stairs as it rises.
 */
export function setoffButtress(g, box, face, yList = [], { overwrite = false } = {}) {
  const out = newOut();
  const [lo, hi] = minMax(box);
  const outward = DIRS[face], a = outward[0] !== 0 ? 0 : 2, sgn = outward[a];
  const rank = (p) => (sgn > 0 ? hi[a] - p[a] : p[a] - lo[a]);       // 0 = the outermost layer
  for (let y = lo[1]; y <= hi[1]; y++) {
    const removed = yList.filter((s) => s < y).length, setoff = yList.includes(y);
    for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) {
      const r = rank([x, y, z]);
      if (r < removed) continue;
      if (setoff && r === removed) put(g, out, [x, y, z], ...stairs(OPPOSITE[face], "top"), overwrite);
      else put(g, out, [x, y, z], "smooth_sandstone", undefined, overwrite);
    }
  }
  return out;
}

/**
 * One-block-thick flying buttress arc from `from` (pier top) to `to` (clerestory wall), spanning along `axis` ("x" or "z").
 * Rises from from.y to to.y on a quarter-sine: steep off the pier, level into the wall. Each column is an upside-down
 * stair soffit at yU with an upright stair coping at yU + 1, both facing the wall end. Air below the arc.
 */
export function flyer(g, from, to, axis, { overwrite = false } = {}) {
  if (axis !== "x" && axis !== "z") throw new Error(`flyer: axis must be "x" or "z" (got ${axis})`);
  const ai = axis === "x" ? 0 : 2, pi = axis === "x" ? 2 : 0;
  if (from[pi] !== to[pi]) throw new Error(`flyer: from and to must share ${axis === "x" ? "z" : "x"}`);
  const L = Math.abs(to[ai] - from[ai]);
  if (L < 1) throw new Error("flyer: the span is empty");
  const out = newOut();
  const sgn = Math.sign(to[ai] - from[ai]);
  const toward = axis === "x" ? (sgn > 0 ? "east" : "west") : (sgn > 0 ? "south" : "north");
  const rise = to[1] - from[1];
  for (let s = 0; s <= L; s++) {
    const yU = Math.round(from[1] + rise * Math.sin((Math.PI / 2) * (s / L)));
    const cell = (y) => { const p = [from[0], y, from[2]]; p[ai] = from[ai] + sgn * s; return p; };
    put(g, out, cell(yU), ...stairs(toward, "top"), overwrite);
    put(g, out, cell(yU + 1), ...stairs(toward, "bottom"), overwrite);
  }
  return out;
}

/**
 * One course of an octagon centred on (cx, cz) at height y. w = the x and z extent (odd); cut = the corner cut in cells
 * along each edge. A ring by default (only the outline cells); { fill: true } for a solid course.
 */
export function octagonRing(g, cx, cz, y, w, cut, mat, { fill = false, overwrite = false } = {}) {
  if (w < 1 || w % 2 !== 1) throw new Error(`octagonRing: w must be odd and >= 1 (got ${w})`);
  const out = newOut();
  const h0 = (w - 1) / 2;
  const inside = (dx, dz) => Math.abs(dx) <= h0 && Math.abs(dz) <= h0 && Math.abs(dx) + Math.abs(dz) <= 2 * h0 - cut;
  for (let dx = -h0; dx <= h0; dx++) for (let dz = -h0; dz <= h0; dz++) {
    if (!inside(dx, dz)) continue;
    const edge = !(inside(dx + 1, dz) && inside(dx - 1, dz) && inside(dx, dz + 1) && inside(dx, dz - 1));
    if (fill || edge) put(g, out, [cx + dx, y, cz + dz], mat, undefined, overwrite);
  }
  return out;
}

/**
 * Glazing for an opening: box = [x0, y0, z0, x1, y1, z1] (the opening's air cells), face = outward direction of the wall.
 * Blue panes, with the top headRows rows in purple; each pane joins its neighbours across the wall (never through it).
 */
export function glazeOpening(g, box, face, { glass = PANE, head = PANE_HEAD, headRows = 2, overwrite = false } = {}) {
  const out = newOut();
  const [lo, hi] = minMax(box);
  const across = acrossOf(face);
  const plus = across[0] === 1 ? "east" : "south", minus = OPPOSITE[plus];
  const cells = [];
  for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) cells.push([x, y, z]);
  const glazed = new Set(cells.filter(([x, y, z]) => overwrite || g.isAir(x, y, z)).map((p) => p.join(",")));
  for (const [x, y, z] of cells) {
    const p = [x, y, z];
    const state = { north: "false", east: "false", south: "false", west: "false",
      [plus]: String(glazed.has([x + across[0], y, z + across[2]].join(","))),
      [minus]: String(glazed.has([x - across[0], y, z - across[2]].join(","))) };
    put(g, out, p, y >= hi[1] - headRows + 1 ? head : glass, state, overwrite);
  }
  return out;
}

/**
 * Paving over air in a box: smooth_stone with polished_andesite flags, one flag in three, on a 2x2 grid. Never writes
 * into ground (only air cells are paved).
 */
export function pavePatch(g, box, { overwrite = false } = {}) {
  const out = newOut();
  const [lo, hi] = minMax(box);
  for (let y = lo[1]; y <= hi[1]; y++) for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) {
    const flag = (((Math.floor(x / 2) + Math.floor(z / 2)) % 3) + 3) % 3;
    put(g, out, [x, y, z], flag === 0 ? "polished_andesite" : "smooth_stone", undefined, overwrite);
  }
  return out;
}
