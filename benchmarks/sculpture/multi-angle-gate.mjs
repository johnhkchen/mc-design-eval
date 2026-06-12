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
// JUDGE-REPLY ROBUSTNESS (T-114-01): a malformed judge reply is NOT a verdict. Each judged view
// asks through the bounded reply policy (src/form/judge-reply.mjs): a reply either parses — then
// it is FINAL, no re-ask ever (structurally: the policy cannot ask past a parsed reply) — or is
// malformed and gets bounded re-asks (MAX_REPLY_ATTEMPTS total) with the SAME prompt and pinned
// model (no corrective addendum — the instrument is byte-identical). Every reply, malformed ones
// included, is committed on the view as the `replies[]` audit ledger. `--rejudge` completes the
// I/O of a committed record: it re-judges ONLY views that exhausted to `unparsed` (seeding their
// ledger with the committed malformed reply), copies — never recomputes — zones/coverage/
// kitPresence/contract, and refuses to write unless gateInstrumentDiff proves every parsed
// verdict byte-untouched. Rule 4 stands: the mode has no lens/threshold/angle parameter.
//
//   npm run gate:multi -- --subject cottage                       # the durable-skin artifact (label "current")
//   npm run gate:multi -- --subject cottage --label baseline \
//       --artifact concept-materials/cottage/after-artifact.json  # the proof baseline
//   npm run gate:multi -- --subject cottage --offline             # re-assert the committed record (no GL/judge)
//   npm run gate:rejudge -- --subject church --label challenge    # re-judge the record's unparsed views only
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
  gateInstrumentDiff, MULTI_ANGLE_GATE_SCHEMA,
} from "../../src/form/multi-angle-gate.mjs";
import { runReplyPolicy, MAX_REPLY_ATTEMPTS } from "../../src/form/judge-reply.mjs";
import {
  ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked,
} from "../../src/form/pin-guard.mjs";
import {
  kitPresence, composeKitAwareVerdict, KIT_PRESENCE_SCHEMA,
} from "../../src/form/kit-presence.mjs";
import { extractApertures } from "../../src/view/opening-dressing.mjs";
import { composeVocabulary } from "../../src/form/material-vocabulary.mjs";
import {
  resampleRgba, silhouetteToRgba, composeTriptych, composeSheet, RESEMBLANCE_DEFAULTS,
} from "../../src/form/resemblance.mjs";
import { resolveAngle, renderViews } from "../../src/view/multi-angle.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { surfaceZoneHistogram, ownCoverage } from "../../src/view/zone-fill.mjs";
import { visibilityAwareCoverage, DEFAULT_COVERAGE_THRESHOLD } from "../../src/view/face-resemblance.mjs";
import { layerCounts, zonesFromBands } from "../../src/view/zone-map.mjs";
import { reviveComponentPlan, frameLinesFromComponent, planCensusZoneOf, bandFloorLines } from "../../src/view/component-plan.mjs";
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

// THE GATE REGISTRY: the pipeline subjects + the synthetic-positive fixture (registry DATA only —
// E-25 Rule 3). "synthetic-hut" exists to prove the gate's PASS path end-to-end: its "concept" is a
// committed render of its own artifact, so ground truth is same-object by construction; it is labeled
// synthetic in every record and is NOT a pipeline subject. Exported (with deriveZones /
// policyInShippedPalette) for the T-137 visibility witness — one derivation point, no refork.
export const GATE_SUBJECTS = {
  ...SUBJECTS,
  "synthetic-hut": {
    key: "synthetic-hut",
    concept: "multi-angle/fixtures/hut/concept.png",
    map: "multi-angle/fixtures/hut/material-map.json",
    glb: "multi-angle/fixtures/hut/none.glb", // absent by design — mesh panel falls back to placeholder
    build: "multi-angle/fixtures/hut/artifact.json",
    policy: { // fallback prior, mirrors the fixture's two materials
      base: { dominant: "stone_bricks", preserve: [], splat: [] },
      upper: { dominant: "stone_bricks", preserve: [], splat: [] },
      roof: { dominant: "spruce_planks", preserve: [], splat: [] },
    },
  },
};

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

/** The T-092 zone derivation, re-run from the same committed inputs; prior policy as recorded
 *  fallback. T-106-01: `componentPlan` (revived from the chain's persisted component-plan.json)
 *  pins the wall/roof boundary so the gate reads the SAME geometry the chain skinned. */
