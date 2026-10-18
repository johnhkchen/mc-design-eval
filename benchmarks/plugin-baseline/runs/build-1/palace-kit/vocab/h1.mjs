// Palace of Fine Arts: plan.md VOCABULARY helpers, part 1 (octRing, archivolt, peristyleCol, reliefPanel, domeShell,
// medallion, weepingFigure, blindArch, lampStandard). Each takes its position (and face or armDir where it has one)
// as arguments. A helper writes only its own footprint, and only into air: a cell an earlier part already filled is
// refused and counted, unless opts.over names the block ids it may replace (the medallion over the paving).
// Centres are cell-index centres as plan.md uses them: the rotunda is [31.5, 31.5], so a cell at x has dx = x - 31.5.
// Every helper returns { placed, refused }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SQ = Math.SQRT1_2;
const DIAGONAL = new Set(["ne", "nw", "se", "sw"]);

// Outward normal and tangent (the t of plan.md) for each face of the rotunda's octagon.
const NORMAL = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [SQ, -SQ], nw: [-SQ, -SQ], se: [SQ, SQ], sw: [-SQ, SQ] };
const TANGENT = { n: [1, 0], s: [1, 0], e: [0, 1], w: [0, 1], ne: [SQ, SQ], sw: [SQ, SQ], nw: [SQ, -SQ], se: [SQ, -SQ] };

const faceVecs = (face) => {
  if (!NORMAL[face]) throw new Error(`face ${face} is not n|s|e|w|ne|nw|se|sw`);
  return [NORMAL[face], TANGENT[face]];
};
// Distance from the centre to the face: the flat for N/S/E/W, the corner line (D / sqrt 2) for the diagonals.
const planeOf = (face, s) => (DIAGONAL.has(face) ? Math.round(s * Math.SQRT2) * SQ : s);
// Octagon of flat half-width s: |dx|, |dz| <= s and |dx| + |dz| <= round(s * sqrt 2) (plan: 27 -> 38, 21 -> 30).
const inOct = (dx, dz, s) => Math.abs(dx) <= s && Math.abs(dz) <= s && Math.abs(dx) + Math.abs(dz) <= Math.round(s * Math.SQRT2);
// Inclusive box of the cells within r of the centre c on x and z.
const boxOf = ([cx, cz], r, y0, y1) => [Math.ceil(cx - r), y0, Math.ceil(cz - r), Math.floor(cx + r), y1, Math.floor(cz + r)];

// One footprint's writer: air only (or the opts.over ids), inside the box; counts what it placed and refused.
function writer(g, box, over = []) {
  const allowed = new Set(over.map((id) => (id.includes(":") ? id : `minecraft:${id}`)));
  const out = { placed: 0, refused: 0 };
  const put = (x, y, z, block) => {
    const [x0, y0, z0, x1, y1, z1] = box;
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (!inside || !g.inBounds(x, y, z) || !(g.isAir(x, y, z) || allowed.has(g.blockAt(x, y, z)))) { out.refused++; return; }
    const [id, state, nbt] = Array.isArray(block) ? block : [block];
    g.set(x, y, z, id, state, nbt);
    out.placed++;
  };
  return { put, out };
}

/**
 * Octagonal ring (rotunda arch ring and piers): cells inside the outer octagon (flat rOut) and outside the inner one
 * (flat rIn), y0..y1. Arch openings and archivolt cells are left for their own parts through opts.skip(x, y, z) -> true.
 */
export function octRing(g, [cx, cz], rIn, rOut, y0, y1, block, opts = {}) {
  const box = boxOf([cx, cz], rOut, y0, y1);
  const w = writer(g, box, opts.over);
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dz = z - cz;
    if (!inOct(dx, dz, rOut) || inOct(dx, dz, rIn)) continue;
    for (let y = y0; y <= y1; y++) if (!opts.skip?.(x, y, z)) w.put(x, y, z, block);
  }
  return w.out;
}

