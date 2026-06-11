// KIT EXTRACTION sweep — the E-26 "recognize, don't match" step (T-096-01 / S-096).
//
// For each subject the multimodal model (STRONG tier via the `claude -p` subscription shim —
// never the metered API) enumerates the concept's depicted ingredients as a KIT
// ({block, role, formClass, whereUsed, confidence}), validated against the full survival
// vocabulary (block-vocab.json ← minecraft-data), value-verified in chroma-weighted CIE-Lab
// (flag-for-review, never a silent color-snap), tied to the committed T-092 zone-map bands
// (referenced, never re-derived), and diffed against the old E-21 color-role map.
//
// PURE/LIVE split (project idiom): every decision is in src/form/kit.mjs (unit-tested); this
// runner is the IMPURE leaf — the live shim call, image decode, file I/O.
//
//   node benchmarks/sculpture/kit-extract.mjs                 # live sweep → kit/<subj>.{json,raw.json,md}
//   node benchmarks/sculpture/kit-extract.mjs --offline       # re-validate committed raw replies, no live call
//   node benchmarks/sculpture/kit-extract.mjs --subject=cottage
//
// E-24 Rule 2 (pinned re-runs): the verbatim model reply is committed as <subj>.raw.json;
// --offline reproduces <subj>.json byte-identically from committed inputs alone.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  KIT_SCHEMA, KIT_VERIFY_DELTA_MAX, loadBlockVocab, bandRefsFromZoneRecord, buildKitPrompt,
  parseKit, assertKit, verifyKitValues, kitOverrides, diffKitVsMap,
} from "../../src/form/kit.mjs";
import {
  SAMPLE_GRID_N, estimateBorderColor, sampleRoleSwatches, CHROMA_WEIGHT, MIN_CELLS,
} from "../../src/color/value-select.mjs";
import { gridFromPixels } from "../../src/color/image-grid.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { MODEL_TIERS } from "../../src/config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "kit");

// Subjects are DATA (E-25 Rule 3) — paths identical to durable-skin.mjs SUBJECTS.
const SUBJECTS = [
  {
    key: "cottage",
    concept: "runs/014-vConcept-a-cottage/concept.png",
    map: "material-map/cottage.json",
    zoneMapRecord: "zone-map/cottage.json",
  },
  {
    key: "gatehouse",
    concept: "runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
    map: "material-map/gatehouse.json",
    zoneMapRecord: "zone-map/gatehouse.json",
  },
  { // T-110-01: the E-25 challenge subject's first kit (zone-map/church.json landed the same ticket)
    key: "church",
    concept: "runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png",
    map: "material-map/church.json",
    zoneMapRecord: "zone-map/church.json",
  },
  { // T-116-01: the E-29 fourth subject's first kit (zone-map/barn.json lands the same ticket)
    key: "barn",
    concept: "runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
    map: "material-map/barn.json",
    zoneMapRecord: "zone-map/barn.json",
  },
];

const OFFLINE = process.argv.includes("--offline");
const ONLY = process.argv.find((a) => a.startsWith("--subject="))?.slice("--subject=".length) ?? null;

/** Fence-strip + brace-slice a model reply down to its JSON object (the bridge idiom). */
function extractJson(text) {
  let cleaned = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const lo = cleaned.indexOf("{");
  const hi = cleaned.lastIndexOf("}");
  if (lo >= 0 && hi > lo) cleaned = cleaned.slice(lo, hi + 1);
  return JSON.parse(cleaned);
}

/** One LIVE recognition call: concept PNG + recognition prompt → raw reply object. */
async function callModel(prompt, conceptPath) {
  const { requestTextWithImage } = await import("../../src/sdk-binding.mjs");
  const b64 = (await readFile(conceptPath)).toString("base64");
  const { text } = await requestTextWithImage({
    prompt,
    images: [{ base64: b64, mediaType: "image/png" }],
    model: MODEL_TIERS.strong,
  });
  return extractJson(text);
}

