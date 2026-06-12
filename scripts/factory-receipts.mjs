// The compounding receipts runner, impure half (T-132-01, story S-132, epic E-32 terminal):
// reads the committed records of the end-to-end run — the registry, the two packs, the
// backlog records, the promoted drafts' rework frontmatter, the per-stage ledgers, the two
// frozen-gate records — and composes the ONE TABLE through src/factory/receipts.mjs.
//
//   node scripts/factory-receipts.mjs --style <slug> [--rotate-pins]   (npm run factory:receipts)
//
// Pure of model and GL: a re-run over the same committed records is byte-identical (the
// replay). Deliberately OUTSIDE the workshop isolation scan, like pattern-book-compare.mjs —
// it reads verdict-record paths the chain runners are forbidden to name; it judges nothing.
// No subject key in this source: the run key is DISCOVERED from the committed chain records
// (`pattern-book/<key>--<style>.json`); the style arrives as argv (npm-encoded, the house
// convention). The registry BEFORE snapshot is committed DATA below (captured at the step-0
// baseline, ref d679644), never re-derived — the live table is the AFTER.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { brushNames } from "../src/pack/idiom-registry.mjs";
import { loadStylePack } from "../src/pack/style-pack.mjs";
import { gateRow } from "../src/form/head-to-head.mjs";
import { composeReceipts } from "../src/factory/receipts.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../src/form/pin-guard.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const STYLE = argOf("--style");
if (!STYLE || !/^[a-z][a-z0-9-]*$/.test(STYLE)) {
  console.error("usage: node scripts/factory-receipts.mjs --style <slug> [--rotate-pins]");
  process.exit(2);
}

/** The chain's namespaced run key, discovered from the committed records (exactly one). */
const runKeys = readdirSync(join(ROOT, "benchmarks/sculpture/pattern-book"))
  .filter((f) => f.endsWith(`--${STYLE}.json`))
  .map((f) => f.replace(/\.json$/, ""));
if (runKeys.length !== 1) {
  throw new Error(`factory-receipts: expected exactly one committed ${STYLE} chain record, found ${runKeys.length} (${runKeys.join(", ")})`);
}
const SUBJECT_RUN = runKeys[0];
const SUBJECT = SUBJECT_RUN.slice(0, -(STYLE.length + 2)); // <key>--<style>
const OUT = ["benchmarks/sculpture/factory/receipts.json", "benchmarks/sculpture/factory/receipts.md"];

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/** The step-0 baseline (docs/active/work/T-132-01/progress.md): committed data, not re-derived. */
const BEFORE = Object.freeze({
  ref: "d679644",
  count: 19,
  names: Object.freeze([
    "arch", "chimney", "course.slab", "course.stairs", "dormer", "floorplan", "head.flat",
    "hollow", "jetty", "opening-dressing", "plinth", "roof.gable", "roof.hip", "roof.pyramid",
    "surface.fill", "surface.paint", "surface.roof-courses", "surface.strip-salt", "timber-frame",
  ]),
});