// Arch cell rule (plan.md FACADES, arch row) in face coordinates: t across the face, y up. Keystone at the crown,
// the 1-thick ring on the springline arc, jambs below the springline, and for the inner side the 2-wide pilasters.
const KEYSTONE = "chiseled_sandstone", CUT = "cut_sandstone";
function archBlock(t, y, side) {
  const a = Math.abs(t), r = Math.hypot(t, y - 19);
  if (y === 26 && a < 1) return KEYSTONE;
  if (y >= 19 && r > 6.5 && r <= 7.5) return CUT;
  if (y >= 3 && y <= 19 && a > 6 && a <= 7) return CUT;
  if (side === "in" && a > 7 && a <= 9) return y >= 28 ? KEYSTONE : CUT;
  return null;
}

/**
 * Giant arch on one rotunda face: archivolt ring, keystone and jambs (side "out") or the inner ring and pilasters
 * (side "in"). s is the octagon flat it stands on (27 outer ring, 21 inner). The ring sits one layer proud of the face
 * for "out" and one layer inside it for "in", so the ring part keeps its face line exact.
 */
export function archivolt(g, [cx, cz], face, side, s, opts = {}) {
  const [[nx, nz], [tx, tz]] = faceVecs(face);
  if (side !== "out" && side !== "in") throw new Error(`archivolt side ${side} is not out|in`);
  const plane = planeOf(face, s);
  const r = s + 2;
  const box = [Math.ceil(cx - r), 1, Math.ceil(cz - r), Math.floor(cx + r), 29, Math.floor(cz + r)];
  const w = writer(g, box, opts.over);
  const inLayer = (n) => (side === "out" ? n > plane && n <= plane + 1 : n > plane - 1 && n <= plane);
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dz = z - cz, n = dx * nx + dz * nz, t = dx * tx + dz * tz;
    if (!inLayer(n) || Math.abs(t) > 9) continue;
    for (let y = 1; y <= 29; y++) {
      const block = archBlock(t, y, side);
      if (block) w.put(x, y, z, block);
    }
  }
  return w.out;
}

/**
 * Peristyle column (plots 1 and 2): 4x4 pedestal y1..2 (sandstone, smooth_sandstone), 2x2 white_terracotta shaft y3..18
 * with its origin at (x, z), 4x4 chiseled capital y19, 4x4 smooth_sandstone abacus y20. Two of these share one plinth.
 */
export function peristyleCol(g, x, z, opts = {}) {
  const w = writer(g, [x - 1, 1, z - 1, x + 2, 20, z + 2], opts.over);
  for (let i = x - 1; i <= x + 2; i++) for (let k = z - 1; k <= z + 2; k++) {
    w.put(i, 1, k, "sandstone");
    w.put(i, 2, k, "smooth_sandstone");
    w.put(i, 19, k, "chiseled_sandstone");
    w.put(i, 20, k, "smooth_sandstone");
  }
  for (let y = 3; y <= 18; y++) for (let i = x; i <= x + 1; i++) for (let k = z; k <= z + 1; k++) w.put(i, y, k, "white_terracotta");
  return w.out;
}

/**
 * Attic relief panel on one face (plan.md ROOFS/FACADES attic row): a sunken panel |t| <= 7, y 36..42, one layer deep
 * in the attic's outer surface (flat s, 25); back of the recess alternates chiseled and cut columns; a cut_sandstone
 * frame 1 wide; three 1x3 white_terracotta figures at t = -4, 0, 4, y 37..39, in the recess layer.
 */
