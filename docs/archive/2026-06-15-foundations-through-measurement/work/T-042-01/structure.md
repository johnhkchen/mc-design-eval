# T-042-01 — Structure: codesign-ab-and-consolidate

The blueprint — files created/modified, public interfaces, module boundaries, ordering. No code, the
*shape* of the code. Grounded in design.md (gate = new pure module; consolidation = offline runner;
journal + handoff are docs/assets).

## File-level change set

| file | action | what |
|---|---|---|
| `src/color/value-gate.mjs` | **NEW** | The Δvalue feedback gate (pure). The deliverable for AC2. |
| `src/color/value-gate.test.mjs` | **NEW** | Unit tests for the gate (keeps `npm test` green; AC5). |
| `benchmarks/sculpture/codesign-ab.mjs` | **NEW** | Offline consolidation: per-subject before/after ΔE + verdicts → `codesign-ab.{md,json}` (AC1). |
| `benchmarks/sculpture/codesign-ab.md` | **NEW (generated)** | The A/B report: before/after table + per-subject gate detail. |
| `benchmarks/sculpture/codesign-ab.json` | **NEW (generated)** | Machine record of the same. |
| `docs/knowledge/design-learnings.md` | **MODIFY (append-only)** | "E-14 value-true co-design" section (AC3). |
| `pr/assets/value-true.md` | **NEW** | The "measured the drift, then killed it" beat (AC4). |
| `pr/assets/frames/value-{subject}-v{1,2}.png` | **NEW (copied)** | 6 stills (moai/sword/pineapple × v1/v2) for E-12 (AC4). |

**Untouched (hard AC):** every `.v1` artifact, `artifact.value-matched.json`, `concept.png`, the frozen
`SculptureConceptPrompt.v1`, `value-build.mjs`, `value-palette.mjs`, `image-grid.mjs`,
`palette-extract.mjs`, `run.mjs`, `value-match-*.{mjs,md}`. Additive only.

## `src/color/value-gate.mjs` — public interface

Module header (mirrors the house style of `value-build.mjs`): states it is the **measurement** end of
E-14 (the gate), pure/GL-free/network-free, reuses cielab + value-palette + `comparePalettes`, and that
the realized side is the placed manifest at value-true Lab (the segmentation-free render proxy, by the
T-039 table invariant).

```
import { nearestLab, deltaE } from "./cielab.mjs";
import { comparePalettes } from "./image-grid.mjs";
import { resolveValueTruePalette, normalizeName } from "./value-palette.mjs";

export const VALUE_GATE_SCHEMA = "value-gate/v1";
export const DEFAULT_VALUE_GATE_THRESHOLD = 6;   // ΔE (CIE76), mean over the realized palette

// The render-side proxy: placed manifest at value-true Lab, weighted by placement count.
export function realizedPaletteFromArtifact(artifact)
  -> [{ block, lab, value, count, weight }]      // weight = count / totalPlacements; first-seen order
  // counts artifact.placements[].block by normalizeName; resolves distinct names through
  // resolveValueTruePalette (true rendered Lab); falls back to palette.manifest if no placements.
  // throws if no block names at all (parallels value-build.distinctNames).

// Tolerant reference normalizer — accepts an extractPaletteFromImage result or a ready array.
export function toReferenceClusters(reference)
  -> [{ block, lab, weight }]                      // block <- it.block ?? it.key; lab <- it.lab ?? repColor.lab
  // weight <- it.weight ?? it.coverage ?? it.pct ?? 1 (uniform if absent). throws on empty/bad shape.

// THE GATE (AC2): how far is the realized build from the concept's previewed palette?
export function valueGate(realized, reference, { threshold = DEFAULT_VALUE_GATE_THRESHOLD } = {})
  -> {
    schema, threshold,
    meanDeltaE,            // Σ wᵢ·ΔEᵢ / Σ wᵢ  over realized blocks (nearestLab into reference)
    maxDeltaE,             // worst single realized block
    flagged,               // meanDeltaE > threshold
    recommendCorrectiveReplace,  // == flagged (advisory; see design.md D4)
    perBlock: [{ block, lab, value, weight, nearest, deltaE }],  // one row per realized block
    present, missing, added,     // comparePalettes(realizedIds, referenceIds)
  }
  // realized accepts realizedPaletteFromArtifact output OR a raw [{block,lab,weight?}] (tolerant).

// Before/after scalar (AC1).
export function gapClosure({ before, after })
  -> { before, after, delta: round2(before-after), pct: round1(100*(before-after)/before), improved }
```

