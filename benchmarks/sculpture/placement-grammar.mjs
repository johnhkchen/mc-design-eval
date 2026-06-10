// IMPURE RUNNER — the T-098 placement grammar over the durable skin (S-098, epic E-26).
//
// THE PIPELINE ORDER (AC #2, recorded here and in every record this file writes):
//
//   durable-skin (value-true T-086 → kit overrides T-096 → seal → concept-derived zone map T-092 →
//   full-shell exposure zone-fill T-090 → secondaries splat → coherence T-087 → terminal gates T-088)
//   → PLACEMENT GRAMMAR (this runner: frame lines → field/course re-fill → refill-proof + re-gates)
//   → T-099 (opening treatments — the grammar only BINDS each opening instance, it never places one)
//
// The grammar consumes the COMMITTED durable-skin artifact + record and the committed kit; it never
// re-runs buildSkin and never touches an E-24/E-25 record. The pure core (src/form/placement-grammar
// .mjs) paints the kit's frame block on the structural frame lines (floor-line beams, corner posts,
// eave beams + gable rakes), RESPECTING kept declared secondaries, then realizes fields + roof
// courses by running zoneFill itself — `frameRefilled` MUST be 0 (the T-090-01 declared-secondaries
// contract, proven not assumed), and the T-088 coverage gate + T-090 band evidence are re-asserted
// on the grammar output. A failing gate THROWS: the record says pipeline-failed, nothing passes
// silently (E-25 Rule 6).
//
// DETERMINISM (E-24 Rule 2): no LLM on this path; the deterministic core runs TWICE per live
// invocation and the two final artifacts must be byte-identical (sha256 recorded, re-checked by
// --offline). GL renders are EVIDENCE, never inputs to a decision — before/after at the four CONFIG
// gate azimuths (MULTI_ANGLE_GATE, E-25 Rule 4: never a runner flag).
//
// GENERALIZATION (E-25 Rule 3): no subject keys, constants, branches, or thresholds in this file —
// subjects come from the durable-skin registry; bindings come from the committed kit; thresholds
// mirror the durable-skin terminal gates 1:1.
//
// GL — run on demand, NOT in `npm test`:
//   npm run grammar:cottage                # grammar + gates + renders + frames
//   npm run grammar:gatehouse
//   npm run grammar:cottage -- --offline   # re-assert the committed record + artifact hash, no GL
//
// Writes placement-grammar/<subj>.{json,md} (committed) + placement-grammar/<subj>/artifact.json
// (committed) + per-angle PNGs (gitignored) + pr/assets/frames/grammar-<subj>-{before,after}.png
// (committed evidence sheets).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { zonesFromBands } from "../../src/view/zone-map.mjs";
import { surfaceZoneHistogram, dominantCoverage } from "../../src/view/zone-fill.mjs";
import { applyPaint } from "../../src/view/face-paint.mjs";
import { coverageGate, DEFAULT_COVERAGE_THRESHOLD } from "../../src/view/face-resemblance.mjs";
import { placementGrammar, GRAMMAR_SCHEMA } from "../../src/form/placement-grammar.mjs";
import { composeSheet, resampleRgba, RESEMBLANCE_DEFAULTS } from "../../src/form/resemblance.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "placement-grammar");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

