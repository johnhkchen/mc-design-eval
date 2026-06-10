// IMPURE RUNNER — the multi-angle same-object gate (T-093-01, story S-093, epic E-25).
//
// E-22 judges ONE shared 3/4 view; the defects that make builds read wrong live on the views that gate
// never renders. This gate renders the build at the FOUR config azimuths (src/config.mjs
// MULTI_ANGLE_GATE — 45/135/225/315° at the 30° contract elevation, 512² contract resolution; E-25
// Rule 4: the set is config — this runner has NO flag that drops an angle, changes the elevation, or
// lowers the resolution), runs the T-088 coverage PRECONDITION per view on that view's own visible
// skin (the diagonal projection census — zero new instruments), judges each surviving view against the
// immutable concept with the fixed v2 prompt, aggregates with the unit-tested pure rule, and emits the
// CONTACT SHEET as the verdict artifact (concept | 4 labeled views — Rule 1: no number substitutes for
// the sheet). A missing view or an unparsed verdict is a REFUSAL: no pass/fail is produced at all.
//
// Zones are the T-092 derivation re-run from the same committed inputs (concept + material map +
// structural geometry), prior policy as the recorded fallback; the policy is mapped into the
// artifact's SHIPPED palette (a value-true substitution is applied only where the artifact's manifest
// actually carries the substituted block — so the pre-substitution proof baseline is censused in its
// own palette, not failed on naming).
//
// PURITY: prompt/parser/aggregation/captions are src/form/multi-angle-gate.mjs (unit-tested); panel
// math is src/form/resemblance.mjs composeSheet. This file owns the impure edges: GL renders, decode,
// the metered judge calls, label drawing, file I/O, exit codes.
//
//   npm run gate:multi -- --subject cottage                       # the durable-skin artifact (label "current")
//   npm run gate:multi -- --subject cottage --label baseline \
//       --artifact concept-materials/cottage/after-artifact.json  # the proof baseline
//   npm run gate:multi -- --subject cottage --offline             # re-assert the committed record (no GL/judge)
//
// Exit codes: 0 = decided PASS (or --offline record valid) · 1 = decided FAIL · 2 = REFUSAL.
// Writes multi-angle/<subj>-<label>.{json,md} (committed) + per-view PNGs (gitignored) + the sheet →
// pr/assets/frames/multi-angle-<subj>-<label>.png (committed).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { MULTI_ANGLE_GATE, PHASE1_MODEL_ID } from "../../src/config.mjs";
import {
  buildMultiAngleViewPrompt, parseMultiAngleVerdict, aggregateMultiAngle, viewOutcomeLabel,
  MULTI_ANGLE_GATE_SCHEMA,
} from "../../src/form/multi-angle-gate.mjs";
import {
  resampleRgba, silhouetteToRgba, composeTriptych, composeSheet, RESEMBLANCE_DEFAULTS,
} from "../../src/form/resemblance.mjs";
import { VIEW_ANGLES, resolveAngle, renderViews } from "../../src/view/multi-angle.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { surfaceZoneHistogram, dominantCoverage } from "../../src/view/zone-fill.mjs";
import { coverageGate, DEFAULT_COVERAGE_THRESHOLD } from "../../src/view/face-resemblance.mjs";
import { layerCounts, zonesFromBands } from "../../src/view/zone-map.mjs";
import { extractConceptZoneMap } from "../../src/color/band-profile.mjs";
import {
  SAMPLE_GRID_N, estimateBorderColor, sampleRoleSwatches, selectValueTrueMap,
} from "../../src/color/value-select.mjs";
import { gridFromPixels } from "../../src/color/image-grid.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { bareList } from "../../src/view/reference-quantize.mjs";
import { allowedPalette } from "../../src/view/palette-cans.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "multi-angle");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");
const RENDER_CONTRACT = Object.freeze({ width: 512, height: 512, elevationDeg: 30 });

const bare = (id) => String(id).replace(/^minecraft:/, "");

