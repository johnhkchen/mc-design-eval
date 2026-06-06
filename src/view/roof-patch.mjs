// Roof-patch detector — light-tier exemplar (T-082-01, story S-082, epic E-23).
//
// One of the two ops that prove right-sized routing (`twodee-interaction-sector`): scoped to ONE view —
// the roof — it asks "which roof cells read wrong / need patching?". That is a narrow classification over
// a BOUNDED candidate set the pure geometric read already isolated (strays + holes), so it runs on the
// LIGHT tier via the subscription shim (see src/model-tier.mjs). The model triages the candidates seeing
// the top render; it never scans 6429 voxels.
//
// Follows the resemblance.mjs split: this file is the PURE core (geometric prior + FIXED prompt + parser),
// imported by the metered runner (benchmarks/sculpture/detector-routing.mjs) which owns the GL render,
// image decode, and the light-tier `claude -p` call. NO model import, NO API key, NO GL here.
//
// PURE — runs under the `src/**/*.test.mjs` glob.

import { stripToJson } from "../sdk-binding.mjs";
import { bareBlock } from "./occupancy.mjs";

/** The op's tier (single point of declaration; mirrored in model-tier OP_ROUTING). */
export const TIER = "light";
/** Schema tag for the parsed result (downstream version-check). */
export const ROOF_PATCH_SCHEMA = "roof-patch/v1";
/** The closed issue vocabulary a patch row may carry. */
export const ISSUES = Object.freeze(["stray-material", "hole", "wrong-tone"]);

/**
 * Pure geometric prior over a {@link import("./structural-read.mjs").roofRegion} result: the dominant
 * roof block, the STRAY cells (block ≠ dominant), and the HOLE count (the coverage gap — no air op,
 * `facade-recess-by-exclusion`: a hole is the absence of a top voxel, counted from `coverage`). This is
 * the bounded candidate set the light model triages, not the raw voxel field.
 * @param {{cells:{x,z,y,block:string}[], coverage:number, area:number}} roofRegion
 * @returns {{dominant:string|null, stray:{x:number,z:number,block:string}[], holeCount:number, area:number, coverage:number}}
 */
export function roofCandidates(roofRegion) {
  const cells = roofRegion?.cells ?? [];
  const counts = new Map();
  for (const c of cells) {
    const b = bareBlock(c.block);
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  let dominant = null, best = -1;
  for (const [b, n] of counts) if (n > best) { best = n; dominant = b; }
  const stray = [];
  for (const c of cells) {
    if (bareBlock(c.block) !== dominant) stray.push({ x: c.x, z: c.z, block: bareBlock(c.block) });
  }
  const area = roofRegion?.area ?? 0;
  const coverage = roofRegion?.coverage ?? 0;
  const holeCount = Math.max(0, Math.round(area * (1 - coverage)));
  return { dominant, stray, holeCount, area, coverage };
}

/**
 * The FIXED roof-patch prompt. States the dominant material, coverage, and the candidate strays + hole
 * count, and asks the (light) model — seeing the same-angle TOP render — to return a strict JSON object
 * of the cells that genuinely read wrong. PURE; the caller delivers the top image alongside.
 * @param {object} roofRegion the roofRegion result (for coverage/area)
 * @param {ReturnType<typeof roofCandidates>} candidates
 * @returns {string}
 */
export function buildRoofPatchPrompt(roofRegion, candidates) {
  const strayList =
    candidates.stray.length === 0
      ? "(none — every roof cell matches the dominant material)"
      : candidates.stray.map((s) => `  - (${s.x},${s.z}) is ${s.block}`).join("\n");
  return [
    "You are a roof-patch detector for a Minecraft building. You are looking at ONE view: the roof,",
    "rendered from straight above (the attached top-down image). Decide which roof cells read WRONG and",
    "need patching. Be conservative — a cell is only a patch if it visibly breaks the roof's coherence.",
    "",
    `Dominant roof material: ${candidates.dominant ?? "(unknown)"}.`,
    `Roof coverage: ${roofRegion?.coverage ?? 0} (1.0 = no holes); approx ${candidates.holeCount} hole cell(s).`,
    `Total roof cells: ${candidates.area}.`,
    "",
    "Candidate stray-material cells the geometry already flagged (block differs from the dominant):",
    strayList,
    "",
    "Coordinates are (x,z) in the build's own integer space, matching the cells above.",
    "",
    "## Output — STRICT",
    "Output a SINGLE JSON object and NOTHING else:",
    '{ "patches": [ { "x": <int>, "z": <int>, "issue": "stray-material|hole|wrong-tone", "note": "<short>" } ] }',
    "Use issue \"stray-material\" for a wrong block, \"hole\" for a gap in the roof skin, \"wrong-tone\" for a",
    "block that matches the material name but reads at the wrong value. Empty patches list is valid.",
  ].join("\n");
}

/**
 * Parse a roof-patch model reply into the schema-tagged result. Reuses `stripToJson` (fences/prose →
 * bare object). Drops rows that lack integer x,z or a known issue; throws ONLY when the reply is not
 * JSON at all (the runner logs the raw text on a throw). PURE.
 * @param {string} text
 * @returns {{schema:string, patches:{x:number,z:number,issue:string,note:string}[]}}
 */
export function parseRoofPatch(text) {
  let obj;
  try {
    obj = JSON.parse(stripToJson(text));
  } catch (e) {
    throw new Error(`parseRoofPatch: reply was not JSON (${e.message})`);
  }
  const rows = Array.isArray(obj?.patches) ? obj.patches : [];
  const patches = [];
  for (const r of rows) {
    if (!Number.isInteger(r?.x) || !Number.isInteger(r?.z)) continue;
    if (!ISSUES.includes(r?.issue)) continue;
    patches.push({ x: r.x, z: r.z, issue: r.issue, note: typeof r.note === "string" ? r.note : "" });
  }
  return { schema: ROOF_PATCH_SCHEMA, patches };
}