export function reliefPanel(g, [cx, cz], face, s = 25, opts = {}) {
  const [[nx, nz], [tx, tz]] = faceVecs(face);
  const plane = planeOf(face, s);
  const box = [Math.ceil(cx - s - 1), 35, Math.ceil(cz - s - 1), Math.floor(cx + s + 1), 43, Math.floor(cz + s + 1)];
  const w = writer(g, box, opts.over);
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dz = z - cz, n = dx * nx + dz * nz, t = dx * tx + dz * tz, a = Math.abs(t);
    if (a > 8) continue;
    if (n > plane - 1 && n <= plane) {                       // outer layer: frame; the panel itself stays air
      for (let y = 35; y <= 43; y++) if (y === 35 || y === 43 || a > 7) w.put(x, y, z, "cut_sandstone");
    } else if (n > plane - 2 && n <= plane - 1 && a <= 7) {  // back of the recess: alternating columns
      const col = Math.abs(Math.floor(t)) % 2 === 0 ? "chiseled_sandstone" : "cut_sandstone";
      for (let y = 36; y <= 42; y++) w.put(x, y, z, col);
    }
  }
  // Figures: point features, so each takes the cell that holds its t (floor of centre + t).
  const nFig = plane - 0.5;
  for (const k of [-4, 0, 4]) {
    const x = Math.floor(cx + k * tx + nFig * nx), z = Math.floor(cz + k * tz + nFig * nz);
    for (let y = 37; y <= 39; y++) w.put(x, y, z, "white_terracotta");
  }
  return w.out;
}

/**
 * Dome shell over the attic (plan.md DOME): spheroid on base y, rx = rz = 23.5, ry = 22. Outer layer (normalised
 * radius 0.957..1.0) terracotta, middle layer brown_terracotta (coffer backs; the coffers helper owns the inner layer).
 * Also the Pantheon step rings at base and base+1, the crown disc (terracotta, our choice: plan gives no block), and
 * 8 polished_granite ribs one layer outside the shell at azimuths 0, 45 ... 315, y base+2..base+20.
 */
export function domeShell(g, [cx, cz], opts = {}) {
  const { base = 46, rx = 23.5, ry = 22 } = opts;
  const top = base + ry;
  const box = [Math.ceil(cx - 25), base, Math.ceil(cz - 25), Math.floor(cx + 25), top, Math.floor(cz + 25)];
  const w = writer(g, box, opts.over);
  const azimuths = Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4);
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz);
    if (r > 23.5 && r <= 25) w.put(x, base, z, "cut_sandstone");
    if (r > 23.5 && r <= 24.5) w.put(x, base + 1, z, "smooth_sandstone");
    if (r <= 3) w.put(x, top, z, "terracotta");
    for (let y = base; y <= top; y++) {
      const rho = Math.hypot(dx / rx, (y - base) / ry, dz / rx);
      if (rho > 0.957 && rho <= 1) w.put(x, y, z, "terracotta");
      else if (rho > 0.914 && rho <= 0.957) w.put(x, y, z, "brown_terracotta");
      else if (rho > 1 && rho <= 1 + 1 / rx && y >= base + 2 && y <= base + 20) {
        const rib = azimuths.some((a) => {
          const along = dx * Math.cos(a) + dz * Math.sin(a), across = -dx * Math.sin(a) + dz * Math.cos(a);
          return along > 0 && Math.abs(across) <= 0.75;
        });
        if (rib) w.put(x, y, z, "polished_granite");
      }
    }
  }
  return w.out;
}

/**
 * Floor medallion flush in the ground layer (y, default 0), centre [cx, cz]: a 4x4 chiseled_sandstone centre with
 * glowstone at its middle 2x2; a polished_granite ring 8 < r <= 9 with 8 glowstone at the axes and diagonals; the
 * rest of r <= 9 smooth_stone. It replaces paving only when called with opts.over: ["smooth_stone"].
 */
