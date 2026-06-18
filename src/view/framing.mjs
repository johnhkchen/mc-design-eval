// THE FRAMING AXIS — the wider eyes (T-196-01, story S-196, epic E-51). A deterministic, picture-anchored
// reading of two things the department-bound DiagnoseBuild critique is structurally BLIND to:
//   (1) ROOF ORIENTATION vs the declared front  — does the gable END face the declared gate/entry?
//   (2) SCALE / PROPORTION vs the recognized intent — do the build's massing RATIOS match, judged on
//       PROPORTION not absolute size (a uniform up-scale is a framing/zoom caveat, NOT a divergence).
//
// WHY a separate axis, not a CritiqueItem: the S-163 decision (recorded in five places) holds that
// proportion/massing is a SEPARATE AXIS, not a department — no registry idiom resizes or rotates a mass, so
// the five-department partition (DPT/DPT3 pins) would break, and the byte-pinned DiagnoseBuild golden
// fixtures (FX-DB1) would re-bake. This module is that sanctioned schema-v2 axis, realized as CODE: a pure,
// deterministic check, so "flags-when-wrong / quiet-when-right" is unit-testable and never a VLM
// thumbnail-vs-zoom false positive. It is REPORTED (the climb's eyes + the named residual → E-49), never
// folded into the frozen scalar (the instrument stays untouched).
//
// Anchoring (design.md): orientation reads the build's ACTUAL ridge from occupancy (a generated roof can
// drift from its declared axis — that drift IS the 90° defect) vs the declared front; scale reads the
// build's ACTUAL ratios vs the recognized program's declared ratios (the concept, as read). Ratio
// definitions mirror silhouetteRatios (measured-program.mjs) — the E-33/E-34 proportion vocabulary.
//
// INSUFFICIENT EVIDENCE → SKIP (quiet), NEVER flag — the structural guarantee against false positives.
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

const fail = (msg) => { throw new Error(`framing: ${msg}`); };

// Tunables. SCALE_TOL is a relative proportion drift (20%) — calibrated so the real gatehouse build is quiet
// and a proportion distortion flags (the real numbers are recorded in the work dir's progress.md). RIDGE_TOP_
// LAYERS reads the ridge LINE. RIDGE_LINE_FRAC is the gate against a BLOB: a true gable ridge is a LINE (its
// short perp extent ≪ its long ridge extent), so the axis is read only when the shorter top-extent is ≤
// RIDGE_LINE_FRAC of the longer; a near-square top (a GLB-voxelized blob with no clean ridge) fails this and
// SKIPS — the structural guard against fabricating a ridge on noisy occupancy. EAVE_FULL is the perp-extent
// fraction that still counts as full-width wall (below the roof taper).
export const SCALE_TOL = 0.2;
export const RIDGE_TOP_LAYERS = 2;
export const RIDGE_LINE_FRAC = 0.5;
export const EAVE_FULL = 0.9;

const EPS = 1e-9;
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const relDelta = (build, target) => Math.abs(build - target) / Math.max(Math.abs(target), EPS);
const axisOfWall = (wall) => (wall === "-x" || wall === "+x" ? "x" : wall === "-z" || wall === "+z" ? "z" : null);

/**
 * The declared FRONT — the wall the gate/entry faces. Prefer a `kind:"door"` opening (the entry); else the
 * widest opening on any mass. Returns `{axis:"x"|"z", side, source}` or `null` when no entry is declared (→
 * orientation is SKIPPED, never flagged — a frontless subject yields no false positive).
 * @param {{masses?:Array<{openings?:Array<object>}>}} program a recognition building-program/v1
 */
export function frontAxisOf(program) {
  const openings = (program?.masses ?? []).flatMap((m) => m?.openings ?? []);
  if (openings.length === 0) return null;
  const door = openings.find((o) => o?.kind === "door" && axisOfWall(o?.wall));
  const pick = door ?? [...openings].filter((o) => axisOfWall(o?.wall)).sort((a, b) => (b?.w ?? 0) - (a?.w ?? 0))[0];
  if (!pick) return null;
  const axis = axisOfWall(pick.wall);
  return axis ? { axis, side: pick.wall, source: pick.kind ?? "opening" } : null;
}

