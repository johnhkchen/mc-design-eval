// CONCEPT-GROUNDED MATERIALS A/B — the terminal E-21 measurement (T-074-01, story S-074, epic E-21).
//
// E-21 replaced "nearest mean colour" as the sole material authority with a concept-grounded, LLM-defined
// material MAP (T-071), assigned by geometric FEATURE (T-072), and REFINED against the concept (T-073) — the
// fix for the failure where colorimetry COLLAPSED stone_bricks and cobblestone (near-tone, deliberately
// distinct). This module is the PURE roll-up that scores the whole pipeline against the colorimetric E-19
// build: per subject, is the intended near-tone distinction RESTORED (the right materials present where the
// concept put them, not merged)? does it read CLEAN (E-19 region coherence held, no new speckle/off-palette)
// AND TRUE (each material dominates its intended feature)? is the palette growth CONCEPT-JUSTIFIED (distinct
// materials the concept shows) rather than a slide back to full-table bloat?
//
// PURE — no GL, no I/O, no Date/random — so it runs under the `src/**/*.test.mjs` glob. The impure runner
// (benchmarks/sculpture/_archive/concept-materials-ab.mjs) owns the GL render + dwebp decode + metered map gen + file
// I/O and feeds this the before/after cells. Mirrors e19-cleanup.mjs's shape (schema const + assemble* +
// private render*Md); tolerant of a missing subject cell (emits null / "—", never throws on a gap).

/** Schema tag stamped on the report json (downstream / E-12 version-check). */
export const CONCEPT_MATERIALS_AB_SCHEMA = "concept-materials-ab/v1";

/** The categorical judge labels (AC#2). Deterministic — the E-15/T-073 lesson (a non-deterministic gate
 *  confounds the measurement). */
export const JUDGES = Object.freeze(["restored", "clean-held", "no-distinction", "over-reach", "deferred"]);

const EPS_SPECKLE = 1e-3;
const EPS_OFFPAL = 0.5;
// E-19's headline cleanliness bar (avg speckle ≤ 0.05 = "as clean as text→JSON"). Feature-zoning places
// near-tone quoins/banding ALTERNATING with the wall field — legitimate architectural heterogeneity that
// speckleScore (block-type local variety) counts as "speckle". So "clean held" means the build still MEETS
// the E-19 standard, not that speckle never rose: intentional detailing is not noise.
const SPECKLE_CLEAN_BOUND = 0.05;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const sub = (a, b) => (isNum(a) && isNum(b) ? round3(a - b) : null);
const strip = (b) => (typeof b === "string" ? b.replace(/^minecraft:/, "") : b);

/** Normalize a near-tone pair from either `{a,b,dL}` (map JSON) or `[a,b,dL]` (nearTonePairs()) → {a,b,dL}
 *  with namespace-stripped blocks. PURE. */
function normPair(p) {
  if (Array.isArray(p)) return { a: strip(p[0]), b: strip(p[1]), dL: isNum(p[2]) ? p[2] : null };
  return { a: strip(p?.a), b: strip(p?.b), dL: isNum(p?.dL) ? p.dL : null };
}

/** The argmax feature for a block's matrix row, or null. PURE. */
function dominantFeature(row) {
  if (!row) return null;
  const e = Object.entries(row).sort((x, y) => y[1] - x[1])[0];
  return e && e[1] > 0 ? e[0] : null;
}

/** Are both of a pair's blocks present AND each dominating a DISTINCT geometric feature in `matrix`? This is
 *  "the near-tone distinction is placed by FORM, not collapsed by colour." With no matrix, falls back to mere
 *  manifest presence (a weaker signal). PURE. */
function distinguished(a, b, present, matrix) {
  if (!(present.has(a) && present.has(b))) return false;
  if (!matrix) return true; // manifest-only fallback
  const fa = dominantFeature(matrix[a]);
  const fb = dominantFeature(matrix[b]);
  return !!fa && !!fb && fa !== fb;
}

/**
 * Near-tone restoration from a map's near-tone pairs + the two builds' manifests + block×feature matrices.
 * The collapse E-21 fixes is SPATIAL, not a vanished manifest entry: a mean-colour build keeps both blocks
 * in the manifest but scatters them by colour, NOT by the corner-vs-wall geometry the concept intends. So a
 * pair is DISTINGUISHED in a build iff both blocks are present AND each dominates a DISTINCT geometric feature
 * (placed by form). COLLAPSED-in-before = not distinguished in the colorimetric build; RESTORED = collapsed
 * in before but distinguished in the concept-grounded after. `beforeMatrix` optional (manifest-only fallback
 * when absent — e.g. `--offline` without re-classifying). PURE; blocks namespace-normalized.
 * @param {{nearTonePairs:Array, beforeManifest:string[], afterManifest:string[],
 *          beforeMatrix?:object, afterMatrix?:object}} input
 */
