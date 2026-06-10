// Kit-extraction PURE core (T-096-01, story S-096, epic E-26) — "recognize, don't match".
//
// The cottage concept depicts NAMEABLE blocks (smooth sandstone panels, stripped logs, trapdoor
// shutters, fence-infilled windows); the E-21 material-map contract only ever asked for a color
// role, and its validator (the full-cube block→Lab table) silently DROPPED the fixtures the model
// did recognize (spruce_door / dark_oak_trapdoor / lantern, dropped "unknown-block" in
// material-map/cottage.json). This module is the recognition contract: parse + validate the
// model's kit reply against the FULL survival vocabulary (block-vocab.json, built from
// minecraft-data), ground-truth each entry's form class, value-verify cube blocks in CIE-Lab as a
// FLAG (never a silent color-snap — AC #2), and resolve which zone-map bands a recognized block
// overrides (recognition beats snap — AC #3).
//
// ONE CONCEPT-READING SEAM: the kit REFERENCES the committed T-092 zone-map bands
// (bandRefsFromZoneRecord) — it never re-derives them. Band names enter the prompt with all block
// IDs and role text STRIPPED (position descriptors only), so the old map's color-guesses
// (white_terracotta) cannot anchor the recognition.
//
// PURITY (the project idiom — runs under `node --test "src/**/*.test.mjs"`): no GL, no network,
// no Date/random. Committed-JSON loads only (the loadBlockTable idiom). The LIVE multimodal call
// lives in the impure runner (benchmarks/sculpture/kit-extract.mjs).
//
// REUSE, NOT REIMPLEMENTATION: color metric = value-select's chroma-weighted ΔE (plain ΔE76 is
// the known pink-block trap); block Lab values = the E-10 table; name normalization = material.mjs.
//
// COLLECT-DON'T-THROW: the live call is metered — bad rows land in `dropped` (loud), good rows
// survive (`parseMaterialMap` precedent). `assertKit` is the consumer-side empty-reply guard.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { tableKey } from "../sculptor/material.mjs";
import { loadBlockTable } from "../color/block-table.mjs";
import { weightedDeltaE, CHROMA_WEIGHT, MIN_CELLS } from "../color/value-select.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** Schema tag of the committed kit record (the runner stamps it). */
export const KIT_SCHEMA = "kit/v1";

/** Default location of the committed survival vocabulary (scripts/build-block-vocab.mjs). */
export const VOCAB_PATH = resolve(here, "block-vocab.json");

/** The CLOSED form-class vocabulary: cube = full solid block; fixture = non-cube placed element
 *  (door, trapdoor, lantern, stairs, slab); rail = thin connecting element (fence, wall, pane). */
export const FORM_CLASSES = Object.freeze(["cube", "fixture", "rail"]);

/** Extraction confidence vocabulary. */
export const CONFIDENCES = Object.freeze(["high", "medium", "low"]);

/** Name pattern of thin CONNECTING elements (rail class). `*_fence_gate` ends in "gate" and
 *  correctly falls through to fixture. Applied only to non-cube blocks (cube wins first). */
export const RAIL_NAME_RE = /(?:fence|wall|pane|bars|rail|chain)$/;

/** Non-band `whereUsed` terms — the feature classes of E-21's PLACEMENT_RULES that cross bands. */
export const WHERE_FEATURE_TERMS = Object.freeze(["openings", "trim", "corners-edges", "base"]);

/** Chroma-weighted ΔE gate for the cube value check. FLAG-ONLY (never a snap): above this the
 *  entry is marked for human review. Above T-086's same-material sampling noise, below the
 *  cross-family distances that motivated the terracotta correction. */
export const KIT_VERIFY_DELTA_MAX = 16;

const TABLE = loadBlockTable();
const CUBE_SET = new Set(TABLE.blocks.map((b) => b.block));
const TABLE_LAB = new Map(TABLE.blocks.map((b) => [b.block, b.lab]));

/**
 * Load the committed survival vocabulary. Zero Minecraft deps at runtime (the table idiom).
 * @param {string} [path]
 * @returns {{schema:string, minecraftVersion:string, count:number, names:Set<string>}}
 */