// the durable-skin terminal-gate thresholds, mirrored 1:1 (stage 9 there; re-asserted here because
// the grammar repaints the shell those gates measured — not exported from durable-skin to keep this
// ticket's footprint on E-24 files at zero)
const COVERAGE_THRESHOLD = DEFAULT_COVERAGE_THRESHOLD;
const ROOF_BAND_TARGET = 0.9;
const UPPER_RESIDUE_MAX = 0.05;

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** T-090 band evidence on a dominantCoverage census (durable-skin stage 9's arithmetic). */
function bandEvidence(cov, policy) {
  const own = (zone) => new Set([policy[zone].dominant, ...(policy[zone].preserve ?? [])].map(bareBlock));
  const fraction = (zone, mats) => {
    const z = cov[zone];
    if (!z || !z.total) return null;
    const n = Object.entries(z.byBlock).reduce((a, [b, c]) => a + (mats.has(b) ? c : 0), 0);
    return Math.round((n / z.total) * 1000) / 1000;
  };
  const wallZones = Object.keys(policy).filter((z) => z !== "roof");
  const wallForeignResidue = {};
  for (const z of wallZones) {
    const mine = own(z);
    const foreign = new Set(wallZones.filter((w) => w !== z)
      .map((w) => bareBlock(policy[w].dominant)).filter((b) => !mine.has(b)));
    wallForeignResidue[z] = fraction(z, foreign);
  }
  return { roofMaterialsFraction: policy.roof ? fraction("roof", own("roof")) : null, wallForeignResidue };
}

/** The deterministic core for one subject: committed inputs → grammar → gated final artifact. */
async function runGrammar(def) {
  const skinRecPath = join(HERE, "durable-skin", `${def.key}.json`);
  const skinArtPath = join(HERE, "durable-skin", def.key, "artifact.json");
  const kitPath = def.kitRecord && join(HERE, def.kitRecord);
  for (const [what, p] of [["durable-skin record", skinRecPath], ["durable-skin artifact", skinArtPath]]) {
    if (!existsSync(p)) throw new Error(`${what} absent (${p}) — run npm run skin:${def.key} first`);
  }
  if (!kitPath || !existsSync(kitPath)) {
    throw new Error(`no committed kit for ${def.key} — the grammar binds KIT entries (run kit:extract)`);
  }
  const skinRec = JSON.parse(await readFile(skinRecPath, "utf8"));
  const build = JSON.parse(await readFile(skinArtPath, "utf8"));
  assertArtifact(build);
  const kitRec = JSON.parse(await readFile(kitPath, "utf8"));
  if (kitRec.schema !== "kit/v1") throw new Error(`${def.kitRecord} is not a kit/v1 record`);
  if (skinRec.zoneMap?.source !== "concept" || !skinRec.zoneMap.bands) {
    throw new Error(`durable-skin record has no concept-derived zone map (source=${skinRec.zoneMap?.source}) — ` +
      `the grammar binds to the T-092 derived bands, not the prior`);
  }

  // geometry + the derived zone map (the same composition buildSkin records)
  const occ = artifactOccupancy(build);
  const sz = structuralZones(occ, def.zoneOpts ?? {});
  const zb = zonesFromBands({
    bands: skinRec.zoneMap.bands, roof: skinRec.zoneMap.roof,
    roofKeys: sz.roofKeys, upperTop: sz.upperTop,
  });
  const bandNames = skinRec.zoneMap.bands.map((b) => b.name);

  // the one renaming point: value-true substitution ∘ kit overrides (buildSkin's subK, from the record)
  const combined = { ...(skinRec.valueTrue?.substitution ?? {}), ...(kitRec.overrides ?? {}) };
  const sub = (b) => combined[b] ?? b;

  const policy = skinRec.fill.policy; // SHIPPED space (recorded by buildSkin after mapPolicy)
  const grammar = placementGrammar(occ, {
    kit: kitRec.kit, bandNames, policy, zoneOf: zb.zoneOf,
    floorLines: sz.floorLines, upperTop: sz.upperTop, roofKeys: sz.roofKeys, sub,
  });

  // --- GATES (deterministic; a failing grammar writes no passing record) -------------------------
  if (!grammar.shipped.frame) {
    throw new Error(`kit binds no frame block (skipped: ${JSON.stringify(grammar.bindings.skipped)}) — ` +
      `the grammar milestone requires a trim-tagged cube entry`);
  }
  if (grammar.frameRefilled !== 0) {
    throw new Error(`fill-survival VIOLATED: ${grammar.frameRefilled} frame cells refilled — the frame ` +
      `block is not an honored declared secondary (preconditions: ${JSON.stringify(grammar.preconditions)})`);
  }
  for (const [band, ok] of Object.entries(grammar.preconditions.frameInPreserve)) {
    if (ok === false) throw new Error(`frame block ${grammar.shipped.frame} undeclared in ${band}'s policy — T-090-01 contract broken`);
  }
  for (const [zone, ok] of Object.entries(grammar.preconditions.bindingAgreesWithPolicy)) {
    if (ok === false) throw new Error(`kit binding for ${zone} disagrees with the shipped zone dominant — wiring bug, not a result`);
  }
  const final = applyPaint(build, grammar.placements);
  assertArtifact(final);
  const cov = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(final), zb.zoneOf, { skin: "exposure" }), policy);
  const gate = coverageGate(cov, { threshold: COVERAGE_THRESHOLD, zones: policy });
  if (!gate.passed) {
    throw new Error(`coverage gate FAILED after the grammar: ` +
      gate.failures.map((f) => `${f.zone} ${f.dominant}=${f.fraction} < ${COVERAGE_THRESHOLD}`).join(", "));
  }
  const bands = bandEvidence(cov, policy);
  const worstResidue = Math.max(0, ...Object.values(bands.wallForeignResidue).filter((v) => v != null));
  if ((bands.roofMaterialsFraction ?? 0) < ROOF_BAND_TARGET || worstResidue > UPPER_RESIDUE_MAX) {
    throw new Error(`band acceptance FAILED after the grammar: roof ${bands.roofMaterialsFraction} ` +
      `(>= ${ROOF_BAND_TARGET}), residue ${JSON.stringify(bands.wallForeignResidue)} (max ${UPPER_RESIDUE_MAX})`);
  }
  return { skinRec, build, grammar, final, coverage: cov, gate, bands, bandNames, policy };
}