export function deriveZones({ occ, conceptImg, matMap, fallbackPolicy, componentPlan = null }) {
  const pinTop = componentPlan?.wallTopEffective ?? componentPlan?.wallTop ?? null; // the chain's arbitrated value
  const sz = structuralZones(occ, pinTop != null ? { upperTop: pinTop } : {});
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
    return {
      zoneOf: zb.zoneOf, zones: zb.zones, source: "concept", reason: null, gridResult,
      bandNames: extracted.bands.map((b) => b.name), bands: extracted.bands, sz,
    };
  }
  return {
    zoneOf: sz.zoneOf,
    zones: Object.fromEntries(Object.entries(fallbackPolicy).map(([z, p]) => [z, { dominant: bare(p.dominant), preserve: p.preserve.map(bare) }])),
    source: "prior-fallback", reason: extracted.reason, gridResult, bandNames: null, bands: null, sz,
  };
}

/** Map a NAMED-space policy into the artifact's SHIPPED palette (see module header). The shipped
 *  name space is value-true substitution COMPOSED WITH the committed kit overrides (T-096: the kit
 *  renames at durable-skin's one renaming point, so a kit-skinned artifact carries e.g.
 *  smooth_sandstone where the named policy says white_terracotta — censusing the named block would
 *  fail the view on NAMING, not coverage). The allowed-guard keeps both renames unapplied on
 *  artifacts whose manifest doesn't carry them (the pre-substitution proof baseline). */
export function policyInShippedPalette(zones, { matMap, gridResult, artifact, kitOverrides = {}, kit = [], componentPlan = null }) {
  const namedManifest = bareList(matMap.palette);
  const swatches = sampleRoleSwatches(gridResult, namedManifest);
  const rows = selectValueTrueMap(matMap.map, swatches);
  const substitution = Object.fromEntries(rows.filter((r) => r.switched).map((r) => [r.named, r.chosen]));
  // T-113-01: the substitution DERIVATION stays here (this process reads the same committed
  // inputs the chain did); the COMPOSITION is the authority's — the same module the chain
  // consumes, in its manifest-guarded mode (`allowed`), so the gate censuses the vocabulary the
  // chain actually shipped, roof course family included.
  const allowed = allowedPalette(artifact);
  const vocab = composeVocabulary({
    policyNamed: zones, substitution, kitOverrides, kit,
    componentPlan, allowed, roofFamilyAllowed: allowed,
  });
  return { zones: vocab.zones, substitution, kitOverrides, ship: vocab.sub, vocabulary: vocab };
}

/** THE gate census, exported (T-137): the per-view own-coverage censuses on each view's own
 *  visible skin (diagonal projection) + the exposure-skin existence basis, in ONE definition the
 *  live gate and the visibility witness both consume (the witness provably runs the gate's own
 *  census; zone-fill stays behind this runner's allowlisted door). Deterministic, GL-free. */
export function gateCensuses(occ, zoneOf, azimuths, zones) {
  return {
    perView: azimuths.map((a) => ({
      angle: a,
      coverage: ownCoverage(surfaceZoneHistogram(occ, zoneOf, { faces: [a], skin: "projection" }), zones),
    })),
    exposure: surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" }),
  };
}

/** The METERED ask through the reply policy (T-114-01). One thunk per view, closed over the
 *  FIXED prompt + pinned model once — every re-ask is byte-identical by construction. `seed`
 *  enters a committed malformed reply as attempt 1 (the --rejudge path). */
