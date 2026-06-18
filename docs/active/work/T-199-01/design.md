# T-199-01 — Design: the form-credit clause

## Goal restated

Credit a **form-readiness win** (closure↑ toward 0.9) in the accept gate, even at a picture-score tie
or regression — the form-analog of the E-50 department-dominant override — so `close_shell` is **kept**
on the real T-198 tie and the climb can leave the colonnade. Must **reject** a flood/regress/new-major
"closing" move (no rubber-stamp), and stay form-AND-glance-defensible (not blind closure-maximizing).

## The falsification frame (anti-hedge)

The clause must be **falsified both ways** as a unit test:
- **KEEP**: reproduce the real T-198 `close_shell` counts (tie + closure 0.615→1.000, no new major, net
  flat) → ACCEPT.
- **REJECT**: a deliberately-bad closing move (adds a major / regresses roof / grows the targeted
  dept's total) → ROLLBACK, even though closure rose.

Fails if: it rubber-stamps the bad move (guard leak — tighten as CG15 did); it's too narrow and still
rolls back the legitimate close (no behaviour change); or the keep is glance-indefensible.

## Options considered

### Option A — whole-build scalar bypass: "accept any closure↑"
Keep any round where `closureAfter > closureBefore`. **Rejected.** Exactly the rubber-stamp the ticket
forbids — a flood raises closure while wrecking the roof. Not noise-robust; ignores the picture
entirely. Violates "structure-scoped, never a whole-build scalar bypass."

### Option B — second form metric (e.g. interior-fill ratio, spike census)
Introduce a new scalar to distinguish "good close" from "flood." **Rejected.** The AC forbids a second
metric ("Reuses `eaveRingClosure`/`closureOf`, no second metric"); memory
[[form-revision-needs-3d-target]] warns parallel metrics diverge. The department guards already
separate good from bad without a new lens.

### Option C — form-analog of `departmentDominant` (CHOSEN)
A `formCredit(...)` helper structurally parallel to `departmentDominant`, fired in `acceptsRound`
**after** the department override and **before** the regression reject. Guard (a) "cleared a major"
becomes "**closure rose by `closureMargin` while the form was not yet ready**"; guards (b) no-new-major
and (c) net-total are kept. The closure scalar is computed by the runner (`eaveRingClosure`) and passed
in — `climb-gate` stays pure/occ-free.

**Why C.** It reuses the *exact* discipline E-50 proved live (T-191 vindicated), reuses the existing
metric, keeps the module pure, and is provably noise-robust because the closure win is a **structural**
fact (perimeter occupancy) independent of the noisy picture scalar — yet the department guards keep it
from breaking any department. The keep is form-AND-glance-defensible: closure↑ is the form win, and
"no new major anywhere" is the glance guard (the judge did not call the closed build worse on any
department).

## The clause, precisely

`formCredit` returns a truthy result (→ accept) iff **all** hold:

1. **Closure evidence present** — `closureBefore`, `closureAfter` finite; else `null` (inert,
   backward-compatible, like `departmentDominant` without department context).
2. **Form gap exists** — `closureBefore < formReadyThreshold` (0.9). Once the form is already ready,
   the detail-gate governs and no form credit is needed; crediting there would be closure-maximizing
   noise. This bounds the clause to the *form-closing* phase.
3. **Real gain toward the threshold** — `closureAfter - closureBefore >= closureMargin`. The move must
   raise closure by a meaningful margin (the real case gains 0.385). A trivial +0.001 wobble does not
   qualify.
4. **(b′) No new department major anywhere (whole-build)** — for every department in
   `before/afterDeptMajors`, `after[d] <= before[d]`. **Stricter than `departmentDominant`'s
   targeted-only (b)**: form credit is justified by a *structural* scalar, not by clearing a
   department's major, so it must not be allowed to introduce a major in *any* department (this is what
   rejects "regresses roof" / "adds a major"). Requires the major maps; absent → inert (fail-safe).
5. **(c′) Net guard (targeted)** — no targeted dept's *total* (major+minor) burden rose; the E-50
   net-minor tightening, targeted-only as in E-50. Active only when `targetDepartments` + `*DeptItems`
   supplied; absent → guard skipped (b′ still mandatory).

## Why (b′) is whole-build but (c′) is targeted

(b′) is the no-rubber-stamp guard: the reject fixtures all carry a **major** somewhere (roof regress,
ROOM flood-major, added major). Checking whole-build majors catches them all, which `departmentDominant`'s
targeted-only (b) would miss for a form move (close_shell targets only WALL). (c′) mirrors E-50 exactly
(targeted net total) — its job is to reject "closed the wall but degraded its own target with minors,"
which is inherently about the *targeted* department. Keeping (c′) targeted preserves the E-50 precedent
and its CG15 leak-documentation discipline.

## Tunables

- `FORM_READY_CLOSURE = 0.9` — reused (already exported). Threshold for guard 2.
- `CLOSURE_GAIN_MARGIN = 0.1` — new, exported, frozen. The minimum closure rise to count as a form win.
  Calibrated against the measured gap (0.615→1.000 = 0.385 gain; 0.1 is well inside it, robust not a
  knife-edge). Like `CLIMB_DEFAULTS.margin`, the runner can report the observed gain beside it.

## Ordering in `acceptsRound`

```
improved (delta>=margin)            → accept
departmentDominant override         → accept   (regression-tolerant)
formCredit                          → accept   (regression-tolerant)   ← NEW
regressed (delta<=-margin)          → reject
tie zone (coverage shrank?)         → accept / reject
```

Form credit sits with the other regression-tolerant accept paths, before the regression reject, so it
can keep `close_shell` on a tie *or* a regression — but only when its structural win + guards hold.
Order vs `departmentDominant` is immaterial (independent accept paths); placed after it to read as
"department-trust, then form-trust."

## Runner wiring (`picture-climb.mjs`)

- Compute `closureAfter = closureNow(cand)` once, **before** the gate.
- Pass `closureBefore: closure, closureAfter` into the existing `acceptsRound(...)` opts.
- Fix the recorded `closureAfter` (line 633) to record the **candidate's** closure (the value the gate
  saw), not the rolled-back `occ` — so the trajectory stops lying about the form move.
- No new spend, no new metric, no GL on the decision path.

## What stays out of scope

S-200's signal work (voxel-vs-art tolerance) and the T-201 metered re-climb. This ticket is the
**mechanism + unit falsification**, one stage. The clause is structure-scoped precisely so it is robust
regardless of what S-200 does to the picture signal.
