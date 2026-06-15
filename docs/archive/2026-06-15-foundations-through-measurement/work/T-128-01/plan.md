# T-128-01 — brush-registry — Plan

Phase 4 of 6. Ordered, independently verifiable steps; each commits atomically with the suite
green. Before every commit: re-check for minutes-old sibling commits touching the same files
(`git log --oneline -5`; the double-dispatch lesson) — T-125/T-126 are in flight but on disjoint
modules.

## Step 0 — Preflight (no commit)

- `npm test` green at baseline; `git status` notes pre-existing dirty files (tickets, .lisa*) that
  this ticket must NOT touch or commit.
- Verify the technique-module test files structure §1 will declare actually exist
  (`ls src/view/{zone-fill,face-paint,surface-pattern,opening-dressing,hollow-carve,floorplan}.test.mjs
  src/view/roof-generate.test.mjs src/form/{shaped-vocab,idiom-constructs,placement-grammar}.test.mjs`).
- Baseline byte-identity spot-check: `npm run workshop:offline` and one `challenge:cottage --
  --offline` pass BEFORE any change (so step-7 failures, if any, are attributable).

**Verify:** suite green; baseline asserts pass; test-file list confirmed (adjust structure §1
paths if any differ — document deviation in progress.md).

## Step 1 — The contract: schema + loader (commit 1)

- `schema/brush.schema.json` — descriptor schema per structure §2.
- `src/pack/brush-contract.mjs` — constants/vocabularies, `loadBrushSchema`,
  `compileBrushValidator` (memoized), `brushDescriptor`, `parseBrushDescriptor`,
  `assertBrushDescriptor`, `validateBrushRegistry` (injectable registry/cardSpecs/readFile).
  The pass-preview resolvability rule calls `realizePassPreview` via dynamic import? NO — keep it
  injectable: `validateBrushRegistry(…, {realizePreview})` defaulting to a lazy import-free stub
  that step 3 wires; cleaner: rule 5 for passes delegates to a `realizePreview` option whose
  DEFAULT arrives in step 3 (until then tests inject a fake). Document in module header.
- `src/pack/brush-contract.test.mjs` — fixture mini-registry; both-ways tests for: JSON gate,
  paramsSchema compile + `{}` accept, kind/composition consistency, vocabulary closure, preview
  declaration (card-id resolution against injected cardSpecs; pass realize ≥1 cell via injected
  realizer), tests-file existence + export mention (injected readFile), source export check.

**Verify:** `node --test src/pack/brush-contract.test.mjs` green; full suite green (nothing else
touched). Commit: `feat(E-32 T-128-01): brush contract — descriptor schema + gate + semantic rules`.

## Step 2 — The inventory registers (commit 2)

- `src/pack/idiom-registry.mjs`: add `composition`/`tests`/`preview` to all 15 entries (constructs:
  `preview.card` ids from the committed `IDIOM_CARD_SPECS`; passes: substrate decls + `realize`
  closures); add the four `surface.*` entries with closed paramsSchemas; add `BRUSH_REGISTRY`/
  `brushNames`/`getBrush` aliases. Update the module header (brush contract now lives here;
  E-32 Rule 1).
- `src/pack/idiom-registry.test.mjs`: new-entry shape tests, paramsSchema-accepts-`{}` sweep over
  ALL entries, alias identity, `idiomNames()` now includes `surface.*` (sorted), existing
  assertions untouched.
- Guard checks while editing: no block names/dimensions in the new entries' CODE beyond preview
  fixture data (CARD_ROWS status — preview substrates/params are committed fixture data, allowed);
  passes still rejected as workshop program elements (existing T-126 test covers — run it).

**Verify:** suite green, including `src/workshop/program.test.mjs` and `src/pack/style-pack.test.mjs`
untouched-and-green (the consumer-safety claim). `npm run pack:validate` green (rustic resolves).
Commit: `feat(E-32 T-128-01): full inventory registered — surface ops join, entries carry the
brush contract`.

## Step 3 — Pass previews realize (commit 3)

- `src/pack/brush-preview.mjs`: `previewSubstrate` (shell→boxShell, solid→local fill),
  `realizePassPreview`; wire as `validateBrushRegistry`'s default realizer (one import, top of
  brush-contract — no cycle: preview imports workshop/program + occupancy only).
- `src/pack/brush-preview.test.mjs`: substrate semantics (shell hollow + true holes; solid filled),
  per-pass realization non-empty + deterministic ×2, bbox sanity.
- `src/pack/brush-contract.test.mjs` += **the meta-test**: `validateBrushRegistry()` on the real
  registry → `ok:true, count:19`, zero error findings.