async function judgeThroughPolicy({ slug, angle, azimuthDeg, triptychBuf, seed = [] }) {
  const { requestTextWithImage } = await import("../../src/sdk-binding.mjs");
  const prompt = buildMultiAngleViewPrompt(angle, azimuthDeg); // built ONCE — no per-attempt mutation
  const ask = async () => {
    const { text, raw } = await requestTextWithImage({
      prompt,
      images: [{ data: triptychBuf, mediaType: "image/png" }],
      model: PHASE1_MODEL_ID,
    });
    return {
      text,
      usage: raw?.usage
        ? { input_tokens: raw.usage.input_tokens, output_tokens: raw.usage.output_tokens, cost_usd: raw.total_cost_usd ?? null }
        : null,
    };
  };
  const out = await runReplyPolicy(ask, { parse: parseMultiAngleVerdict, seed });
  for (const r of out.replies) {
    if (!r.parsed && r.source === "live") {
      console.error(`[${slug}] ${angle}: malformed reply, attempt ${r.attempt}/${MAX_REPLY_ATTEMPTS} — ` +
        `${r.parseError}${r.attempt < MAX_REPLY_ATTEMPTS ? " — re-asking (same prompt, same model)" : ""}`);
    }
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  const subjectKey = arg("--subject");
  const def = GATE_SUBJECTS[subjectKey];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(GATE_SUBJECTS).join(", ")}`);
  const label = arg("--label") ?? "current";
  const artifactRel = arg("--artifact") ?? (def.build?.startsWith("multi-angle/") ? def.build : `durable-skin/${def.key}/artifact.json`);
  // T-115-01: optional APERTURE-REFERENCE input (like --artifact, an input path — the judged
  // contract is untouched): the kit-presence fixpoint extracts concept-declared apertures from the
  // chain's RAW input build; a generate-first chain's raw input is its GENERATED base, not def.build.
  const referenceRel = arg("--reference") ?? def.build;
  const offline = argv.includes("--offline");
  const rejudge = argv.includes("--rejudge");
  const rotate = argv.includes(ROTATE_FLAG);
  const slug = `${def.key}-${label}`;
  const recPath = join(OUT_DIR, `${slug}.json`);
  const sheetFrame = join(FRAMES_DIR, `multi-angle-${slug}.png`);

  if (rejudge) {
    await rejudgeMain({ def, label, slug, recPath, sheetFrame });
    return;
  }

  // T-119-01 preflight, BEFORE any render or judge call: a live gate run re-rolls the committed
  // verdict record — that is a pin rotation and must be explicit (--rejudge stays the T-114-
  // sanctioned completion of a committed record; --offline writes nothing).
  if (!offline) {
    const trackedSet = loadTrackedSet(ROOT);
    const verdictPins = [`benchmarks/sculpture/multi-angle/${slug}.json`, `benchmarks/sculpture/multi-angle/${slug}.md`];
    preflightPins({
      pins: verdictPins.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
      rotate, intent: `live multi-angle gate (${slug}) — re-judging re-rolls committed verdicts (E-28 Rule 4)`,
    });
  }

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
      // T-100 (additive — records without kitPresence stay valid): the recorded overall verdict
      // must equal the pure composition of the recorded aggregate and presence result.
      kitAware: !rec.kitPresence || (() => {
        const expect = composeKitAwareVerdict(rec.aggregate, rec.kitPresence);
        return rec.overall && expect.decided === rec.overall.decided &&
          expect.passed === rec.overall.passed && expect.refusal === rec.overall.refusal &&
          (rec.kitPresence.ran === false || rec.kitPresence.schema === KIT_PRESENCE_SCHEMA);
      })(),
      // T-114 (additive — records without replies[] stay valid): the committed ledger must show
      // the policy's invariants — bounded, parsed only as the LAST entry (no re-roll is visible
      // in the artifact itself), and verdict present iff the last reply parsed.
      replies: (rec.views ?? []).every((v) => !v.replies || (
        Array.isArray(v.replies) && v.replies.length >= 1 && v.replies.length <= MAX_REPLY_ATTEMPTS &&
        v.replies.every((r, i) => r && typeof r.parsed === "boolean" &&
          (!r.parsed || i === v.replies.length - 1)) &&
        !!v.verdict === v.replies.at(-1).parsed
      )),
      // T-137 (additive — records without visibility stay valid): the cross-view block must be
      // internally consistent (passed ⇔ no named not-visible-from-any-view failure).
      visibility: !rec.visibility || (
        rec.visibility.byBand && Array.isArray(rec.visibility.failures) &&
        rec.visibility.passed === (rec.visibility.failures.length === 0) &&
        rec.visibility.failures.every((x) => rec.visibility.byBand[x.band]?.status === "not-visible-from-any-view")
      ),
      // T-114 (additive): a re-judged record carries its own instrument proof.
      rejudge: !rec.rejudge || (
        Array.isArray(rec.rejudge.angles) && rec.rejudge.angles.length >= 1 &&
        Array.isArray(rec.rejudge.instrumentDiff) && rec.rejudge.instrumentDiff.length === 0
      ),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${slug}: schema ${checks.schema ? "OK" : "BAD"}; contract ${checks.contract ? "OK" : "VIOLATED"}; ` +
      `views ${checks.views ? "OK" : "BAD"}; T-088 short-circuit ${checks.shortCircuit ? "OK" : "VIOLATED"}; ` +
      `aggregate ${checks.aggregate ? "well-formed" : "MALFORMED"}; sheet ${checks.sheet ? "present" : "MISSING"}; ` +
      `kit-aware ${rec.kitPresence ? (checks.kitAware ? "consistent" : "INCONSISTENT") : "n/a (pre-T-100)"}; ` +
      `replies ${(rec.views ?? []).some((v) => v.replies) ? (checks.replies ? "ledger OK" : "LEDGER VIOLATED") : "n/a (pre-T-114)"}; ` +
      `visibility ${rec.visibility ? (checks.visibility ? "consistent" : "INCONSISTENT") : "n/a (pre-T-137)"}; ` +
      `rejudge ${rec.rejudge ? (checks.rejudge ? "instrument-clean" : "INSTRUMENT DIRTY") : "n/a"} — ` +
      `recorded outcome: ${rec.aggregate?.decided ? (rec.aggregate.passed ? "PASS" : "FAIL") : `REFUSAL (${rec.aggregate?.refusal})`}` +
      (rec.overall ? ` → kit-aware ${rec.overall.decided ? (rec.overall.passed ? "PASS" : "FAIL") : `REFUSAL (${rec.overall.refusal})`}` : ""));
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
  // T-096: the committed kit's verified overrides are part of the shipped name space (durable-skin
  // composes them at its one renaming point); read them the same way, optional like there.
  let kitOverrides = {};
  let kitRec = null;
  if (def.kitRecord && existsSync(join(HERE, def.kitRecord))) {
    kitRec = JSON.parse(await readFile(join(HERE, def.kitRecord), "utf8"));
    if (kitRec.schema !== "kit/v1") throw new Error(`${def.kitRecord} is not a kit/v1 record`);
    kitOverrides = kitRec.overrides ?? {};
  }
  // T-106-01: the chain persists its consumption plan beside the artifact under test — the
  // kit-presence fixpoint must re-run the SAME op (frames, wall top, census routing). Absent file
  // (pre-T-106 artifacts, record-less subjects) → null, the occupancy path exactly as before.
  const planPath = join(HERE, artifactRel.replace(/[^/]+$/, "component-plan.json"));
  const componentPlan = existsSync(planPath)
    ? reviveComponentPlan(JSON.parse(await readFile(planPath, "utf8")))
    : null;
  if (componentPlan) {
    console.error(`[${slug}] component plan: ${planPath.replace(HERE + "/", "")} — ` +
      `wallTop ${componentPlan.wallTop ?? "—"}, frames ${componentPlan.frames ? componentPlan.frames.rooflineSource : "—"}, ` +
      `roof cells ${componentPlan.roof ? componentPlan.roof.cells.size : 0}`);
  }
  const derived = deriveZones({ occ, conceptImg, matMap, fallbackPolicy: def.policy, componentPlan });
  const { zones: zonesShipped, substitution, ship, vocabulary } = policyInShippedPalette(derived.zones, {
    matMap, gridResult: derived.gridResult, artifact, kitOverrides, kit: kitRec?.kit ?? [], componentPlan,
  });
  console.error(`[${slug}] zones: ${derived.source}${derived.reason ? ` (${derived.reason})` : ""} — ` +
    Object.entries(zonesShipped).map(([z, p]) => `${z}=${p.dominant}`).join(", "));
  // per-view census routing matches the chain's: program cells are roof, offslab cells measured
  const gateCensusZoneOf = componentPlan
    ? planCensusZoneOf(derived.zoneOf, componentPlan, derived.bandNames ?? [])
    : derived.zoneOf;

  // --- T-100: the kit-presence COMPANION precondition (deterministic; runs whether or not the
  // judge later refuses — both run, both reported; the kit is the COMMITTED record, immutable) ----
  let presence;
  if (!kitRec) {
    presence = { ran: false, reason: "no-kit-record" };
  } else if (derived.source !== "concept") {
    presence = { ran: false, reason: "no-concept-bands" }; // kit whereUsed refs need the derived bands
  } else if (!existsSync(join(HERE, referenceRel))) {
    presence = { ran: false, reason: "no-reference-build" }; // apertures are concept-declared (T-099)
  } else {
    const refArt = JSON.parse(await readFile(join(HERE, referenceRel), "utf8"));
    const refOcc = artifactOccupancy(refArt);
    // the fixpoint rule re-runs the SAME op the chain ran: component frames + the concept-band
    // floor lines (the occupancy storey scan reads every layer of a cage-solid shell as a floor)
    const floorLinesEff = componentPlan && derived.bands ? bandFloorLines(derived.bands) : derived.sz.floorLines;
    presence = kitPresence(occ, {
      kit: kitRec.kit, bandNames: derived.bandNames, policy: zonesShipped, zoneOf: derived.zoneOf,
      floorLines: floorLinesEff, upperTop: derived.sz.upperTop, roofKeys: derived.sz.roofKeys,
      sub: ship,
      apertures: extractApertures(refOcc),
      // T-113-01: the SHIPPED treatments — the same vocabulary the chain dressed with
      treatments: vocabulary.treatments,
      frames: componentPlan?.frames
        ? frameLinesFromComponent(occ,
            { floorLines: floorLinesEff, upperTop: derived.sz.upperTop, roofKeys: derived.sz.roofKeys },
            { ...componentPlan.frames, floorLineSource: "concept-bands" })
        : null,
      // defined geometry = reconstruction edits ∪ the raw base's concept-declared cells (the
      // build's own timber beside a window is as defined as an eave course)
      definedCells: componentPlan
        ? (p) => (componentPlan.touchedCells?.has(p.join(",")) ?? false) || refOcc.has(...p)
        : null,
    });
    console.error(`[${slug}] kit presence: ${presence.passed ? "PASS" : "FAIL"}` +
      (presence.gaps.length ? ` — ${presence.gaps.join("; ")}` : ""));
    for (const s of presence.skips) console.error(`[${slug}] kit presence skip: ${s.feature} (${s.reason})`);
  }
  if (!presence.ran && presence.reason) {
    console.error(`[${slug}] kit presence not run: ${presence.reason}`);
  }

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

  // --- T-137 visibility-aware coverage, all four views at once (pure, GL-free) ---------------------
  // The per-view census denominator is that view's own visible skin (the diagonal projection —
  // unchanged); what changed is the treatment of an EMPTY denominator: a band no gate view can see
  // is excluded (not-on-skin) or NAMED (not-visible-from-any-view when the exposure skin carries
  // it) instead of refusing the judge on invisibility. Both arithmetics land in the record.
  const censuses = gateCensuses(occ, gateCensusZoneOf, azimuths, zonesShipped);
  const vis = visibilityAwareCoverage({
    views: censuses.perView,
    zones: zonesShipped,
    exposure: censuses.exposure,
    threshold: DEFAULT_COVERAGE_THRESHOLD,
    metric: "own",
  });
  const visByAngle = new Map(vis.views.map((v) => [v.angle, v]));
  for (const b of vis.visibility.failures) {
    console.error(`[${slug}] visibility: band ${b.band} is on the exposure skin but NO gate view can see it — named failure`);
  }
  for (const [band, info] of Object.entries(vis.visibility.byBand)) {
    if (info.status === "not-on-skin") {
      console.error(`[${slug}] visibility: band ${band} has no cells in the census identity (not-on-skin) — ` +
        "excluded from the precondition; the proportion check owns the form defect");
    }
  }

  const views = [];
  const panels = [conceptPanel];
  if (renderError) {
    console.error(`[${slug}] RENDER FAILED — the gate refuses to produce a verdict: ${renderError}`);
    for (const a of azimuths) {
      views.push({ angle: a, azimuthDeg: resolveAngle(a).azimuthDeg, rendered: false, render: { error: renderError }, coverage: null, verdict: null, judge: null });
      panels.push(grey);
    }
  } else {
    for (const r of renders) {
      const a = r.angle;
      const az = resolveAngle(a).azimuthDeg;
      // T-088 PRECONDITION on THIS view's visible skin: the diagonal projection census. Censused on
      // OWN materials (dominant + declared preserve — T-090's band-evidence set, T-101): a styled
      // zone legitimately carries frame lines and shutters over its dominant; dominant-only counting
      // rejected exactly the ingredients the kit supplied. T-137: gated through the visibility-aware
      // arithmetic computed above — a band this view cannot see is excluded HERE and gated wherever
      // visible; the legacy arithmetic is recorded beside it. Monotone vs both prior metrics.
      const { aware: cov, legacy } = visByAngle.get(a);
      const viewImg = await decodeImage(r.path);
      const viewPanel = resampleRgba(viewImg, P, P, "aspect");
      panels.push(viewPanel);
      const view = {
        angle: a, azimuthDeg: az, rendered: true, render: { path: r.path.replace(ROOT, "") },
        coverage: {
          passed: cov.passed, threshold: cov.threshold, byZone: cov.byZone,
          legacy: { passed: legacy.passed, failures: legacy.failures },
        },
        verdict: null, judge: null,
      };
      if (!cov.passed) {
        // the T-088 short-circuit: the judge is NEVER called; the record must show that.
        view.reason = "coverage";
        console.error(`[${slug}] ${a} (${az}°): coverage REJECT — ` +
          cov.failures.map((f) => `${f.zone} own(${f.dominant}+preserve)=${f.fraction}`).join(", ") + " — judge not called");
      } else {
        const meshPanel = mesh
          ? resampleRgba(silhouetteToRgba(rasterizeSilhouette(mesh, { view: resolveAngle(a) })), P, P, "aspect")
          : grey;
        const triptych = composeTriptych([conceptPanel, meshPanel, viewPanel], { gutter: RESEMBLANCE_DEFAULTS.gutter });
        const triptychBuf = encodeRgbaToPng(triptych.data, triptych.w, triptych.h);
        await writeFile(join(viewsDir, `judged-${a.replace(/[+]/g, "p").replace(/-/g, "m")}.png`), triptychBuf);
        const { verdict, replies } = await judgeThroughPolicy({ slug, angle: a, azimuthDeg: az, triptychBuf });
        view.replies = replies;
        view.judge = { model: PHASE1_MODEL_ID, usage: replies.at(-1).usage };
        if (verdict) {
          view.verdict = verdict;
        } else {
          // every attempt malformed — the bound is exhausted; unparsed keeps its meaning downstream
          view.unparsed = true;
          view.parseError = replies.at(-1).parseError;
          view.rawReply = replies.at(-1).rawReply;
          console.error(`[${slug}] ${a}: UNPARSED after ${replies.length}/${MAX_REPLY_ATTEMPTS} attempts — ${view.parseError}`);
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
  // T-100: the kit-aware verdict — presence ANDs with the aggregate, never replaces it.
  const overall = composeKitAwareVerdict(aggregate, presence);

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
    zones: {
      source: derived.source, reason: derived.reason, policy: zonesShipped,
      substitutionApplied: substitution, kitOverridesApplied: kitOverrides,
      vocabulary: vocabulary.record, // the authority's composed lineage (T-113-01)
    },
    views,
    aggregate,
    kitPresence: presence,
    overall,
    // T-137 (additive — pre-T-137 records stay valid): the cross-view visibility verdict. The
    // per-view exclusions live in each view's coverage.byZone; this names the band-level statuses.
    visibility: vis.visibility,
    sheet: sheetFrame.replace(ROOT, ""),
    labeled,
  };
  await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/multi-angle/${slug}.json`, content: JSON.stringify(record, null, 2) + "\n", rotate });
  await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/multi-angle/${slug}.md`, content: recordMd(record), rotate });

  const outcome = overall.decided ? (overall.passed ? "PASS" : "FAIL") : `REFUSAL (${overall.refusal})`;
  console.error(`\n[${slug}] kit-aware verdict: ${outcome} — resemblance ` +
    (aggregate.decided ? `${aggregate.passed ? "pass" : "fail"} (gaps ${aggregate.gapCount}/${aggregate.gapBudget})` : `refusal`) +
    `; kit presence ` + (presence.ran === false ? `not run (${presence.reason})` : presence.passed ? "pass" : "fail"));
  console.error(`✓ wrote ${recPath} + sheet ${record.sheet}`);
  process.exitCode = overall.decided ? (overall.passed ? 0 : 1) : 2;
}

