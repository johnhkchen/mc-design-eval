# T-041-01 — Plan: value-matched-build

Ordered, independently verifiable steps. Two commits (feat/docs-pair convention): (1) the pure
module + tests + config id; (2) the wiring (sculpture descriptor, runner flag, A/B script) + produced
renders/reports.

## Testing strategy

- **Unit only for the block-choice logic** (AC4): `src/color/value-build.test.mjs`, pure arithmetic +
  committed-table read, no model/GL/network, auto-collected by `node --test "src/**/*.test.mjs"`.
  Synthetic artifacts + synthetic realized palettes (`[{block,lab}]` from real table rows) so `to` ∈
  table and `valueShift` are assertable without re-running an extractor or a render.
- **The A/B render is GL/metered** (AC accepts this): produced by the offline `value-match-ab.mjs` over
  committed runs (no model call), `GL_AVAILABLE` is true here so the value-matched stills are saved.
- **Verification per AC:**
  - AC1 (snap to value-true via `nearestLab` against the S-039 contract + realized palette extracted
    with `extractPaletteFromImage`, additive to `.v1`) → module + test groups A/B/C/D + runner flag
    off-by-default; `.v1` outputs byte-unchanged (git status).
  - AC2 (A/B for moai+sword+pineapple: `.v1` vs value-matched render + per-region swap) →
    `value-match-ab.mjs` writes per-run `value-swaps.md` + `render-3q.value.png` and the top-level
    `value-match-ab.md`.
  - AC3 (moai drift addressed honestly) → the moai swap row (`gray_concrete` → value-true block, with
    `valueShift`) + the report's realized-dominant residual note.
  - AC4 (renders saved; `npm test` green) → final `npm test` + the saved `.value.png` files.

## Steps

### Step 1 — `src/config.mjs`: add the `.v2` method id
Add `VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2"` with the shared-prompt doc comment.
*Verify:* `node -e "import('./src/config.mjs').then(m=>console.log(m.VCONCEPT_SCULPTURE_METHOD_ID_V2))"`.

### Step 2 — `src/color/value-build.mjs`: the pure snap module
Implement per Structure: `VALUE_MATCHED_SCHEMA`, `toRealizedClusters`, `distinctNames`, `anchorFor`,
`snapArtifactToValueTrue`. Watch items: namespace strip on lookup + re-namespace on write;
`structuredClone` (no input mutation); manifest rebuilt first-seen from rewritten placements; round
`toL`/`valueShift`/`deltaE`; `opts.methodId` stamps the clone only.
*Verify:* `node -e` smoke — snap a committed moai `artifact.json` against its extracted concept palette;
print the swap table; confirm `gray_concrete` → a real value-true block with `valueShift > 0`, the
snapped artifact `assertArtifact`s clean.

### Step 3 — `src/color/value-build.test.mjs`: groups A–G
Per Structure. Key assertions:
- A: placements rewritten to nearest realized block (namespaced), manifest deduped/first-seen,
  `changedPlacements` correct, one swap row per distinct name.
- B: dark-anchor → lighter realized cluster ⇒ `valueShift > 0`, pinned `to`.
- C: `minecraft:honey_block` (non-table) snaps without throwing, `to` ∈ table.
- D: `[{block,lab}]` vs extractor-shaped realized input deep-equal.
- E: two calls deep-equal; input artifact unchanged; `methodId` stamps clone only.
- F: empty realized + no-names artifact throw actionable errors.
- G: every swap row numeric `toL`/`valueHonestL`, `to` ∈ table; snapped artifact re-validates.
*Verify:* `node --test src/color/value-build.test.mjs` green.

### Step 4 — `src/sculpture.mjs`: `VCONCEPT_SCULPTURE_V2` descriptor
Import the v2 id; add the frozen descriptor + header note (prompt shared with `.v1`,
`composeSculptureBuildPrompt` unchanged).
*Verify:* sculpture tests still green (`node --test src/sculpture.test.mjs`).

### Step 5 — commit 1
`feat(E-14 T-041-01): snapArtifactToValueTrue — value-matched build path` (module, test, config,
descriptor).

### Step 6 — `benchmarks/sculpture/run.mjs`: additive `--value-match` flag
Add the flag (default false) and the post-`.v1` value-match block (extract → snap → write
`artifact.value-matched.json` + `value-swaps.{json,md}` → render `render-3q.value.png` → `summary.json`
`valueMatch` block). `.v1` path untouched.
*Verify:* `node benchmarks/sculpture/run.mjs` with no `--subject` still prints usage; flag parsed.

### Step 7 — `benchmarks/sculpture/value-match-ab.mjs`: offline A/B + run it
Implement the offline A/B (Structure). Run it for moai/sword/pineapple:
`node benchmarks/sculpture/value-match-ab.mjs`.
*Verify:* each run dir gains `artifact.value-matched.json`, `value-swaps.{json,md}`,
`render-3q.value.png`; `benchmarks/sculpture/value-match-ab.md` written with side-by-side tables;
moai row shows `gray_concrete` → value-true block.

### Step 8 — full suite + commit 2
`npm test` green (incl. the new test file; `reuse-boundary.test.mjs` still green — cielab untouched).
Commit: `feat(E-14 T-041-01): value-matched A/B (moai+sword+pineapple) + runner flag` with the
produced renders/reports.

## Risks & mitigations

- **Palette collapse** (several model blocks → one realized cluster, e.g. moai mid-grays → `copper_ore`)
  reduces material variety. *Mitigated:* surfaced in the swap report (`changed`/`to` columns + realized
  palette listing); `k` is a knob to widen the target set; documented as a known limitation in Review.
- **Under-correction of the moai** (hue-anchor lifts to the nearest realized neutral, not the lighter
  dominant). *Mitigated:* honest — `valueShift` and the realized dominant are both reported; AC3 asks for
  honesty, not a maximal lift.
- **Snapped artifact failing the schema** (namespace/shape). *Mitigated:* re-namespaced writes + a
  group-G `assertArtifact` round-trip test.
- **Render regression vs `.v1`** on some subject. *Mitigated:* `.v1` render kept side-by-side; the A/B
  report shows both so a regression is visible, not hidden.

## Done when
All four ACs check; `npm test` green; both commits landed; the three A/B renders + swap reports saved;
`progress.md` reflects the run and any deviations; `review.md` summarizes changes/coverage/concerns.
