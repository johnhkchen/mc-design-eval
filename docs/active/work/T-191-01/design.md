# T-191-01 — DESIGN: the department-dominant override

## The decision

Implement the **department-dominant override** as a new accept path in `acceptsRound` that fires **before the
regression reject**, so a tool that did its job in its own department survives a whole-build scalar
regression. Guard it with a **net (total-item) check per targeted department** — not major-only — so the
override KEEPS the grey roof yet REJECTS a fix that clears a targeted major while degrading its own target.

The rule, stated once:

> **Keep** a candidate over a scalar regression iff the applied tool **(a) cleared a major in a department it
> targets**, **(b) introduced no new major in any department it targets**, and **(c) did not increase the
> total item burden of any department it targets.** Otherwise fall through to the existing margin / tie logic.

(a)+(b) are the rule T-190 `ceiling.md` named. (c) is the **net-minor tightening** the ticket demands as the
falsification co-lever — it is what separates the real grey-roof KEEP from the adversarial leak.

## Why this rule (grounded in the recorded trajectory)

From T-190's round 3 (research §"ground truth"), per the **targeted** department ROOF:

| | majors | minors | total |
|---|---|---|---|
| before (brown, kept) | 1 | 1 | 2 |
| after (grey, rejected) | 0 | 1 | 1 |

- (a) cleared: ROOF major 1→0 ✅
- (b) no new ROOF major: 0 ≤ 1 ✅
- (c) ROOF total did not grow: 1 ≤ 2 ✅
→ **override fires → KEEP.** The promoted WALL+OPENING majors are in **untargeted** departments and are
correctly ignored (the regression is provably attention-shift away from the tool's target).

The adversarial fixture (clears ROOF major, adds 2 ROOF minors): ROOF `{1,0}`→`{0,2}`. (a) ✅ (b) ✅ but
(c) total 2 > 1 ❌ → **override does not fire → regression reject.** The net guard plugs the leak that a
major-only guard (a+b only) would have leaked through.

A genuinely-bad change that clears nothing (ROOF major 1→1, score regressed) fails (a) → reject. A change
that clears one ROOF major but adds a *different* ROOF major (1→1 majors) fails (a) (no net major drop) and
(b) is moot → reject. So all three "bad" shapes reject; only the attention-shift shape keeps.

## Options considered

### Option A — weighted-burden guard (`burden = W·majors + minors`, W large)
Override keeps iff cleared a targeted major and no targeted dept's *weighted* burden grew.
**Rejected.** With W large, clearing one major (−W) buys headroom for up to W−1 new minors, so "clears 1
major, adds k minors" keeps for any realistic k. That is exactly the leak the ticket says must reject — a
weighted guard with majors dominating **cannot** reject it. Fails the falsification by construction.

### Option B — strict "no new minor in any targeted dept" (per-dept `afterMinor ≤ beforeMinor`)
**Rejected (too strict / risks the KEEP).** It treats a major→minor *improvement* as a regression: a build
that swaps a ROOF major for a ROOF minor (clearly better) but where the minor count rose 0→1 would be
rejected. The real grey build's ROOF minor (eave/verge band) persists rather than appearing, so it happens
to survive here — but the rule is brittle: any cleared-major fix that surfaces one new minor in its own
target dies, which would re-stall the climb on the next subject. Over-fits the one trajectory.

### Option C — net total-item guard per targeted dept (`afterTotal ≤ beforeTotal`), plus the major guard ★ CHOSEN
Override keeps iff (a) cleared a targeted major, (b) no new major in any targeted dept, (c) no targeted
dept's **total** item count grew. **Chosen.** It distinguishes the two cases the ticket cares about:
- major→fewer-or-equal-total (incl. a major→minor *swap*, total flat) = improvement → KEEP. Robust: it does
  **not** punish surfacing one new minor as long as a major was retired (total still drops or holds).
- major cleared but total **grew** (extra minors push the dept worse overall) = net degradation → REJECT.
This is the minimal rule that KEEPS the real roof *and* REJECTS the named adversarial leak. The "net-minor"
the ticket asks for is operationalised as "total item count did not grow," which is symmetric and noise-robust
(it doesn't hinge on the fragile minor delta alone).

### Where the override sits in the control flow
- **Considered:** keep it inside the tie zone (status quo) and only relax the *tie* — rejected, the failure
  is past-margin, not a tie; the override must run on a regression.
- **Chosen:** evaluate the override **after** the clear-improvement accept and **before** the regression
  reject. A clear improvement never needs the override; everything else (regression or tie) gets one shot at
  it. This subsumes the old tie-zone department leg (the override is a superset), so that leg is removed and
  the tie zone keeps only the whole-build coverage-shrink break.

## Interface

- New pure helper **`deptItemCounts(items)` → `{[dept]: {major, minor}}`** in `climb-gate.mjs` (sibling to
  `deptMajorCounts`; counts both severities, skips no-department items). Exported + unit-tested.
- `acceptsRound(before, after, opts)` gains two optional params: **`beforeDeptItems`, `afterDeptItems`**
  (the `deptItemCounts` objects). `targetDepartments`, `beforeDeptMajors`, `afterDeptMajors` stay (the major
  guard reads them). When item-count objects are **absent**, the override degrades to the major-only guard
  (a+b) — preserving backward compatibility and *documenting* (in a test) that major-only leaks.
- New private `departmentDominant({...})` → the cleared dept name (string) or `null`, so `acceptsRound` stays
  readable and the rule is testable in one place.

## Backward-compatibility & the one intended break

- CG1, CG2, CG3 (margin/tie, no department context) — unaffected (override inert without department args).
- CG10 (`deptMajorCounts`), CG12 (`buildDigest`) — unaffected.
- CG11 has four cases. The first three (tie + cleared → keep; not-cleared → reject; legacy no-context →
  reject) stay green: the new override fires in the tie zone too with the same `/ROOF cleared a major/`
  reason substring. The **fourth case** asserts that a *past-margin regression with a cleared ROOF major*
  REJECTS — that is precisely the behavior T-191 **deliberately inverts**. It will be updated to assert the
  new KEEP (with item-count args present), and a sibling assertion added for the adversarial reject. This is
  the one intended semantic change; it is the whole point of the ticket and is called out explicitly.

## Falsification plan (anti-hedge, lead with how it fails)

1. **KEEP proof** — re-run the metered gatehouse climb (`CLIMB_OUT` → this work dir). Expect: round-3
   `recolor_roof` now **KEPT** by the override (reason `ROOF cleared a major (department-dominant override)`),
   trend continues past 60; beside-concept render of the kept grey state. Report the observed vote bands.
2. **REJECT proof (mandatory, unit)** — the adversarial fixture (clears ROOF major, adds 2 ROOF minors,
   score regressed) is REJECTED by the net guard; a paired assertion shows the **major-only** path (no item
   args) would have KEPT it (the documented leak the net guard plugs).
3. **Fails if:** the net guard rejects the *real* grey roof too (over-strict → re-loosen / report tension);
   the override never fires in the live run (mis-modelled → re-localize); or major/minor is so vote-noisy
   across votes that the keep/reject flips run-to-run (→ name vote-noise reduction as the co-lever and report
   the bands). All three are reported honestly, not hidden.