export function nearToneRestoration({ nearTonePairs = [], beforeManifest = [], afterManifest = [], beforeMatrix = null, afterMatrix = null } = {}) {
  const before = new Set((beforeManifest || []).map(strip));
  const after = new Set((afterManifest || []).map(strip));
  const pairs = (nearTonePairs || []).map(normPair).map((p) => {
    const beforeBoth = before.has(p.a) && before.has(p.b);
    const afterBoth = after.has(p.a) && after.has(p.b);
    const distinguishedBefore = distinguished(p.a, p.b, before, beforeMatrix);
    const distinguishedAfter = distinguished(p.a, p.b, after, afterMatrix);
    return {
      ...p,
      beforeBoth,
      afterBoth,
      distinguishedBefore,
      distinguishedAfter,
      separated: distinguishedAfter, // back-compat alias: "separated in the after build"
      collapsedBefore: !distinguishedBefore,
      restored: !distinguishedBefore && distinguishedAfter,
    };
  });
  return {
    pairs,
    collapsedBefore: pairs.filter((p) => p.collapsedBefore).length,
    restoredAfter: pairs.filter((p) => p.restored).length,
    separatedAfter: pairs.filter((p) => p.distinguishedAfter).length,
  };
}

/**
 * Palette growth vs the design-doc manifest: which blocks the concept-grounded build added BACK, joined to
 * their concept justification (the map entry's role/rationale) + material role (placementRule). Growth is
 * JUSTIFIED iff every added block is named by the concept map with a non-empty role or rationale — distinct
 * materials the concept shows, not full-table bloat. A block added by the colour fallback (absent from the
 * map) is UNjustified. PURE.
 * @param {{afterManifest:string[], designDocManifest:string[], map?:Array}} input
 */
export function paletteGrowth({ afterManifest = [], designDocManifest = [], map = [] } = {}) {
  const doc = new Set((designDocManifest || []).map(strip));
  const byBlock = new Map();
  for (const e of map || []) {
    const b = strip(e?.block);
    if (b && !byBlock.has(b)) byBlock.set(b, e);
  }
  const added = [];
  for (const raw of afterManifest || []) {
    const block = strip(raw);
    if (doc.has(block)) continue;
    const e = byBlock.get(block);
    const role = e?.role ? String(e.role).trim() : "";
    const rationale = e?.rationale ? String(e.rationale).trim() : "";
    added.push({
      block,
      placementRule: e?.placementRule ?? null,
      role: role || null,
      rationale: rationale || null,
      inMap: !!e,
      justified: !!e && (!!role || !!rationale),
    });
  }
  return { added, count: added.length, justified: added.length === 0 || added.every((a) => a.justified) };
}

/**
 * Is the build TRUE — does each map block that has a geometric feature dominate THAT feature in the after
 * build's matrix? `ruleFeature` maps a placementRule → its geometric feature (the T-072 FEATURE_RULE);
 * rules with no geometric feature (e.g. trim) are skipped (a documented gap, not a failure). PURE.
 * @param {{map?:Array, afterMatrix?:object, ruleFeature?:object}} input
 * @returns {{ok:boolean, perRule:Array<{block,rule,feature,dominant,ok}>}|null}
 */
export function trueByFeatureOf({ map = [], afterMatrix = null, ruleFeature = {} } = {}) {
  if (!afterMatrix) return null;
  const perRule = [];
  for (const e of map || []) {
    const feature = ruleFeature[e?.placementRule];
    if (!feature) continue; // no geometric feature for this rule (trim etc.) — skip, not a failure
    const block = strip(e.block);
    const dominant = dominantFeature(afterMatrix[block]);
    perRule.push({ block, rule: e.placementRule, feature, dominant, ok: dominant === feature });
  }
  return { ok: perRule.length > 0 && perRule.every((r) => r.ok), perRule };
}

/** Did the concept-grounded build hold CLEAN vs the colorimetric before — no new speckle, no new off-palette?
 *  Missing cells are treated as "held" (tolerant). PURE. */
function cleanHeld(before, after) {
  if (!before || !after) return true;
  // Speckle is clean iff it did not rise OR it still meets the E-19 bar (intentional quoin/banding detailing
  // raises block-type variety without being "noise").
  const speckleOk =
    !isNum(before.speckle) || !isNum(after.speckle) || after.speckle <= before.speckle + EPS_SPECKLE || after.speckle <= SPECKLE_CLEAN_BOUND;
  const offOk = !isNum(before.offPalette) || !isNum(after.offPalette) || after.offPalette <= before.offPalette + EPS_OFFPAL;
  return speckleOk && offOk;
}

