# T-165-01 — Design

Decide how recognition declares a `style` and how Layer A (`DiagnoseBuild`) selects a per-style `expected`
profile by it, with `rustic`/`saltcrag` as distinct registered suites. Grounded in Research.

## The decision in one paragraph

Add an **optional `style`** to the building-program schema, **stamped at the recognition seam** from the
conditioning pack (`program.style = pack.style`) — honest, because today style *is* the pack id. Give
`DiagnoseBuild` a new typed input **`style_profile`**: a compact per-style construction-grammar block
(roof / walls / openings) **derived deterministically from the pack** by a new pure function
`styleProfileBlock({pack})` in `diagnose.mjs`. `diagnoseRenderArgs` keys the `style` label on
**`program.style ?? pack.style`** (the *declared* style, with the honest pack-id fallback for legacy
records) and emits `style_profile`. The "suite" is the (style → pack) pair; the registry of suites is the
two pack files. A pure fixture proves the two suites' profiles genuinely differ (rustic timber-frame+spruce
vs saltcrag limewash+dark-oak+ridge-tiles), supplying the within-family gradient.

## Options considered

### A. Stamp `style` at the seam; derive a per-style `style_profile` from the pack (CHOSEN)

- Recognition stamps `program.style = pack.style` (optional schema field, stripped from the base prompt).
- `styleProfileBlock({pack})` derives roof/wall/opening grammar lines from `pack.idioms` + `pack.palette`.
- `DiagnoseBuild` gains a `style_profile` input; the prompt consumes it as the style's expected
  construction grammar. `style` keyed on `program.style ?? pack.style`.
- **Pros:** honest (no invented signal); single-source (profile derived from pack, no per-subject
  constants); pure serializer (pack passed in); genuinely differentiates (the two packs differ in grammar,
  not just palette); minimal pin churn (only my epic's diagnose golden + an optional schema field).
- **Cons:** stamping ≠ model-authored style (acknowledged, and exactly what the Note blesses); one BAML
  param + a `baml:gen`; the diagnose golden regenerates.

### B. Make the *model* author `style` in recognition (rejected)

Add `style` to the model-facing schema and ask the model to declare it. **Rejected:** (1) it invents a
richer style signal the recognition step doesn't actually produce (the pack already fixes the style — the
model has no freedom to choose another) — the anti-hedge Note forbids this; (2) it drifts the FX-R1
recognition prompt shas (every committed recognition record re-pins); (3) it adds a failure mode (the model
declaring a style off the pack) with no upside this ticket.

### C. No new input — rely on `palette_block` + `program_block` to differ (rejected)

The palette already differs between packs, so "expected materials" already differ. **Rejected:** the
ticket asks Layer A to *select its expected profile by the style* — materials alone are not the style's
**construction grammar** (gable vs hip, timber-frame vs limewash, ridge-tiles). Without an explicit
profile, "suite selection" is invisible and untestable; the AC2 fixture would have nothing crisp to assert,
and the within-family gradient (the whole point) stays implicit. C does too little.

### D. A hand-written per-style descriptor table (rejected)

A literal `{rustic: "...", saltcrag: "..."}` map of expected prose. **Rejected:** it duplicates the pack
(two sources of truth that drift — E-39's "one composition point" rule) and is a per-style constant table
that the recognize self-grep discipline warns against. Derive from the pack instead.

## Why deriving the profile from the pack is the single source of truth

The pack already encodes the style's grammar:
- **roof**: which `roof.*` idioms it has (`roof.gable`, `roof.hip`, `roof.pyramid`) + `roof.field` /
  `roof.ridge` / `roof.course*` palette roles → "this style roofs with X material, ridge Y, pitch classes
  Z".
- **walls**: `wall.*` palette roles + wall-construction idioms present (`timber-frame`, `surface.*`,
  `plinth`, `jetty`) → "walls are timber-frame infill" vs "limewash over cobble with quoins".
- **openings**: `door.*` / `window.*` palette roles + `opening-dressing` / `dormer` / `arch` idioms →
  "dressed openings; dormers" vs "dressed openings; shuttered".

`styleProfileBlock({pack})` reads exactly these fields, so editing the pack updates the profile — no second
source. It is keyed on the **pack**, which is keyed on the **style**; there are no subject names anywhere.

## How the suite is "selected by the declared style"

- In the **loop**: `program.style` was stamped from the same pack `--pack` loaded, so they agree; the
  selection is trivially consistent. `style` in the prompt comes from `program.style` (the declared style),
  proving the label flows from the program, not a constant.
- In the **fixture** (AC2): the same base program + same renders are serialized **twice** — once as
  `{program with style:"rustic", pack: rustic}`, once as `{program with style:"saltcrag", pack: saltcrag}`.
  The `style`, `palette_block`, and `style_profile` differ → the rendered prompt differs → the `expected`
  the judge forms differs. This is the deterministic, offline-testable proxy for "yields different expected
  text": **the inputs that drive `expected` provably differ**, and we exhibit the two profiles side by side.
- IO note: loading a pack *by style slug* (the registry lookup) is the seam's job
  (`loadStylePack(packPath)`); `diagnose.mjs` stays pure and receives the resolved pack. The fixture/test
  loads both packs and passes them — no IO inside the serializer.

## The falsifiable claim — how this lands

Claim: keying `expected` on the declared style makes the *same build* yield *different* expected
roof/wall/opening under two styles. **Evidence it succeeds:** the two packs differ in roof material
(spruce vs dark-oak), wall grammar (timber-frame vs limewash+cobble+quoins), ridge (none vs deepslate
tiles), and available idioms — so `styleProfileBlock` produces materially different roof/wall/opening
lines. **The honest escape hatch (recorded if it fires):** if the derived profiles came out near-identical,
AC2 lets the ticket record "reskins don't differ, T-165-02 is the real test." Given the table above, that
is **not** expected to fire for rustic-vs-saltcrag — the DG5 fixture asserts the profiles differ on
concrete tokens; if that assertion could only be met by trivial label differences, the review will say so.

## Boundaries (unchanged)

- **No proportion / massing** in Layer A (the T-164-01 boundary; profile is element grammar, not size).
- **Frozen instrument untouched**; fused `CritiqueWorkshopRound` path unchanged.
- **No gate vocabulary** in the new BAML text (TG5 stays green).
- **`style_profile` is style grammar, not a verdict** — descriptive "expected", consistent with Layer A's
  contract (`expected/present/missing`).