/** Render an artifact at the four config gate azimuths; compose a labeled-order 4-panel sheet. */
async function renderSheet(artifact, label, subjDir) {
  const { renderViews } = await import("../../src/view/multi-angle.mjs");
  const renders = await renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], {
    outDir: subjDir, label: (a) => `${label}-${a.replace(/\+/g, "p").replace(/-/g, "m")}`,
  });
  const P = RESEMBLANCE_DEFAULTS.panel;
  const panels = [];
  for (const r of renders) panels.push(resampleRgba(await decodeImage(r.path), P, P, "aspect"));
  const sheet = composeSheet(panels, { gutter: RESEMBLANCE_DEFAULTS.gutter });
  const sheetPath = join(subjDir, `${label}-sheet.png`);
  await writeFile(sheetPath, encodeRgbaToPng(sheet.data, sheet.w, sheet.h));
  return { renders: renders.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, "") })), sheetPath };
}

function markdown(def, rec) {
  const g = rec.grammar;
  const lines = [
    `# placement-grammar — ${def.key}`, "",
    `Pipeline order: **${rec.pipelineOrder}**`, "",
    `Bindings (named → shipped): frame ${g.bindings.frame} → **${g.shipped.frame}**; ` +
    rec.bandNames.map((b) => `${b} ${g.bindings.panels[b]} → ${g.shipped.panels[b]}`).join("; ") +
    `; course ${g.bindings.course} → ${g.shipped.course}.`, "",
    `Frame lines: ${g.frame.counts.cornerPost} cornerPost + ${g.frame.counts.roofline} roofline + ` +
    `${g.frame.counts.floorLine} floorLine of ${g.frame.counts.wall} wall cells — ` +
    `${g.frame.painted} painted, ${g.frame.respected} respected (kept declared secondaries), ` +
    `${g.frame.alreadyFrame} already frame.`, "",
    `Fill (fields + courses through zoneFill): ${g.fill.placements.length} filled, ${g.fill.kept} kept; ` +
    `**frameRefilled ${g.frameRefilled}** (the T-090-01 survival proof).`, "",
    `Openings bound for T-099: ${g.openings.length} instances — ` +
    (g.openings.map((o) => `${o.dir} ${o.kind}→${o.treatment ?? "∅"}`).join(", ") || "none") + ".", "",
    `Coverage after grammar: ` + Object.entries(rec.coverage)
      .map(([z, c]) => `${z} ${c.dominant}=${c.dominantFraction == null ? "?" : Math.round(c.dominantFraction * 100) + "%"}`)
      .join(", ") + ` → gate ${rec.coverageGate.passed ? "PASS" : "FAIL"}; roof materials ` +
    `${rec.bands.roofMaterialsFraction}; residue ` +
    Object.entries(rec.bands.wallForeignResidue).map(([z, v]) => `${z}=${v ?? "n/a"}`).join(", ") + ".", "",
    `Reproducible: double-run byte-identical; artifact sha256 \`${rec.reproducible.sha256}\`.`, "",
    rec.frames.length ? `Evidence: ${rec.frames.map((f) => `\`${f}\``).join(", ")} (4 gate azimuths each).` : "",
  ];
  return lines.join("\n") + "\n";
}

async function main() {
  const argv = process.argv.slice(2);
  const subjectKey = argv[argv.indexOf("--subject") + 1];
  const def = SUBJECTS[subjectKey];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const artPath = join(subjDir, "artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(artPath)) {
      throw new Error(`committed record/artifact absent — run npm run grammar:${def.key} first`);
    }
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const checks = {
      schema: rec.schema === GRAMMAR_SCHEMA,
      sha: sha256(artBytes) === rec.reproducible?.sha256,
      frameRefilled: rec.grammar?.frameRefilled === 0,
      gate: rec.coverageGate?.passed === true,
      bands: (rec.bands?.roofMaterialsFraction ?? 0) >= ROOF_BAND_TARGET &&
        Object.values(rec.bands?.wallForeignResidue ?? {}).every((v) => v == null || v <= UPPER_RESIDUE_MAX),
      framePainted: (rec.grammar?.frame?.painted ?? 0) + (rec.grammar?.frame?.alreadyFrame ?? 0) > 0,
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `frameRefilled ${checks.frameRefilled ? "0" : "VIOLATED"}; coverage gate ${checks.gate ? "passed" : "VIOLATED"}; ` +
      `bands ${checks.bands ? "OK" : "VIOLATED"}; frame ${checks.framePainted ? "present" : "ABSENT"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  let r1;
  try {
    // THE REPRODUCIBILITY PROOF (E-24 Rule 2): the deterministic core twice, byte-equal or no record.
    r1 = await runGrammar(def);
    const r2 = await runGrammar(def);
    if (JSON.stringify(r1.final) !== JSON.stringify(r2.final)) {
      throw new Error("NON-DETERMINISTIC: two in-process runs produced different artifacts");
    }
  } catch (e) {
    await writeFile(recPath, JSON.stringify({
      schema: GRAMMAR_SCHEMA, subject: def.key, status: "pipeline-failed", error: e.message,
    }, null, 2) + "\n");
    console.error(`[${def.key}] PIPELINE FAILED: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  const g = r1.grammar;
  console.error(`[${def.key}] bindings: frame ${g.bindings.frame}→${g.shipped.frame}, ` +
    r1.bandNames.map((b) => `${b} ${g.shipped.panels[b]}`).join(", ") + `, course ${g.shipped.course}` +
    (g.bindings.skipped.length ? ` (skipped: ${g.bindings.skipped.map((s) => s.feature).join(", ")})` : ""));
  console.error(`[${def.key}] frame: ${g.frame.counts.cornerPost}+${g.frame.counts.roofline}+` +
    `${g.frame.counts.floorLine} cells (posts+crown+beams) — ${g.frame.painted} painted, ` +
    `${g.frame.respected} respected, ${g.frame.alreadyFrame} already`);
  console.error(`[${def.key}] fill: ${g.fill.placements.length} filled, ${g.fill.kept} kept; frameRefilled ${g.frameRefilled}`);
  console.error(`[${def.key}] openings bound: ${g.openings.map((o) => `${o.dir} ${o.kind}→${o.treatment ?? "∅"}`).join(", ") || "none"}`);
  console.error(`[${def.key}] coverage: ` + Object.entries(r1.coverage)
    .map(([z, c]) => `${z} ${c.dominant}=${Math.round((c.dominantFraction ?? 0) * 100)}%`).join(", ") +
    ` → gate PASS; roof materials ${r1.bands.roofMaterialsFraction}`);

  const artJson = JSON.stringify(r1.final, null, 2) + "\n";
  await writeFile(artPath, artJson);

  // --- renders: before (durable skin) / after (grammar) at the 4 CONFIG azimuths (evidence) ------
  const frames = [];
  let renders = null;
  try {
    const before = await renderSheet(r1.build, "before", subjDir);
    const after = await renderSheet(r1.final, "after", subjDir);
    await copyFile(before.sheetPath, join(FRAMES_DIR, `grammar-${def.key}-before.png`));
    await copyFile(after.sheetPath, join(FRAMES_DIR, `grammar-${def.key}-after.png`));
    frames.push(`pr/assets/frames/grammar-${def.key}-before.png`, `pr/assets/frames/grammar-${def.key}-after.png`);
    renders = { before: before.renders, after: after.renders, azimuths: [...MULTI_ANGLE_GATE.azimuths] };
    console.error(`[${def.key}] frames: ${frames.join(", ")}`);
  } catch (e) {
    console.error(`renders unavailable (${e.message}) — evidence only, never the gate`);
  }

  const record = {
    schema: GRAMMAR_SCHEMA,
    subject: def.key,
    pipelineOrder: "durable-skin → placement-grammar → T-099 (openings)",
    inputs: {
      build: `durable-skin/${def.key}/artifact.json`,
      skinRecord: `durable-skin/${def.key}.json`,
      kit: def.kitRecord,
      zoneMapBands: r1.bandNames,
    },
    grammar: {
      bindings: g.bindings, shipped: g.shipped,
      frame: { counts: g.frame.counts, painted: g.frame.painted, respected: g.frame.respected, alreadyFrame: g.frame.alreadyFrame },
      fill: { placements: g.fill.placements.length, kept: g.fill.kept, byZone: g.fill.byZone },
      frameRefilled: g.frameRefilled,
      preconditions: g.preconditions,
      fields: g.fields.map((f) => ({ dir: f.dir, instances: f.instances.length, cells: f.instances.reduce((a, i) => a + i.cells, 0) })),
      openings: g.openings.map((o) => ({ dir: o.dir, kind: o.kind, bbox: o.bbox, cells: o.cells, dressing: o.dressing, treatment: o.treatment, candidates: o.candidates })),
      placements: g.placements.length,
    },
    coverage: r1.coverage,
    coverageGate: { threshold: COVERAGE_THRESHOLD, ...r1.gate },
    bands: { ...r1.bands, roofTarget: ROOF_BAND_TARGET, residueMax: UPPER_RESIDUE_MAX },
    reproducible: { doubleRun: true, sha256: sha256(artJson) },
    renders,
    frames,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), markdown(def, record));
  console.error(`[${def.key}] record: ${recPath.replace(ROOT, "")}`);
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exitCode = 1;
});
