// Region addressing + the per-region lock over a DesignArtifact (T-044-01, story S-044, epic E-15).
//
// THE SPATIAL GENERALIZATION OF E-11's FIELD-LOCK. E-11 locked a build-state per FIELD
// (build-state.mjs: writing a LOCKED field throws). This module locks the compiled DesignArtifact per
// REGION: select a sub-region R, freeze every placement outside R, and permit only bounded edits whose
// cells stay inside R. Moved up from the facade build-state to the artifact level so the surgical
// revision loop (S-045+) reaches the 3-D sculptures and so a future GLB form-target plugs in here.
//
// Two primitives, NO control flow (the loop, the accept-gate, the diagnosis are S-045+):
//   1. selectRegion(artifact, spec) -> R          region addressing (bbox | named part | `where`)
//   2. applyRegionEdit(artifact, R, edit)         the region-lock (out-of-R immutable, in-R bound-checked)
//   3. observeRegion(artifact, R)                 a tight crop render via framedCamera(subBoundsOf(R))
//
// BOUNDARIES: the PURE core (addressing + lock) imports ONLY ../expand.mjs (integer geometry) — NO GL,
// NO schema, NO SDK, NO render. The one live leaf `observeRegion` LAZY-imports the render stack (the
// E-11 review-seam idiom), so importing this module for the pure tests loads no GL. The edited artifact
// is NOT validated here; callers run it through src/artifact.mjs (the AJV gate), as the compile spine does.

import { expandPlacement } from "../expand.mjs";

/** Schema tag stamped on a region R so downstream (the S-045 loop) can version-check it. */
export const REGION_SCHEMA = "region/v1";

/** Default slab thickness (a fraction of an axis extent) for a named part / `where` region. */
export const DEFAULT_FRACTION = 0.5;

/** The geometric direction vocabulary (NOT anatomy — see resolveNamedRegion). Frozen, for docs/validation. */
export const PART_NAMES = Object.freeze([
  "top", "bottom", "upper", "lower", "left", "right", "front", "back", "core", "center", "middle",
]);

/**
 * Free-text `where` keyword → geometric part. Geometric, deterministic, documented: `front`/`back` are the
 * MAJOR horizontal axis's high/low ends by convention (NOT an anatomical claim — orientation is not
 * recoverable from the artifact). A `where` with no keyword falls back to the whole build (a safe no-op).
 */
const WHERE_SYNONYMS = Object.freeze({
  top: "top", above: "top", upper: "top", crown: "top", roof: "top",
  bottom: "bottom", below: "bottom", base: "bottom", lower: "bottom", foot: "bottom", floor: "bottom",
  left: "left", right: "right",
  front: "front", face: "front", nose: "front", forward: "front",
  back: "back", rear: "back", behind: "back", tail: "back",
  middle: "middle", center: "core", centre: "core", core: "core", central: "core",
});

// --- bounds helpers (pure integer geometry) --------------------------------

/**
 * A single placement's integer bounding box. voxel: `pos..pos`; line/box/fill: the normalized
 * `from..to` corners (the schema does not require from <= to).
 * @param {object} p a schema-valid placement
 * @returns {{min:number[], max:number[]}}
 */
export function placementBounds(p) {
  if (p.op === "voxel") return { min: [...p.pos], max: [...p.pos] };
  const f = p.from, t = p.to;
  return {
    min: [Math.min(f[0], t[0]), Math.min(f[1], t[1]), Math.min(f[2], t[2])],
    max: [Math.max(f[0], t[0]), Math.max(f[1], t[1]), Math.max(f[2], t[2])],
  };
}

/**
 * The artifact's overall integer extent (union of every placement's bounds). Throws if there are no
 * placements (a region has no frame without a build).
 * @param {{placements:object[]}} artifact
 * @returns {{min:number[], max:number[]}}
 */
export function artifactBounds(artifact) {
  const ps = artifact?.placements || [];
  if (ps.length === 0) throw new Error("artifactBounds: artifact has no placements");
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of ps) {
    const b = placementBounds(p);
    for (let a = 0; a < 3; a++) {
      if (b.min[a] < min[a]) min[a] = b.min[a];
      if (b.max[a] > max[a]) max[a] = b.max[a];
    }
  }
  return { min, max };
}

