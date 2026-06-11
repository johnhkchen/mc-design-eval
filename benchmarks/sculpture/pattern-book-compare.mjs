// THE MILESTONE COMPARISON (T-127-01, story S-127, epic E-31) — pure I/O over COMMITTED records:
// the frozen gate's patternbook-label verdicts beside the metrology path's generated-label bests
// (T-122's project-best profiles), composed by src/form/head-to-head.mjs into ONE table, plus the
// E-12 handoff page with the two contact sheets side by side per subject.
//
// THIS FILE READS GATE RECORDS BY PATH — that is exactly why it is NOT in the workshop isolation
// scan (src/workshop/isolation.test.mjs names it): it convenes nothing, judges nothing, writes no
// verdict record; it quotes verdicts as judged. Deterministic over its committed inputs (re-run →
// byte-identical). No model, no GL.
//
// Usage: node benchmarks/sculpture/pattern-book-compare.mjs [--rotate-pins]

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { composeHeadToHead, headToHeadMd } from "../../src/form/head-to-head.mjs";
import { ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked } from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const GATE_REL = "benchmarks/sculpture/multi-angle";
const CHAIN_REL = "benchmarks/sculpture/pattern-book";
const GENERATED_REL = "benchmarks/sculpture/generated";
const H2H_RELS = [`${CHAIN_REL}/head-to-head.json`, `${CHAIN_REL}/head-to-head.md`, "pr/assets/pattern-book-milestone.md"];

const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";
const readJson = async (rel) => JSON.parse(await readFile(join(ROOT, rel), "utf8"));

const rotate = process.argv.includes(ROTATE_FLAG);

/** Subjects with BOTH committed gate records (patternbook + generated labels). */
const keys = Object.keys(SUBJECTS).filter((k) =>
  existsSync(join(ROOT, `${GATE_REL}/${k}-patternbook.json`)) &&
  existsSync(join(ROOT, `${GATE_REL}/${k}-generated.json`)));
if (keys.length === 0) {
  throw new Error("no subject has both a patternbook and a generated gate record — run the chains and gate:patternbook:* first");
}

const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: H2H_RELS.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
  rotate, intent: "pattern-book head-to-head composition",
});

const subjects = [];
for (const key of keys) {
  const chain = existsSync(join(ROOT, `${CHAIN_REL}/${key}.json`)) ? await readJson(`${CHAIN_REL}/${key}.json`) : null;
  const generated = existsSync(join(ROOT, `${GENERATED_REL}/${key}.json`)) ? await readJson(`${GENERATED_REL}/${key}.json`) : null;
  subjects.push({
    key,
    records: {
      patternbook: await readJson(`${GATE_REL}/${key}-patternbook.json`),
      generated: await readJson(`${GATE_REL}/${key}-generated.json`),
    },
    context: {
      patternbook: chain && chain.status !== "pipeline-failed" ? {
        budget: chain.budget,
        workshop: chain.stages.workshop && {
          outcome: chain.stages.workshop.outcome,
          rounds: chain.stages.workshop.rounds,
          accepted: chain.stages.workshop.accepted,
          rolledBack: chain.stages.workshop.rolledBack,
          conformance: chain.stages.workshop.conformance,
        },
        seedCells: chain.stages.seed?.cells ?? null,
        recognitionAsks: chain.stages.recognition?.replies ?? null,
      } : { missing: "no committed chain record" },
      generated: generated ? {
        status: generated.status,
        census: generated.census ? { spikes: generated.census.spikes, raggedRate: generated.census.raggedRate } : null,
      } : { missing: "no committed generated record" },
    },
  });
}

const h2h = composeHeadToHead({ subjects });
const record = { ...h2h, ticket: "T-127-01", subjects: h2h.subjects };

const contextMd = subjects.map(({ key, context }) => {
  const c = context.patternbook;
  const w = c?.workshop;
  return [`### ${key} — chain receipts`,
    w ? `Workshop: **${w.outcome}** after ${w.rounds.used}/${w.rounds.budget} rounds (accepted ${w.accepted}, ` +
        `rolled back ${w.rolledBack}); conformance ${w.conformance.first ? `${w.conformance.first.passed}✓/${w.conformance.first.findings}f` : "—"} → ` +
        `${w.conformance.final.passed}✓/${w.conformance.final.findings}f; seed ${c.seedCells} cells; ` +
        `recognition asks ${c.recognitionAsks ? `${c.recognitionAsks.askCount}/${c.recognitionAsks.budget}` : "—"}.`
      : `Chain: ${JSON.stringify(c)}.`,
    context.generated?.census ? `Generated-path census: spikes ${context.generated.census.spikes}, ragged rate ${context.generated.census.raggedRate}.` : "",
  ].filter(Boolean).join("\n");
}).join("\n\n");

const md = headToHeadMd(h2h) + "\n## Chain receipts (pattern-book side)\n\n" + contextMd + "\n";

const sheetsMd = ["# Pattern-book milestone — the sheets, side by side (E-31, T-127-01)", "",
  "Left: the pattern-book path (recognize → realize → workshop revision). Right: the metrology",
  "path's project best (the E-29/T-122 generated chain). The sheet is the verdict artifact",
  "(E-25 Rule 1); `benchmarks/sculpture/pattern-book/head-to-head.md` is the table.", ""];
for (const s of h2h.subjects) {
  const [pb, gen] = s.rows;
  const caption = (r) => `${r.label}: ${r.decided ? (r.passed ? "PASS" : "FAIL") : `REFUSAL`} — gaps ${r.gapCount ?? "—"}/${r.gapBudget ?? "—"}, same-object ${r.sameObject.count}/${r.sameObject.total}`;
  sheetsMd.push(`## ${s.key}`, "",
    "| pattern-book | metrology best (generated) |", "| --- | --- |",
    `| ![${s.key} patternbook](${pb.sheet?.replace(/^pr\/assets\//, "")}) | ![${s.key} generated](${gen.sheet?.replace(/^pr\/assets\//, "")}) |`,
    `| ${caption(pb)} | ${caption(gen)} |`, "");
}

await guardedWriteRecord({ root: ROOT, rel: H2H_RELS[0], content: jsonOf(record), rotate, trackedSet });
await guardedWriteRecord({ root: ROOT, rel: H2H_RELS[1], content: md, rotate, trackedSet });
await guardedWriteRecord({ root: ROOT, rel: H2H_RELS[2], content: sheetsMd.join("\n") + "\n", rotate, trackedSet });

for (const s of h2h.subjects) {
  console.error(`[head-to-head] ${s.key}: patternbook gaps ${s.rows[0].gapCount}/${s.rows[0].gapBudget} same-object ` +
    `${s.rows[0].sameObject.count}/${s.rows[0].sameObject.total} vs generated ${s.rows[1].gapCount}/${s.rows[1].gapBudget} ` +
    `(${s.rows[1].sameObject.count}/${s.rows[1].sameObject.total}) — deltas gaps ${s.deltas.gapCount}, same-object ${s.deltas.sameObject}`);
}
console.error(`✓ wrote ${H2H_RELS.join(", ")}`);
