# T-042-01 — Progress: codesign-ab-and-consolidate

Implementation log for the terminal E-14 link. Three atomic commits, all on `main` (the RDSPI shared
branch). Baseline `npm test` 348/348 → final 369/369.

## Completed

### Step 1 — the Δvalue gate (commit `feat(E-14 T-042-01): valueGate …`)
- **`src/color/value-gate.mjs`** (NEW, ~210 lines). Pure, GL-free, network-free. Exports:
  - `VALUE_GATE_SCHEMA = "value-gate/v1"`, `DEFAULT_VALUE_GATE_THRESHOLD = 6`.
  - `realizedPaletteFromArtifact(artifact)` — placed manifest at value-true Lab (via
    `resolveValueTruePalette`), weighted by placement count; manifest fallback; the segmentation-free
    render proxy.
  - `toReferenceClusters(reference)` — tolerant: accepts an `extractPaletteFromImage` result or a ready array.
  - `valueGate(realized, reference, {threshold})` — coverage-weighted mean ΔE (`nearestLab`), max ΔE,
    `flagged`, `recommendCorrectiveReplace`, per-block rows, and the `comparePalettes` partition. **The gate.**
  - `gapClosure({before, after})` — the before/after scalar.
- **`src/color/value-gate.test.mjs`** (NEW) — 21 tests, groups A–G. `npm test` → 369/369.

### Step 2 — the consolidation A/B (commit `feat(E-14 T-042-01): codesign A/B …`)
- **`benchmarks/sculpture/codesign-ab.mjs`** (NEW) — offline over the 3 committed subjects; no model, no GL.
  Extracts the concept palette, builds v1/v2 realized palettes, runs `valueGate` twice, `gapClosure`,
  categorical verdict vs the E-13 baseline, per-subject corrective-re-place note.
- **`codesign-ab.{md,json}`** (NEW, generated). Measured result:

  | subject | ΔE before | ΔE after | closure | gate after | verdict |
  |---|---|---|---|---|---|
  | moai | 6.97 | 2.31 | 4.66 (66.9%) | ✓ clear | **closed** |
  | sword | 3.98 | 2.65 | 1.33 (33.4%) | ✓ clear | already-near-true |
  | pineapple | 10.34 | 8.55 | 1.79 (17.3%) | ⚠ flagged | narrowed |

### Step 3 — journal + E-12 handoff (commit `docs(E-14 T-042-01): …`)
- **`docs/knowledge/design-learnings.md`** (append-only) — "E-14 value-true co-design" section: before/after
  table, the moai close, honest notes (tautology caveat, sword near-true, segmentation cost, collapse residual).
- **`pr/assets/value-true.md`** (NEW) — the "measured the drift, then killed it" beat.
- **`pr/assets/frames/value-{moai,sword,pineapple}-v{1,2}.png`** (NEW, copied from the run renders).

## Deviations from the plan

1. **No new `comparePalettes`-with-ΔE function; layered ΔE on top instead.** The plan/design called for the
   gate to "use `comparePalettes` (realized vs target) → ΔE". `comparePalettes` is categorical
   (present/missing/added) by construction; rather than change it, `valueGate` *imports* it for the partition
   and computes the ΔE via `nearestLab` alongside. Same contract, no change to the shared E-10 function.
2. **Corrective re-place: recommend, never auto-fire (as designed, D4).** Confirmed empirically — a second
   snap against the same realized palette is idempotent. The gate sets `recommendCorrectiveReplace`; the
   runner records `fired: false` with the rationale per subject. Satisfies "documented whether or not it fired".
3. **Render-PNG extraction abandoned for the placed-manifest proxy.** Research found render PNGs are ~79%
   `glass` (viewer scene). Used the T-039 table invariant (a real full-cube block renders as itself) for a
   segmentation-free realized palette. Documented as the "cost of segmentation" honesty note (AC3).
4. **Live full-loop re-run deferred (metered).** The committed `.v1`/`.v2` artifacts for 3 subjects already
   exercise both loop ends; a fresh palette-aware-concept → value-build run is model+image-gen metered. The
   command is documented in `codesign-ab.md`; the offline consolidation is fully reproducible. Mirrors how
   T-040/T-041 gated their live paths.

## Verification done

- `node --test src/color/value-gate.test.mjs` → 21/21.
- `npm test` → 369/369 (was 348 + 21 new).
- `node benchmarks/sculpture/codesign-ab.mjs` → clean; report + json written; numbers cross-checked against
  `value-match-ab.md` swap shifts (moai `gray_concrete`→`deepslate_bricks` +5.5 ⇒ measurable before>after).
- `git status` — only additions + the `design-learnings.md` append + Lisa-owned ticket frontmatter; **no
  `.v1` artifact, frozen prompt, or existing module touched** (`.v1` reproducibility intact).

## Remaining

- Review artifact (`review.md`) — next.
