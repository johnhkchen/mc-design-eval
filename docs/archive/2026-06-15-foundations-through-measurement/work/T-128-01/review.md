# T-128-01 — brush-registry — Review

Phase 6 of 6. Handoff: what changed, how it is tested, what a human should look at.

## What shipped (against the acceptance criteria)

1. **The brush contract** — `schema/brush.schema.json` (draft 2020-12, strict) over the
   serializable descriptor (identity, kind, `composition {consumes, emits}` with closed
   vocabularies, paramsSchema, preview declaration, test pointer) +
   `src/pack/brush-contract.mjs`: the style-pack Ajv idiom (memoized validator, non-throwing
   `parseBrushDescriptor` / fail-fast assert, `formatErrors` reused) and `validateBrushRegistry`
   — the semantic rules JSON Schema can't say: paramsSchema compiles AND accepts `{}`,
   kind/composition consistency, **preview resolves** (construct card ids exist and realize that
   brush; pass previews realize ≥1 cell with a non-empty effect), **tests file exists and names
   the brush**, source exists. The contract meta-test sweeps the real registry — an entry without
   tests or a preview fails `npm test`. ✅
2. **Full inventory registered** — `src/pack/idiom-registry.mjs` extended in place (additive
   only; the wrap-don't-fork constraint with T-125/T-126 in flight): all 15 T-124 entries carry
   the contract metadata; the four E-23 spray/paint ops join as `surface.fill` / `surface.paint`
   / `surface.roof-courses` / `surface.strip-salt` (closed paramsSchemas, unlike the four
   inherited open pass schemas — deliberately untouched, S-125/126 territory).
   `BRUSH_REGISTRY`/`brushNames`/`getBrush` alias the SAME frozen table. Consumer safety was
   verified per consumer (packDigest enumerates pack idioms, cardCoverage pins constructs only,
   workshop programs reject passes) — all sibling suites green untouched. ✅
3. **Preview cards for passes** — `src/pack/brush-preview.mjs`: substrates (`shell` via T-126's
   boxShell, `solid`, sealed `box`) + `realizePassPreview` driving each entry's in-entry
   `realize({occ, cells})` closure. Every one of the 8 passes previews on a declared synthetic
   subject (deterministic, visible-effect-asserted). ✅
4. **The catalog** — `src/pack/brush-catalog.mjs` (one plot per brush, every-brush coverage pin,
   AJV-gated artifact, the page generator) + `benchmarks/sculpture/brush-catalog.mjs`
   (`npm run brush:catalog`: contract → coverage → gate → unmapped 0/4019 → renders w/ sha256
   receipts) + committed `benchmarks/sculpture/brush-catalog/` (catalog.json, record.json,
   brush-catalog.md, 5 PNGs). **`record.json.brushCount = 19`** (11 constructs + 8 passes) —
   **the factory baseline** S-132 measures against. The page documents per-brush params (open
   schemas surfaced honestly) and the deliberate NOT-brushes with reasons (instruments, boxShell,
   the workshop action, context producers). ✅
5. **The single door** — `src/pack/brush-door.conformance.test.mjs` (the T-113 tripwire pattern):
   closed sweep over six pipeline dirs; technique-module imports allowed only via an EXACT
   allowlist (the door, intra-layer composition, record-pinned legacy runners — each with a
   reason, derived from the real import graph, zero padding); allowances asserted live so the
   list can't rot. ✅
6. **Byte-identity migration** — registration is additive name-resolution; nothing rewired.
   Proofs (progress.md, verbatim): challenge `--offline` ×4 PASS, durable-skin `--offline` ×2
   PASS, `workshop:replay` BYTE-IDENTICAL, `workshop:offline` PASS, `pack:validate` PASS,
   `idioms:card` regenerates **git-clean**, `npm test` 1821/1821. ✅ (with one pre-existing
   finding — below)

## Files

- **Created:** `schema/brush.schema.json`; `src/pack/brush-contract.mjs`(+test),
  `src/pack/brush-preview.mjs`(+test), `src/pack/brush-catalog.mjs`(+test),
  `src/pack/brush-door.conformance.test.mjs`; `benchmarks/sculpture/brush-catalog.mjs` +
  committed catalog outputs (8 files).
- **Modified:** `src/pack/idiom-registry.mjs`(+test) — additive metadata + 4 entries + aliases;
  `package.json` (`brush:catalog` script only).
- **Deleted:** none. Existing exports/semantics untouched (T-125/T-126 consumers unaffected).

## Test coverage

36 new unit tests across five files: contract rules both ways on fixtures + THE META-TEST (real
registry clean, count 19); substrate semantics + every-pass preview realization (non-empty,
deterministic, effect-positive, op-signature checks); catalog layout overlap-free + coverage pin
+ artifact gate + page completeness; registry entry shapes + alias identity; the door tripwire.
**Gaps (consistent with precedent):** the impure runner is wiring-only, not unit-tested (the
idiom-card seam-invariant status); render PNGs are evidence with sha256 receipts, never gated;
`validateBrushRegistry`'s source-check is existence-only (adapters' realizers live in the
registry file itself, so an export-name check against `source` would false-positive — documented
in the module).