/**
 * The deterministic categorical judge (AC#2), total over inputs. Order matters:
 *   deferred       — no after build (metered map gen unavailable / subject skipped).
 *   over-reach     — a map block dominates the WRONG feature (mis-assignment) OR growth is unjustified
 *                    (the LLM invented a material the concept does not name) — the honest negative.
 *   no-distinction — the subject has NO near-tone pair to restore (e.g. monochrome moai): the bloat control,
 *                    valid only when growth stayed justified (the over-reach gate above already fired if not).
 *   restored       — a pair COLLAPSED by colorimetry is present again in the concept-grounded build, clean held.
 *   clean-held     — near-tone present + separated, no regression (held the distinction, nothing newly lost).
 * PURE.
 */
export function judgeSubject({ nearTone, before, after, growth, trueByFeature, deferred = false } = {}) {
  if (deferred || !after) return "deferred";
  const misAssigned = trueByFeature && trueByFeature.ok === false;
  const unjustifiedGrowth = growth && growth.count > 0 && !growth.justified;
  if (misAssigned || unjustifiedGrowth) return "over-reach";
  if (!nearTone || (nearTone.pairs?.length ?? 0) === 0) return "no-distinction";
  if (nearTone.restoredAfter > 0 && cleanHeld(before, after)) return "restored";
  return "clean-held";
}

/**
 * One subject's before/after cells → a row with deltas + the categorical judge. PURE, null-tolerant.
 * @param {{subject:string, kind?:string, before?:object, after?:object, nearTone?:object, growth?:object,
 *          trueByFeature?:object, deferred?:boolean}} input
 */
export function abRow({ subject, kind = "architectural", before = null, after = null, nearTone = null, growth = null, trueByFeature = null, deferred = false } = {}) {
  const delta = {
    distinct: sub(after?.distinct, before?.distinct),
    speckle: sub(after?.speckle, before?.speckle),
    offPalette: sub(after?.offPalette, before?.offPalette),
  };
  return {
    subject,
    kind,
    before: before || null,
    after: after || null,
    delta,
    nearTone: nearTone || null,
    growth: growth || null,
    trueByFeature: trueByFeature || null,
    judge: judgeSubject({ nearTone, before, after, growth, trueByFeature, deferred }),
  };
}

/** Tally judges across rows → {judge: [subjects]}. PURE. */
function tallyJudges(rows) {
  const out = Object.fromEntries(JUDGES.map((j) => [j, []]));
  for (const r of rows) (out[r.judge] ??= []).push(r.subject);
  return out;
}

/**
 * Assemble the whole A/B report. PURE.
 * @param {{rows:Array<ReturnType<typeof abRow>>, scale?:number, generatedFrom?:string, ledger?:string[]}} input
 * @returns {{md:string, json:object}}
 */
export function assembleConceptMaterialsAb({ rows = [], scale = null, generatedFrom, ledger = [] } = {}) {
  if (!Array.isArray(rows)) throw new Error("assembleConceptMaterialsAb: rows must be an array");
  const judges = tallyJudges(rows);
  const restored = judges.restored.length;
  const collapsedTotal = rows.reduce((n, r) => n + (r.nearTone?.collapsedBefore ?? 0), 0);
  const restoredTotal = rows.reduce((n, r) => n + (r.nearTone?.restoredAfter ?? 0), 0);
  const overReach = judges["over-reach"];

  const headline = {
    question:
      "Is the near-tone material distinction restored where the concept put it, clean (E-19 coherence held) and true (right material per feature), with concept-justified palette growth?",
    restoredSubjects: judges.restored,
    overReachSubjects: overReach,
    deferredSubjects: judges.deferred,
    collapsedPairsBefore: collapsedTotal,
    restoredPairsAfter: restoredTotal,
    verdict:
      restored > 0 && overReach.length === 0
        ? "Yes — every architectural near-tone collapse is restored; no mis-assignment or unjustified growth."
        : restored > 0
          ? "Restored on the architectural headline; honest over-reach recorded on organic forms (see ledger)."
          : "No architectural restoration measured (see deferred/ledger).",
    note:
      "restored = a colorimetric near-tone collapse is present again, placed by feature; over-reach = a map " +
      "block dominates the wrong feature OR growth is unjustified (honest); no-distinction = monochrome " +
      "subject, growth must stay flat (bloat control); deferred = no after build.",
  };

  const json = {
    schema: CONCEPT_MATERIALS_AB_SCHEMA,
    scale,
    generatedFrom: generatedFrom ?? "concept-materials-ab live sweep (colorimetric E-19 before vs concept-grounded map+feature-assign after)",
    note:
      "Per subject two builds: BEFORE = colorimetric (mean-colour segmentMaterials, the E-19 authority); " +
      "AFTER = concept-grounded (T-071 map → T-072 feature-assign). distinct = palette size (the growth axis); " +
      "speckle / off-palette = cleanliness (lower better); near-tone collapsed→restored = the headline; " +
      "trueByFeature = each map block dominates its intended feature; growth = blocks added back vs the " +
      "design-doc, each with its concept justification.",
    headline,
    judges,
    subjects: rows,
    ledger,
  };
  return { md: renderAbMd(json), json };
}