/** Inclusive integer footprint/height from occupancy bounds. `null` when the occupancy is empty. */
function bbox(occ) {
  if (!occ?.bounds) return null;
  const { min, max } = occ.bounds;
  return { x0: min[0], x1: max[0], y0: min[1], y1: max[1], z0: min[2], z1: max[2],
    w: max[0] - min[0] + 1, d: max[2] - min[2] + 1, h: max[1] - min[1] + 1 };
}

/**
 * The build's ACTUAL roof ridge axis, read from occupancy (NOT program.ridgeAxis — the generated roof's drift
 * from its declared axis is exactly the defect this catches). The topmost RIDGE_TOP_LAYERS form a ridge LINE;
 * its longer horizontal extent is the ridge. Returns `"x"|"z"`, or `null` when the two extents tie within
 * RIDGE_TIE (a flat/pyramidal top is ambiguous → SKIP, never a false flag).
 */
export function buildRidgeAxis(occ) {
  const box = bbox(occ);
  if (!box) return null;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, any = false;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (y < box.y1 - (RIDGE_TOP_LAYERS - 1)) continue;
    any = true;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  if (!any) return null;
  const xExt = x1 - x0, zExt = z1 - z0;
  const long = Math.max(xExt, zExt), short = Math.min(xExt, zExt);
  if (long <= 0 || short > RIDGE_LINE_FRAC * long) return null; // near-square / blob top → no clean ridge → SKIP
  return xExt > zExt ? "x" : "z";
}

/**
 * ORIENTATION framing: does the build's gable END face the declared front? `flagged` only when both the front
 * AND a clear build ridge are known and they disagree (the 90° error). Quiet on any insufficient evidence.
 */
export function orientationFraming(program, occ) {
  const front = frontAxisOf(program);
  const ridgeAxis = buildRidgeAxis(occ);
  const frontAxis = front?.axis ?? null;
  const known = Boolean(frontAxis && ridgeAxis);
  const gableFacesFront = known ? frontAxis === ridgeAxis : null;
  const flagged = known && !gableFacesFront;
  return {
    axis: ridgeAxis, frontAxis, frontSide: front?.side ?? null, gableFacesFront, flagged,
    severity: flagged ? "major" : null,
    note: !known
      ? `orientation SKIPPED (front=${frontAxis ?? "?"}, ridge=${ridgeAxis ?? "?"} — insufficient evidence)`
      : flagged
        ? `gable runs ${ridgeAxis} but the declared gate is on the ${front.side} wall — roof is rotated 90° from the front`
        : `gable faces the declared ${front.side} front`,
  };
}

/** The highest y at which the perp-to-ridge occupied extent is still ≥ EAVE_FULL of its max (the eave; above
 *  it the roof tapers). `null` when the section never tapers (no detectable roof). */
function eaveYOf(occ, ridgeAxis) {
  const box = bbox(occ);
  if (!box) return null;
  const perpOf = ridgeAxis === "x" ? 2 : 0; // perp to an x ridge is z, and vice-versa
  const lo = [box.x0, box.y0, box.z0][perpOf], hi = [box.x1, box.y1, box.z1][perpOf];
  const maxPerp = hi - lo + 1;
  const extentAt = new Map(); // y -> [min,max] perp coord
  for (const key of occ.cells.keys()) {
    const c = key.split(",").map(Number);
    const y = c[1], p = c[perpOf];
    const e = extentAt.get(y) ?? [Infinity, -Infinity];
    if (p < e[0]) e[0] = p; if (p > e[1]) e[1] = p;
    extentAt.set(y, e);
  }
  let eaveY = null;
  for (let y = box.y0; y <= box.y1; y++) {
    const e = extentAt.get(y);
    if (!e) continue;
    if (e[1] - e[0] + 1 >= EAVE_FULL * maxPerp) eaveY = y;
  }
  return eaveY === box.y1 ? null : eaveY; // full width all the way up = no roof taper detected
}

