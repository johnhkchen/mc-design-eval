// PROPORTION WITNESS RUNNER (T-135-01, story S-135, epic E-33) — the proportion-vs-concept check
// run over a COMMITTED workshop chain, round by round: the numeric record of the defect the
// model's critique kept naming and no gate owned. For each committed subject: derive the declared
// targets the chain never had (concept silhouette first — with the deterministic segmentability
// guard — conditioned sketch as the recorded per-ratio fallback), prefix-replay the committed
// ledger (replayLedger throughRound — no model, no GL, Rule 5's substrate), measure the
// silhouette ratios of every round's build, and record the verdict each round WOULD have
// received. The full replay is byte-compared against the committed final artifact first — the
// witness provably measured the chain of record.
//
// RECORDS AT NEW PATHS (benchmarks/sculpture/proportion/<runKey>.*): committed ledgers, seeds and
// finals stay untouched and valid (pin policy — rotation belongs to an owning ticket). NO JUDGE
// RUNS; this runner names no judge seam. Wiring declared targets into LIVE seeds is S-138's.
//
//   live      derive + write records (pin-guarded, preflighted before any write)
//   --repro   re-derive the record from the committed inputs and byte-compare; exit-coded
//   --offline alias of --repro (no model/ledger layer here)
//
// Usage: node benchmarks/sculpture/proportion-witness.mjs --subject <key> | --all
//        [--repro|--offline] [--pack packs/<style>.json] [--ticket <id>] [--rotate-pins]

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { classifyWitnessRepro, retiredEntry, WITNESS_REPRO_VERDICT } from "../../src/form/witness-repro.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { extractSilhouette, CONCEPT_BG } from "../../src/form/form-fidelity.mjs";
import {
  PROPORTION_DEFAULTS, deriveProportionDeclarations, proportionRatios, compareRatios, maskCoverage,
} from "../../src/form/silhouette-proportion.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { serializeArtifact, replayLedger } from "../../src/workshop/replay.mjs";
import { chainRels, packNs, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const WITNESS_RECORD_SCHEMA = "proportion-witness/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REL_DIR = "benchmarks/sculpture/proportion";
const SKETCH_REL = "benchmarks/sculpture/form-sketch";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readRel = (rel) => readFile(join(ROOT, rel), "utf8");

/** The witness-record paths — packNs-namespaced beside chainRels. */
export function witnessRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  const base = `${REL_DIR}/${runKey}`;
  return Object.freeze({ runKey, record: `${base}.json`, md: `${base}.md` });
}

/** Registered buildings with a committed conditioned sketch (the recognize.mjs predicate). */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/**
 * The deterministic derivation both modes share: committed ledger + final + sketch + concept →
 * declared targets, per-round measured ratios, per-round would-be verdicts. Throws when the
 * committed chain is absent or the replay does not reproduce the committed final (the witness
 * refuses to measure anything but the chain of record).
 */
async function derive(def) {
  const key = def.key;
  const rels = chainRels(key, packRel);
  const ledgerText = await readRel(rels.ledger).catch(() => {
    throw new Error(`no committed chain for "${key}" (${rels.ledger}) — the witness measures committed records only`);
  });
  const finalText = await readRel(rels.final);
  const ledger = JSON.parse(ledgerText);

  // Rule 5 anchor: the prefix source must reproduce the committed final byte-identically. The pack
  // is a committed, sha-pinned input — the geometry-bearing rounds (E-33) re-derive their levers
  // through it (replayLedger throws without it).
  const full = replayLedger({ ledger, pack });
  if (serializeArtifact(full.artifact) !== finalText) {
    throw new Error(`replay of ${rels.ledger} DIVERGES from the committed final artifact — refusing to witness a drifted chain`);
  }

  const sketchRel = `${SKETCH_REL}/${key}.json`;
  const sketchText = await readRel(sketchRel).catch(() => {
    throw new Error(`committed sketch absent: ${sketchRel} — the recorded fallback reference is required`);
  });
  const sketch = JSON.parse(sketchText);

  // the chain's OWN concept (sha-pinned in the ledger) is the contract image
  const conceptRel = `benchmarks/sculpture/${def.concept}`;
  const conceptBuf = await readFile(join(ROOT, conceptRel));
  if (ledger.conceptRef?.sha256 && ledger.conceptRef.sha256 !== sha256(conceptBuf)) {
    throw new Error(`${conceptRel} does not match the ledger's conceptRef sha — not the chain's contract image`);
  }
  const conceptMask = extractSilhouette(await decodeImage(join(ROOT, conceptRel)), CONCEPT_BG);
  const coverage = Math.round(maskCoverage(conceptMask) * 1e4) / 1e4;

  const declarations = deriveProportionDeclarations({ conceptMask, sketch });

  const rounds = [];
  for (let r = 0; r <= ledger.rounds.length; r++) {
    const { artifact } = replayLedger({ ledger, pack, throughRound: r });
    const measured = proportionRatios(artifactOccupancy(artifact));
    const cmp = compareRatios(measured, declarations);
    const entry = r === 0 ? { round: 0, stage: "seed" } : {
      round: r,
      decision: ledger.rounds[r - 1].decision,
      accepted: ledger.rounds[r - 1].conformance?.accepted ?? null,
      critiqueIssues: (ledger.rounds[r - 1].critique?.issues ?? [])
        .map((i) => ({ severity: i.severity, region: i.region })),
    };
    rounds.push({ ...entry, ratios: measured, pass: cmp.pass, rows: cmp.rows });
  }

  // the named defect: the worst failing whole-object row of the FINAL build
  const last = rounds[rounds.length - 1];
  const failing = last.rows.filter((x) => !x.mass && x.withinTolerance === false && Number.isFinite(x.excess));
  const defect = failing.length === 0 ? null : failing.reduce((a, b) => (b.excess > a.excess ? b : a));

  return {
    rels, ledger, declarations, rounds, defect,
    concept: { path: conceptRel, sha256: sha256(conceptBuf), coverage, segmentable: coverage <= PROPORTION_DEFAULTS.conceptMaxCoverage },
    inputs: {
      ledger: { path: rels.ledger, sha256: sha256(ledgerText) },
      finalArtifact: { path: rels.final, sha256: sha256(finalText) },
      sketch: { path: sketchRel, sha256: sha256(sketchText) },
    },
  };
}

