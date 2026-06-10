// Value-true block selection per material role (T-086-01, story S-086, epic E-24).
//
// THE NAME→VALUE GATE. The E-21 material map names a block per role; a real block passes S-039's
// value-honest card at ΔE 0 BY CONSTRUCTION (a real block "renders as itself"), so a role whose
// NAMED block drifts from the concept's actual color — the cottage's plaster `white_terracotta`
// rendering pink against a warm-cream concept — is invisible to the whole E-14 chain. This module
// closes that gap: sample the CONCEPT's region for each role, and pick the block whose rendered
// color is faithful to that swatch, WITHIN the role's material family.
//
// Three measured facts (T-086-01 research) shape the design:
//   1. Plain ΔE76 KEEPS the pink block — white_terracotta is the nearest table block to the
//      sampled cream; the defect is the a* axis (+8.9 vs the concept's +1.2). So selection uses a
//      CHROMA-WEIGHTED metric (hue/chroma drift is what reads as "wrong material color"; L*
//      matches easily under lighting), composed with T-064's flat preference via the engine's
//      pluggable-metric seam (`nearestFlat`) — selection is biased, the REPORTED ΔE stays true.
//   2. Concept backgrounds poison naive sampling (the cottage's is near-WHITE; the default
//      near-black dropColor removes nothing). `estimateBorderColor` supplies the dropColor;
//      sampling reuses image-grid's validate-mode quantize (the named block LOCATES its region)
//      plus the opt-in `cellMeans` to read the true color behind each assignment.
//   3. Token families admit non-buildable winners (sand is a gravity block; deepslate ores are
//      resource blocks) and thin regions produce noise winners — hence the exclusion list, the
//      MIN_CELLS floor, and the SWITCH_MARGIN that keeps the map's name as the PRIOR
//      (palette discipline: this is a family-bounded pick, NOT a return to the full-table snap).
//
// PURE, GL-FREE, NETWORK-FREE: committed-table read + arithmetic only, so it runs under the
// `src/**/*.test.mjs` glob with nothing mocked. Imports only sibling color modules; cielab.mjs's
// reuse boundary is untouched. The impure wiring (decode, render, record) lives in
// benchmarks/sculpture/value-select.mjs. Integration into the paint pipeline is S-089's job —
// downstream consumes this module's OUTPUT (a value-true role map), not its imports.

import { srgbToLab, deltaE76, nearestFlat } from "./cielab.mjs";
import { loadBlockTable } from "./block-table.mjs";

/** Schema tag stamped on the runner's record so downstream (S-089) can version-check it. */
export const VALUE_SELECT_SCHEMA = "value-select/v1";

/** Chroma (a*, b*) weight in the selection metric — the smallest integer weight that lets a
 *  hue-faithful block dethrone a value-matched-but-hue-drifted prior (measured on the cottage
 *  plaster: w=1 keeps the pink block, w=2 flips it with a 21% margin). */
export const CHROMA_WEIGHT = 2;

/** Relative score improvement the family winner must show to dethrone the named prior. */
export const SWITCH_MARGIN = 0.15;

/** Sample floor: a role whose concept region yields fewer assigned cells keeps its prior
 *  (measured: the cottage's 6-cell quoin and 17-cell chimney-cap samples produce noise winners). */
export const MIN_CELLS = 24;

/** Default concept quantize width for role sampling — role-swatch Labs are stable across
 *  n = 48…128 on the cottage; 96 balances cell purity against per-role sample size. */
export const SAMPLE_GRID_N = 96;

/** T-064's flat-preference weight, reused verbatim (see cielab.mjs FLAT_LAMBDA). */
const FLAT_LAMBDA = 0.1;

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/** Strip a leading namespace (`minecraft:`) from a block id. */
const bare = (id) => String(id).replace(/^[a-z0-9_]+:/, "");

// --- material families -------------------------------------------------------

