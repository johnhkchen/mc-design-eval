# T-214-01 — Verdict: the re-climb with the winning rule, and the can-it-finish answer

**Epic E-55 / Story S-214 — the capstone.** Two metered re-climbs of the gatehouse with the T-213 contest
winner (`CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving`, `CLIMB_BATCH_SIZE=4 CLIMB_MAX_ROUNDS=8`).
Subscription shim only; 0 votes timed out; frozen instrument untouched; `npm test` 2446/2446.

## Headline (anti-hedge — led with how the claim failed)

**M1 did NOT land. The architecture ceiling is NAMED — and the accept-rule is removed as the confound it has
been since E-38, because it failed in the *predicted* way: the winning rule keeps the glance-better move it was
built to keep, but the build still misses M1 — and it misses for a reason UPSTREAM of the accept-rule.**

The falsifiable claim was: "the re-climb carries the dressing compound to a KEPT M1 build (closed dressed
walls, centered arched gate, dark gabled roof, right proportion)." **Refuted.** Both runs stalled on the OPEN
form and never reached the detail phase where the dressing (and the +48 arch) live. The kept build is a brown
gable roof on an open colonnade — a stranger does not recognize the gatehouse.

**This is the E-54 stop-line vindicated and sharpened:** the per-move median was NOT the last thing between the
climb and M1. trimmedMean fixed it (proven below), and removing it revealed the NEXT binding constraint — the
**form-move closure gate** — which the arc had not isolated because T-211 (a single median run) happened to
clear it.

## The two runs (reproducible)

| run | trend | kept | stop | acted-on |
|---|---|---|---|---|
| 1 (`trajectory.json`) | `14 → 14 → 14 → 14 → 22 → 22 → 22` (Δ+8) | apply_gable_roof only | stalled (2 rolled back) | ROOF |
| 2 (`trajectory-2.json`) | `16 → 16 → 16 → 16` (Δ+0) | **nothing** | agent-done | (none) |

Both stalled at the FORM phase. `closureFirst = closureLast = 0.667` in both — **the shell never closed.**

## Did the accept-rule do its job? YES — proven on the one move it was tested on

**Run 1, round 3:** `apply_gable_roof` votes `[36, 0, 8]`. `trimmedMean` drops the lone 0 → `mean(36,8) = 22`;
delta `22 − 14 = 8 ≥ margin 4` → **KEPT (improved +8)**. The **median would take 8** → delta `8 − 8 = 0` → tie →
**rolled back** (exactly the T-211 failure). This is the median-discards-a-strong-minority defect the whole
E-48→E-55 arc named, fixed and firing live. **The rule is not the confound.** (Slack +4 over the margin — a
clear keep, robust to one vote shifting; see Reproducibility.)

## Why the build still missed M1 — the NEXT binding constraint (the named ceiling)

The detail phase (rebuild_arch, relief_walls) was **never reached** because the form never closed. Two
reproducible seams, neither of which is the per-move accept-rule:

1. **The form-move closure gate rolls back `close_shell` (BOTH runs, r1).** `close_shell` densely closes the
   shell (closure 0.667 → 1.000) but is rejected: *"form: closure rose but blocked (new major / net-grow)."*
   The featureless closed box reads to the picture-critique as introducing a new major (a blank wall with no
   arched gate — the gate is *detail*, gated behind form-readiness, so the major is premature). `formCredit`'s
   no-new-major guard (clause b′) then refuses the close. **In T-211 (median, single run) this guard happened
   to pass** — so 2 of 3 recorded runs roll back close_shell. This is the form gate, blind to the fact that a
   form-only box is *supposed* to lack detail.
2. **The gable-before-close ordering trap (run 1, r4).** With both shell-closers rolled back, the agent applied
   the gable (which trimmedMean correctly kept). The roof cells then **dilute the footprint coverage to 0.27 <
   0.5**, below `closeShell`'s trust floor — so `close_shell` now *honestly no-ops* ("footprint registration
   below trust floor"). The form can **never** close after the roof goes on. Detail stays locked forever.

`construct_walls` is no escape: it only reaches closure 0.702 (< the 0.1 gain margin), rolled back in both runs.

## The glance (run 1 high-water, `builds/gatehouse/picture-climb/round-3/beside-concept.png`)

