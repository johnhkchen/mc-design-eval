# T-203-01 — Review

**What this ticket did:** built the **wide-arch rebuild** hand — the defining feature of a
*gatehouse*. The E-49 capstone (T-201) proved `carve_arch` can never *keep* an arch (it carves a
clean wide rectangle, adds a voxel arch ring, then its own full-height coherence check refutes the
arch spandrels as "notched columns 3,4,8,9"). This ticket replaces the coherence check with an
**arch-aware** one and wires a `rebuild_arch` OPENING lever that **passes** the gate on the real
gatehouse. Five commits (`bee5955`…`9397edb`); `npm test` 2411 green.

## Changes (this ticket's files)

| File | Change |
|------|--------|
| `src/view/aperture-carve.mjs` | +`archedVoidCoherence` (passage below the spring is gated, spandrels above are the head not notches); `apertureCoherenceGate` gains opt-in `arch:{spring}`; `apertureColumns` exported (one aperture-column authority). SCOPE+CLOSURE conjuncts and the legacy path byte-identical. (+77/−~) |
| `src/view/aperture-carve.test.mjs` | +AR1-3,5 on the REAL `frameArchPlacements`/`archRing` geometry (the both-ways discriminator: arch-true / legacy-false on one build). (+101) |
| `src/view/wall-generate.mjs` | `eaveRingClosure` gains opt-in `openCols` (closure-except-aperture). Default ∅ byte-identical to T-202. (+21/−4) |
| `src/view/wall-generate.test.mjs` | +WG-CS9 (forgiven swath reads form-ready; over-forgiveness guard). (+23) |
| `src/workshop/climb-gate.mjs` | +`rebuild_arch` in `TOOL_DEPARTMENTS` (`["OPENING"]`) + `TOOL_STAGE` (`"detail"`). (+5) |
| `src/workshop/climb-gate.test.mjs` | +CG-REB1 + map asserts. (+8) |
| `experiments/eval-alignment/picture-climb.mjs` | +`rebuild_arch` hand; `openColumns` closure-except-aperture threading; MENU/enum/form-readiness strings; `REBUILD_ARCH_PROBE` evidence seam. (+186, runner — not in `npm test`) |
| `docs/active/work/T-203-01/*` | RDSPI artifacts + two evidence renders. |

(The `src/view/roof-generate.*` hunks in the working tree are the **parallel sibling T-204-01**'s
roof work — no shared file with this ticket.)

## Acceptance criteria — met

- ✅ **Wide-arch rebuild hand: declared aperture → wide opening with coherent head/jambs/sill +
  voussoir; passes the coherence gate; closure-except-aperture on the S-202 plane metric.**
  Live: `width=7 carved=351 framed=true arched=true voussoir=7 (curved head)`,
  `gate ok=true [single=true passage=true head=true] closure=true`. The voussoir (S-179
  `deriveArchHead`) names the curved crown the arch ring built. Sill honestly = 0 (ground gate).
- ✅ **Pure parts unit-tested; real-build evidence on the gatehouse.** AR1-3,5 (the gate, arch-vs-
  legacy, ragged-below-spring refute, byte-stable) + WG-CS9. The glance (`evidence-rebuilt-
  beside.png`) reads a wide arched gateway where the seed had a 1-wide slot.
- ✅ **Wired into the picture-climb as the OPENING lever; self-reverts on gate fail.** `rebuild_arch`
  in `TOOLS`/`MENU`/enum/maps; reverts to `frame_arch` on a true refute (recorded). `carve_arch`
  retired from the agent menu (it provably always refuted).
- ✅ **Recorded honestly.** The rebuild keeps a clean wide aperture — and the feared S-202/S-203
  coupling did **not** materialize (closure stays 1.000; the gate head sits below the eave so its
  columns keep wall above). Documented in `progress.md` as a non-event, not hidden behind the guard.
- ✅ **`npm test` green (2411); frozen instrument untouched; recess-by-exclusion outside the
  declared aperture.** The carve is the only air op, inside the declared region (SCOPE conjunct).

## Falsifiable claim — outcome

> The rebuild yields a wide arched gate passing the coherence gate, reading as an arch on the
> glance, closure held except the declared aperture.

**Held.** The three named failure modes were checked, not assumed:
- *The arch-aware gate still refutes the real build* — refuted: `gate ok=true` on the live
  gatehouse (single+passage+head all true). The width-7 case that failed in T-201 now passes.
- *Closure drops below form-ready → climb oscillates* — did not occur: closure 1.000 bare AND
  except-aperture. The gate head below the eave means the aperture never drops a footprint column;
  `close_shell` is not triggered. The `openCols` guard remains for the general case (WG-CS9).
- *The coherence gate refutes the rebuild too (a deeper charter bound)* — refuted for this subject.
  The "carving wide openings is a deeper limit" outcome did not obtain.

## Test coverage & gaps

- **Covered:** the both-ways discriminator (AR1/AR2 — the arch passes with `arch`, refutes without,
  on the REAL ring geometry, the exact T-201 regression); a true passage blockage below the spring
  still refuted (AR3 — the arch option does not blind the gate); closure-except-aperture forgives
  the right swath and not the wrong one (WG-CS9); byte-stability (AR5); the climb-gate maps (CG-REB1).
- **Gap — the metered climb is not run here.** Real-build evidence is the zero-spend
  `REBUILD_ARCH_PROBE` (the deterministic geometry + glance), not a full picture-critique climb.
  Whether the picture vote *keeps* `rebuild_arch` (it is picture-driven, isFormMove=false) is for
  **S-205**'s metered re-climb. If the judge refuses an arch that reads right, that is an EYES gap
  to name there, not a hand bug.
- **Gap — single subject + single aperture geometry.** Tested on the gatehouse `-x` gable gate
  (head below eave). An aperture reaching the eave line *would* exercise the `openCols` coupling
  live; that path is unit-proven (WG-CS9) but not run on a real build. Out of this ticket's scope.
- **Gap — `sill=0` not exercised positively.** A gate with a raised sill would place a sill course;
  here the ground gate correctly places none. The non-zero path is unverified on a real build.

## Open concerns / handoff

- **S-205 (the capstone re-climb)** is the live test: does the metered climb *pick and keep*
  `rebuild_arch`, and does the gate read as a wide arch beside the concept on the glance with the
  roof (T-204) and walls (relief) also landed? This ticket proves the hand works and the gate
  passes; S-205 proves the *agent reaches for it*.
- **No coupling fix was load-bearing.** Recorded honestly: the closure-except-aperture machinery is
  insurance, not a fix the gatehouse needed — because of the head-below-eave geometry. If a future
  subject's gate reaches the eave, the guard activates (WG-CS9 is the proof it will).
- **No critical issues for human attention.** Changes are localized, every new behaviour is opt-in
  (legacy paths byte-identical), reversible, and `npm test` is green at each commit.