export function loadBlockVocab(path = VOCAB_PATH) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (raw?.schema !== "block-vocab/v1" || !Array.isArray(raw.blocks)) {
    throw new Error(`loadBlockVocab: ${path} is not a block-vocab/v1 record`);
  }
  return {
    schema: raw.schema,
    minecraftVersion: raw.minecraftVersion,
    count: raw.count,
    names: new Set(raw.blocks),
  };
}

/**
 * Ground-truth form class of a block: `cube` iff it is in the full-cube block→Lab table (full-cube
 * by that table's construction); else `rail` by name pattern; else `fixture`. Deterministic — the
 * LLM's DECLARED class is preserved separately when it disagrees. PURE.
 * @param {string} block  bare or namespaced id
 * @param {{cubeSet?: Set<string>}} [opts]  injectable for tests
 * @returns {"cube"|"rail"|"fixture"}
 */
export function derivedFormClass(block, opts = {}) {
  const bare = tableKey(String(block));
  const cubes = opts.cubeSet ?? CUBE_SET;
  if (cubes.has(bare)) return "cube";
  return RAIL_NAME_RE.test(bare) ? "rail" : "fixture";
}

/**
 * Band references from a committed zone-map/v1 record — the kit's link to the T-092 bands (AC #3:
 * reference, never re-derive). Block IDs and role text are STRIPPED (anti-anchoring): each band
 * becomes a name + voxel y-range + a POSITION descriptor only. Throws on a wrong-schema or
 * non-concept-readable record — a kit must not be extracted against a fallback prior.
 * @param {{schema:string, source:string, derived?:{bands:object[], roof:object}}} zoneRecord
 * @returns {{bandNames:string[], promptBands:{name:string, yRange:[number,number]|null, position:string}[]}}
 */
export function bandRefsFromZoneRecord(zoneRecord) {
  if (zoneRecord?.schema !== "zone-map/v1") {
    throw new Error("bandRefsFromZoneRecord: expected a zone-map/v1 record");
  }
  if (zoneRecord.source !== "concept" || !Array.isArray(zoneRecord.derived?.bands)) {
    throw new Error("bandRefsFromZoneRecord: record is not a concept-derived zone map (no bands to reference)");
  }
  const bands = zoneRecord.derived.bands;
  const promptBands = bands.map((b, i) => {
    const position =
      bands.length === 1 ? "the whole wall body" :
      i === 0 ? "the lowest wall band" :
      i === bands.length - 1 ? "the highest wall band (below the roof)" :
      "a middle wall band";
    return { name: b.name, yRange: Array.isArray(b.yRange) ? [...b.yRange] : null, position };
  });
  promptBands.push({ name: "roof", yRange: null, position: "the roof" });
  return { bandNames: promptBands.map((b) => b.name), promptBands };
}

/**
 * The recognition prompt. The contract the ticket names: the concept is voxel art DEPICTING
 * nameable Minecraft blocks — ask "which block is this?", never "which color matches?". PURE,
 * deterministic in its inputs (pinnable).
 * @param {{subject:string, promptBands:{name:string, yRange?:number[]|null, position:string}[]}} p
 * @returns {string}
 */