function kitMd(rec) {
  const lines = [
    `# Kit — ${rec.subject} (${rec.schema})`,
    ``,
    `Recognized ingredient kit extracted from the concept (E-26 Rule 1: recognize, don't match).`,
    `Check each line against the picture: \`${rec.generatedFrom.concept}\`.`,
    ``,
    `| block | form | whereUsed | conf | value check | role |`,
    `|---|---|---|---|---|---|`,
  ];
  for (const e of rec.kit) {
    const vc = e.valueCheck;
    const vcs = vc.verdict === null ? "— (non-cube)" :
      vc.verdict === "verified" ? `verified (ΔEw ${vc.deltaE}, raw ${vc.rawDeltaE})` :
      `**${vc.verdict}**${vc.deltaE != null ? ` (ΔEw ${vc.deltaE}, raw ${vc.rawDeltaE})` : ""} ⚑`;
    lines.push(`| \`${e.block}\`${e.flags.length ? " ⚑" : ""} | ${e.formClass}${e.declaredFormClass ? ` (declared ${e.declaredFormClass})` : ""} | ${e.whereUsed.join(", ")} | ${e.confidence} | ${vcs} | ${e.role} |`);
  }
  lines.push(``);
  for (const e of rec.kit) {
    lines.push(`- \`${e.block}\`: ${e.rationale}`);
  }
  if (rec.unidentified.length) {
    lines.push(``, `## Unidentified surfaces (recorded color-snap fallback)`);
    for (const u of rec.unidentified) lines.push(`- ${u.surface} — ${u.reason}`);
  }
  if (rec.diff.corrections.length) {
    lines.push(``, `## Corrections vs the E-21 color-role map`);
    for (const c of rec.diff.corrections) {
      lines.push(`- ${c.band}: \`${c.old}\` → \`${c.new}\` (was "${c.oldRole}")`);
    }
  }
  if (rec.diff.recovered.length) {
    lines.push(``, `## Recovered ingredients (absent from the old map)`);
    for (const r of rec.diff.recovered) lines.push(`- \`${r.block}\` (${r.formClass}) — ${r.role}`);
  }
  if (rec.dropped.length) {
    lines.push(``, `## Dropped rows`);
    for (const d of rec.dropped) lines.push(`- ${d.reason}: \`${JSON.stringify(d.entry).slice(0, 120)}\``);
  }
  return lines.join("\n") + "\n";
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const vocab = loadBlockVocab();
  const summary = [];

  for (const def of SUBJECTS) {
    if (ONLY && def.key !== ONLY) continue;
    const { key } = def;
    const conceptPath = join(HERE, def.concept);
    const rawPath = join(OUT_DIR, `${key}.raw.json`);

    const zoneRecord = JSON.parse(await readFile(join(HERE, def.zoneMapRecord), "utf8"));
    const matMap = JSON.parse(await readFile(join(HERE, def.map), "utf8"));
    const { bandNames, promptBands } = bandRefsFromZoneRecord(zoneRecord);
    const prompt = buildKitPrompt({ subject: key, promptBands });

    let raw;
    if (OFFLINE) {
      if (!existsSync(rawPath)) {
        console.error(`[${key}] --offline: no committed ${key}.raw.json — skipping`);
        continue;
      }
      raw = JSON.parse(await readFile(rawPath, "utf8"));
      console.error(`[${key}] offline: re-validating committed raw reply`);
    } else {
      if (!existsSync(conceptPath)) {
        console.error(`[${key}] no concept at ${conceptPath} — skipping`);
        continue;
      }
      console.error(`[${key}] live: recognizing the kit (strong tier, subscription shim)…`);
      raw = await callModel(prompt, conceptPath);
      await writeFile(rawPath, JSON.stringify(raw, null, 2) + "\n");
    }

    const { kit: parsed, unidentified, dropped, stats } = parseKit(raw, { vocab, bandNames });
    assertKit(parsed);

    // Value verification: the kit's own cube blocks locate their concept regions (the proven
    // T-086 locator). Evidence for line-by-line review, not a decision gate.
    const cubeBlocks = [...new Set(parsed.filter((e) => e.formClass === "cube").map((e) => e.block))];
    const conceptImg = await decodeImage(conceptPath);
    const gridResult = gridFromPixels(conceptImg, {
      whitelist: cubeBlocks, n: SAMPLE_GRID_N, dropColor: estimateBorderColor(conceptImg), cellMeans: true,
    });
    const swatches = sampleRoleSwatches(gridResult, cubeBlocks);
    const { kit, valueParams } = verifyKitValues(parsed, swatches);

    const ov = kitOverrides(kit, zoneRecord.derived);
    const diff = diffKitVsMap(kit, matMap, ov);

    const record = {
      schema: KIT_SCHEMA,
      subject: key,
      generatedFrom: { concept: def.concept, materialMap: def.map, zoneMapRecord: def.zoneMapRecord },
      params: {
        model: MODEL_TIERS.strong, tier: "strong", gridN: SAMPLE_GRID_N,
        deltaMax: KIT_VERIFY_DELTA_MAX, chromaWeight: CHROMA_WEIGHT, minCells: MIN_CELLS,
        ...valueParams, // lightnessOffset (shared concept shading) + offsetSamples
      },
      kit,
      unidentified,
      dropped,
      overrides: ov.overrides,
      overrideRows: ov.rows,
      diff,
      stats: {
        ...stats,
        verified: kit.filter((e) => e.valueCheck.verdict === "verified").length,
        flaggedForReview: kit.filter((e) => e.valueCheck.flaggedForReview).length,
      },
    };
    await writeFile(join(OUT_DIR, `${key}.json`), JSON.stringify(record, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${key}.md`), kitMd(record));

    summary.push({ key, ...record.stats, overrides: Object.keys(ov.overrides).length });
    console.error(
      `[${key}] kept=${stats.kept} (cube=${stats.formClasses.cube} fixture=${stats.formClasses.fixture} ` +
      `rail=${stats.formClasses.rail}) dropped=${stats.dropped} verified=${record.stats.verified} ` +
      `flagged=${record.stats.flaggedForReview} overrides=${JSON.stringify(ov.overrides)}`,
    );
  }

  console.error("\n== kit-extract summary ==");
  for (const s of summary) {
    console.error(`  ${s.key.padEnd(10)} kept=${s.kept} dropped=${s.dropped} verified=${s.verified} flagged=${s.flaggedForReview} overrides=${s.overrides}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