// node-canvas resolves only from the render package (resemblance.mjs precedent); labels are cosmetic.
let _canvasPkg = null;
function canvasLib() {
  if (_canvasPkg !== null) return _canvasPkg;
  try {
    const req = createRequire(join(ROOT, "render", "src", "headless-canvas.mjs"));
    _canvasPkg = req("canvas");
  } catch {
    _canvasPkg = false;
  }
  return _canvasPkg;
}

/** Encode a composed sheet, drawing a caption bar under each panel when node-canvas is available. */
function encodeLabeledSheet(composed, labels, panelW, gutter) {
  const lib = canvasLib();
  if (!lib) return { buf: encodeRgbaToPng(composed.data, composed.w, composed.h), labeled: false };
  const barH = 28;
  const c = lib.createCanvas(composed.w, composed.h + barH);
  const ctx = c.getContext("2d");
  const img = lib.createImageData
    ? new lib.ImageData(new Uint8ClampedArray(composed.data), composed.w, composed.h)
    : ctx.createImageData(composed.w, composed.h);
  if (!lib.createImageData && img.data.set) img.data.set(composed.data);
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = "#282828";
  ctx.fillRect(0, composed.h, composed.w, barH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "13px sans-serif";
  ctx.textBaseline = "middle";
  labels.forEach((label, i) => {
    ctx.fillText(label, i * (panelW + gutter) + 8, composed.h + barH / 2, panelW - 16);
  });
  return { buf: c.toBuffer("image/png"), labeled: true };
}

/** The T-092 zone derivation, re-run from the same committed inputs; prior policy as recorded fallback. */
function deriveZones({ occ, conceptImg, matMap, fallbackPolicy }) {
  const sz = structuralZones(occ, {});
  const gridResult = gridFromPixels(conceptImg, {
    whitelist: bareList(matMap.palette), n: SAMPLE_GRID_N,
    dropColor: estimateBorderColor(conceptImg), cellMeans: true,
  });
  const extracted = extractConceptZoneMap({
    gridResult, floorLines: sz.floorLines, layerCounts: layerCounts(occ),
    upperTop: sz.upperTop, materialMap: matMap,
  });
  if (extracted.readable) {
    const zb = zonesFromBands({ bands: extracted.bands, roof: extracted.roof, roofKeys: sz.roofKeys, upperTop: sz.upperTop });
    return { zoneOf: zb.zoneOf, zones: zb.zones, source: "concept", reason: null, gridResult };
  }
  return {
    zoneOf: sz.zoneOf,
    zones: Object.fromEntries(Object.entries(fallbackPolicy).map(([z, p]) => [z, { dominant: bare(p.dominant), preserve: p.preserve.map(bare) }])),
    source: "prior-fallback", reason: extracted.reason, gridResult,
  };
}

/** Map a NAMED-space policy into the artifact's SHIPPED palette (see module header). */
function policyInShippedPalette(zones, { matMap, gridResult, artifact }) {
  const namedManifest = bareList(matMap.palette);
  const swatches = sampleRoleSwatches(gridResult, namedManifest);
  const rows = selectValueTrueMap(matMap.map, swatches);
  const substitution = Object.fromEntries(rows.filter((r) => r.switched).map((r) => [r.named, r.chosen]));
  const allowed = allowedPalette(artifact);
  const ship = (b) => (substitution[bare(b)] && allowed.has(substitution[bare(b)])) ? substitution[bare(b)] : bare(b);
  const out = Object.fromEntries(Object.entries(zones).map(([z, p]) => [z, {
    dominant: ship(p.dominant), preserve: [...new Set((p.preserve ?? []).map(ship))],
  }]));
  return { zones: out, substitution };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  const subjectKey = arg("--subject");
  const def = SUBJECTS[subjectKey];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const label = arg("--label") ?? "current";
  const artifactRel = arg("--artifact") ?? `durable-skin/${def.key}/artifact.json`;
  const offline = argv.includes("--offline");
  const slug = `${def.key}-${label}`;
  const recPath = join(OUT_DIR, `${slug}.json`);
  const sheetFrame = join(FRAMES_DIR, `multi-angle-${slug}.png`);

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run gate:multi -- --subject ${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const checks = {
      schema: rec.schema === MULTI_ANGLE_GATE_SCHEMA,
      contract: JSON.stringify(rec.contract?.azimuths) === JSON.stringify([...MULTI_ANGLE_GATE.azimuths]) &&
        rec.contract?.width === RENDER_CONTRACT.width && rec.contract?.gapBudget === MULTI_ANGLE_GATE.gapBudget,
      views: Array.isArray(rec.views) && rec.views.length === MULTI_ANGLE_GATE.azimuths.length,
      shortCircuit: (rec.views ?? []).every((v) => v.coverage?.passed !== false || v.verdict === null),
      aggregate: rec.aggregate && (rec.aggregate.decided === true) !== (typeof rec.aggregate.refusal === "string"),
      sheet: typeof rec.sheet === "string" && existsSync(join(ROOT, rec.sheet)),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${slug}: schema ${checks.schema ? "OK" : "BAD"}; contract ${checks.contract ? "OK" : "VIOLATED"}; ` +
      `views ${checks.views ? "OK" : "BAD"}; T-088 short-circuit ${checks.shortCircuit ? "OK" : "VIOLATED"}; ` +
      `aggregate ${checks.aggregate ? "well-formed" : "MALFORMED"}; sheet ${checks.sheet ? "present" : "MISSING"} — ` +
      `recorded outcome: ${rec.aggregate?.decided ? (rec.aggregate.passed ? "PASS" : "FAIL") : `REFUSAL (${rec.aggregate?.refusal})`}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });
  const viewsDir = join(OUT_DIR, slug);
  await mkdir(viewsDir, { recursive: true });

  // --- immutable inputs ----------------------------------------------------------------------------
  const conceptPath = join(HERE, def.concept);
  if (!existsSync(conceptPath)) throw new Error(`concept image absent: ${conceptPath} (immutable reference)`);
  const artifactPath = join(HERE, artifactRel);
  const artifactJson = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactJson);
  assertArtifact(artifact);
  const matMap = JSON.parse(await readFile(join(HERE, def.map), "utf8"));
  const conceptImg = await decodeImage(conceptPath);
  const occ = artifactOccupancy(artifact);

  // --- zones (T-092 reuse) + the shipped-palette policy ---------------------------------------------
  const derived = deriveZones({ occ, conceptImg, matMap, fallbackPolicy: def.policy });
  const { zones: zonesShipped, substitution } = policyInShippedPalette(derived.zones, {
    matMap, gridResult: derived.gridResult, artifact,
  });
  console.error(`[${slug}] zones: ${derived.source}${derived.reason ? ` (${derived.reason})` : ""} — ` +
    Object.entries(zonesShipped).map(([z, p]) => `${z}=${p.dominant}`).join(", "));

  // --- mesh silhouettes (form reference that rotates; GLB is gitignored — placeholder when absent) --
  const glbPath = join(HERE, def.glb);
  let mesh = null;
  if (existsSync(glbPath)) mesh = loadMeshFromGlb(await readFile(glbPath));
  else console.error(`WARN: GLB absent (${glbPath}) — mesh panel will be a placeholder`);

  // --- the four renders (E-25 Rule 4: all of them, contract lens; any failure = REFUSAL) ------------
  const azimuths = MULTI_ANGLE_GATE.azimuths;
  let renders = null, renderError = null;
  try {
    renders = await renderViews(artifact, [...azimuths], { outDir: viewsDir });
    for (const r of renders) {
      if (!r?.path || !existsSync(r.path) || !(r.bytes > 0)) throw new Error(`render missing for ${r?.angle}`);
    }
  } catch (e) {
    renderError = e.message;
  }

  const P = RESEMBLANCE_DEFAULTS.panel;
  const conceptPanel = resampleRgba(conceptImg, P, P, "aspect");
  const grey = { w: P, h: P, data: new Uint8Array(P * P * 4).fill(235) };

  const views = [];
  const panels = [conceptPanel];
  if (renderError) {
    console.error(`[${slug}] RENDER FAILED — the gate refuses to produce a verdict: ${renderError}`);
    for (const a of azimuths) {
      views.push({ angle: a, azimuthDeg: VIEW_ANGLES[a].azimuthDeg, rendered: false, render: { error: renderError }, coverage: null, verdict: null, judge: null });
      panels.push(grey);
    }
  } else {
    for (const r of renders) {
      const a = r.angle;
      const az = VIEW_ANGLES[a].azimuthDeg;
      // T-088 PRECONDITION on THIS view's visible skin: the diagonal projection census.
      const cov = coverageGate(
        dominantCoverage(surfaceZoneHistogram(occ, derived.zoneOf, { faces: [a], skin: "projection" }), zonesShipped),
        { threshold: DEFAULT_COVERAGE_THRESHOLD, zones: zonesShipped });
      const viewImg = await decodeImage(r.path);
      const viewPanel = resampleRgba(viewImg, P, P, "aspect");
      panels.push(viewPanel);
      const view = {
        angle: a, azimuthDeg: az, rendered: true, render: { path: r.path.replace(ROOT, "") },
        coverage: { passed: cov.passed, threshold: cov.threshold, byZone: cov.byZone },
        verdict: null, judge: null,
      };
      if (!cov.passed) {
        // the T-088 short-circuit: the judge is NEVER called; the record must show that.
        view.reason = "coverage";
        console.error(`[${slug}] ${a} (${az}°): coverage REJECT — ` +
          cov.failures.map((f) => `${f.zone} ${f.dominant}=${f.fraction}`).join(", ") + " — judge not called");
      } else {
        const meshPanel = mesh
          ? resampleRgba(silhouetteToRgba(rasterizeSilhouette(mesh, { view: resolveAngle(a) })), P, P, "aspect")
          : grey;
        const triptych = composeTriptych([conceptPanel, meshPanel, viewPanel], { gutter: RESEMBLANCE_DEFAULTS.gutter });
        const triptychBuf = encodeRgbaToPng(triptych.data, triptych.w, triptych.h);
        await writeFile(join(viewsDir, `judged-${a.replace(/[+]/g, "p").replace(/-/g, "m")}.png`), triptychBuf);
        const { requestTextWithImage } = await import("../../src/sdk-binding.mjs");
        const { text, raw } = await requestTextWithImage({
          prompt: buildMultiAngleViewPrompt(a, az),
          images: [{ data: triptychBuf, mediaType: "image/png" }],
          model: PHASE1_MODEL_ID,
        });
        view.judge = {
          model: PHASE1_MODEL_ID,
          usage: raw?.usage ? { input_tokens: raw.usage.input_tokens, output_tokens: raw.usage.output_tokens, cost_usd: raw.total_cost_usd ?? null } : null,
        };
        try {
          view.verdict = parseMultiAngleVerdict(text);
        } catch (e) {
          view.unparsed = true;
          view.parseError = e.message;
          view.rawReply = typeof text === "string" ? text.slice(0, 400) : null;
          console.error(`[${slug}] ${a}: UNPARSED judge reply — ${e.message}`);
        }
        if (view.verdict) {
          console.error(`[${slug}] ${a} (${az}°): ${view.verdict.verdict}` +
            (view.verdict.gaps.length ? ` — ${view.verdict.gaps.map((g) => `${g.severity} ${g.attribute}@${g.region}`).join("; ")}` : ""));
        }
      }
      views.push(view);
    }
  }

  // --- the pure aggregate (REFUSE / DECIDE) ----------------------------------------------------------
  const aggregate = aggregateMultiAngle(views.map((v) => ({
    angle: v.angle, rendered: v.rendered, coverage: v.coverage, verdict: v.verdict, unparsed: v.unparsed,
  })));

  // --- THE CONTACT SHEET (the verdict artifact — Rule 1) ----------------------------------------------
  const sheetComposed = composeSheet(panels, { gutter: RESEMBLANCE_DEFAULTS.gutter });
  const labels = ["concept", ...views.map((v) => `${v.angle} ${v.azimuthDeg}° — ${viewOutcomeLabel(v)}`)];
  const { buf: sheetBuf, labeled } = encodeLabeledSheet(sheetComposed, labels, P, RESEMBLANCE_DEFAULTS.gutter);
  const sheetPath = join(OUT_DIR, `${slug}-sheet.png`);
  await writeFile(sheetPath, sheetBuf);
  await copyFile(sheetPath, sheetFrame);

  // --- the record + md ---------------------------------------------------------------------------------
  const record = {
    schema: MULTI_ANGLE_GATE_SCHEMA,
    subject: def.key,
    label,
    artifact: { path: `benchmarks/sculpture/${artifactRel}`, sha256: createHash("sha256").update(artifactJson).digest("hex") },
    contract: {
      azimuths: [...azimuths], elevationDeg: RENDER_CONTRACT.elevationDeg,
      width: RENDER_CONTRACT.width, height: RENDER_CONTRACT.height,
      gapBudget: MULTI_ANGLE_GATE.gapBudget, coverageThreshold: DEFAULT_COVERAGE_THRESHOLD,
      note: "the azimuth set/elevation/resolution are CONFIG (E-25 Rule 4) — this runner has no flag to change them",
    },
    zones: { source: derived.source, reason: derived.reason, policy: zonesShipped, substitutionApplied: substitution },
    views,
    aggregate,
    sheet: sheetFrame.replace(ROOT, ""),
    labeled,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${slug}.md`), recordMd(record));

  const outcome = aggregate.decided ? (aggregate.passed ? "PASS" : "FAIL") : `REFUSAL (${aggregate.refusal})`;
  console.error(`\n[${slug}] verdict: ${outcome}` +
    (aggregate.decided ? ` — gaps ${aggregate.gapCount}/${aggregate.gapBudget}, failures ${JSON.stringify(aggregate.failures)}` : ""));
  console.error(`✓ wrote ${recPath} + sheet ${record.sheet}`);
  process.exitCode = aggregate.decided ? (aggregate.passed ? 0 : 1) : 2;
}

function recordMd(r) {
  const viewRows = r.views.map((v) => {
    const covCell = v.coverage
      ? (v.coverage.passed ? "pass" : Object.entries(v.coverage.byZone).map(([z, c]) => `${z} ${c.dominant}=${c.fraction ?? "?"}`).join("<br>"))
      : "—";
    const verdictCell = v.verdict
      ? `${v.verdict.verdict}${v.verdict.gaps.length ? `<br>${v.verdict.gaps.map((g) => `${g.severity} ${g.attribute} @ ${g.region}`).join("<br>")}` : ""}`
      : (v.unparsed ? "unparsed" : v.reason === "coverage" ? "(judge not called — coverage)" : "(missing)");
    return `| ${v.angle} | ${v.azimuthDeg}° | ${v.rendered ? "yes" : "NO"} | ${covCell} | ${verdictCell} |`;
  }).join("\n");
  const agg = r.aggregate.decided
    ? `**${r.aggregate.passed ? "PASS" : "FAIL"}** — gaps ${r.aggregate.gapCount}/${r.aggregate.gapBudget}` +
      (r.aggregate.failures.length ? `; failures: ${r.aggregate.failures.map((f) => `${f.angle}:${f.reason}`).join(", ")}` : "")
    : `**REFUSAL** — ${r.aggregate.refusal} (no pass/fail verdict is produced on a partial gate)`;
  return `# Multi-angle same-object gate — ${r.subject} (${r.label}) — T-093-01\n\n` +
    `![sheet](../../../${r.sheet})\n\n` +
    `**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.\n\n` +
    `Artifact: \`${r.artifact.path}\` (sha256 \`${r.artifact.sha256.slice(0, 12)}…\`) · zones: ${r.zones.source}` +
    (r.zones.reason ? ` (${r.zones.reason})` : "") + ` · contract: ${r.contract.azimuths.join(", ")} @ ` +
    `${r.contract.elevationDeg}°, ${r.contract.width}², coverage ≥ ${r.contract.coverageThreshold}, ` +
    `gap budget ${r.contract.gapBudget}\n\n` +
    `| view | azimuth | rendered | T-088 coverage | judge verdict |\n|---|---|---|---|---|\n${viewRows}\n\n` +
    `## Aggregate\n${agg}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
