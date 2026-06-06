// Hollowable-mass detector — light-tier exemplar (T-082-01, story S-082, epic E-23). FEEDS T-080-01.
//
// The second op proving right-sized routing (`twodee-interaction-sector`): scoped to the massing —
// footprint + storey bands + a single 3/4 view — it confirms the safe-to-carve interior mass and FLAGS
// skin-hole blockers. A bounded geometric classification, so it runs on the LIGHT tier via the
// subscription shim (src/model-tier.mjs). The downstream invariant it serves: SEAL the shell watertight
// BEFORE hollowing (S-084), so any blocker (a skin hole) means "seal first, hollow second".
//
// Same split as roof-patch.mjs / resemblance.mjs: PURE core (geometric prior + FIXED prompt + parser);
// the metered runner owns the GL render, decode, and the light-tier `claude -p` call. NO model import,
// NO API key, NO GL here. PURE — runs under the `src/**/*.test.mjs` glob.

import { parseJsonReply } from "./json-reply.mjs";
import { storeyBands, wallFields } from "./structural-read.mjs";

/** The op's tier (single point of declaration; mirrored in model-tier OP_ROUTING). */
export const TIER = "light";
/** Schema tag for the parsed result. */
export const HOLLOWABLE_SCHEMA = "hollowable-mass/v1";
/** The T-080-01 handoff invariant: a non-empty `blockers` list means seal the shell BEFORE hollowing. */
export const SEAL_BEFORE_HOLLOW =
  "Any blocker (skin hole) must be sealed watertight before hollowing — seal-before-hollow (S-084 → T-080-01).";

/**
 * Pure geometric prior: the safe-to-carve interior bulk. A voxel is ENCLOSED iff all six orthogonal
 * neighbours are occupied — removing it cannot breach the skin — so enclosed voxels are the hollowable
 * mass. Counts are grouped per storey band, and `skinHoles` totals the enclosed-air gaps in the four
 * elevations (a hole means the shell is NOT watertight: a blocker the model must flag).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object} [opts] forwarded to storeyBands
 * @returns {{enclosed:number, perBand:{yStart:number,yEnd:number,enclosed:number}[], skinHoles:number}}
 */
export function hollowableCore(occ, opts = {}) {
  if (!occ || !occ.bounds) return { enclosed: 0, perBand: [], skinHoles: 0 };
  const enclosedYs = []; // y of each enclosed voxel
  let enclosed = 0;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (
      occ.has(x + 1, y, z) && occ.has(x - 1, y, z) &&
      occ.has(x, y + 1, z) && occ.has(x, y - 1, z) &&
      occ.has(x, y, z + 1) && occ.has(x, y, z - 1)
    ) {
      enclosed++;
      enclosedYs.push(y);
    }
  }
  const { bands } = storeyBands(occ, opts);
  const perBand = bands.map((b) => ({
    yStart: b.yStart,
    yEnd: b.yEnd,
    enclosed: enclosedYs.filter((y) => y >= b.yStart && y <= b.yEnd).length,
  }));
  const { faces } = wallFields(occ);
  const skinHoles = Object.values(faces).reduce((n, f) => n + f.holes.length, 0);
  return { enclosed, perBand, skinHoles };
}

/**
 * The FIXED hollowable-mass prompt. States footprint dims, storey bands, the enclosed-core size per band,
 * and the skin-hole count, and asks the (light) model — seeing the 3/4 render — to confirm the hollowable
 * regions and FLAG blockers. PURE; the caller delivers the 3/4 image alongside.
 * @param {{footprint:object, storeyBands:object}} read a structuralRead result (footprint + storeyBands)
 * @param {ReturnType<typeof hollowableCore>} core
 * @returns {string}
 */
export function buildHollowablePrompt(read, core) {
  const fp = read?.footprint ?? {};
  const bandList =
    core.perBand.length === 0
      ? "  (no bands)"
      : core.perBand.map((b) => `  - y ${b.yStart}–${b.yEnd}: ${b.enclosed} enclosed (carveable) cell(s)`).join("\n");
  return [
    "You are a hollowable-mass detector for a Minecraft building. You are looking at the massing: the",
    "footprint, the storey bands, and the attached 3/4 view. Decide which interior mass is safe to HOLLOW",
    "(carve out) WITHOUT breaching the exterior skin, and flag anything that blocks a safe hollow.",
    "",
    `Footprint: ${fp.width ?? 0}×${fp.depth ?? 0} columns (${fp.area ?? 0} total).`,
    `Total enclosed (all-neighbours-occupied) cells, the carveable bulk: ${core.enclosed}.`,
    "Enclosed cells per storey band:",
    bandList,
    `Skin holes detected in the elevations: ${core.skinHoles}.`,
    "",
    "IMPORTANT: the shell must be WATERTIGHT before hollowing. If there are skin holes, they are BLOCKERS:",
    "report hollowable=false (or list the blockers) so the seal happens first (seal-before-hollow).",
    "",
    "## Output — STRICT",
    "Output a SINGLE JSON object and NOTHING else:",
    '{ "hollowable": <bool>, "regions": [ { "yStart": <int>, "yEnd": <int>, "inset": <int>, "note": "<short>" } ],',
    '  "blockers": [ "<short reason>" ] }',
    "`inset` is how many cells in from the skin to keep as wall. Empty regions/blockers lists are valid.",
  ].join("\n");
}

/**
 * Parse a hollowable-mass model reply into the schema-tagged result. Reuses `parseJsonReply` (fences /
 * prose / fence-then-prose). Coerces `hollowable` to bool, keeps well-formed regions, defaults `blockers`
 * to `[]`. Throws ONLY on non-JSON. PURE.
 * @param {string} text
 * @returns {{schema:string, hollowable:boolean, regions:{yStart:number,yEnd:number,inset:number,note:string}[], blockers:string[]}}
 */
export function parseHollowable(text) {
  let obj;
  try {
    obj = parseJsonReply(text);
  } catch (e) {
    throw new Error(`parseHollowable: ${e.message}`);
  }
  const regions = [];
  for (const r of Array.isArray(obj?.regions) ? obj.regions : []) {
    if (!Number.isInteger(r?.yStart) || !Number.isInteger(r?.yEnd)) continue;
    regions.push({
      yStart: r.yStart,
      yEnd: r.yEnd,
      inset: Number.isInteger(r?.inset) ? r.inset : 1,
      note: typeof r.note === "string" ? r.note : "",
    });
  }
  const blockers = (Array.isArray(obj?.blockers) ? obj.blockers : [])
    .filter((b) => typeof b === "string" && b.trim().length > 0);
  return { schema: HOLLOWABLE_SCHEMA, hollowable: Boolean(obj?.hollowable), regions, blockers };
}