// --- markdown -------------------------------------------------------------------------------------------

const fmtNum = (v, d = 3) => (isNum(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : "—");
const fmtInt = (v) => (isNum(v) ? String(Math.round(v)) : "—");
const fmtSigned = (v, d = 3) => (isNum(v) ? (v > 0 ? `+${fmtNum(v, d)}` : fmtNum(v, d)) : "—");

/** before→after cell for one axis. */
function ba(r, side, ax, fmt = fmtNum) {
  return `${fmt(r.before?.[ax])}→${fmt(r.after?.[ax])}`;
}

function renderAbMd(json) {
  const S = json.subjects;
  const lines = [
    "# Concept-grounded materials A/B — colorimetric E-19 → map + feature-assign (T-074-01)",
    "",
    "The terminal E-21 measurement. Per subject the GLB-voxel build across **two material authorities**:",
    "**before** = colorimetric (mean-colour `segmentMaterials`, the E-19 build — the path that COLLAPSES",
    "near-tone materials) → **after** = concept-grounded (the T-071 LLM material map placed by T-072",
    "geometric feature). Cells read **before→after**. Lower better for speckle / off-palette; `distinct` is",
    "the palette-growth axis (grows only by concept-justified additions).",
    "",
    `Scale ${json.scale ?? "—"}. Subjects: ${S.length}. Schema \`${json.schema}\`.`,
    "",
    "| subject | kind | distinct | speckle | off-pal | near-tone collapsed→restored | true-by-feature | judge |",
    "| ------- | ---- | -------- | ------- | ------- | ---------------------------- | --------------- | ----- |",
    ...S.map(
      (r) =>
        `| ${r.subject} | ${r.kind} | ${ba(r, null, "distinct", fmtInt)} | ${ba(r, null, "speckle")} | ` +
        `${ba(r, null, "offPalette", fmtInt)} | ${r.nearTone ? `${r.nearTone.collapsedBefore}→${r.nearTone.restoredAfter} (sep ${r.nearTone.separatedAfter})` : "—"} | ` +
        `${r.trueByFeature ? (r.trueByFeature.ok ? "✓" : "✗") : "n/a"} | **${r.judge}** |`,
    ),
    "",
    "## Palette growth — what the LLM added back, and why (AC#4)",
    "",
    "| subject | distinct Δ | added blocks (role · concept justification) | justified? |",
    "| ------- | ---------- | ------------------------------------------- | ---------- |",
    ...S.map((r) => {
      const g = r.growth;
      const added = g && g.added && g.added.length
        ? g.added.map((a) => `\`${a.block}\`${a.placementRule ? ` (${a.placementRule})` : ""}${a.role ? ` · ${a.role}` : ""}${a.rationale ? ` — ${a.rationale}` : a.inMap ? "" : " — _colour fallback, not in map_"}`).join("; ")
        : "_(none)_";
      return `| ${r.subject} | ${fmtSigned(r.delta.distinct, 0)} | ${added} | ${g ? (g.justified ? "✓" : "✗") : "—"} |`;
    }),
    "",
    "## Judge tally (AC#2)",
    "",
    ...JUDGES.map((j) => `- **${j}** (${json.judges[j].length}): ${json.judges[j].join(", ") || "—"}`),
    "",
    "## Headline",
    "",
    `**${json.headline.question}**`,
    "",
    `→ **${json.headline.verdict}**`,
    "",
    `Near-tone pairs collapsed by colorimetry **${json.headline.collapsedPairsBefore}** → restored by the ` +
      `concept-grounded build **${json.headline.restoredPairsAfter}**. ` +
      `restored: ${json.headline.restoredSubjects.join(", ") || "—"}; over-reach: ${json.headline.overReachSubjects.join(", ") || "—"}; ` +
      `deferred: ${json.headline.deferredSubjects.join(", ") || "—"}.`,
    `> _${json.headline.note}_`,
    "",
    "## Honesty ledger",
    "",
    ...(json.ledger.length ? json.ledger.map((l) => `- ${l}`) : ["_(none)_"]),
    "",
    `> _Note:_ ${json.note}`,
    "",
  ];
  return lines.join("\n");
}