/** Promoted drafts: name + rework notes from the backlog frontmatter (T-131's metric). */
function promotedDrafts() {
  const dir = "docs/active/backlog";
  const out = [];
  for (const f of readdirSync(join(ROOT, dir)).filter((f) => f.startsWith(`${STYLE}--`) && f.endsWith(".md") && !f.includes("parametrization"))) {
    const text = read(`${dir}/${f}`);
    const fm = text.split("---")[1] ?? "";
    if (!/ticket:\s*"T-132-01"/.test(fm)) continue; // unpromoted drafts are not receipts
    const name = (/^brush:\s*"([^"]+)"/m.exec(fm) ?? [])[1];
    if (!name) throw new Error(`factory-receipts: no brush name in ${f}`);
    const reworkBlock = /\nrework:(.*?)(?=\n\S|$)/s.exec(fm)?.[1] ?? "";
    const rework = [...reworkBlock.matchAll(/^\s+- "(.*)"$/gm)].map((m) => m[1]);
    out.push({ name, rework });
  }
  if (!out.length) throw new Error("factory-receipts: no promoted drafts found");
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Model calls per stage, from the committed ledgers (live asks only — replays cost nothing). */
function costShape() {
  const rows = [];
  let formation = 0;
  for (const stage of ["vernacular", "palette", "proportions", "decompose"]) {
    const led = readJson(`packs/drafts/${STYLE}/stages/${stage}/ledger.json`);
    if (led.source === "live" || led.source === undefined) formation += led.askCount ?? 0;
  }
  rows.push({ stage: "formation", calls: formation, source: `packs/drafts/${STYLE}/stages/*/ledger.json` });
  rows.push({ stage: "ratification", calls: 0, source: "scripts/ratify-pack.mjs (human gate, zero spend)" });
  const backlogLedger = readJson(`docs/active/backlog/records/${STYLE}/ledger.json`);
  rows.push({ stage: "backlog", calls: backlogLedger.askCount ?? 0, source: `docs/active/backlog/records/${STYLE}/ledger.json` });
  rows.push({ stage: "brush-implementation", calls: 0, source: "AI coding (lisa) — outside the chain's meter" });
  const recog = readJson(`benchmarks/sculpture/recognition/${SUBJECT_RUN}.replies.json`);
  rows.push({ stage: "recognition", calls: recog.askCount ?? 0, source: `benchmarks/sculpture/recognition/${SUBJECT_RUN}.replies.json` });
  const workshop = readJson(`benchmarks/sculpture/workshop/${SUBJECT_RUN}.json`);
  const workshopCalls = (workshop.rounds ?? []).reduce((a, r) => a + (r.askCount ?? r.replies?.length ?? 0), 0);
  rows.push({ stage: "workshop", calls: workshopCalls, source: `benchmarks/sculpture/workshop/${SUBJECT_RUN}.json` });
  const gate = readJson(`benchmarks/sculpture/multi-angle/${SUBJECT}-patternbook-${STYLE}.json`);
  const gateCalls = (gate.views ?? []).reduce((a, v) => a + (v.replies?.length ?? 0), 0);
  rows.push({ stage: "gate", calls: gateCalls, source: `benchmarks/sculpture/multi-angle/${SUBJECT}-patternbook-${STYLE}.json` });
  return rows;
}

const rotate = process.argv.includes(ROTATE_FLAG);
const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: OUT.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
  rotate, intent: "factory receipts compose",
});

const rustic = loadStylePack(join(ROOT, "packs/rustic.json"));
const pack = loadStylePack(join(ROOT, `packs/${STYLE}.json`));
const chainRecord = readJson(`benchmarks/sculpture/pattern-book/${SUBJECT_RUN}.json`);
if (chainRecord.status === "pipeline-failed") {
  throw new Error(`factory-receipts: the chain record is pipeline-failed at "${chainRecord.stage}" — no receipts over a broken chain`);
}
const backlogLedger = readJson(`docs/active/backlog/records/${STYLE}/ledger.json`);

const { receipts, md } = composeReceipts({
  before: BEFORE,
  afterNames: brushNames(),
  baselineStyle: rustic.style,
  baselineIdioms: rustic.idioms.map((i) => i.name),
  style: pack.style,
  styleIdioms: pack.idioms.map((i) => i.name),
  backlog: {
    items: backlogLedger.counts?.items ?? backlogLedger.counts?.newItems ?? 0,
    notes: backlogLedger.counts?.notes ?? 0,
    demotions: (backlogLedger.dedup?.demotions ?? []).length,
    askCount: backlogLedger.askCount ?? 0,
  },
  drafts: promotedDrafts(),
  costShape: costShape(),
  gates: {
    baseline: gateRow(readJson(`benchmarks/sculpture/multi-angle/${SUBJECT}-patternbook.json`), `${SUBJECT}-patternbook`),
    candidate: gateRow(readJson(`benchmarks/sculpture/multi-angle/${SUBJECT}-patternbook-${STYLE}.json`), `${SUBJECT}-patternbook-${STYLE}`),
  },
  conformance: chainRecord.stages.workshop.conformance,
  chain: {
    record: `benchmarks/sculpture/pattern-book/${SUBJECT_RUN}.json`,
    replay: chainRecord.replay.npmRun,
  },
});

const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate, trackedSet });
await write(OUT[0], jsonOf(receipts));
await write(OUT[1], md);
console.error(`[factory-receipts] registry ${receipts.registry.before} → ${receipts.registry.after}; ` +
  `reuse ${Math.round(receipts.reuse.fraction * 100)}% of ${receipts.reuse.packIdioms.length} pack brushes; ` +
  `${receipts.callsTotal} model calls; verdict carried as it fell. → ${OUT[1]}`);