- Fiddly contexts (the design risk): floorplan synthetic read `{storeyBands:{floorLines,bands},
  openings:[]}`; timber-frame minimal kit (2–3 entries with `whereUsed`/`confidence`/`formClass`),
  zoneOf from y-bands. If a pass resists a small honest context, fall back per design D4
  (reduced-context preview) and record the deviation.

**Verify:** meta-test green; suite green. Commit: `feat(E-32 T-128-01): pass preview realization —
every brush previews on a declared synthetic subject`.

## Step 4 — The catalog, pure half (commit 4)

- `src/pack/brush-catalog.mjs`: `catalogPlots` (one representative per brush), layout (reuse the
  idiomCardLayout algorithm — extract-and-share is tempting but idiom-card is committed T-124
  surface; COPY the ~40-line algorithm with a header note instead of destabilizing the card,
  unless a zero-risk parameterization is obvious at the keyboard — decide there, document),
  `catalogCoverage`, `brushCatalog` artifact, `brushCatalogMarkdown` (per-brush docs from
  paramsSchema walk, excluded-inventory table with D3 reasons, baseline count).
- `src/pack/brush-catalog.test.mjs`: overlap-free, 19/19 coverage, artifact shape via
  `assertArtifact`, markdown completeness (every name, the count, the exclusions).

**Verify:** suite green. Commit: `feat(E-32 T-128-01): brush catalog — layout, artifact, the page`.

## Step 5 — The committed catalog (commit 5)

- `benchmarks/sculpture/brush-catalog.mjs` runner (idiom-card ladder: gate → unmapped===0 →
  coverage → contract clean → renders w/ sha256 → write outputs).
- `package.json`: `"brush:catalog"` script.
- Run `npm run brush:catalog`; commit outputs `benchmarks/sculpture/brush-catalog/{catalog.json,
  record.json, brush-catalog.md, view-*.png}`. Eyeball the front render: every plot non-empty,
  passes visibly distinct from bare substrate (the glance test — if a pass preview reads as
  nothing, fix the preview spec, not the gate).

**Verify:** runner exits 0; `record.json.brushCount === 19`; renders committed with receipts.
Commit: `feat(E-32 T-128-01): committed brush catalog — 19 brushes, the factory baseline`.

## Step 6 — The single door enforced (commit 6)

- Grep the real import graph for the ten technique modules; enumerate every current importer with
  a one-line reason (pinned runner / intra-layer / test / door).
- `src/pack/brush-door.conformance.test.mjs` per structure §7 (closed sweep + cannot-rot checks).

**Verify:** tripwire green against the real tree (no allowlist padding — every entry justified);
suite green. Commit: `feat(E-32 T-128-01): the registry is the only door — conformance tripwire`.

## Step 7 — Byte-identity proofs (commit 7, the migration AC)

Run and record verbatim results in progress.md:

```
npm run challenge:cottage  -- --offline   && npm run challenge:cottage  -- --repro
npm run challenge:gatehouse -- --offline  && npm run challenge:gatehouse -- --repro
npm run challenge:church   -- --offline   && npm run challenge:church   -- --repro
npm run challenge:barn     -- --offline   && npm run challenge:barn     -- --repro
node benchmarks/sculpture/durable-skin.mjs --subject cottage --offline   (and gatehouse)
npm run workshop:replay && npm run workshop:offline
npm run pack:validate && npm run idioms:card  (then git diff --stat benchmarks/sculpture/idiom-card/ → clean)
npm test
```

(Flags after `--` — the npm-flag-swallowing lesson. GL renders are excluded from decisions; the
asserts above gate on hashes/coverage only.)

**Verify:** every assert passes; idiom-card outputs byte-unchanged. Any failure = stop, diagnose,
fix THIS ticket's change (the records are pinned truth — never regenerate them to pass; pin-guard
is structural). Commit: progress.md + any doc-only notes.

## Step 8 — Review (no code)

`review.md` per RDSPI: files, AC walk-through, coverage + gaps, open concerns (expected: open pass
paramsSchemas documented-not-tightened; boxShell layering note; catalog plot representativeness).

## Test strategy summary

Unit (pure, suite glob): contract rules both ways; preview realization determinism; catalog
layout/coverage/page; registry entry shapes. Integration (runner, committed evidence): the catalog
record + renders. Regression: the untouched 1703-test suite + the step-7 offline/repro asserts —
the AC's byte-identity proof. NOT tested (consistent with precedent): the impure runner's wiring
(seam-invariant, idiom-card status); render pixels (evidence only).

## Acceptance-criteria mapping

| AC | Steps |
|---|---|
| Contract (schema+loader, pure, tested; composition; test req; preview-card req) | 1, 3 |
| Full inventory through the registry; only door for new brushes | 2, 6 |
| Behavior-preserving migration, byte-identical re-verify | 0, 7 |
| Catalog page + brush count baseline | 4, 5 |
| No per-building constants; `npm test` green | every step |