/** Build massing ratios from occupancy — the same definitions as silhouetteRatios (measured-program.mjs). */
export function proportionRatios(occ) {
  const box = bbox(occ);
  if (!box) return null;
  const aspect = r4(Math.max(box.w, box.d) / Math.max(Math.min(box.w, box.d), EPS));
  const ridgeAxis = buildRidgeAxis(occ);
  const eaveY = ridgeAxis ? eaveYOf(occ, ridgeAxis) : null;
  if (eaveY === null) return { aspect, ridgeToEave: null, roofShare: null };
  const eave = eaveY - box.y0 + 1, total = box.y1 - box.y0 + 1;
  return { aspect, ridgeToEave: r4(total / eave), roofShare: r4((total - eave) / total) };
}

/** The recognized intent's target ratios from the program's declared geometry (rect + storeys + pitch). */
export function targetRatiosOf(program) {
  const m = program?.masses?.[0];
  const rect = m?.rect, roof = m?.roof;
  if (!rect || !Number.isFinite(rect.w) || !Number.isFinite(rect.d)) return null;
  const aspect = r4(Math.max(rect.w, rect.d) / Math.max(Math.min(rect.w, rect.d), EPS));
  const eave = (m?.storeys ?? 0) * (m?.storeyHeight ?? 0);
  if (!Number.isFinite(eave) || eave <= 0 || !roof?.ridgeAxis) return { aspect, ridgeToEave: null, roofShare: null };
  const perp = roof.ridgeAxis === "x" ? rect.d : rect.w;
  const pitch = Number.isFinite(roof.pitchClass) ? roof.pitchClass : 1;
  const rise = Math.floor(perp / 2) * pitch;
  const total = eave + rise;
  return { aspect, ridgeToEave: r4(total / eave), roofShare: r4(rise / total) };
}

/**
 * SCALE framing: build ratios vs the recognized target, judged on PROPORTION. `flagged` when either NAMED
 * E-33 ratio (aspect, ridgeToEave) drifts past `tol`; `roofShare` is reported as evidence. A uniform up-scale
 * leaves all ratios identical → deltas 0 → quiet (the proportion-not-pixels guarantee). Quiet when the target
 * or the build's eave is unknown (insufficient evidence).
 */
export function scaleFraming(program, occ, { tol = SCALE_TOL } = {}) {
  const build = proportionRatios(occ);
  const target = targetRatiosOf(program);
  if (!build || !target) return { build, target, deltas: null, flagged: false, severity: null, note: "scale SKIPPED (no ratios)" };
  const named = ["aspect", "ridgeToEave"];
  const deltas = {};
  for (const k of ["aspect", "ridgeToEave", "roofShare"]) {
    deltas[k] = build[k] !== null && target[k] !== null ? r4(relDelta(build[k], target[k])) : null;
  }
  const tripped = named.filter((k) => deltas[k] !== null && deltas[k] > tol);
  const flagged = tripped.length > 0;
  return {
    build, target, deltas, flagged, severity: flagged ? "major" : null,
    note: flagged
      ? `proportion drift > ${tol}: ${tripped.map((k) => `${k} ${build[k]} vs ${target[k]}`).join("; ")}`
      : `proportions within ${tol} of the recognized intent (uniform size is framing, not a divergence)`,
  };
}

/**
 * The framing bundle the climb attaches to a scored build: `orientation` + `scale` checks, a short `flags`
 * list for the agent prompt's eyes, and a `residual` list (the named fourth gap → E-49). Pure; deterministic
 * in its inputs. No fix is proposed (no hand rotates a roof or resizes a mass — that is downstream).
 */
export function framingReport(program, occ, opts = {}) {
  if (!program || typeof program !== "object") fail("program is required");
  if (!occ?.cells) fail("occ (an Occupancy) is required");
  const orientation = orientationFraming(program, occ);
  const scale = scaleFraming(program, occ, opts);
  const flags = [];
  const residual = [];
  if (orientation.flagged) { flags.push(`ORIENTATION: ${orientation.note}`); residual.push({ axis: "orientation", note: orientation.note, severity: orientation.severity }); }
  if (scale.flagged) { flags.push(`SCALE: ${scale.note}`); residual.push({ axis: "scale", note: scale.note, severity: scale.severity }); }
  return { orientation, scale, flags, residual };
}