// Ordered token rules. Precedence resolves the overlaps deliberately: stone_bricks → stone (grey
// masonry, not clay brick); quartz_bricks → brick (a brick pattern, whatever it's cut from).
const STONE_TOKENS = new Set([
  "stone", "cobblestone", "deepslate", "andesite", "diorite", "granite",
  "tuff", "blackstone", "basalt", "cobbled",
]);
const SMOOTH_TOKENS = new Set([
  "terracotta", "concrete", "wool", "quartz", "bone", "calcite", "sandstone", "sand",
]);

/**
 * Classify a block id into its semantic material family. Curated token rules, NOT a Lab
 * neighborhood — mean-color neighborhoods are exactly the near-tone collapse documented in
 * `material-identity-is-semantic`. Accepts namespaced or bare ids.
 * @param {string} blockId
 * @returns {"log"|"planks"|"stone"|"brick"|"smooth"|null} null = no family (selection keeps the prior)
 */
export function familyOf(blockId) {
  const k = bare(blockId);
  if (/(_log|_wood|_stem|_hyphae)$/.test(k)) return "log";
  if (/_planks$/.test(k)) return "planks";
  const tokens = new Set(k.split("_"));
  for (const t of tokens) if (STONE_TOKENS.has(t)) return "stone";
  if (tokens.has("brick") || tokens.has("bricks")) return "brick";
  for (const t of tokens) if (SMOOTH_TOKENS.has(t)) return "smooth";
  return null;
}

/**
 * True for table blocks a wall/roof role must never select even when the color fits: resource
 * blocks (`*_ore`) and gravity-affected blocks (sands/gravels/concrete powders fall).
 * @param {string} blockId  namespaced or bare
 */
export function isExcludedCandidate(blockId) {
  const k = bare(blockId);
  if (/_ore$/.test(k)) return true;
  if (/concrete_powder$/.test(k)) return true;
  return ["sand", "red_sand", "gravel", "suspicious_sand", "suspicious_gravel"].includes(k);
}

// Lazy, memoized family pools over the committed table (mirrors value-palette's candidatesOnce).
let _pools = null;
function poolsOnce(table) {
  if (!table && _pools) return _pools;
  const t = table ?? loadBlockTable();
  const pools = new Map();
  for (const b of t.blocks) {
    if (isExcludedCandidate(b.block)) continue;
    const f = familyOf(b.block);
    if (!f) continue;
    if (!pools.has(f)) pools.set(f, []);
    pools.get(f).push({ key: b.block, lab: b.lab, var: b.var });
  }
  if (!table) _pools = pools;
  return pools;
}

/**
 * The selectable candidates of a family: committed table ∩ family − exclusions, as
 * nearest-ready `{ key, lab, var }` entries. Throws on an unknown family (an actionable
 * upstream bug, not a soft skip).
 * @param {"log"|"planks"|"stone"|"brick"|"smooth"} family
 * @param {object} [table]  a loaded block table (default: the committed one, memoized)
 * @returns {{key:string, lab:number[], var:number}[]}
 */
export function familyCandidates(family, table) {
  const pools = poolsOnce(table);
  const pool = pools.get(family);
  if (!pool || pool.length === 0) {
    throw new Error(`familyCandidates: unknown or empty family "${family}" (expected one of ${[...pools.keys()].join(", ")})`);
  }
  return pool;
}

// --- the selection metric ----------------------------------------------------

/**
 * Chroma-weighted Lab distance: √(ΔL² + (w·Δa)² + (w·Δb)²). At w=1 this IS deltaE76. The weight
 * encodes the witnessed failure mode: hue/chroma drift is what reads as "wrong material color"
 * (pink vs cream), while L* matches easily. Used for SELECTION only — every reported ΔE in the
 * decision rows is the true, unweighted deltaE76.
 * @param {number[]} a  Lab
 * @param {number[]} b  Lab
 * @param {number} [w=CHROMA_WEIGHT]
 */