/** THE RE-JUDGE MODE (T-114-01): complete the I/O of a committed record. Re-judges ONLY views
 *  that exhausted to `unparsed` (their ledger seeded with the committed malformed reply, so the
 *  bound spans the view's whole history); zones/coverage/kitPresence/contract are COPIED from the
 *  record, never recomputed — that, plus gateInstrumentDiff refusing the write on any drift, is
 *  what makes a verdict re-roll impossible by construction. Renders happen only for pixels (the
 *  judge triptych + the regenerated sheet); nothing decision-bearing is recomputed from GL. */
async function rejudgeMain({ def, label, slug, recPath, sheetFrame }) {
  if (!existsSync(recPath)) {
    throw new Error(`committed record absent (${recPath}) — nothing to re-judge; run npm run gate:multi -- --subject ${def.key} --label ${label} first`);
  }
  const before = JSON.parse(await readFile(recPath, "utf8"));
  if (before.schema !== MULTI_ANGLE_GATE_SCHEMA) {
    throw new Error(`${recPath} is not a ${MULTI_ANGLE_GATE_SCHEMA} record`);
  }
  if (JSON.stringify(before.contract?.azimuths) !== JSON.stringify([...MULTI_ANGLE_GATE.azimuths])) {
    throw new Error("record contract diverges from config azimuths — refusing to re-judge");
  }

  // the artifact pin, BEFORE any render or metered call: a changed build is a different
  // judgement (it needs a fresh gate run), not a reply re-ask.
  const artifactPath = join(ROOT, before.artifact.path);
  const artifactJson = await readFile(artifactPath, "utf8");
  const sha = createHash("sha256").update(artifactJson).digest("hex");
  if (sha !== before.artifact.sha256) {
    throw new Error(`artifact pin mismatch: ${before.artifact.path} is ${sha.slice(0, 12)}…, the record judged ` +
      `${before.artifact.sha256.slice(0, 12)}… — a changed build needs a fresh gate run, not a re-judge`);
  }
  const artifact = JSON.parse(artifactJson);
  assertArtifact(artifact);

  // ONLY unparsed views are re-judgeable; a record of parsed verdicts has nothing to ask.
  const targets = before.views.filter((v) => v.unparsed === true && !v.verdict);
  if (targets.length === 0) {
    throw new Error(`[${slug}] no unparsed view — every verdict is parsed and FINAL; ` +
      "re-judging parsed verdicts is impossible by construction (that would be a re-roll)");
  }
  console.error(`[${slug}] re-judge: ${targets.map((t) => t.angle).join(", ")} — completing I/O on the ` +
    "committed record (zones/coverage/kitPresence copied, never recomputed)");

  // pixels only: the four contract renders feed the triptych + the regenerated sheet.
  const viewsDir = join(OUT_DIR, slug);
  await mkdir(viewsDir, { recursive: true });
  const conceptPath = join(HERE, def.concept);
  if (!existsSync(conceptPath)) throw new Error(`concept image absent: ${conceptPath} (immutable reference)`);
  const conceptImg = await decodeImage(conceptPath);
  const renders = await renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], { outDir: viewsDir });
  for (const r of renders) {
    if (!r?.path || !existsSync(r.path) || !(r.bytes > 0)) throw new Error(`render missing for ${r?.angle}`);
  }
  const renderByAngle = new Map(renders.map((r) => [r.angle, r]));
  const glbPath = join(HERE, def.glb);
  let mesh = null;
  if (existsSync(glbPath)) mesh = loadMeshFromGlb(await readFile(glbPath));
  else console.error(`WARN: GLB absent (${glbPath}) — mesh panel will be a placeholder`);

  const P = RESEMBLANCE_DEFAULTS.panel;
  const conceptPanel = resampleRgba(conceptImg, P, P, "aspect");
  const grey = { w: P, h: P, data: new Uint8Array(P * P * 4).fill(235) };
  const panelByAngle = new Map();
  for (const a of MULTI_ANGLE_GATE.azimuths) {
    panelByAngle.set(a, resampleRgba(await decodeImage(renderByAngle.get(a).path), P, P, "aspect"));
  }

  const views = [];
  for (const bv of before.views) {
    if (!(bv.unparsed === true && !bv.verdict)) {
      views.push(structuredClone(bv)); // parsed (or short-circuited) views: byte-identical copies
      continue;
    }
    const meshPanel = mesh
      ? resampleRgba(silhouetteToRgba(rasterizeSilhouette(mesh, { view: resolveAngle(bv.angle) })), P, P, "aspect")
      : grey;
    const triptych = composeTriptych([conceptPanel, meshPanel, panelByAngle.get(bv.angle)], { gutter: RESEMBLANCE_DEFAULTS.gutter });
    const triptychBuf = encodeRgbaToPng(triptych.data, triptych.w, triptych.h);
    await writeFile(join(viewsDir, `judged-${bv.angle.replace(/[+]/g, "p").replace(/-/g, "m")}.png`), triptychBuf);
    // the committed malformed reply is attempt 1 of THIS view's ledger — the bound spans history
    const seed = [{
      parsed: false, parseError: bv.parseError ?? "unparsed (no parseError recorded)",
      rawReply: bv.rawReply ?? null, usage: bv.judge?.usage ?? null,
    }];
    const { verdict, replies } = await judgeThroughPolicy({
      slug, angle: bv.angle, azimuthDeg: bv.azimuthDeg, triptychBuf, seed,
    });
    const nv = { ...structuredClone(bv), replies };
    nv.judge = { model: PHASE1_MODEL_ID, usage: replies.at(-1).usage }; // original usage lives in replies[0]
    if (verdict) {
      nv.verdict = verdict;
      delete nv.unparsed;
      delete nv.parseError;
      delete nv.rawReply;
      console.error(`[${slug}] ${bv.angle} (${bv.azimuthDeg}°): recovered on attempt ${replies.length} — ${verdict.verdict}` +
        (verdict.gaps.length ? ` — ${verdict.gaps.map((g) => `${g.severity} ${g.attribute}@${g.region}`).join("; ")}` : ""));
    } else {
      nv.parseError = replies.at(-1).parseError;
      nv.rawReply = replies.at(-1).rawReply;
      console.error(`[${slug}] ${bv.angle}: STILL UNPARSED after ${replies.length}/${MAX_REPLY_ATTEMPTS} attempts — ` +
        "the REFUSAL stands; ledger committed (do not raise the bound)");
    }
    views.push(nv);
  }

  // the pure tail, recomputed; kitPresence is the COMMITTED result (deterministic, not re-run)
  const aggregate = aggregateMultiAngle(views.map((v) => ({
    angle: v.angle, rendered: v.rendered, coverage: v.coverage, verdict: v.verdict, unparsed: v.unparsed,
  })));
  const overall = composeKitAwareVerdict(aggregate, before.kitPresence);

  const record = {
    ...structuredClone(before),
    views,
    aggregate,
    overall,
    rejudge: { ticket: "T-114-01", angles: targets.map((t) => t.angle), seeded: true, instrumentDiff: [] },
  };
  const diff = gateInstrumentDiff(before, record);
  record.rejudge.instrumentDiff = diff;
  if (diff.length > 0) {
    throw new Error(`[${slug}] instrument diff non-empty (${diff.join(", ")}) — refusing to write the re-judged record`);
  }

  const panels = [conceptPanel, ...MULTI_ANGLE_GATE.azimuths.map((a) => panelByAngle.get(a))];
  const sheetComposed = composeSheet(panels, { gutter: RESEMBLANCE_DEFAULTS.gutter });
  const labels = ["concept", ...views.map((v) => `${v.angle} ${v.azimuthDeg}° — ${viewOutcomeLabel(v)}`)];
  const { buf: sheetBuf, labeled } = encodeLabeledSheet(sheetComposed, labels, P, RESEMBLANCE_DEFAULTS.gutter);
  record.labeled = labeled;
  const sheetPath = join(OUT_DIR, `${slug}-sheet.png`);
  await writeFile(sheetPath, sheetBuf);
  await copyFile(sheetPath, sheetFrame);
  // T-119-01: completing a committed record in place is the one T-114-sanctioned write — it fills
  // unparsed verdicts only (this mode's own artifact-pin and parsed-view refusals enforce that).
  const sanction = "rejudge (T-114 reply completion of a committed record)";
  await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/multi-angle/${slug}.json`, content: JSON.stringify(record, null, 2) + "\n", sanction });
  await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/multi-angle/${slug}.md`, content: recordMd(record), sanction });

  const outcome = overall.decided ? (overall.passed ? "PASS" : "FAIL") : `REFUSAL (${overall.refusal})`;
  console.error(`\n[${slug}] re-judged kit-aware verdict: ${outcome} — resemblance ` +
    (aggregate.decided ? `${aggregate.passed ? "pass" : "fail"} (gaps ${aggregate.gapCount}/${aggregate.gapBudget})` : "refusal") +
    `; kit presence ` + (before.kitPresence?.ran === false ? `not run (${before.kitPresence.reason})` : before.kitPresence?.passed ? "pass" : "fail") +
    `; instrument-diff clean`);
  console.error(`✓ wrote ${recPath} + sheet ${record.sheet}`);
  process.exitCode = overall.decided ? (overall.passed ? 0 : 1) : 2;
}