Internal helpers (not exported): `round1`, `round2`, a `toRealized(realized)` coercer that accepts either
the artifact-proxy array or a raw array. No new color math; ΔE via `nearestLab`/`deltaE`.

**Boundary:** value-gate depends on value-palette and image-grid but NOTHING depends on value-gate except
the runner — it is a leaf measurement module. It never mutates inputs. The module-level cost is only the
transitive `loadBlockTable`/`resolvePalette` memo already paid by its imports.

## `benchmarks/sculpture/codesign-ab.mjs` — orchestration

Modeled on `value-match-ab.mjs`. No model call; no GL (renders pre-exist). Shape:

```
DEFAULT_RUNS = ["001-vConcept-moai", "007-vConcept-a-sword", "013-vConcept-a-pineapple"]
E13_VERDICT  = { "001-vConcept-moai": "Competent — faithful form, drifted value", ... }  // baseline labels

for each runId:
  load artifact.json (.v1), artifact.value-matched.json (.v2), concept.png
  reference  = await extractPaletteFromImage(concept.png, {k:8})        // concept side
  v1Realized = realizedPaletteFromArtifact(v1)                          // render side, before
  v2Realized = realizedPaletteFromArtifact(v2)                          // render side, after
  gateBefore = valueGate(v1Realized, reference)
  gateAfter  = valueGate(v2Realized, reference)
  closure    = gapClosure({ before: gateBefore.meanDeltaE, after: gateAfter.meanDeltaE })
  verdict    = categorical(closure, gateAfter)  // "closed"/"narrowed"/"already-true"/"flagged-residual"
  record { runId, e13Verdict, gateBefore, gateAfter, closure, verdict }

write codesign-ab.json  (schema "codesign-ab/v1", threshold, rows[])
write codesign-ab.md    (headline + before/after table + per-subject gate sections + honesty notes)
console summary
```

The categorical verdict function is local to the runner (presentation, not core logic): given closure +
the after-gate flag, label the subject relative to its E-13 baseline. The corrective-re-place line is
emitted per subject from `gateAfter.recommendCorrectiveReplace` with the fixed rationale (idempotent vs the
same palette; the real lever is a new concept or wider `k`) — satisfying "documented whether or not it fired".

## `design-learnings.md` — append-only section (ordering: after line ~1391)

New `##` section after "Fidelity-vs-concept frontier (E-13 sculpture set, S-038)". Subsections:
1. **The claim** — value-true closes the concept↔render value gap; the loop's two ends.
2. **Before/after table** — per subject: E-13 verdict, ΔE_before, ΔE_after, closure, gate flag.
3. **The moai close** — the headline number + the residual to the L41 concept dominant.
4. **Honest notes** — sword already near-true (small closure); ΔE_after is partly by-construction;
   render-PNG segmentation cost; many-to-one collapse residual (links T-041 review §1–2).

## `pr/assets/` — handoff (ordering: after the runner produces verdicts)

- `frames/value-{moai,sword,pineapple}-v{1,2}.png` — copied from each run's
  `render-3q.png` (v1) / `render-3q.value.png` (v2).
- `value-true.md` — voice of `sculptures.md`: a one-paragraph beat, the before/after ΔE table, the moai
  pair callout, and the honesty line. References the frame paths. Notes renders are real prismarine voxels.

## Ordering of changes (commit boundaries — see plan.md)

1. `value-gate.mjs` + `value-gate.test.mjs` (the pure core; tests green) — atomic.
2. `codesign-ab.mjs` + generated `codesign-ab.{md,json}` (the measurement) — atomic.
3. `design-learnings.md` section + `pr/assets/value-true.md` + copied frames (journal + handoff) — atomic.

Each step is independently verifiable: step 1 by `npm test`; step 2 by running the runner and reading the
report; step 3 by inspection. `.v1` reproducibility is checked at the end (`git status` shows only adds +
the one append).