async function buildRecord(def) {
  const d = await derive(def);
  const w = witnessRels(def.key, packRel);
  return {
    record: {
      schema: WITNESS_RECORD_SCHEMA,
      ticket: ticketId,
      subject: def.key,
      runKey: w.runKey,
      inputs: { ...d.inputs, concept: { path: d.concept.path, sha256: d.concept.sha256 } },
      conceptSegmentation: { coverage: d.concept.coverage, segmentable: d.concept.segmentable },
      declarations: d.declarations,
      rounds: d.rounds,
      defect: d.defect,
      generalization: await generalizationGrep(),
      replay: {
        npmRun: "proportion:repro",
        asserts: "committed ledger + sketch + concept → byte-identical witness record (prefix replay, no model, no GL, no judge)",
      },
    },
    rels: w,
    derived: d,
  };
}

const fmt = (x) => (x === null || x === undefined ? "—" : String(x));

function recordMd(record) {
  const { declarations: decl, rounds, defect } = record;
  const target = (name) => `${decl.targets[name]} (${decl.sources[name]})`;
  const head = rounds.map((r) => {
    const what = r.stage === "seed" ? "seed" : `${r.decision}${r.accepted === false ? " (rolled back)" : ""}`;
    const issues = (r.critiqueIssues ?? []).map((i) => `${i.severity}: ${i.region}`).join("<br>") || "—";
    const verdict = r.pass ? "pass" : `FAIL — ${r.rows.filter((x) => x.withinTolerance === false).map((x) => x.ratio).join(", ")}`;
    return `| ${r.round} | ${what} | ${issues} | ${fmt(r.ratios.ridgeToEave)} | ${fmt(r.ratios.roofShare)} | ${fmt(r.ratios.aspect)} | ${verdict} |`;
  });
  return [
    `# Proportion witness — ${record.runKey} (${WITNESS_RECORD_SCHEMA}, ${record.ticket})`,
    "",
    "The proportion-vs-concept check (S-135) run over the committed workshop chain, round by",
    "round, with the declared targets the chain never had. Deterministic end to end: prefix",
    "replay of the committed ledger, orthographic silhouettes, no model, no GL, no judge runs.",
    `Reproduce: \`npm run proportion:repro\`.`,
    "",
    "## Declared targets",
    "",
    `- concept segmentation: coverage ${record.conceptSegmentation.coverage} → ` +
    (record.conceptSegmentation.segmentable
      ? "segmentable, concept-sourced ratios live"
      : "NOT segmentable (full illustrated scene) — the conditioned sketch is the recorded fallback for every height ratio"),
    `- ridge:eave **${target("ridgeToEave")}**, roof share **${target("roofShare")}**, aspect **${target("aspect")}**; tolerance ${decl.tolerance} (relative)`,
    "",
    "## The chain, measured per round",
    "",
    "| round | action | critique issues | ridge:eave | roof share | aspect | proportion gate |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...head,
    "",
    "## The named defect",
    "",
    defect
      ? `**${defect.ratio} ${defect.measured} vs target ${defect.target} (${defect.source}) — Δrel ${defect.excess} > tolerance ${decl.tolerance}.** ` +
        "The build reads as mostly roof: the silhouette's widest layer (jetty + eave overhang) sits low, " +
        "so the storeys below it are a sliver of the elevation — the squat-storey / shallow read the " +
        "judge-side coverage rejection and the model's own critique kept describing, now with a number " +
        "every round could have aimed at."
      : "No whole-object ratio ends beyond tolerance — the chain's proportions match the declared targets.",
    "",
  ].join("\n");
}