export function buildKitPrompt({ subject, promptBands }) {
  const bandLines = promptBands
    .map((b) => `  - "${b.name}": ${b.position}${b.yRange ? ` (voxel rows y ${b.yRange[0]}..${b.yRange[1]})` : ""}`)
    .join("\n");
  return [
    `You are looking at the concept image for a Minecraft build ("${subject}").`,
    ``,
    `This concept is VOXEL ART that depicts real, nameable Minecraft blocks. Your job is to`,
    `RECOGNIZE the kit of ingredients the artist depicted — never to pick a block whose average`,
    `color is close. For every distinct material/element you can see, ask "which Minecraft block`,
    `IS this?" and name it. Include non-cube elements: doors, trapdoor shutters, fence or bar`,
    `infills in windows, lanterns, stairs, slabs — they are part of the kit.`,
    ``,
    `The build's wall/roof structure has these named regions (use these exact names in whereUsed):`,
    bandLines,
    `Feature areas that cross bands may also be referenced: ${WHERE_FEATURE_TERMS.map((t) => `"${t}"`).join(", ")}.`,
    ``,
    `Reply with STRICT JSON only (no prose, no code fences) in exactly this shape:`,
    `{`,
    `  "ingredients": [`,
    `    {`,
    `      "block": "<bare 1.20.1 block id, e.g. smooth_sandstone>",`,
    `      "role": "<what this ingredient is in the building, in a few words>",`,
    `      "formClass": "cube" | "fixture" | "rail",`,
    `      "whereUsed": ["<region or feature names from the lists above>"],`,
    `      "confidence": "high" | "medium" | "low",`,
    `      "rationale": "<the VISUAL EVIDENCE in the picture that identifies THIS block — texture,`,
    `                    seams, grain, shape — not its color family>"`,
    `    }`,
    `  ],`,
    `  "unidentified": [`,
    `    { "surface": "<surface/region you cannot name a block for>", "reason": "<why>" }`,
    `  ]`,
    `}`,
    ``,
    `formClass meanings: "cube" = a full solid block; "rail" = a thin connecting element (fence,`,
    `wall, glass pane, iron bars); "fixture" = any other non-cube placed element (door, trapdoor,`,
    `lantern, stairs, slab). Use real 1.20.1 survival block ids. If you can SEE a material but`,
    `cannot honestly name its block, put that surface in "unidentified" instead of guessing.`,
  ].join("\n");
}

/**
 * Parse + validate a RAW kit reply (already JSON-parsed) into a clean kit. PURE,
 * collect-don't-throw: bad rows land in `dropped` with a reason; recoverable oddities keep the
 * entry and add to `entry.flags`. Never merges, never renames, never color-snaps.
 *
 * Per entry: `block` must be in the survival vocabulary (the FULL set — fixtures survive now);
 * `formClass` must be declared and valid, then is GROUND-TRUTHED by {@link derivedFormClass}
 * (mismatch ⇒ derived wins, declared preserved, flag "form-class-corrected"); `whereUsed` refs
 * outside bandNames ∪ {@link WHERE_FEATURE_TERMS} flag "unknown-where-ref"; a missing confidence
 * defaults to "medium" with flag "default-confidence"; duplicates on (block, role) keep first.
 *
 * @param {{ingredients?:object[], unidentified?:object[]}} rawObj  the model reply
 * @param {{vocab:{names:Set<string>}, cubeSet?:Set<string>, bandNames?:string[]}} opts
 * @returns {{kit:object[], unidentified:object[], dropped:{reason:string, entry:*}[], stats:object}}
 */
