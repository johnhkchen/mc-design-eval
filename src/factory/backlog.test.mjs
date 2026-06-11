// Tests for the design-backlog factory's pure half (T-131-01, story S-131, epic E-32).
// The structural AC lands here: duplicate detection both ways, the FX-D1 empty-union
// classifier, and the scan-dir assertion against the REAL `.lisa.toml`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BACKLOG_DIR,
  packSummary,
  assertNonEmptyBacklog,
  enforceRegistryDedup,
  draftRel,
  notesRel,
  renderDraft,
  renderNotes,
  backlogFiles,
  lisaScanDirs,
  isOutsideScanDirs,
} from "./backlog.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const ITEM = Object.freeze({
  name: "opening-fill",
  purpose: "Fills each dressed aperture with its leaf or lattice member.",
  parameter_sketch: "{ kind: 'door'|'shutter', block: string }",
  composition_notes: "Runs AFTER opening-dressing and AFTER hollow.",
  test_plan: "door kind fills full aperture height; degenerate aperture emits nothing.",
  preview_subject: "A single 1-block-thick dressed stone wall panel with one 2x3 aperture.",
  context: "Openings read as voids without leaves. The registry owns dressing, not filling.",
  acceptance_criteria: ["fills the declared aperture", "never widens the aperture", "no-op when already filled"],
});
const NOTE = Object.freeze({ need: "stone plinth course", existing_brush: "plinth", note: "set height=1." });
const PROV = Object.freeze({
  function: "DecomposeBrushBacklog",
  model: "claude-test",
  prompt_sha256: "abc123",
  generated: "2026-06-11T00:00:00Z (run rustic)",
});
const OWNED = ["plinth", "roof.gable", "surface.paint"];

// ---------------------------------------------------------------- FX-D1: the empty union

test("B1 assertNonEmptyBacklog throws on the empty union, passes either-populated", () => {
  assert.throws(() => assertNonEmptyBacklog({ items: [], parametrization_notes: [] }), /MALFORMED/);
  assert.throws(() => assertNonEmptyBacklog({}), /MALFORMED/);
  assert.deepEqual(assertNonEmptyBacklog({ items: [ITEM], parametrization_notes: [] }).items, [ITEM]);
  assert.equal(assertNonEmptyBacklog({ items: [], parametrization_notes: [NOTE] }).parametrization_notes[0], NOTE);
});

// ---------------------------------------------------------------- AC3: dedup, both ways

test("B2 an item naming an OWNED brush is demoted to a parametrization note, ledgered", () => {
  const owned = { ...ITEM, name: "roof.gable" };
  const r = enforceRegistryDedup({ items: [owned], parametrization_notes: [] }, OWNED);
  assert.deepEqual(r.items, [], "never a duplicate work item");
  assert.deepEqual(r.demotions, [{ name: "roof.gable" }], "the demotion is the quality signal, never silent");
  assert.equal(r.parametrization_notes.length, 1);
  assert.equal(r.parametrization_notes[0].existing_brush, "roof.gable");
  assert.match(r.parametrization_notes[0].note, /registry owns/);
  assert.match(r.parametrization_notes[0].note, /kind: 'door'/, "the requested sketch survives in the note");
});

test("B3 an item naming a NEW brush passes through untouched", () => {
  const r = enforceRegistryDedup({ items: [ITEM], parametrization_notes: [NOTE] }, OWNED);
  assert.deepEqual(r.items, [ITEM]);
  assert.deepEqual(r.demotions, []);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.parametrization_notes, [NOTE]);
});

test("B4 a note citing an UNOWNED brush is kept but warned — never auto-promoted", () => {
  const ghost = { need: "wavy ridge", existing_brush: "roof.wave", note: "use it" };
  const r = enforceRegistryDedup({ items: [], parametrization_notes: [ghost] }, OWNED);
  assert.equal(r.parametrization_notes.length, 1, "kept");
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /roof\.wave/);
});

// ---------------------------------------------------------------- AC1: outside the scan dirs

const REAL_TOML = readFileSync(join(ROOT, ".lisa.toml"), "utf8");

test("B5 the REAL .lisa.toml: BACKLOG_DIR is outside every scan dir (lisa never sees a draft)", () => {
  const dirs = lisaScanDirs(REAL_TOML);
  assert.ok(dirs.length >= 3, `expected the [dirs] section, got ${JSON.stringify(dirs)}`);
  assert.ok(dirs.includes("docs/active/tickets"), "the parse must see the tickets scan dir");
  assert.equal(isOutsideScanDirs(BACKLOG_DIR, dirs), true, `${BACKLOG_DIR} must be outside ${dirs}`);
});