/** Whether `coord` lies within `bounds` (inclusive). */
export function coordInBounds(coord, bounds) {
  for (let a = 0; a < 3; a++) {
    if (coord[a] < bounds.min[a] || coord[a] > bounds.max[a]) return false;
  }
  return true;
}

/** Whether `inner` ⊆ `outer` (inclusive, all axes). */
export function boundsContain(outer, inner) {
  for (let a = 0; a < 3; a++) {
    if (inner.min[a] < outer.min[a] || inner.max[a] > outer.max[a]) return false;
  }
  return true;
}

/** Coerce a (possibly non-integer) bbox to integers — floor the min, ceil the max (never shrink a request). */
function toIntBounds(b) {
  return {
    min: [Math.floor(b.min[0]), Math.floor(b.min[1]), Math.floor(b.min[2])],
    max: [Math.ceil(b.max[0]), Math.ceil(b.max[1]), Math.ceil(b.max[2])],
  };
}

/** Intersect `inner` into `outer` (integer, clamped so min<=max). */
export function clampBounds(inner, outer) {
  const min = [], max = [];
  for (let a = 0; a < 3; a++) {
    let lo = Math.max(inner.min[a], outer.min[a]);
    let hi = Math.min(inner.max[a], outer.max[a]);
    // If the request misses the build on this axis, collapse to the nearest in-build cell.
    if (lo > hi) { lo = hi = Math.min(Math.max(lo, outer.min[a]), outer.max[a]); }
    min.push(lo); max.push(hi);
  }
  return { min, max };
}

/** Bounding box of several bounds (the union). */
function unionBounds(list) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const b of list) {
    for (let a = 0; a < 3; a++) {
      if (b.min[a] < min[a]) min[a] = b.min[a];
      if (b.max[a] > max[a]) max[a] = b.max[a];
    }
  }
  return { min, max };
}

/** The integer sub-bounds R frames on (the value framedCamera consumes). */
export function subBoundsOf(R) {
  return R.subBounds;
}

// --- region resolution -----------------------------------------------------

/**
 * Slab [lo,hi] of `fraction` of an inclusive integer axis [min,max], at `side` ∈ low|high|center.
 * `cells = ceil(fraction · extent)` (≥1), so a 50% slab of a 10-cell axis is 5 cells at the named end.
 */
function axisSlab(min, max, fraction, side) {
  const extent = max - min + 1;
  const cells = Math.max(1, Math.min(extent, Math.ceil(fraction * extent)));
  if (side === "low") return [min, min + cells - 1];
  if (side === "high") return [max - cells + 1, max];
  const start = min + Math.floor((extent - cells) / 2); // center
  return [start, start + cells - 1];
}

/**
 * Resolve a GEOMETRIC part name to a sub-box of `bounds`. These are directions, not anatomy:
 * top/bottom = the y high/low slab; left/right = the MINOR horizontal axis ends; front/back = the
 * MAJOR horizontal axis high/low ends (a stated convention); core/center = the central cube on all
 * axes; middle = the central slab on the major axis. Throws on an unknown name.
 * @param {{min:number[],max:number[]}} bounds
 * @param {string} name
 * @param {number} [fraction]
 * @returns {{min:number[],max:number[]}}
 */
export function resolveNamedRegion(bounds, name, fraction = DEFAULT_FRACTION) {
  const { min, max } = bounds;
  const out = { min: [...min], max: [...max] };
  const major = (max[0] - min[0]) >= (max[2] - min[2]) ? 0 : 2; // longer horizontal axis
  const minor = major === 0 ? 2 : 0;
  const setAxis = (ax, side) => {
    const [lo, hi] = axisSlab(min[ax], max[ax], fraction, side);
    out.min[ax] = lo; out.max[ax] = hi;
  };
  switch (name) {
    case "top": case "upper": setAxis(1, "high"); break;
    case "bottom": case "lower": setAxis(1, "low"); break;
    case "right": setAxis(minor, "high"); break;
    case "left": setAxis(minor, "low"); break;
    case "front": setAxis(major, "high"); break;
    case "back": setAxis(major, "low"); break;
    case "middle": setAxis(major, "center"); break;
    case "core": case "center": setAxis(0, "center"); setAxis(1, "center"); setAxis(2, "center"); break;
    default: throw new Error(`resolveNamedRegion: unknown part "${name}" — expected one of ${PART_NAMES.join(", ")}`);
  }
  return out;
}