A brown timber gable roof on an open colonnade of splayed grey pillars — you see straight through it. Against
the four M1 criteria (scored vs the **concept**, not vs T-211):

- **Closed dressed walls:** ✗ open colonnade, never closed (the binding failure).
- **Centered arched gate:** ✗ absent — the detail phase was never reached.
- **Dark gabled roof:** ~ gable FORM present (kept by trimmedMean) but brown timber (`apply_gable_roof`), not
  the concept's dark grey (`recolor_roof` never picked).
- **Right proportion / stranger recognizes:** ✗ reads as a roof on stilts, not a stone gatehouse.

**Is the kept build the high-water mark?** Yes — round 3 (score 22) is the highest accepted build; nothing
better was rolled back (the arch was never built). The failure is *reaching* M1, not a rollback of a better
build. (Contrast the median, whose defining failure WAS rolling back a better build — the +48 arch. trimmedMean
removed that failure mode; a new one upstream took its place.)

## Reproducibility (failure-mode 3: does variance dominate the aggregator?)

**No — the verdict is reproducible, and the load-bearing KEEP is robust.**
- The headline (form never closes → stall → no M1) reproduced in **2/2** runs.
- The aggregator's one KEEP (run 1 gable) cleared by **+4 slack** over the margin (delta 8 vs margin 4) — not a
  knife-edge; one vote moving ±10 would not flip it.
- A SECOND run was warranted (tier-2) precisely because run 1 hinged on the close_shell rollback; it confirmed
  the rollback is structural, not a fluke. **The SCORER is not the ceiling here** — variance did not decide the
  outcome; the deterministic form-move gate did.

**One honest aggregator side effect, named:** trimmedMean's optimism (drop-lowest) scores the OPEN colonnade
seed *off the floor* (14, 16) where the median put it at 0. This does not *cause* the close_shell rollback (the
no-new-major guard is score-independent, and items come from the median-representative sample regardless of
aggregator), but it is a real behavioral change worth flagging for the form phase.

## The two adversarial checks the ticket names

- **Did the winning rule regress a frozen comparison run?** No. The rule is default-OFF; `npm test` 2446/2446
  green; `git status -- src measurements benchmarks experiments` empty. Prior climbs re-run byte-identically
  (the gate decision functions are byte-unchanged — only vote aggregation/batch entry changed). The "regression"
  vs T-211 is *within the opt-in path* (close_shell rolled back where T-211 kept it) and is the **form gate**,
  not the aggregator — see below.
- **Is the verdict reproducible?** Yes (2/2), see above.

## Cost + autonomy

- Run 1: 4 scored builds, 12 strong-tier diagnoses, 0 timeouts, actionableFrac **0.2**.
- Run 2: 3 scored builds, 9 strong-tier diagnoses, 0 timeouts, actionableFrac **0.0**.
- Total: 7 scored builds, **21** metered diagnoses, **0** dropped/timed-out votes. Fully autonomous (no human
  in the loop); the agent's tool-picks were coherent (it correctly diagnosed the open form and reached for
  close_shell repeatedly) — the autonomy is real; the *architecture* could not act on the diagnosis.

## Reviewer decision (E-55 closes here)

**The per-move accept-rule is no longer the binding constraint** — trimmedMean fixed the median-discards-minority
defect (E-38→E-54's quarry), proven live, removed as the confound. **M1 by another route requires a FORM-PHASE
fix, not a per-move-gate fix** — a different climb architecture, as the E-54 stop-line anticipated. Two
candidate routes for the successor epic (E-56, generalization — or a dedicated form-phase epic):

1. **Form-gate that tolerates a featureless closed shell.** `formCredit`'s no-new-major guard should not reject
   a form-only `close_shell` for a *detail* major (the missing arched gate) that is, by the form-before-detail
   ordering, not yet buildable. The closed box IS the correct intermediate; the major is premature.
2. **Seed the climb from an already-closed shell** (skip the form phase), so the detail phase — where
   trimmedMean demonstrably rescues the +48 arch — is actually reached. This is the cleanest way to test whether
   the *rest* of the architecture finishes, now that the per-move rule is fixed.

**Bottom line:** the architecture can keep the glance-better move (proven). It cannot yet *finish* a subject to
M1 — not because of the accept-rule the arc spent seven epics on, but because the form-move closure gate stops
the climb before the fixed rule can matter. The confound is gone; the next constraint is named and upstream.