test("B6 scan-dir verdicts: containment either way fails; prefix-collision does not", () => {
  const dirs = ["docs/active/tickets", "docs/active/work"];
  assert.equal(isOutsideScanDirs("docs/active/tickets/sub", dirs), false, "inside a scan dir");
  assert.equal(isOutsideScanDirs("docs/active", dirs), false, "scan dir nested under it");
  assert.equal(isOutsideScanDirs("docs/active/ticketsX", dirs), true, "prefix collision is not containment");
  assert.equal(isOutsideScanDirs("docs/active/backlog/", dirs), true, "trailing slash tolerated");
});

test("B7 lisaScanDirs reads only the [dirs] section", () => {
  const toml = `[dirs]\ntickets = "a/b"\n[scheduling]\nmax_threads = 2\nother = "c/d"\n`;
  assert.deepEqual(lisaScanDirs(toml), ["a/b"]);
});

// ---------------------------------------------------------------- AC2: the draft contract

test("B8 a draft carries every quality-contract section and checkboxed ACs", () => {
  const md = renderDraft({ styleName: "rustic", item: ITEM, provenance: PROV });
  for (const section of [
    "## Context (self-contained)",
    "## Acceptance Criteria",
    "## Parameter sketch",
    "## Composition",
    "## Test plan",
    "## Preview subject",
  ]) {
    assert.ok(md.includes(section), `missing ${section}`);
  }
  const boxes = md.match(/^- \[ \] /gm) ?? [];
  assert.equal(boxes.length, ITEM.acceptance_criteria.length);
  assert.ok(md.includes(ITEM.purpose) && md.includes(ITEM.context));
});

test("B9 a draft is structurally unschedulable: no lisa vocabulary in the frontmatter", () => {
  const md = renderDraft({ styleName: "rustic", item: ITEM, provenance: PROV });
  const fm = md.split("---")[1];
  for (const key of ["id:", "story:", "phase:", "depends_on:"]) {
    assert.ok(!new RegExp(`^\\s*${key}`, "m").test(fm), `frontmatter must not carry ${key}`);
  }
  assert.match(fm, /^status: draft$/m);
  assert.match(fm, /^type: brush-work-item$/m);
  assert.match(fm, /^rework: \[\]$/m);
});

test("B10 backlogFiles: every rel under BACKLOG_DIR; rendering deterministic; notes file present iff content", () => {
  const backlog = enforceRegistryDedup({ items: [ITEM], parametrization_notes: [NOTE] }, OWNED);
  const files = backlogFiles({ styleName: "rustic", backlog, provenance: PROV });
  assert.deepEqual(files.map((f) => f.rel), [draftRel("rustic", ITEM.name), notesRel("rustic")]);
  for (const f of files) assert.ok(f.rel.startsWith(`${BACKLOG_DIR}/`));
  const again = backlogFiles({ styleName: "rustic", backlog, provenance: PROV });
  assert.deepEqual(again, files, "same input, same bytes (the offline replay contract)");
  const none = backlogFiles({
    styleName: "rustic",
    backlog: { items: [ITEM], parametrization_notes: [], demotions: [], warnings: [] },
    provenance: PROV,
  });
  assert.deepEqual(none.map((f) => f.rel), [draftRel("rustic", ITEM.name)], "no empty notes page");
});

test("B11 renderNotes names demotions and warnings; clean run says so", () => {
  const md = renderNotes({ styleName: "rustic", notes: [NOTE], demotions: [{ name: "plinth" }], warnings: ["w1"], provenance: PROV });
  assert.ok(md.includes("`plinth`") && md.includes("- w1"));
  const clean = renderNotes({ styleName: "rustic", notes: [NOTE], demotions: [], warnings: [], provenance: PROV });
  assert.match(clean, /none — the model honored the registry digest/);
});

// ---------------------------------------------------------------- the moved packSummary pin

test("B12 packSummary(rustic) byte-equals the committed decompose fixture's style_summary", () => {
  const inputs = JSON.parse(readFileSync(join(ROOT, "src/baml/fixtures/decompose/inputs.json"), "utf8"));
  const pack = loadStylePack(join(ROOT, "packs/rustic.json"));
  assert.equal(packSummary(pack), inputs.style_summary, "the moved function must not drift from the fixture");
});