async function runLive(def, { rotate }) {
  const rels = witnessRels(def.key, packRel);
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({
    pins: [rels.record, rels.md].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate,
    intent: `proportion witness (${rels.runKey})`,
    domain: "workshop",
  });
  await mkdir(join(ROOT, REL_DIR), { recursive: true });
  const { record } = await buildRecord(def);
  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, domain: "workshop" });
  await write(rels.record, jsonOf(record));
  await write(rels.md, recordMd(record));
  const last = record.rounds[record.rounds.length - 1];
  console.error(`[proportion] ${rels.runKey}: ${record.rounds.length} rows (seed + ${record.rounds.length - 1} rounds); ` +
    `final ${last.pass ? "PASS" : `FAIL on ${record.defect?.ratio ?? "unmeasured"} (Δrel ${record.defect?.excess})`}; ` +
    `targets ${JSON.stringify(record.declarations.targets)} (${Object.values(record.declarations.sources).join("/")}); ` +
    `grep ${record.generalization.clean ? "clean" : `HITS ${record.generalization.subjectKeysInRunner}`}`);
  return record.generalization.clean;
}

async function runRepro(def) {
  const rels = witnessRels(def.key, packRel);
  if (!existsSync(join(ROOT, rels.record))) {
    console.error(`[proportion --repro] ${rels.runKey}: no committed witness record — skipped`);
    return null;
  }
  // SKIP-vs-FAIL guard (T-142-01): a witness reproduces against its PINNED source (the ledger).
  // T-138's chains retired these ledgers — a registered rotation SKIPs (named), an unchanged source
  // that diverges still FAILs in the byte-compare below, an undeclared change FAILs here.
  const committed = JSON.parse(await readRel(rels.record));
  const pinnedSourceSha = committed.inputs?.ledger?.sha256;
  const ledgerRel = chainRels(def.key, packRel).ledger;
  const currentSourceSha = existsSync(join(ROOT, ledgerRel)) ? sha256(await readRel(ledgerRel)) : null;
  const verdict = classifyWitnessRepro({
    pinnedSourceSha, currentSourceSha, retired: retiredEntry(def.key, RETIRED),
  });
  if (verdict.verdict === WITNESS_REPRO_VERDICT.SKIP) {
    console.error(`[proportion --repro] ${rels.runKey}: SKIP — ${verdict.reason}`);
    return true; // an acceptable outcome (NOT null — a SKIP must not read as "no record")
  }
  if (verdict.verdict === WITNESS_REPRO_VERDICT.FAIL) {
    console.error(`[proportion --repro] ${rels.runKey}: ${verdict.reason}`);
    return false;
  }
  // GREEN: the pinned ledger is unchanged — re-derive and byte-compare (the corruption detector)
  const problems = [];
  try {
    const { record } = await buildRecord(def);
    if (sha256(jsonOf(record)) !== sha256(await readRel(rels.record))) {
      problems.push("re-derived witness record DIVERGES from the committed one");
    }
    if (recordMd(record) !== (await readRel(rels.md))) {
      problems.push("re-derived witness digest DIVERGES from the committed one");
    }
  } catch (e) {
    problems.push(e.message);
  }
  for (const p of problems) console.error(`[proportion --repro] ${rels.runKey}: ${p}`);
  console.error(`[proportion --repro] ${rels.runKey}: ${problems.length === 0
    ? "REPRODUCES byte-identically (ledger + sketch + concept → witness record)"
    : `${problems.length} problem(s)`}`);
  return problems.length === 0;
}

// --- CLI ------------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const repro = argv.includes("--repro") || argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL;
const ticketId = argOf("--ticket") ?? "T-135-01"; // the run's authority, named in the records

// the pack is a committed, sha-pinned input — geometry-bearing E-33 ledgers re-derive their levers
// through it (replayLedger throws without it). Loaded once for the whole run.
const pack = loadStylePack(join(ROOT, packRel));
// the sanctioned-rotation registry (committed sidecar — subject keys live there, not in this source,
// so the generalization self-grep stays clean). T-142-01: T-138's chains retired these ledgers.
const RETIRED = JSON.parse(await readRel("benchmarks/sculpture/retired-pins.json")).proportion;

const defs = subjectDefs();
if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}> or --all`);
if (onlySubject && !defs.some((d) => d.key === onlySubject)) {
  throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
}
const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);

if (repro) {
  const results = [];
  for (const def of selected) results.push(await runRepro(def));
  const ran = results.filter((r) => r !== null);
  if (ran.length === 0) throw new Error("--repro: no committed witness records found for the selection");
  if (ran.some((ok) => !ok)) process.exit(1);
} else {
  for (const def of selected) {
    const skip = !existsSync(join(ROOT, chainRels(def.key, packRel).ledger));
    if (skip) {
      console.error(`[proportion] ${witnessRels(def.key, packRel).runKey}: no committed chain — skipped`);
      continue;
    }
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