export function parseKit(rawObj, opts = {}) {
  const { vocab, cubeSet, bandNames = [] } = opts;
  if (!vocab?.names) throw new Error("parseKit: opts.vocab (loadBlockVocab result) required");
  const whereSet = new Set([...bandNames, ...WHERE_FEATURE_TERMS]);
  const rows = Array.isArray(rawObj?.ingredients) ? rawObj.ingredients : [];
  const kit = [];
  const dropped = [];
  const seen = new Set();

  for (const entry of rows) {
    if (!entry || typeof entry !== "object") {
      dropped.push({ reason: "not-an-object", entry });
      continue;
    }
    const role = typeof entry.role === "string" ? entry.role.trim() : "";
    if (!role) {
      dropped.push({ reason: "empty-role", entry });
      continue;
    }
    const block = typeof entry.block === "string" && entry.block.trim() ? tableKey(entry.block.trim()) : null;
    if (!block) {
      dropped.push({ reason: "missing-block", entry });
      continue;
    }
    if (!vocab.names.has(block)) {
      dropped.push({ reason: "unknown-block", entry });
      continue;
    }
    const declared = typeof entry.formClass === "string" ? entry.formClass.trim().toLowerCase() : "";
    if (!FORM_CLASSES.includes(declared)) {
      dropped.push({ reason: "unknown-form-class", entry });
      continue;
    }
    const flags = [];
    const formClass = derivedFormClass(block, { cubeSet });
    const clean = { block, role, formClass, whereUsed: [], confidence: "medium", rationale: "", flags };
    if (formClass !== declared) {
      clean.declaredFormClass = declared;
      flags.push("form-class-corrected");
    }
    const whereRaw = Array.isArray(entry.whereUsed) ? entry.whereUsed : [];
    clean.whereUsed = whereRaw
      .filter((w) => typeof w === "string" && w.trim())
      .map((w) => w.trim().toLowerCase());
    if (clean.whereUsed.some((w) => !whereSet.has(w))) flags.push("unknown-where-ref");
    const conf = typeof entry.confidence === "string" ? entry.confidence.trim().toLowerCase() : "";
    if (CONFIDENCES.includes(conf)) clean.confidence = conf;
    else flags.push("default-confidence");
    clean.rationale = typeof entry.rationale === "string" ? entry.rationale.trim() : "";

    const k = `${clean.block}|${clean.role}`;
    if (seen.has(k)) {
      dropped.push({ reason: "duplicate", entry });
      continue;
    }
    seen.add(k);
    kit.push(clean);
  }

  // Surfaces the extractor DECLARES unidentifiable: the recorded color-snap fallback (AC #2).
  const unidentified = (Array.isArray(rawObj?.unidentified) ? rawObj.unidentified : [])
    .filter((u) => u && typeof u === "object" && typeof u.surface === "string" && u.surface.trim())
    .map((u) => ({
      surface: u.surface.trim(),
      reason: typeof u.reason === "string" ? u.reason.trim() : "",
      fallback: { mode: "color-snap" },
    }));

  const stats = {
    in: rows.length,
    kept: kit.length,
    dropped: dropped.length,
    unidentified: unidentified.length,
    flagged: kit.filter((e) => e.flags.length > 0).length,
    formClasses: Object.fromEntries(FORM_CLASSES.map((fc) => [fc, kit.filter((e) => e.formClass === fc).length])),
  };
  return { kit, unidentified, dropped, stats };
}

/** Consumer-side guard: a metered call that returned nothing usable must fail loudly. */
export function assertKit(kit) {
  if (!Array.isArray(kit) || kit.length === 0) {
    throw new Error("kit is empty — the extraction returned nothing usable");
  }
  for (const e of kit) {
    if (!e || !e.block || !e.role || !FORM_CLASSES.includes(e.formClass)) {
      throw new Error(`kit has an invalid entry: ${JSON.stringify(e)}`);
    }
  }
}

/**
 * Value verification (AC #2): check each derived-CUBE entry's render swatch (block→Lab table)
 * against its concept region (validate-mode swatch sample) in chroma-weighted CIE-Lab. A mismatch
 * FLAGS the entry for review — it never rewrites `block` and never falls back to a color-snap.
 * Non-cube entries get `valueCheck: {verdict:null, reason:"non-cube"}` (no Lab row exists; the
 * vocabulary check is their whole validation). Returns NEW entry objects; input is not mutated.
 * @param {object[]} kit  from parseKit
 * @param {Map<string,{lab:number[], cells:number}>} swatches  from sampleRoleSwatches (bare keys)
 * @param {{deltaMax?:number, minCells?:number, chromaWeight?:number, tableLab?:Map<string,number[]>}} [opts]
 * @returns {object[]} kit with `valueCheck` per entry
 */
export function verifyKitValues(kit, swatches, opts = {}) {
  const deltaMax = opts.deltaMax ?? KIT_VERIFY_DELTA_MAX;
  const minCells = opts.minCells ?? MIN_CELLS;
  const w = opts.chromaWeight ?? CHROMA_WEIGHT;
  const labs = opts.tableLab ?? TABLE_LAB;
  const round3 = (n) => Math.round(n * 1000) / 1000;

  return kit.map((e) => {
    if (e.formClass !== "cube") {
      return { ...e, valueCheck: { verdict: null, reason: "non-cube", flaggedForReview: false } };
    }
    const blockLab = labs.get(e.block) ?? null;
    const s = swatches?.get(e.block) ?? null;
    if (!blockLab || !s) {
      return { ...e, valueCheck: { verdict: "no-swatch", flaggedForReview: true } };
    }
    if (s.cells < minCells) {
      return { ...e, valueCheck: { verdict: "thin-sample", cells: s.cells, flaggedForReview: true } };
    }
    const deltaE = round3(weightedDeltaE(s.lab, blockLab, w));
    const verdict = deltaE <= deltaMax ? "verified" : "flagged-mismatch";
    return {
      ...e,
      valueCheck: {
        verdict,
        deltaE,
        cells: s.cells,
        swatchLab: s.lab.map(round3),
        blockLab: blockLab.map(round3),
        flaggedForReview: verdict !== "verified",
      },
    };
  });
}