export function weightedDeltaE(a, b, w = CHROMA_WEIGHT) {
  const dL = a[0] - b[0];
  const da = (a[1] - b[1]) * w;
  const db = (a[2] - b[2]) * w;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// --- concept sampling helpers --------------------------------------------------

/**
 * Estimate an image's background color as the mean of its 1-px border — the dropColor for
 * sampling quantizes. Concept backgrounds are flat fields touching the frame on all sides
 * (the cottage's is near-white, which the default near-black drop never removes).
 * @param {{width:number,height:number,data:Uint8Array|Buffer}} img  decoded RGBA
 * @returns {[number,number,number]}
 */
export function estimateBorderColor({ width, height, data }) {
  if (!width || !height) throw new Error("estimateBorderColor: empty image");
  let r = 0, g = 0, b = 0, c = 0;
  const acc = (x, y) => {
    const p = (y * width + x) << 2;
    r += data[p]; g += data[p + 1]; b += data[p + 2]; c++;
  };
  for (let x = 0; x < width; x++) { acc(x, 0); if (height > 1) acc(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { acc(0, y); if (width > 1) acc(width - 1, y); }
  return [r / c, g / c, b / c];
}

/**
 * Per-role concept swatches from a validate-mode GridResult carrying `cellMeans`: for each named
 * (bare) block, the mean Lab of the TRUE foreground colors of the cells assigned to it. The named
 * block LOCATES its region (it is the region's nearest manifest block — the prior's one job here);
 * the swatch is the region's real color, not the block's. Pure.
 * @param {{grid:(string|null)[][], cellMeans:(number[]|null)[][]}} gridResult
 *   from gridFromPixels(img, { whitelist: manifest, cellMeans: true, … })
 * @param {string[]} namedBlocks  the map's blocks (namespaced or bare)
 * @returns {Map<string, {lab:[number,number,number], cells:number}>} keyed by bare id; only
 *   blocks with ≥1 assigned cell appear
 */
export function sampleRoleSwatches(gridResult, namedBlocks) {
  if (!gridResult || !Array.isArray(gridResult.grid)) {
    throw new Error("sampleRoleSwatches: expected a GridResult with .grid");
  }
  if (!Array.isArray(gridResult.cellMeans)) {
    throw new Error("sampleRoleSwatches: GridResult has no cellMeans — quantize with { cellMeans: true }");
  }
  const want = new Set(namedBlocks.map(bare));
  const acc = new Map(); // bare -> {L,a,b,n}
  const { grid, cellMeans } = gridResult;
  for (let gy = 0; gy < grid.length; gy++) {
    for (let gx = 0; gx < grid[gy].length; gx++) {
      const key = grid[gy][gx];
      if (key === null || !want.has(key)) continue;
      const mean = cellMeans[gy][gx];
      if (!mean) continue;
      const lab = srgbToLab(mean);
      const a = acc.get(key) ?? { L: 0, a: 0, b: 0, n: 0 };
      a.L += lab[0]; a.a += lab[1]; a.b += lab[2]; a.n++;
      acc.set(key, a);
    }
  }
  const out = new Map();
  for (const [key, a] of acc) {
    out.set(key, { lab: [a.L / a.n, a.a / a.n, a.b / a.n], cells: a.n });
  }
  return out;
}

// --- the decision core ---------------------------------------------------------

/** True-ΔE report row for a block vs the sampled swatch: honest, unweighted components. */
function trueReport(lab, sampleLab) {
  return {
    deltaE: round2(deltaE76(sampleLab, lab)),
    dL: round2(lab[0] - sampleLab[0]),
    da: round2(lab[1] - sampleLab[1]),
    db: round2(lab[2] - sampleLab[2]),
  };
}

/**
 * Decide one role's value-true block. The map's NAMED block is the prior; the family winner
 * (argmin weightedDeltaE + flat penalty, via the engine's `nearestFlat`) dethrones it only with
 * a real sample (≥ minCells) and a clear margin (≥ switchMargin relative score improvement).
 * Reasons that KEEP the prior are recorded, never thrown — a thin sample or family-less block is
 * a recorded gap (E-24 Rule 5), not an error.
 * @param {{named:string, sampleLab:number[]|null, sampleCells?:number}} role
 *   `named` namespaced or bare; `sampleLab` null when the concept never showed the role.
 * @param {{table?:object, chromaWeight?:number, switchMargin?:number, minCells?:number,
 *          lambda?:number}} [opts]
 * @returns {{named:string, chosen:string, switched:boolean, reason:string, family:string|null,
 *   sampleLab:number[]|null, sampleCells:number, namedScore:number|null, chosenScore:number|null,
 *   namedTrue:object|null, chosenTrue:object|null}}
 */
export function selectValueTrueBlock(role, opts = {}) {
  const named = bare(role.named);
  const sampleLab = role.sampleLab ?? null;
  const sampleCells = role.sampleCells ?? 0;
  const w = opts.chromaWeight ?? CHROMA_WEIGHT;
  const margin = opts.switchMargin ?? SWITCH_MARGIN;
  const minCells = opts.minCells ?? MIN_CELLS;
  const lambda = opts.lambda ?? FLAT_LAMBDA;
  const family = familyOf(named);

  const keep = (reason, extra = {}) => ({
    named, chosen: named, switched: false, reason, family,
    sampleLab: sampleLab ? sampleLab.map(round1) : null, sampleCells,
    namedScore: null, chosenScore: null, namedTrue: null, chosenTrue: null,
    ...extra,
  });

  if (!sampleLab || sampleCells === 0) return keep("no-sample");
  if (family === null) return keep("no-family");

  const pool = familyCandidates(family, opts.table);
  const namedEntry = pool.find((e) => e.key === named);
  if (!namedEntry) return keep("not-in-table");
  if (sampleCells < minCells) return keep("thin-sample");

  const metric = (a, b) => weightedDeltaE(a, b, w);
  const score = (e) => metric(sampleLab, e.lab) + (Number.isFinite(e.var) ? lambda * Math.sqrt(e.var) : 0);
  const winner = nearestFlat(sampleLab, pool, { lambda, metric });
  const winnerEntry = pool.find((e) => e.key === winner.key);
  const namedScore = score(namedEntry);
  const winnerScore = score(winnerEntry);

  const base = {
    named, family, sampleLab: sampleLab.map(round1), sampleCells,
    namedScore: round2(namedScore), namedTrue: trueReport(namedEntry.lab, sampleLab),
  };
  if (winner.key === named) {
    return { ...base, chosen: named, switched: false, reason: "prior-is-best",
      chosenScore: round2(namedScore), chosenTrue: base.namedTrue };
  }
  if (namedScore - winnerScore < margin * namedScore) {
    return { ...base, chosen: named, switched: false, reason: "below-margin",
      chosenScore: round2(namedScore), chosenTrue: base.namedTrue };
  }
  return { ...base, chosen: winner.key, switched: true, reason: "switched",
    chosenScore: round2(winnerScore), chosenTrue: trueReport(winnerEntry.lab, sampleLab) };
}

/**
 * Run the decision over an E-21 material map. Each map row (`{role, block, placementRule}`)
 * gets its swatch by its named block (bare) from `swatches` (see {@link sampleRoleSwatches})
 * and keeps its role/placementRule, so the output doubles as a value-true role map.
 * @param {{role:string, block:string, placementRule?:string}[]} map
 * @param {Map<string, {lab:number[], cells:number}>} swatches
 * @param {object} [opts]  forwarded to {@link selectValueTrueBlock}
 * @returns {object[]} one decision row per map row, + role/placementRule
 */
export function selectValueTrueMap(map, swatches, opts = {}) {
  if (!Array.isArray(map) || map.length === 0) {
    throw new Error("selectValueTrueMap: map must be a non-empty array of { role, block }");
  }
  return map.map((row) => {
    const sw = swatches.get(bare(row.block));
    const decision = selectValueTrueBlock(
      { named: row.block, sampleLab: sw?.lab ?? null, sampleCells: sw?.cells ?? 0 },
      opts,
    );
    return { role: row.role, placementRule: row.placementRule, ...decision };
  });
}
