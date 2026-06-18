# T-207-01 Design — run parameters & the judgment protocol

This ticket writes **no source**. The design decisions are (A) the run configuration and (B) the judgment
protocol that turns the trajectory + glance into the verdict the acceptance criteria demand.

## A. Run configuration

### A1. Round budget — `CLIMB_MAX_ROUNDS=8` (chosen)

| Option | Verdict |
|---|---|
| **8 (chosen)** | The hypothesis needs a *productive sequence* this time: `close_shell` (form) → then detail compounds (`apply_gable_roof`/`recolor_roof`, `rebuild_arch`, `relief_walls`, `band_eave`). At the frozen 5, T-201 truncated before `recolor_roof`; with a real `close_shell` consuming round 1, 5 is even tighter. 8 gives the form move + ≥5 detail moves headroom without being open-ended. T-205 already used 8 (knob proven; it stalled at 4, so 8 was never the limiter). |
| 5 (frozen default) | Risks truncating before the climb expresses the full detail chain → a *budget* confound on the very question (form-alone-enough?) we are answering. Rejected: the T-205 review explicitly ruled the cap a confound and added the knob to remove it. |
| >8 | No evidence the chain needs >5 productive moves; longer = more spend + more chance of late-round oscillation noise polluting the verdict. Rejected. |

`CLIMB_MAX_ROUNDS` is a metered-budget knob (line 84), default-preserving (the runner is out of `npm test`;
`CLIMB_DEFAULTS.maxRounds` is never asserted). Not a new hand.

### A2. Votes / tier — `VOTES=3`, `TIER=strong` (frozen, unchanged)

Keep the committed defaults. `VOTES=3` medians out the same-seed 0–76 swing (T-187); `strong`
(`claude-opus-4-8`) is the diagnose tier the whole E-47→E-52 arc used. Changing either would make this
re-climb **incomparable** to T-201/T-205 — the point is a like-for-like re-run on the *one* changed variable
(the form metric). Rejected: any vote/tier change.

### A3. Output location — `CLIMB_OUT=docs/active/work/T-207-01/trajectory.json` (chosen)

The runner honors `process.env.CLIMB_OUT` (line 698), defaulting to T-188's dir. Point it at this ticket's
work dir so the trajectory lands beside the artifacts. Per-round beside renders always go under
`builds/gatehouse/picture-climb/round-*/` — copy first/best/final into the work dir post-run (AC demands
beside-concept renders *in the work dir*).

### A4. Pre-flight — `GUARD_ONLY=1` first (chosen)

Run the zero-spend guard first: it asserts assets + GL, renders round-0 + the beside sheet, and exits before
any spend. This proves the render seam in *this* environment before committing metered budget — the discipline
every prior climb ticket followed. If GL is absent here, surface it and STOP (do not fabricate a run).

### A5. Shim — subscription `claude -p` only (frozen)

`runTieredOp`/`requestText` default to the subscription shim. **Do not** set `ANTHROPIC_API_KEY`. Watch the
spend-limit reply failure mode ([[spend-limit-reply-failure-mode]]): a zero-token notice reply burns the
re-ask budget. The T-198 guard + `RoundAbortedError` path catch an all-failed round (recorded, exit 2) — if
that fires, the verdict is "environment cannot reach the metered diagnose", reported not fabricated.

## B. The judgment protocol (what the acceptance criteria require)

The verdict is read from `trajectory.json` + `climb.log` + the three glance renders. Four questions:

### B1. Did the form close, and stay closed? (the T-206 fix taking live)

From the trajectory:
- `closureFirst` ≈ **0.608** (the seed reads OPEN — the T-206 fix landed in the live runner, vs T-205's 0.980).
- `close_shell` **picked first** (round 1 `pick.tool`), with `gate.accept=true` and `closureAfter ≥ 0.9`
  (`close_shell` log line reports `closure X → Y`).
- Closure **stays ≥ 0.9** through every subsequent round's `closure`/`closureAfter` field (the relief residual
  must not dip a detail round below 0.9 — T-206 concern #1, ~0.04 margin).
- `closureLast ≥ 0.9`.

If all hold → **the form actually closed this time** (T-205's precondition was never met). This alone is a
result: it isolates whatever happens next as a *post-form* finding.

### B2. Did detail compound? (relief/arch/roof kept on a closed form)

- Round-by-round `pick` + `accepted`: were any of `relief_walls`/`rebuild_arch`/`apply_gable_roof`/
  `recolor_roof`/`band_eave` KEPT after the shell closed? `inventory.actedOn` lists the departments acted on.
- T-201 showed relief +20 on a closed form; the test is whether that reproduces once `close_shell` (not the
  T-201 manual close) supplies the closed base.

### B3. Did any major clear? (the form-alone-vs-detail-credit crux)

- `deptMajorsBefore`/`deptMajorsAfter` per kept round: did any department's major count drop? The department-
  dominant override (T-191) needs a major reported *cleared*; T-205 starved it (none ever cleared). If a major
  clears on the closed form → the gradient is alive → **form fix may be enough**. If majors never clear even on
  a genuinely closed, dressed form → the **S-208 detail-credit gap is real and independent** (the key finding).

### B4. The human glance vs concept (the gate vs glance doctrine)

Open `beside-final.png` and the candidate glances. Judge **reached-its-picture** (closed dressed walls, wide
arch, dark slate roof at the right pitch, right orientation/scale → **M1 landed**, E-53 can close here) **or**
the precise residual. **Scale/pitch judged on proportion, not render pixels** (the AC). If the build stalls at
0, **confirm from the trajectory the form was genuinely closed** (closure stayed ≥ 0.9) — that is what makes
the S-208 gap a real finding and not a form artifact (the T-205 failure was a form artifact; this must not be).

## C. The three branches of the falsifiable claim (lead with how it fails)

1. **M1 landed** — close_shell first, shell closed+stayed, detail compounded, a major cleared, glance reaches
   the picture. → E-53 closes here; record autonomy + cost.
2. **Stall at 0 on a genuinely closed form** — the *good* failure: with trajectory proof closure ≥ 0.9
   throughout, this confirms the **S-208 detail-credit cold-start gap** as an independent finding. The whole
   point of fixing the form first was to make this diagnosis trustworthy.
3. **A seventh gap / unreproducible variance** — a hand that does not read, a missing kit material, or a
   closed dressed build scoring 32 one run / 0 the next (→ accept-signal de-noising). Reported as the gap.

## D. What is explicitly NOT done

No new hand, no gate/scoring change, no source edit, `measurements/` untouched, `CLIMB_DEFAULTS` unchanged.
S-208 (the detail-credit fix, if branch 2) is out of scope — this ticket *diagnoses*, it does not fix the
gradient. One stage, run-and-judge.
