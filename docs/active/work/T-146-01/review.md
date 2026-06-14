# T-146-01 — Review

Story S-146 (relief-by-construction), epic E-35, the crux ticket. Ships the shared surface-relief op,
its no-regress harness gate, the 2.5-D relief read, and the registry/preview wiring. **Handoff
document — what a reviewer needs without reading every diff.**

## What changed

**Created**
- `src/view/surface-relief.mjs` (≈185 lines) — `surfaceRelief(occ, opts)` (the op) + `reliefNoRegress(
  occBefore, placements, {faces})` (the AC2 gate) + `SURFACE_RELIEF_SCHEMA`, `RELIEF_DEFAULTS`.
- `src/view/surface-relief.test.mjs` — SR1–SR10.

**Modified**
- `src/view/surface-grid.mjs` — appended `reliefProfile(grid)` (the AC3 relief-aware read). No change
  to existing exports/behaviour.
- `src/view/surface-grid.test.mjs` — three `reliefProfile` tests + import.
- `src/pack/idiom-registry.mjs` — import + `"surface.relief"` `kind:"pass"` entry (composition,
  preview card, paramsSchema). Additive.
- `src/pack/brush-door.conformance.test.mjs` — `"surface-relief"` added to `TECHNIQUES`.
- `src/pack/brush-contract.test.mjs` — real-registry brush count 23→24 (+ comment).

**Commits:** `b3a2d7d` (op+harness), `2609a08` (read), `6c11ab8` (door). All on `main` per the RDSPI
workflow convention (matches the T-143-02 commit pattern).

## Design in one paragraph
Skinning is recolor-on-fixed-geometry and can never make a pilaster proud of its infill; relief must be
construction. `surfaceRelief` generalises the proven proud-emission mechanism (clinker's lap courses,
jetty's bressummer): for each named exterior face it emits, in sorted byte-stable order, `depth` cells
*in front of* existing skin cells that fall on a column/row rhythm, skipping cells already carrying the
relief material and breaking a ray at the first occupied cell. Because nothing is emitted where the face
has no cell, the relieved face's own orthographic silhouette — and therefore the E-34 `maskProportions`
ruler measured on it — is byte-identical by construction (clinker's CL4, generalised). Recesses are by
exclusion: the op only adds; a field left at the base plane reads recessed against proud pilasters, and
`report.fieldCells` makes that observable without any air op (the no-air-op rule stands for paint).

## Test coverage
- **Op (SR1–SR8):** proud emission on strip columns only; recess-by-exclusion (field columns get zero
  placements); in-plane/rake containment; idempotence (re-run = 0); row-rhythm belt courses; depth≥2
  contiguous runs; byte-stable ordering; fail-loud opts gates.
- **Gate (SR9):** `reliefNoRegress` returns `inPlanePreserved && ratiosPreserved` true and a non-empty
  `expectedWidening` for a full-height pilaster relief — the AC2 acceptance gate, executable.
- **Read (SR10 + surface-grid group):** `reliefProfile` sees the constructed proud strips, the flush
  field, and zero recessed cells (relief only adds); reports no relief on a flat wall; runs on a
  diagonal grid.
- **Wiring:** `idiom-registry.test.mjs`, `brush-door.conformance.test.mjs`, `brush-contract.test.mjs`,
  `brush-preview`/`brush-catalog` meta-tests all green with the new entry.
- **Byte-identity (AC4):** `workshop:replay` BYTE-IDENTICAL; `workshop:offline` clean; `patternbook:
  repro` cottage+barn reproduce byte-identically.

**Coverage gaps / honest limits:**
- The `break`-on-occupied guard in `surfaceRelief` is **not** unit-exercised (it cannot fire from a true
  exterior skin cell — see progress.md deviation). It is retained as a defensive invariant matching
  clinker; a multi-mass fixture could exercise it later but adds little. Idempotence is proven via the
  material-skip path (SR4), which is the real mechanism.
- `reliefNoRegress.ratiosPreserved` is byte-true for *height-respecting* relief (the common case:
  full-height pilasters, belt courses). Partial-height relief that shifts the **perpendicular** view's
  relative ridge/eave-row detection would report `ratiosPreserved:false` — that is the gate working, not
  a bug, but no test covers that negative path yet (the own-face `inPlanePreserved` is always true).
- No production runner invokes `surface.relief` yet (by design — wiring is S-147/S-149).

## Critical issue needing human / sibling attention
**FX-R1 fails in the shared working tree, but NOT because of this ticket.** The concurrent **T-145-01**
thread has UNCOMMITTED changes in the tree — `schema/building-program.schema.json` gains a `facade`
grammar block (tagged "T-145-01, E-35") that flows into the recognition prompt's `schema_json` and
drifts the cottage/barn `promptSha256`. Proof: FX-R1 passes at `b903216` (clean); the before/after
rendered-prompt diff shows *only* the facade block; my commits never touch that schema and my registry
addition does not alter the recognition prompt (`surface.relief` is not in `packs/rustic.json`, so
`packDigest` is byte-unchanged). I deliberately did **not** re-pin those records — they are owned by
T-145-01 / S-149 (the terminal re-skin + re-verdict), and re-pinning another ticket's record here would
violate the pin-guard discipline. **Reviewer action:** treat FX-R1 as T-145-01's to resolve when the
facade schema is committed; in isolation (my three commits over `b903216`) the suite is fully green.

## Risk assessment
- **Low blast radius:** the op/read/gate are additive, pure, and unreached by committed runners — no
  pinned record moves from this work (verified by the replay/offline/repro gates).
- **Shared-file discipline observed:** registry/conformance/contract edits were committed by explicit
  path (no sibling hunks captured); each file's diff was inspected to contain only T-146-01 content.
- **Brush-door contract upheld:** `surface-relief` is reachable only through the registry door; the
  conformance sweep now guards it like clinker/limewash.

## Follow-ups (not in scope here)
1. T-145-01 / S-149: re-pin cottage/barn `promptSha256` once the facade schema lands; re-run FX-R1.
2. S-147 (articulation brushes) / S-149 (re-skin): wire `surface.relief` into a build/skin chain so a
   facade actually gets pilasters/belt-courses, and add a relief-aware precondition to the gate (S-148)
   reusing `reliefNoRegress`.
3. Optional: a multi-mass fixture exercising the `break`-on-occupied guard, and a negative-path test for
   `reliefNoRegress.ratiosPreserved` under partial-height relief.