function recordMd(r) {
  const viewRows = r.views.map((v) => {
    const covCell = v.coverage
      ? (v.coverage.passed ? "pass" : Object.entries(v.coverage.byZone)
          .map(([z, c]) => (c.excluded ? `${z} ${c.status}` : `${z} ${c.dominant}=${c.fraction ?? "?"}`)).join("<br>"))
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
  const kp = r.kitPresence;
  const kitSection = kp?.ran === false
    ? `not run — ${kp.reason}`
    : `**${kp.passed ? "PASS" : "FAIL"}**` +
      (kp.gaps.length ? ` — named absences:\n${kp.gaps.map((g) => `- \`${g}\``).join("\n")}` : " — every kit entry present at its grammar sites") +
      (kp.skips.length ? `\n\nSkips (recorded): ${kp.skips.map((s) => `${s.feature} (${s.reason})`).join("; ")}` : "");
  const overall = r.overall
    ? (r.overall.decided
      ? `**${r.overall.passed ? "PASS" : "FAIL"}** — resemblance ${r.overall.components.resemblance.passed ? "pass" : "fail"} ∧ ` +
        `kit presence ${r.overall.components.kitPresence.ran ? (r.overall.components.kitPresence.passed ? "pass" : "fail") : "not run"}` +
        ` (the judge cannot pass a build missing kit entries; the kit check cannot replace the judgement)`
      : `**REFUSAL** — ${r.overall.refusal} (kit presence still reported above)`)
    : "(pre-T-100 record)";
  return `# Multi-angle same-object gate — ${r.subject} (${r.label}) — T-093-01\n\n` +
    `![sheet](../../../${r.sheet})\n\n` +
    `**The sheet is the verdict artifact** (E-25 Rule 1); this table is support.\n\n` +
    `Artifact: \`${r.artifact.path}\` (sha256 \`${r.artifact.sha256.slice(0, 12)}…\`) · zones: ${r.zones.source}` +
    (r.zones.reason ? ` (${r.zones.reason})` : "") + ` · contract: ${r.contract.azimuths.join(", ")} @ ` +
    `${r.contract.elevationDeg}°, ${r.contract.width}², coverage ≥ ${r.contract.coverageThreshold}, ` +
    `gap budget ${r.contract.gapBudget}\n\n` +
    `| view | azimuth | rendered | T-088 coverage | judge verdict |\n|---|---|---|---|---|\n${viewRows}\n\n` +
    `## Resemblance aggregate (T-093)\n${agg}\n\n` +
    `## Kit presence (T-100)\n${kitSection}\n\n` +
    `## Kit-aware verdict\n${overall}\n` +
    (r.rejudge
      ? `\n## Re-judge (T-114)\nUnparsed view(s) re-judged under the bounded reply policy: ` +
        `${r.rejudge.angles.join(", ")} — every reply committed (\`replies[]\` per attempt, the committed ` +
        `malformed reply seeded as attempt 1); prompt and judge model byte-identical; ` +
        `instrument-diff ${r.rejudge.instrumentDiff.length === 0 ? "CLEAN — parsed verdicts untouched" : `DIRTY: ${r.rejudge.instrumentDiff.join(", ")}`}.\n`
      : "");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