/**
 * Recognition beats snap (AC #3): for each derived zone-map band (and the roof), the VERIFIED
 * cube kit entry covering it (whereUsed) supplies the band's block; the band's named-space
 * `dominantBlock` maps to it. Only verified entries override — a flagged entry NEVER ships.
 * Highest confidence wins among candidates; first-seen wins a tie; a second band naming a
 * conflicting recognition for the same named block records "skipped-conflict".
 * @param {object[]} kit  from verifyKitValues
 * @param {{bands:{name:string, dominantBlock:string}[], roof:{dominantBlock:string}}} zoneDerived
 * @returns {{overrides:Record<string,string>, rows:{bandName,named,recognized,verdict}[]}}
 */
export function kitOverrides(kit, zoneDerived) {
  const confRank = { high: 0, medium: 1, low: 2 };
  const targets = [
    ...(zoneDerived?.bands ?? []).map((b) => ({ name: b.name, named: b.dominantBlock })),
    ...(zoneDerived?.roof ? [{ name: "roof", named: zoneDerived.roof.dominantBlock }] : []),
  ];
  const overrides = {};
  const rows = [];
  for (const t of targets) {
    const candidates = kit
      .filter((e) => e.formClass === "cube" && e.valueCheck?.verdict === "verified" && e.whereUsed.includes(t.name))
      .sort((a, b) => confRank[a.confidence] - confRank[b.confidence]);
    if (!candidates.length) {
      rows.push({ bandName: t.name, named: t.named, recognized: null, verdict: "no-candidate" });
      continue;
    }
    const recognized = candidates[0].block;
    if (recognized === t.named) {
      rows.push({ bandName: t.name, named: t.named, recognized, verdict: "identity" });
      continue;
    }
    if (t.named in overrides && overrides[t.named] !== recognized) {
      rows.push({ bandName: t.name, named: t.named, recognized, verdict: "skipped-conflict" });
      continue;
    }
    overrides[t.named] = recognized;
    rows.push({ bandName: t.name, named: t.named, recognized, verdict: "override" });
  }
  return { overrides, rows };
}

/**
 * The cottage-proof diff (AC #4): the kit against the old E-21 map. `corrections` = band-covering
 * recognitions that name a DIFFERENT block than the old map (the white_terracotta fix made
 * visible, joined through {@link kitOverrides} rows); `recovered` = kit ingredients absent from
 * the old map's palette (the formerly-dropped fixtures/rails); `unchanged` = kit blocks the old
 * map already had. PURE.
 * @param {object[]} kit
 * @param {{map:{role:string, block:string}[]}} materialMap  the committed E-21 record
 * @param {{rows:object[]}} overridesResult  from kitOverrides
 * @returns {{corrections:object[], recovered:object[], unchanged:string[]}}
 */
export function diffKitVsMap(kit, materialMap, overridesResult) {
  const mapByBlock = new Map((materialMap?.map ?? []).map((r) => [tableKey(r.block), r]));
  const corrections = (overridesResult?.rows ?? [])
    .filter((r) => r.verdict === "override")
    .map((r) => ({
      band: r.bandName,
      old: r.named,
      new: r.recognized,
      oldRole: mapByBlock.get(tableKey(r.named))?.role ?? null,
    }));
  const recovered = [];
  const unchanged = [];
  for (const e of kit) {
    if (mapByBlock.has(e.block)) unchanged.push(e.block);
    else if (!corrections.some((c) => c.new === e.block)) {
      recovered.push({ block: e.block, role: e.role, formClass: e.formClass });
    }
  }
  return { corrections, recovered, unchanged: [...new Set(unchanged)] };
}