## ⚠ Critical finding for human attention (pre-existing, not this ticket)

**`challenge:* -- --repro` is broken on all four subjects** — the fresh-process chain no longer
reproduces the committed challenge pins (cottage/barn diverge at the final artifact; gatehouse/
church hit the pin-guard at shell/reconstructed — the guard correctly refusing the overwrite).
A clean worktree at the pre-ticket commit `808d6fc` reproduces the IDENTICAL hashes, so the
drift predates T-128 (and the unchanged fresh-hash before/after is itself this ticket's
no-behavior-change proof). The committed records still self-verify (`--offline` green). Some
change between the records' pinning and today broke live reproduction without rotating pins —
this needs an owning ticket (bisect candidates: today's T-117/T-118/T-119-era chain changes or
dependency drift). Records were NOT regenerated here (pin policy).

## Open concerns / known limitations

1. **The four inherited pass paramsSchemas remain open** (`additionalProperties:true`) — their
   real contracts live in their modules; the catalog says so per brush. Tightening belongs to
   S-125/S-126 (both in flight today).
2. **`boxShell` import direction** — brush-preview imports `src/workshop/program.mjs` (no ESM
   cycle; header-documented). If boxShell ever moves to a form module, one call site updates.
   boxShell itself is deliberately NOT a brush (live T-126 seam; NOT_BRUSHES table).
3. **Catalog plots one representative per construct** (first card id); the full orientation
   sweep stays on the T-124 idiom card. If S-131 wants per-variant cards, extend `catalogPlots`.
4. **Pass previews are display-honest but staged**: roof-courses pits its own substrate,
   strip-salt salts it, hollow/floorplan cut away for visibility — documented in the registry
   header and per-entry comments; op semantics are proven by their module tests, not the card.
5. **The door allowlist is exact** — a pinned runner importing an additional technique trips.
   That is intended friction (new capability enters via the registry), but it means legacy-runner
   refactors may need allowlist edits in their owning tickets.
6. **Sibling activity:** T-125 committed recognition-runner work in parallel (disjoint files; no
   conflicts); T-126's review was already committed. No shared-file races occurred.

## For the human reviewer

Eyeball `benchmarks/sculpture/brush-catalog/view-catalog-+x+z.png` (all 19 plots should read as
distinct techniques — the dressed pavilion, the hollow cutaway, the striped paint face, the
timbered shell) and skim `brush-catalog.md` top to bottom (the page IS the AC's catalog: count,
per-brush docs, the not-brushes table). `npm run brush:catalog` reproduces the verdict;
`node --test src/pack/brush-contract.test.mjs` shows the contract holding the real registry.
Decide who owns the `--repro` drift investigation — that is the one red flag, and it was red
before this ticket started.