/**
 * Resolve a critic `where` free-text string to a sub-box. Keyword-scans for the geometric vocabulary
 * (+ documented synonyms); the result is the UNION of the matched slabs. No keyword (or empty) → the
 * WHOLE build (a safe no-op crop) — an unparseable `where` never throws and never picks a wrong corner.
 * @param {{min:number[],max:number[]}} bounds
 * @param {string} where
 * @param {number} [fraction]
 * @returns {{min:number[],max:number[]}}
 */
export function resolveWhereRegion(bounds, where, fraction = DEFAULT_FRACTION) {
  const tokens = String(where || "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const parts = [];
  for (const tok of tokens) {
    const part = WHERE_SYNONYMS[tok];
    if (part && !parts.includes(part)) parts.push(part);
  }
  if (parts.length === 0) return { min: [...bounds.min], max: [...bounds.max] };
  return unionBounds(parts.map((p) => resolveNamedRegion(bounds, p, fraction)));
}

/**
 * Select a sub-region R of an artifact. `spec` is one of:
 *   - a string                → treated as a critic `where`
 *   - `{min,max}`             → an explicit integer bbox (clamped to the build)
 *   - `{bbox:{min,max}}`      → same, namespaced
 *   - `{part:name}`           → a geometric named part
 *   - `{where:str}`           → a critic `where` string
 * R = `{schema, spec, subBounds, placements, indices, fraction}` (frozen). `placements` is the
 * in-region set (every placement whose bbox is FULLY contained in subBounds); `indices` are their
 * positions in the original array (so applyRegionEdit can rebuild preserving out-of-R order).
 * @param {{placements:object[]}} artifact
 * @param {string|object} spec
 * @param {{fraction?:number}} [opts]
 * @returns {Readonly<{schema:string, spec:any, subBounds:{min:number[],max:number[]}, placements:object[], indices:number[], fraction:number}>}
 */
export function selectRegion(artifact, spec, opts = {}) {
  const fraction = opts.fraction ?? DEFAULT_FRACTION;
  const B = artifactBounds(artifact);
  let sub;
  if (typeof spec === "string") sub = resolveWhereRegion(B, spec, fraction);
  else if (spec && spec.min && spec.max) sub = toIntBounds(spec);
  else if (spec && spec.bbox) sub = toIntBounds(spec.bbox);
  else if (spec && typeof spec.part === "string") sub = resolveNamedRegion(B, spec.part, fraction);
  else if (spec && typeof spec.where === "string") sub = resolveWhereRegion(B, spec.where, fraction);
  else throw new Error(`selectRegion: unrecognized spec ${JSON.stringify(spec)}`);
  sub = clampBounds(sub, B);

  const placements = [];
  const indices = [];
  artifact.placements.forEach((p, i) => {
    if (boundsContain(sub, placementBounds(p))) { placements.push(p); indices.push(i); }
  });

  return Object.freeze({
    schema: REGION_SCHEMA,
    spec,
    subBounds: Object.freeze({ min: Object.freeze([...sub.min]), max: Object.freeze([...sub.max]) }),
    placements: Object.freeze(placements),
    indices: Object.freeze(indices),
    fraction,
  });
}

// --- the region-lock -------------------------------------------------------

/**
 * Thrown by applyRegionEdit when an edit places a voxel OUTSIDE R's sub-bounds — the spatial
 * generalization of E-11's LockViolationError (a write that escapes the region instead of a locked field).
 */
export class RegionEditOutOfBoundsError extends Error {
  constructor(index, coord, subBounds) {
    super(
      `region edit placement #${index} writes [${coord}] outside R ` +
        `(min [${subBounds.min}] max [${subBounds.max}])`,
    );
    this.name = "RegionEditOutOfBoundsError";
    this.code = "region_edit_out_of_bounds";
    this.index = index;
    this.coord = coord;
    this.subBounds = subBounds;
  }
}

/**
 * THE REGION-LOCK. Replace R's in-region placements with `edit`, keeping everything OUTSIDE R frozen.
 * Every voxel of every edit placement must lie inside R's sub-bounds — else throw
 * RegionEditOutOfBoundsError (this is how "rejects any edit that adds/removes/moves a placement outside
 * R" is enforced; out-of-R placements are carried through untouched, so they cannot be removed/moved by
 * an edit at all). The result is reassembled as `out-of-R (original order) ++ edited in-R`, its palette
 * manifest rebuilt from the placed blocks (so a swapped-in block is declared), and is GUARANTEED:
 *
 *   INVARIANT — every cell OUTSIDE subBounds is byte-identical (block+state) before and after.
 *
 * PURE: inputs are never mutated; a fresh artifact is returned. NOT validated here — run it through
 * src/artifact.mjs (the AJV gate). Throws if the edit would leave zero placements (schema minItems:1).
 * @param {object} artifact a schema-valid DesignArtifact
 * @param {ReturnType<typeof selectRegion>} R
 * @param {object[] | ((inRegion:object[]) => object[])} edit  replacement in-R placements, or an editor fn
 * @returns {object} a fresh DesignArtifact
 */
export function applyRegionEdit(artifact, R, edit) {
  const sub = R.subBounds;
  const newInRegion = typeof edit === "function" ? edit(R.placements) : edit;
  if (!Array.isArray(newInRegion)) {
    throw new Error("applyRegionEdit: edit must be a placement array or a function returning one");
  }

  // The lock: every cell an edit writes must stay inside R.
  newInRegion.forEach((p, idx) => {
    for (const v of expandPlacement(p)) {
      if (!coordInBounds(v.pos, sub)) throw new RegionEditOutOfBoundsError(idx, v.pos, sub);
    }
  });

  const inIdx = new Set(R.indices);
  const outOfRegion = artifact.placements.filter((_, i) => !inIdx.has(i));
  const placements = [...outOfRegion, ...newInRegion];
  if (placements.length === 0) {
    throw new Error("applyRegionEdit: edit would leave zero placements (artifact requires ≥1)");
  }

  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  return {
    ...artifact,
    palette: { ...artifact.palette, manifest },
    placements,
  };
}

// --- the live leaf: observe a section (GL, lazy) ---------------------------

/**
 * OBSERVE R: render a TIGHT CROP on R via framedCamera(subBoundsOf(R)) — no new camera math (the camera
 * already frames an arbitrary integer voxel bounds; render/src/camera.mjs). The FULL build is rendered
 * (surrounding context preserved) but the camera is framed on R's sub-bounds, so the section is seen
 * closely in its build. LAZY-imports the render stack (the E-11 review-seam idiom) so the pure region
 * core loads no GL; this is the ticket's one boundary-crosser, exercised only by the GL-gated live test.
 * @param {object} artifact a schema-valid DesignArtifact
 * @param {ReturnType<typeof selectRegion>} R
 * @param {{outPath?:string, view?:object, width?:number, height?:number, strict?:boolean}} [opts]
 * @returns {Promise<{path:string|null, bytes:number, view:object, bounds:{min:number[],max:number[]}}>}
 */
export async function observeRegion(artifact, R, opts = {}) {
  const { buildWorldFromArtifact } = await import("../../render/src/world.mjs");
  const { renderWorldToPng } = await import("../../render/src/render.mjs");
  const sub = subBoundsOf(R);
  const view = { ...(opts.view || {}) };
  const width = opts.width ?? 512;
  const height = opts.height ?? 512;
  const build = await buildWorldFromArtifact(artifact, { strict: opts.strict });
  const buffer = await renderWorldToPng(build.world, build.center, {
    bounds: sub, view, outPath: opts.outPath, width, height,
  });
  return { path: opts.outPath ?? null, bytes: buffer.length, view, bounds: sub };
}
