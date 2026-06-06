# T-042-01 — Plan: codesign-ab-and-consolidate

Ordered, independently-verifiable steps. Three atomic commits (per structure.md). Testing strategy:
the pure gate is unit-tested; the offline consolidation is executed (integration) and its report read;
the journal/handoff is inspected. Baseline `npm test` = 348/348.

## Step 1 — `src/color/value-gate.mjs` (the gate core)

Implement exactly the interface in structure.md:
- `VALUE_GATE_SCHEMA`, `DEFAULT_VALUE_GATE_THRESHOLD = 6`.
- `realizedPaletteFromArtifact(artifact)` — count `placements[].block` by `normalizeName`; resolve distinct
  names via `resolveValueTruePalette` to true Lab; weight = count/total; first-seen order; manifest
  fallback; throw on no names.
- `toReferenceClusters(reference)` — accept extractor result or array; `block ← block??key`,
  `lab ← lab??repColor.lab`, `weight ← weight??coverage??pct??1`.
- `valueGate(realized, reference, {threshold})` — per realized block `nearestLab` into reference clusters;
  `meanDeltaE` (weighted), `maxDeltaE`; `flagged`/`recommendCorrectiveReplace = meanDeltaE>threshold`;
  `perBlock` rows; `comparePalettes` partition.
- `gapClosure({before, after})`.

**Verify:** `node -e` smoke — build a tiny synthetic artifact + reference, assert shapes and that a
dark-block realized palette flags against a light reference. Then Step 2's tests formalize it.

## Step 2 — `src/color/value-gate.test.mjs` (unit tests)

Groups (node:test, synthetic inputs — no fixtures, no GL):
- **A — realizedPaletteFromArtifact:** counts/weights sum to 1; first-seen order; non-cube name resolves
  to its value-true block's Lab; manifest fallback when no placements; throws on empty.
- **B — toReferenceClusters:** accepts `{palette:[{block,repColor:{lab}}]}` and `[{key,lab}]`; weight
  defaulting; throws on empty/bad.
- **C — valueGate ΔE math:** identical realized==reference → meanDeltaE ≈ 0, not flagged; a realized
  palette far in L* from the reference → meanDeltaE large, `flagged` + `recommendCorrectiveReplace` true;
  `maxDeltaE ≥ meanDeltaE`; weighting (a heavy dark block dominates the mean).
- **D — comparePalettes passthrough:** `present/missing/added` correct on known id sets.
- **E — gapClosure:** before>after → `improved`, `delta>0`, `pct` correct; before==after → not improved;
  `before:0` guarded (no NaN).
- **F — purity/determinism:** same inputs → deep-equal output; input artifact/reference not mutated.
- **G — threshold knob:** custom `threshold` flips `flagged` at the boundary.

**Verify:** `npm run test:unit` → 348 + new tests green; full `npm test` green.
**Commit:** `feat(E-14 T-042-01): valueGate — concept↔render Δvalue feedback gate`.

## Step 3 — `benchmarks/sculpture/codesign-ab.mjs` (offline consolidation)

Implement the orchestration in structure.md over `DEFAULT_RUNS` (moai/sword/pineapple):
load `.v1`+`.v2` artifacts + `concept.png`; `extractPaletteFromImage` reference; two `valueGate` runs;
`gapClosure`; categorical verdict vs the hard-coded E-13 baseline labels; per-subject corrective-re-place
line. Emit `codesign-ab.json` (schema `codesign-ab/v1`) and `codesign-ab.md`.

**Verify:** `node benchmarks/sculpture/codesign-ab.mjs` runs clean; read `codesign-ab.md` — confirm every
subject has ΔE_before, ΔE_after, closure, a verdict, and the corrective-re-place note; confirm the moai row
shows a closure. Sanity-check the numbers against `value-match-ab.md`'s swap shifts (moai
`gray_concrete`→`deepslate_bricks` +5.5 should manifest as a measurable before>after).
**Commit:** `feat(E-14 T-042-01): codesign A/B — measured concept↔render gap closure`.

## Step 4 — journal: `design-learnings.md` E-14 section

Append (after the E-13 frontier section) the value-true section: the claim, the before/after table (pulled
from `codesign-ab.json`), the moai close (+ residual to the concept dominant), and the honest notes (sword
near-true; by-construction caveat; segmentation cost; collapse residual).

**Verify:** `grep -n "E-14 value-true"` finds the heading exactly once; numbers match `codesign-ab.json`.

## Step 5 — E-12 handoff: `pr/assets/`

Copy 6 frames: `runs/{001-moai,007-sword,013-pineapple}/render-3q.png` → `frames/value-{subject}-v1.png`
and `render-3q.value.png` → `frames/value-{subject}-v2.png`. Write `pr/assets/value-true.md` — the beat
(paragraph + before/after table + moai pair callout + honesty line + frame references).

**Verify:** the 6 frames exist and are non-empty; `value-true.md` links resolve (relative paths under
`pr/assets/`); the ΔE numbers match the journal.
**Commit (with Step 4):** `docs(E-14 T-042-01): value-true journal + E-12 before/after handoff`.

## Step 6 — final verification (AC sweep)

- **AC1 — loop on ≥3 subjects, before/after ΔE + verdict:** `codesign-ab.md` has all three with numbers +
  categorical verdicts vs E-13. ✔ (live full-loop re-run documented as deferred/metered, command given.)
- **AC2 — Δvalue gate exists (comparePalettes: realized vs target → ΔE + threshold flag; corrective
  re-place documented):** `valueGate` in `value-gate.mjs`, unit-tested; per-subject re-place note. ✔
- **AC3 — design-learnings.md value-true (E-14) section (before/after, moai close, honest gaps):** ✔
- **AC4 — E-12 handoff (renders + before/after beat under pr/assets/):** 6 frames + `value-true.md`. ✔
- **AC5 — honest, `.v1` reproducible, `npm test` green:** `git status` shows only additions + one
  append; no `.v1`/frozen-prompt/existing-module change; `npm test` green. ✔

## Risks & mitigations

- **ΔE_after≈0 looks tautological.** Mitigation: state it plainly in report + journal; report `maxDeltaE`
  and the residual-to-dominant so the *honest* gap is visible; frame the gate as a regression detector.
- **Concept extraction `k` sensitivity.** Use `k:8` (matching T-041's `writeValueMatch` default) so the
  reference is consistent with the snap's own target; note `k` as the tunable.
- **Frame copy bloats the repo.** 6 PNGs ≤ ~95 KB each; acceptable and the established `pr/assets` pattern.
- **No `.v1` regression.** Final `git status` review is a gating check before the last commit.