export function medallion(g, [cx, cz], opts = {}) {
  const y = opts.y ?? 0;
  const box = boxOf([cx, cz], 9, y, y);
  const w = writer(g, box, opts.over ?? []);
  const ring = [];
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const r = Math.hypot(x - cx, z - cz);
    if (r > 8 && r <= 9) ring.push([x, z, Math.atan2(z - cz, x - cx)]);
  }
  // Each of the 8 axis and diagonal glowstones takes the ring cell nearest its azimuth.
  const glow = new Set();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    let best = null;
    for (const [x, z, p] of ring) {
      const d = Math.abs(Math.atan2(Math.sin(p - a), Math.cos(p - a)));
      if (!best || d < best.d) best = { x, z, d };
    }
    if (best) glow.add(`${best.x},${best.z}`);
  }
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz);
    if (r > 9) continue;
    if (Math.max(Math.abs(dx), Math.abs(dz)) <= 0.5) w.put(x, y, z, "glowstone");
    else if (Math.max(Math.abs(dx), Math.abs(dz)) <= 1.5) w.put(x, y, z, "chiseled_sandstone");
    else if (r > 8) w.put(x, y, z, glow.has(`${x},${z}`) ? "glowstone" : "polished_granite");
    else w.put(x, y, z, "smooth_stone");
  }
  return w.out;
}

// Direction from the figure to its box corner, as the arm reaches toward it.
const ARM = { ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1] };

/**
 * Weeping figure at a box corner (plan.md Plot 1): cut_sandstone pedestal y25..26, white_terracotta drapery y27..29,
 * calcite head y30, and a sandstone_wall arm at y29 in the diagonal armDir (ne|nw|se|sw: toward the box corner).
 */
export function weepingFigure(g, x, z, armDir, opts = {}) {
  const arm = ARM[armDir];
  if (!arm) throw new Error(`weepingFigure armDir ${armDir} is not ne|nw|se|sw`);
  const w = writer(g, [x - 1, 25, z - 1, x + 1, 30, z + 1], opts.over);
  w.put(x, 25, z, "cut_sandstone");
  w.put(x, 26, z, "cut_sandstone");
  for (let y = 27; y <= 29; y++) w.put(x, y, z, "white_terracotta");
  w.put(x, 30, z, "calcite");
  w.put(x + arm[0], 29, z + arm[1], [...B.wall("sandstone")]);
  return w.out;
}

/**
 * Exhibition-hall blind arch on the front wall plane zFace, centred on xc (plan.md Hall): the archivolt ring
 * 4.5 < r <= 5.5 above the springline y12, jambs at xc +- 4.5 for y 3..12, and the chiseled keystone at y17 over
 * xc +- 0.5. The recess itself (x xc+-4, z zFace..zFace+1) is carved by not placing, so this helper leaves it alone.
 */
export function blindArch(g, xc, zFace, opts = {}) {
  const box = [Math.ceil(xc - 5.5), 3, zFace, Math.floor(xc + 5.5), 17, zFace];
  const w = writer(g, box, opts.over);
  for (let x = box[0]; x <= box[3]; x++) for (let y = 3; y <= 17; y++) {
    const dx = x - xc;
    if (y === 17 && Math.abs(dx) <= 0.5) { w.put(x, y, zFace, "chiseled_sandstone"); continue; }
    if (y >= 12 && Math.hypot(dx, y - 12) > 4.5 && Math.hypot(dx, y - 12) <= 5.5) w.put(x, y, zFace, "cut_sandstone");
    else if (y <= 12 && Math.abs(dx) === 4.5) w.put(x, y, zFace, "cut_sandstone");
  }
  return w.out;
}

/** Corner lamp standard (plan.md PARTS 6): chiseled_sandstone pedestal y1, sandstone_wall posts y2..3, lantern y4. */
export function lampStandard(g, x, z, opts = {}) {
  const w = writer(g, [x, 1, z, x, 4, z], opts.over);
  w.put(x, 1, z, "chiseled_sandstone");
  w.put(x, 2, z, [...B.wall("sandstone")]);
  w.put(x, 3, z, [...B.wall("sandstone")]);
  w.put(x, 4, z, ["lantern", { hanging: "false" }]);
  return w.out;
}
