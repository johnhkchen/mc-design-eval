# T-128-01 — brush-registry — Design

Phase 2 of 6. Options weighed against the research; decisions with rationale.

## D1 — Where the brush table lives

**Options.**
- **(A) Extend `src/pack/idiom-registry.mjs` in place.** Entries gain brush-contract metadata
  (composition, preview, tests); the four E-23 surface ops join as new `kind:"pass"` entries;
  `BRUSH_REGISTRY`/`brushNames`/`getBrush` exported as the brush-facing surface (aliases over the
  same frozen table).
- **(B) New superset module** (`brush-registry.mjs`) deriving idiom entries from `IDIOM_REGISTRY`
  by identity and adding the surface ops + a metadata table keyed by name.
- **(C) Replace the idiom registry** with a brush registry and shim the old exports.

**Decision: (A).** One table *is* the single door; (B) splits registration across two files (an
idiom brush would need an entry in one and metadata in the other — exactly the
`parallel-roots-duplicate-shared-deps` failure), and (C) is churn under two in-flight siblings.
(A)'s safety was verified consumer-by-consumer in research §1: `packDigest` enumerates the *pack's*
idiom list, not the registry, so new entries don't move committed prompts; `cardCoverage` pins
constructs only and the additions are passes; `parseWorkshopProgram` rejects passes as elements (so
new passes can't leak into programs); `validateStylePack` only resolves pack-declared names. All
metadata additions are new optional fields on frozen entries — additive for every reader. The
`IDIOM_REGISTRY` export name stays (T-125/T-126 import it); the brush aliases are the E-32-facing
names S-131 will target.

## D2 — The contract's form: schema + loader + semantic validator

**Options:** (a) a plain validator function, no schema file; (b) the style-pack idiom — a JSON
Schema over the *serializable descriptor* of each entry + an Ajv gate + a semantic layer for what
JSON Schema can't say.

**Decision: (b)** — the AC says "schema + loader" and the codebase has a settled idiom for exactly
this (style-pack.mjs: Ajv2020 strict, memoized validator, non-throwing `parse*` / fail-fast
`assert*`, `formatErrors` reused from artifact.mjs). Functions can't be JSON-schema'd, so the
contract splits:

- **`schema/brush.schema.json`** validates `brushDescriptor(name, entry)` — the serializable
  projection: `{schema:"brush/v1", name, kind:"construct"|"pass", source, composition, paramsSchema,
  preview, tests}`.
- **`composition`** is the machine-readable chaining declaration the AC asks for:
  `{consumes:[…], emits:[…]}` over a closed vocabulary — consumes ⊆ {`spec`, `occupancy`, `zones`,
  `features`, `kit`, `artifact`}, emits ⊆ {`cells`, `placements`, `report`, `removeSet`, `artifact`}.
  Constructs are `spec → cells`; passes are `occupancy+context → placements(+report)`. This makes
  "what a brush consumes/emits so brushes chain" checkable data, not prose.
- **Semantic layer** (`validateBrushRegistry`): per entry — paramsSchema compiles under Ajv **and
  accepts `{}`** (the T-124 partial-params rule); `generate`/`fn` is a function (and `apply` where
  declared); composition terms are in-vocabulary and kind-consistent (construct ⇒ emits `cells`,
  pass ⇒ emits `placements` or `removeSet`); `preview` is declared and resolvable (construct ⇒ ≥1
  card spec exists in the committed card table; pass ⇒ a preview spec realizes non-empty); the
  declared `tests` file exists on disk and names the brush (the committed-file-read purity class,
  same as loadBlockTable); `source` file exists and exports the named function.

The **test requirement** and **preview-card requirement** are thereby enforced by the contract
test sweeping the registry — a brush without a test file or a preview spec fails `npm test`, which
is what makes Rule 1 ("new brushes only enter through the contract") structural rather than polite.

## D3 — The inventory: what registers, what deliberately doesn't

**Register (4 new pass entries — the E-23 spray/paint ops):**
- `surface.fill` → `zoneFill` (zone-dominant recolor over a declared skin; the base coat),
- `surface.paint` → `paintFace` (+`mergePaints` combinator, `applyPaint` applier — the
  hollow-entry precedent of carrying `apply`),
- `surface.roof-courses` → `regularizeRoofCourses` (ADD-only hydrologic pit fill),
- `surface.strip-salt` → `stripStraySalt` (recolor isolated off-dominant specks).

**Stay out, with reasons recorded in the catalog:** `coverageGate`/`dominantCoverage` and the
other instruments — *measurement*, not technique (creation free / measurement frozen: gates are
not brushes); `boxShell` — T-126's program element, in flight, registering it would duplicate a
live seam (follow-up candidate once E-31 lands); the workshop `spray-paint` action — the model's
*hand* that composes `surface.paint`, not a technique itself; `extractApertures`/
`treatmentsFromKit` — context *producers* feeding `opening-dressing`, captured as that brush's
documented consumes-side, not separate brushes.

**Baseline count: 19 brushes** (11 constructs + 4 existing passes + 4 surface passes) — the number
the catalog commits as the factory baseline.

## D4 — Preview cards for passes (the new machinery)

Constructs already preview via `IDIOM_CARD_SPECS`; their entries declare `preview:{card:[spec
ids]}`. Passes act on context, so each new/existing pass entry declares a **synthetic preview
spec**: substrate (data) + params (data) + an in-entry `realize(substrate)` adapter bridging the
pass's natural signature — kept *inside the entry* so the registry stays the single description of
the technique (a name-keyed adapter table elsewhere would be a second door).

Substrates: `boxShell` (imported from `src/workshop/program.mjs` — pure, committed, tested; module
edge workshop→pack already exists in the other direction but creates no ESM cycle since
idiom-registry never imports workshop) for dressing/timber-frame/floorplan/surface ops; a local
~10-line solid box for `hollow` (it needs mass to carve — no solid-box generator exists). Floorplan's
`read` consumption is tiny (`storeyBands.floorLines/bands`, `openings` — research §verified), so a
synthetic read is hand-declared data. Timber-frame gets a minimal synthetic kit (2–3 entries).
Risk: these two are the fiddliest; fallback is a reduced-context preview (substrate + placements
rendered without the full report) — the card shows the technique, the unit tests prove the contract.

## D5 — The catalog

Pure layout `src/pack/brush-catalog.mjs` (the idiomCardLayout pattern: every brush = one plot on a
baseplate; pass plots = substrate cells with the pass's placements applied last-writer-wins) +
impure runner `benchmarks/sculpture/brush-catalog.mjs` (`npm run brush:catalog`): AJV gate →
`unmapped===0` → renders (4 gate azimuths + front, sha256 receipts, evidence-never-verdict) →
commits `benchmarks/sculpture/brush-catalog/{catalog.json, record.json, brush-catalog.md, PNGs}`.

`brush-catalog.md` is the AC's "one committed page": per brush — name, kind, source, composition,
parameter docs *generated from* `paramsSchema` (which makes the open pass-schemas honestly visible
as "params: open — see module contract", T-124 concern #4 surfaced not hidden), preview plot
reference. `record.json` carries `brushCount: 19` — the factory baseline. Coverage pin: **every**
registry brush appears (the card's construct-only pin, widened). The existing idiom-card stays
untouched as T-124's regression sheet (regenerating it would churn committed evidence for no
behavioral reason).

## D6 — Single-door enforcement

The T-113 conformance-tripwire pattern, new instance: `src/pack/brush-door.conformance.test.mjs` —
closed sweep over `src/recognition`, `src/workshop`, `src/pack`, `benchmarks/sculpture` asserting
that imports of the technique modules (roof-generate, shaped-vocab, idiom-constructs, zone-fill,
face-paint, surface-pattern, opening-dressing, hollow-carve, floorplan, placement-grammar) appear
only in: the registry, the preview/catalog modules, each technique's own test file, and the
**enumerated legacy runners** whose committed records pin them (durable-skin, spray-paint,
challenge-milestone, styled-milestone, … — final list from grep at implement time, each with a
one-line reason). A new file importing a technique directly fails with its name. This implements
"new brushes can only enter through it" without rewiring pinned chains.

## D7 — Byte-identity migration proof

**Rejected:** rerouting the pinned runners through the registry. It changes call paths that
committed sha256s pin, for zero behavioral gain — the AC's "the registry wraps, it does not fork"
is satisfied by *reachability*, and the door tripwire (D6) stops future bypasses. **Decision:** the
migration is additive name-resolution only; the proof is the full assert suite re-run after the
change, recorded in progress.md: `challenge:{cottage,gatehouse,church,barn} -- --offline` and
`-- --repro`, durable-skin `--offline`, `workshop:replay` + `workshop:offline`, `pack:validate`,
`npm test` (flags via `--`, the npm-flag-swallowing lesson). The idiom-card committed outputs are
asserted *unchanged* (git diff clean) since nothing it consumes moved.

## Rejected alternatives (summary)

- New superset registry module (B) / registry rename (C) — split door, sibling churn (D1).
- Plain validator without schema file — contradicts the AC's "schema + loader" and forgoes the
  settled Ajv idiom (D2).
- Registering gates/instruments or `boxShell` as brushes — measurement/creation split; live T-126
  seam (D3).
- Per-brush cropped PNGs — needs an image-slicing dep; whole-sheet renders + plot map is the
  committed idiom-card precedent (D5).
- Tightening the four open pass paramsSchemas now — S-125/126 own those contracts and are in
  flight; the catalog *documents* the gap instead (D5).

## Risks

1. **Sibling races on shared files** — this ticket edits only `idiom-registry.mjs` among shared
   modules, additively; commit lock serializes; re-check sibling commits before each commit.
2. **Pass-preview context synthesis** (floorplan read, timber-frame kit) — fallback in D4.
3. **Importing boxShell across the workshop/pack boundary** — no cycle today; documented in the
   module header so a future move (boxShell → a form module) has one call site to update.
