# T-203-01 — Progress

**Status: COMPLETE.** The wide-arch rebuild lands and PASSES on the real gatehouse — the exact
case the E-49 capstone (T-201) refuted. `npm test` 2411 green. Five commits, all steps executed.

## What was done (per the plan, in order)

| Step | Commit | What |
|------|--------|------|
| 1 | `feat(T-203-01): arch-aware void coherence…` | `archedVoidCoherence` + opt-in `arch:{spring}` gate in `aperture-carve.mjs`; `apertureColumns` exported. AR1-3,5. |
| 2 | `feat(T-203-01): closure-except-aperture…` | `eaveRingClosure` gains `openCols`. WG-CS9. |
| 3 | `feat(T-203-01): register rebuild_arch…` | `TOOL_DEPARTMENTS`/`TOOL_STAGE` + CG-REB1. |
| 4 | `feat(T-203-01): wire rebuild_arch hand…` | the runner hand + closure-except-aperture threading + MENU/enum/strings. |
| 5 | `feat(T-203-01): REBUILD_ARCH_PROBE…` | zero-spend evidence seam + gatehouse glance + renders. |

## The root cause, fixed

`carve_arch` carved a clean wide rectangle then ADDED a voxel arch ring; the gate's `carvedVoidCoherence`
checks **full-height** column continuity, so the arch spandrels (solid upper corners — what an arch
IS) read as "notched columns 3,4,8,9" → refute → fall back to a 1-wide framed slot. The
`continuous` conjunct is the wrong shape for an arched void. Fix: `archedVoidCoherence` gates the
rectangular **passage** below the springline and **credits** the head (spandrels) above it.

## Real-build evidence (REBUILD_ARCH_PROBE=1, zero spend)

```
[close_shell] CLOSED: closure 0.615 → 1.000 (ring 102)
[T-203 REBUILD] closed+gabled wall-plane closure: 1.000
[rebuild_arch] -x: width=7 carved=351 framed=true arched=true sill=0 voussoir=7 (curved head)
[rebuild_arch] gate ok=true (scope=true coherent=true [single=true passage=true head=true] closure=true)
[T-203 REBUILD] gate PASSED — wide arched gate kept
[T-203 REBUILD] closure-except-aperture: bare 1.000 → with 189 declared-open columns forgiven 1.000
                ✓ ≥ form-ready (close_shell will NOT re-fill the gate)
```

Glance (`evidence-rebuilt-beside.png`): the gable end now carries a **wide arched gateway** (width 7,
curved head) where the seed had a 1-wide slot. The exact `width=7` carve that logged "notched columns
3,4,8,9" in T-201 now reports `[single passage head]` all true and **keeps**.

## Two honest findings (not papered over)

1. **The feared S-202/S-203 coupling did not materialize on the gatehouse.** Bare closure stays
   **1.000** even with the gate carved — because the gate head sits **below the eave**, so the
   aperture columns retain wall *above* the arch and never drop out of the per-column footprint the
   plane metric measures. So `close_shell` would not have re-filled the gate regardless. The
   `openCols` closure-except-aperture guard is still wired (and unit-proven by WG-CS9) for the
   general case where an aperture *does* reach the perimeter — it is correctness insurance, not a
   load-bearing fix here. Recorded honestly: the coupling the ticket warned of is, for this subject,
   a non-event.
2. **`sill=0`** — the declared gate sills at the ground (program `sill:0`), so the sill course would
   land *below* the floor (no cell to recolor). A ground gate has no sill band; the hand correctly
   places none rather than inventing one. The "sill" slot is exercised on the geometry but honestly
   reports zero here.

## Deviations from the plan

- AR4 (closure-except-aperture) was placed in `wall-generate.test.mjs` as **WG-CS9** (eaveRingClosure's
  home), not in `aperture-carve.test.mjs` — the plan offered either; WG-CS9 is the cleaner home and
  carries the over-forgiveness guard too. No duplicate.
- The S-179 voussoir reuse is **evidence-only** (`deriveArchHead` names the 7-cell curved crown the
  arch ring built) rather than a second placement: the `frameArchPlacements` arch ring *is* the
  full-cube voussoir wedge course, so re-placing would be a same-block no-op. The log shows
  `voussoir=7 (curved head)` confirming the head is a genuine curve, not a flat lintel.

## Verification

- `npm test` → **2411 / 2411** green (2400 baseline + AR1-3,5 + WG-CS9 + CG-REB1).
- `GUARD_ONLY=1` and `REBUILD_ARCH_PROBE=1` both exit clean, GL available, zero LLM spend.
- Frozen instrument (`benchmarks/sculpture/measurements/**`) untouched; no record re-pinned.
- Byte-stability: AC1-AC8, WG-CS1-CS8, `closureOf`, default `eaveRingClosure` all unchanged (every
  new behaviour opt-in).
