---
id: E-53
title: form-readiness-truth-and-finish-the-gatehouse
type: epic
status: open
priority: high
depends_on: [E-52]
spec: "§1, §5, §6, §9"
stories: [S-206, S-207, S-208]
---

## Background (the capstone regressed — and the cause is a metric that now lies)

**Milestone rung: M1, still — finish the gatehouse to its picture; the last attempt regressed.** The E-52
capstone (T-205) re-ran the metered climb and **fully stalled at score 0** (trend 0→0→0→0→0, 3 rolled back) —
a **glance regression** versus E-49's T-201, which had reached a closed dressed-stone mass at score 32. The
build ended a dark, open colonnade with a brown roof — worse than where it started two epics ago.

The diagnosis is precise and evidence-backed (the seed closure probe, zero-spend):

```
seed wall-band closure: 0.980          ← current eaveRingClosure (post-T-202)
close_shell ... closure 0.615 → 1.000  ← close_shell's own internal measure of the SAME seed
```

**T-202 over-corrected.** Its robust-footprint clamp — meant to stop proud relief (quoins/plinth) from
cratering closure — *also* absorbed the open colonnade's gaps, so an **open colonnade now reads 0.980 =
"form-ready."** The same seed read 0.615 (correctly) on the old metric in T-201, and the render confirms it is
genuinely open. The cascade:

1. Seed reads 0.980 → the **form-before-detail gate (T-197) thinks the form is already closed** → `close_shell`
   is **never picked**; the shell never actually closes.
2. Detail hands (relief / arch / roof) run on an **open colonnade** — the E-51 disease returns.
3. The build stays a dark open mass → the judge correctly scores it **0 and keeps all four majors** (trajectory:
   `deptMajorsBefore == deptMajorsAfter` every round — **nothing ever clears**).
4. Every detail move is a "tie at 0" → rolled back → total stall, glance regression.

So the fix is **not** detail-credit (a credit-majors-cleared rule can't fire when no major clears, and crediting
detail on a genuinely-open form would re-entrench the colonnade). The fix is to **make the form-readiness metric
tell the truth again**: read the colonnade low (forcing `close_shell` first) while still not cratering on proud
relief. Governed by `docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`; frozen
instrument untouched; subscription shim only.

## The hypothesis this epic tests

**Once the form actually closes, the detail hands compound and the build reaches its picture — no detail-credit
change needed.** T-201 already showed detail moves *do* score on a closed form (relief +20, 12→32); the score-0
floor in T-205 was an artifact of the form never closing. So: fix the metric, re-climb, and see if M1 lands. The
detail-credit fix is held **contingent** — built only if the re-climb still stalls on a *genuinely closed* form.

## Stories

- **S-206 — form-readiness truth (the lead fix).** Replace T-202's extent-clamp with closure measured on the
  **absolute program footprint**: a footprint-perimeter column with no wall cell at the plane is **open** (so
  colonnade gaps read open); cells standing **proud of** the footprint (relief) are **ignored** (so relief
  doesn't crater it). The colonnade seed must read ~0.6 (< 0.9, forcing `close_shell`); a closed shell with
  proud relief must read ≥ 0.9; and the metric must **agree with `close_shell`'s internal measure** (no more
  two-numbers-disagree). Reuse the one closure authority.
- **S-207 — re-climb on the corrected metric + glance verdict (the test of the hypothesis).** Re-run the metered
  gatehouse climb. Best case: `close_shell` is picked first, the shell closes, detail compounds, and the build
  reaches **its picture** (closed dressed walls, wide arch, dark slate roof at the right pitch) — **M1 landed,
  E-53 done.** Or: it still stalls at 0 **on a genuinely closed form** — which **confirms an independent
  detail-credit gap** (the score-0 cold start) and names it precisely for S-208.
- **S-208 — detail-credit / score-0 cold-start accept-gate (CONTINGENT).** Built **only if S-207 confirms** the
  climb stalls at 0 on a genuinely closed form. The fix: let detail hands escape a score-0 cold start so they
  can compound (e.g. provisional-accept-then-judge-the-batch, or a structural fallback signal when the VLM
  scalar saturates at 0), then re-climb to prove it. If S-207 reaches the picture, **this story is a documented
  no-op** (the form fix sufficed) — anti-hedge: it must be allowed to be unnecessary.

## How this epic can fail (state it up front — anti-hedge)

- **The footprint metric is also wrong** — the program footprint doesn't match the build's real wall plane on
  this seed (registration ambiguity, the `AMBIGUOUS` axis flag), so closure still mis-reads. Then form
  measurement is a deeper geometry problem ([[wall-construct-needs-dense-shell]], [[cottage-gate-and-volume-gate-are-one-fix]]).
- **The form closes but the picture still doesn't land** — `close_shell` is picked, the shell closes, yet the
  build still misses (the score-0 stall persists → S-208 fires; or a *seventh* gap appears → name it).
- **Score variance dominates regardless** — the 0–76 swing means even a closed, dressed build scores
  unpredictably (T-201 = 32, a re-run might = 0). Then the accept *signal* needs de-noising (more votes /
  noise-aware median) independent of any single fix — the standing co-lever.
- **We keep not landing M1.** Three epics on one house. If E-53 doesn't land it, the honest call is whether the
  picture-climb architecture can finish *any* single subject before generalizing — a reviewer decision, named
  not buried.

## Done when

The form-readiness metric reads the colonnade open (< 0.9) and a relieved closed shell closed (≥ 0.9), agreeing
with `close_shell`'s measure; a re-run metered climb picks `close_shell` first, closes the shell, and either
reaches the gatehouse's picture on the glance (**M1 landed**) or names — on a genuinely closed form — the
detail-credit gap (S-208) or a seventh gap, at full strength. Frozen instrument untouched; subscription shim
only.
