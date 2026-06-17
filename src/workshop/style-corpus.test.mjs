// Tests for the E-46 / S-183 style-corpus loader (T-183-01). Pure I/O + schema — reading and validating
// the committed corpus needs NO model spend (S-183 AC). These also guard the states' referenced assets
// exist on disk, so a moved render/concept/pack/beside fails `npm test` (the reproducibility guard).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

import {
  loadStyleCorpus,
  parseStyleCorpus,
  assertSemantics,
  byCellType,
  cruxCells,
  hardMiddle,
  statePaths,
  STYLE_CORPUS_SCHEMA,
  CELL_TYPES,
  CRUX_CELL_TYPES,
  FAITHFULNESS,
  REPO_ROOT,
} from "./style-corpus.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";

// ---- SC1: the committed corpus loads, has >=8 states, and carries the rater + notes ----
test("SC1 committed corpus loads and meets the S-183 shape", () => {
  const corpus = loadStyleCorpus();
  assert.equal(corpus.schema, STYLE_CORPUS_SCHEMA);
  assert.ok(corpus.states.length >= 8, `expected >=8 states, got ${corpus.states.length}`);
  assert.ok(typeof corpus.rater === "string" && corpus.rater.length > 0, "rater field required");
  assert.ok(typeof corpus.notes === "string" && corpus.notes.length > 0, "notes (honest reporting) required");
  for (const e of corpus.excluded ?? []) assert.ok(e.reason && e.reason.length > 0, `excluded ${e.id} needs a reason`);
});

// ---- SC2: every cellType / intendedFaithfulness is a member of the authoritative enums ----
test("SC2 cellType and intendedFaithfulness are always known enum members", () => {
  const corpus = loadStyleCorpus();
  for (const s of corpus.states) {
    assert.ok(CELL_TYPES.includes(s.cellType), `state ${s.id}: ${s.cellType} not in ${CELL_TYPES.join(",")}`);
    assert.ok(FAITHFULNESS.includes(s.intendedFaithfulness),
      `state ${s.id}: ${s.intendedFaithfulness} not in ${FAITHFULNESS.join(",")}`);
  }
});

// ---- SC3: AC-shape coverage — all four crux cell types, >=2 hard-middle, >=3 subjects ----
test("SC3 corpus covers the four crux cell types + >=2 hard-middle + >=3 subjects", () => {
  const corpus = loadStyleCorpus();
  for (const t of CRUX_CELL_TYPES) {
    assert.ok(byCellType(corpus, t).length >= 1, `missing crux cell type ${t}`);
  }
  assert.ok(hardMiddle(corpus).length >= 2, `need >=2 hard-middle, got ${hardMiddle(corpus).length}`);
  assert.ok(cruxCells(corpus).length >= 1);
  const subjects = new Set(corpus.states.map((s) => s.subject));
  assert.ok(subjects.size >= 3, `need >=3 subjects, got ${subjects.size}`);
});

// ---- SC4: every referenced asset exists on disk (the reproducibility guard) ----
test("SC4 every state's build/renderDir, the 4 view PNGs, pack, concept and beside exist on disk", () => {
  const corpus = loadStyleCorpus();
  const azimuths = [...MULTI_ANGLE_GATE.azimuths];
  for (const s of corpus.states) {
    for (const p of statePaths(s)) {
      assert.ok(existsSync(resolve(REPO_ROOT, p)), `state ${s.id}: missing asset ${p}`);
    }
    for (const a of azimuths) {
      const view = resolve(REPO_ROOT, join(s.renderDir, `view-${a}.png`));
      assert.ok(existsSync(view), `state ${s.id}: missing render view-${a}.png in ${s.renderDir}`);
    }
  }
});

// ---- SC5: parse returns a VALUE on malformed input; load throws on the same (artifact.mjs idiom) ----
test("SC5 parseStyleCorpus returns {ok:false} on invalid; valid round-trips", () => {
  const bad = parseStyleCorpus('{"schema":"eval-alignment/style-corpus/v1"}'); // missing required `rater`,`states`
  assert.equal(bad.ok, false);
  assert.ok(Array.isArray(bad.errors) && bad.errors.length > 0);

  const notJson = parseStyleCorpus("{not json");
  assert.equal(notJson.ok, false);

  const corpus = loadStyleCorpus();
  const good = parseStyleCorpus(JSON.stringify(corpus));
  assert.equal(good.ok, true);
});

// ---- SC6: assertSemantics rejects a missing crux cell type (coverage is enforced, not cosmetic) ----
test("SC6 assertSemantics throws when a crux cell type is absent", () => {
  // A minimal corpus missing `wrong-pack-right-picture` — schema-valid shape, semantic-invalid coverage.
  const skeleton = (cellType, id, subject) => ({
    id, subject, cellType, build: "b", pack: "p", concept: "c",
    intendedFaithfulness: "high", renderDir: "b", beside: "x",
  });
  const corpus = {
    schema: STYLE_CORPUS_SCHEMA, rater: "t", notes: "t",
    states: [
      skeleton("match", "m", "gatehouse"),
      skeleton("same-pack-wrong-picture", "s", "cottage"),
      skeleton("hard-middle", "h1", "barn"),
      skeleton("hard-middle", "h2", "gatehouse"),
    ],
  };
  assert.throws(() => assertSemantics(corpus), /missing required crux cell type "wrong-pack-right-picture"/);
});
