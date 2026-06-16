# T-175-01 — Review: build the chosen approach (compositional treatment grammar) + prove on the gatehouse

**Story S-175 / epic E-43.** T-174-01's spike chose **candidate A** (the compositional treatment grammar) at
restrained amplitude. This ticket built A as a real, serializable, unit-tested module and proved it on the
gatehouse beside the concept. The deliverable the AC names — the **render** (the glance is the judge) — shows
the quoins, trim band, recessed field, and arched reveal all read, a clear step up from the token build,
without regressing closure.

## What changed

| path | change |
|---|---|
| `src/view/treatment-grammar.mjs` | **new** — the engine: `deriveEdges` (geometry→edge descriptors), `composeTreatment` (declarative layered spec → relief through the registry door; amplitude first-class; corner-excluded cornice), `recessClosureGuard` (recess-by-exclusion closure proof) |
| `src/view/treatment-grammar.test.mjs` | **new** — TG1–TG13 on square/rectangle/with-opening synthetic geometry |
| `experiments/eval-alignment/treatment-beside.mjs` | **new** — impure runner: treated + token baseline beside concept; injects the dressing seam; asserts `closure.ok` |
| `docs/active/work/T-175-01/rustic-gatehouse.treatment.json` | **new** — the serialized spec (the reusable artifact S-176 sources) |
| `docs/active/work/T-175-01/{treated,baseline}-beside.png` | **new (generated)** — the evidence |
| `docs/active/work/T-175-01/{research,design,structure,plan,progress,review}.md` + `FINDINGS.md` | **new** — RDSPI artifacts |

**No existing production source, schema, pack, or instrument file was modified.** Frozen instrument
(`measurements/`, pin-guard) untouched. The new module composes existing brushes through the registry door —
it invents no geometry primitive.

## Acceptance criteria

- ✅ **Chosen approach at readable amplitude, recess-by-exclusion closure-guarded.** `composeTreatment` builds
  base/recess/field/edge layers; the field recesses by exclusion (additive only — no air op);
  `recessClosureGuard` proves closure (gatehouse 1.0000 → 1.0000, 0 columns dropped). Amplitude is a
  first-class spec knob (depth / headerDepth / courses / run).
- ✅ **Render beside concept showing quoins, cornice/trim band, recessed field, arched reveal all read** —
  `treated-beside.png` vs `baseline-beside.png` (the token before). All four read (base 60 / quoins 120 /
  cornice 52 / arch 24).
- ✅ **Winner is A → serializable treatment spec + pure compositor with geometry→edge-sets, unit-tested on
  synthetic geometries (square / rectangle / with-opening).** `treatment-grammar/v1` JSON spec; `deriveEdges`
  + `composeTreatment` pure; TG1–TG3 cover the three geometries.
- ✅ **Recorded honestly on the render (richer vs busier, localized).** FINDINGS.md: richer, not busy; the one
  near-busy element is quoin *amplitude* (hd2 serration), not *composition* (no string course) — a tunable
  knob, the reviewer's taste call.
- ✅ **`npm test` green; closure not regressed; frozen instrument untouched.** 2262/2262 (was ~2249; +13).

## Test coverage

13 new unit tests, all green, on synthetic geometry (no GL, fast, deterministic):
- **Derivation (TG1–3):** corners from footprint extrema on square AND rectangle (proves it's geometry, not
  assumed-square) AND with an interior void.
- **Composition (TG4–5):** every layer places; the cornice **excludes the corner columns** (the crisp
  quoin/cornice junction — the spike's named open concern, fixed and tested).
- **Recess + closure (TG6–8):** additive-only (no air op); the guard is `ok` on the additive treatment AND
  **trips on a synthesized carve** (TG8 — the guard has teeth, not a vacuous pass).
- **Invariants (TG9–13):** single-face in-plane no-regress; determinism; the injected opening seam (present
  and absent); fail-loud; purity/serializability.

**Gaps (named):**
- The gatehouse render itself is **not** a unit test (it needs GL + the faithful build); it is evidence in the
  work dir, reproduced by `node experiments/eval-alignment/treatment-beside.mjs`. The runner asserts
  `closure.ok` and exits non-zero on regression, so the closure invariant is machine-checked on the real
  subject even though the *glance* is human-judged.
- `deriveEdges` is tested on single-box geometry only. Two-mass / L-mass / gable derivation is **untested**
  (see open concerns).

## Open concerns / limitations (for the human reviewer + S-176)

1. **The one taste call the glance owns:** quoin amplitude. A's serrated `headerDepth:2` is the boldest
   element — bold enough to read, coherent enough not to be noisy (my read), but a reviewer may prefer flusher
   (hd1) or the spike's louder B (hd3). The spec exposes `edges.corners.amplitude.headerDepth`, so it is a
   one-line change + re-render, no code. This is the epic's explicit "the render owns amplitude/taste" call.
2. **Edge material must differ from the field material.** `surfaceRelief` skips a source cell already carrying
   the relief material, so a same-material course silently no-ops. The spec uses `cobblestone` dressing on all
   edges against the `stone_bricks` field (reads + concept-faithful). **S-176's sourcing must guarantee the
   edge material ≠ the field material** or treatments will silently emit nothing — recorded in FINDINGS.
3. **Generalization past one clean box is untested** (the epic's named risk). `deriveEdges`'s footprint-bbox
   model yields 4 corners for any rectangle; an L-mass has 6. S-176 must retest `deriveEdges` on the
   cottage's two perpendicular masses before trusting generality — and is where the same `edges` vocabulary
   extends to roof (overhang/ridge) and openings (reveal/arch).
4. **`ratiosPreserved=false` on the full-perimeter treatment** is the honest perpendicular widening read
   through the height-ratio lens — evidence, not a gate. The gate is `recessClosureGuard` (holds). Worth a
   glance if a reviewer expects relief to be silhouette-invisible: full-perimeter quoins are *meant* to widen.

## Handoff

The decision rests on the two PNGs in this dir — open `baseline-beside.png` then `treated-beside.png`, read
left (concept) → right. The engine is `src/view/treatment-grammar.mjs` (pure, 13 tests); the reusable spec is
`rustic-gatehouse.treatment.json` (what S-176 will source instead of hand-authoring). Reproduce the render
with `node experiments/eval-alignment/treatment-beside.mjs`. Nothing here touches the frozen instrument.
