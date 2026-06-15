# T-122-01 ridge-height-closure — Progress

## Step 0 — Diagnosis (recorded BEFORE any fix; AC 1) ✅

Trace: fit record → generator input → placed cells, on the committed records at HEAD
(`544afca`). Measurement method: evaluate the pure surface (`gableSurfaceHeight`, the exact
definition `roofHeightfield` realizes) over each gable's committed footprint columns from
`generated/<s>/provision-fit.json`, beside the committed `roof-diff/<s>-generated.json`
profiles. The fitted-apex / built-ridge numbers, per gable:

| gable | ridge.y (recordY) | plane intersect | apexLine.height | GLB ridge profile (instrument) | max generated surface | built apex |
|---|---|---|---|---|---|---|
| cottage `gable-roof-2-roof-3` (cross) | 21 | 18.864 | 22.792 | 22.445 (flat) | **18.577** | cell 18 + slab |
| cottage `gable-roof-0-roof-4` | 24 | 22.54 | 24.333 | — (mean δ −0.381) | **22.268** | ~22–23 |
| barn `gable-roof-1-roof-8` | 19.5 | 19.126 | 20.991 (3 bins of 48) | 19.5 (flat, full span) | **19.098** unramped / 13.5→19 ramp | 13→19 |

Where the ~4 blocks are lost — four named mechanisms, none of them the swap ladder (the
generated path has no swap ladder; `generateProvision` → `generateRoof` consumes the fit
gables directly):

- **(a) Shallow side planes cap the ridge.** `gableSurfaceHeight` = `min(ridge.y, eaveY +
  pitch·dist, hip planes)` (roof-fit.mjs:223). The independently-fitted side pitches (cottage
  cross: 0.453/0.885) intersect at 18.864 — the surface never reaches ridge.y 21. Built apex
  18.577 ≈ the plane intersection. Loss: −2.1 (cross), −1.7 (main), −0.4 (barn flat half).
- **(b) A misfitted hip end plane is honored as a hard ceiling.** Barn `hip.lo` demanded
  (recorded ridge cells stop at x=17 vs bbox minX −24 — a blob artifact), fitted pitch 0.231
  (near-flat) anchored at v=−24 → ramps the entire lo half of the ridge 13.5→19 while the GLB
  ridge profile is flat 19.5 across the FULL span [−24, 23]. Loss: up to −6 at the end
  (instrument maxAbs −8.8 eave-relative).
- **(c) The trusted fitted apex is never consumed.** `ridgeFit[].apexLine` (T-118's repaired
  reading) is evidence-only; `ridge.y` stays the blob median (cottage cross 21 vs apex 22.792 /
  profile 22.445). Loss: −1.4 to −1.8.
- **(d) Instrument anchor artifact on asymmetric eaves.** `heightProfiles`: buildEave = mean of
  DECLARED side eaves (barn (13.5+18)/2 = 15.75) but glbEave = ONE pooled median over whatever
  eave-edge columns sampled (barn: 4 samples, low side only → 13.45), contradicting its own
  "each side anchored to its own eave" docstring. Manufactures −2.3 of barn's −4.396 mean.
  Cottage (symmetric eaves) unaffected: buildEave 14.75 / glbEave 14.794.

Committed instrument numbers these mechanisms explain: cottage cross-gable ridge mean
**−4.324** (build 18, glb 22.445, count 13) ≈ (a)+(c); barn ridge mean **−4.396**, maxAbs −8.8
(build 13→19, glb flat 19.5, count 47) ≈ (a)+(b)+(d). Headline provenance: the ticket's
**−4.015** is a rake `rawDelta` entry in T-118's before record
(`docs/active/work/T-118-01/artifacts/before/cottage-generated.json` profiles[1].rakes[1]
.profile[6]); the cross-gable ridge stats mean is −4.324 in BOTH the T-118 before record and
HEAD ("unchanged through T-118's repair" holds). The witness test pins the committed values.

Ticket-candidate verdicts: "fitted apex not consumed" CONFIRMED (c); "eave/pitch integer
quantization" REFUTED as quantization — it is plane shallowness (a), continuous not integer;
"swap-ladder rung accepting a low candidate" REFUTED for this path (no ladder).

## Steps — all complete

- [x] Step 1 — sampler move + shared anchors + instrument repair (`8e50977`). Measured: the
  barn anchor artifact was **−1.897** (mean −4.396 → −2.499 under the repaired anchors alone),
  slightly less than the −2.3 raw offset estimate in the diagnosis; cottage cross-gable −4.324
  byte-stable (symmetric eaves) — the construction deficit stood isolated as predicted.
- [x] Step 2 — dominantLine extraction (key order preserved for --repro) + fitRidgeProfile +
  closeRidge + the witness test (`3d75530`).
- [x] Step 3 — fitProvision closure integration + realization tests (`13776a6`).
- [x] Step 4 — `--skip-gate` + roof-diff comment hygiene (`6c7bfd1`); fail-closed verified
  (run without --rotate-pins → first changed pin refused, no judge spawn).
- [x] Step 5+6 — skip-gate chains + instrument verification BEFORE judging (`1375805`):
  closures cottage cross 21→22.5 / main 24→23 / barn 19.5→20 + lo hip REFUTED;
  ridge means cottage cross **−4.324 → −0.401**, barn **−4.396 → −0.111** (≤ ±1 declared);
  total mismatch 5922→5637px / 4416→3153px; IoU vs GLB: barn +4/4, cottage +3/4 with +x−z
  −0.008 (inside the 0.01 tolerance — cage holds, no rollback needed). All 8 roof-diff records
  re-derived (anchor repair moved every ruler), `diff:roof --repro` PASS.
  *Deviation noted:* byRegion before/after categories re-attribute (regions move with the
  closed gables) — totals + profile stats + IoU are the comparable rulers, recorded as such.
- [x] Step 7 — diff:roof --repro PASS (mid-check).
- [x] Step 8 — one owned re-judge (`90af70f`): cottage 12/2 0/4 → **10/2, 2/4 same-object**
  (135° demotes ridge/apex to minor); barn 12/2 0/4 → 12/2 0/4 with the majors CHANGED from
  flattened-ridge form to roof coverage/material (the deferred barn-kit recognition residual,
  diff deltas beside it). Receipts frozen `diffs: []` both; zero T-114 re-asks; barn
  `generalization.clean: true` at last.
- [x] Step 9 — milestone `--repro`/`--offline` PASS both subjects; suite **1629/1629**; no
  conformance tripwires fired.
- [x] Step 10 — review.md.

*Housekeeping deviation:* a stray pre-existing `generated/barn/HEIF Image.heic` was swept into
the artifacts commit by a directory `git add`; removed from the index (kept on disk) and the
commit amended before any push.
