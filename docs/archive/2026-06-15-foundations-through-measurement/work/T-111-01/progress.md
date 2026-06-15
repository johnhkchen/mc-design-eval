# T-111-01 closure-milestone — Progress

Tracking against plan.md (8 steps). Deviations are named here before proceeding.

## Status

- [x] Step 0 — concurrency + baseline `npm test` (1431/1431 green at ccb198e)
- [x] Step 1 — evidence pre-capture (closure-<s>-before.png ×3, byte-equal; commit 2afb53f)
- [x] Step 2 — `roof:church` under T-108/T-109 cores (+repro/offline; commit 0064dfd)
- [x] Step 3 — CANCELLED (S-113 owns the vocabulary-authority fix; see deviation 1)
- [x] Step 4 — CANCELLED (same)
- [x] Step 5 — `reconstructed:{cottage,gatehouse,church}` one live run each
      (cb4ef4b / 25a80cb / f4f996b)
- [x] Step 6 — `--repro` + `--offline` receipts per subject (all green; church repro honestly
      "pipeline-failed — nothing to reproduce", exit 1)
- [x] Step 7 — closure frames-after + `pr/assets/closure-milestone.md` + design-learnings E-28
      (166b8e7)
- [x] Step 8 — review.md, final suite green (1431/1431 + validator)

## Log

- (start) 2026-06-10 ~22:58 PDT — phases research→plan written; no sibling session on T-111-01
  (work dir created by this session; latest sibling activity is T-109-01, closed at 746f44a).
- 23:07 — step 0: `npm test` 1431/1431 green. Step 1: closure-<s>-before.png ×3 committed
  (2afb53f), provenance = reconstructed-<s>-after.png @ ccb198e.
- 23:12 — step 2: `roof:church` re-cut (0064dfd). Nave ACCEPTED `end-fitted-gable-ends`
  (ridge intersect Δ vs record 0.378, apex line rmse 0); tower honest fallback (no sane
  in-tolerance gable — pyramidal cap, S-112 scope); both nave ends `end-hip` named (the nave
  ends slope — hip demanded, not fitted); 12/14 terminations accepted (−386 cells; 2 closure
  rollbacks); residual res-0 (18 cells) removed refuted @ +x+z, res-1 (5 cells) GLB-exempt;
  protrusions 0→1; unmapped 0/16522; IoU unchanged at all 4 azimuths. `--repro` MATCHES
  (b107b729df7b), `--offline` OK.

- 23:25 — step 5 cottage (cb4ef4b): chain gated, instrument frozen `diffs: []` (vs committed
  pre-run record; judge claude-opus-4-8). Verdicts as judged: 135°/225° same object (2 minor
  each); 45° drifted (roof-vs-walls massing MAJOR; was form-major at E-27); 315° drifted (roof
  form MAJOR). Aggregate FAIL gapCount 10, kit presence PASS. Census 265/21.7% → 86/6.3%
  (E-27 after was 51/6.8%): measured the +35 spike delta cell-by-cell — 38 added spike cells,
  36 spruce_planks + 2 dark_oak_log, y14–24 = the T-108 open-underside verge sheet courses;
  the full-occupancy census counts declared sheet cells by design (T-108 review #1
  counted-never-hidden). Ragged improved 6.8% → 6.3%.

- 23:34 — step 5 gatehouse (25a80cb): chain gated, instrument frozen `diffs: []`. Verdicts as
  judged: 4/4 drifted (was 3/4 at E-27), gapCount 12, roof form MAJOR at every azimuth; 45°
  names "extra protruding masses" = the two GLB-backed remnants T-109 exempt-showed (its
  review #1 pre-named per-column membership as the next move — E-29 territory). Kit presence
  PASS. Census 118/14.1% → 43/8.1% (E-27 after 25/9.9%; spike rise = sheet courses, ragged
  improved).

- 23:42 — step 5 church (f4f996b): styled-routed for the first time; honest refusal @ settle
  (frame 13 / foreign fill 168 / gating 0 — shifted from T-110's 14/170 by the new roof,
  consistent with the structural vocabulary-split diagnosis). Instrument untouched (no gate
  ran). Census on last-completed artifact 602/24.3% → 204/15.9%. styled/church/* artifacts
  committed (sibling parity).
- 23:48 — step 6: cottage repro MATCH (33ffd0c825a0), gatehouse repro MATCH (a8b4c58e3571),
  church repro exit 1 (nothing to reproduce, honest); offline ×3 MATCH/pinned/frozen; roof
  offline cottage+gatehouse OK.
- 23:55 — step 7 (166b8e7): closure-after frames ×3, epic sheet, design-learnings E-28 section
  + E-12 handoff. Final `npm test` 1431/1431 green.

## Deviations

1. **(pre-implementation, 23:05)** Commit `ccb198e` (E-29 epic + S-112…S-116) landed mid-ticket
   and assigns the church settle fix to S-113 (vocabulary-authority), DAG-sequenced after
   T-111-01. Plan steps 3–4 cancelled; this ticket ships zero construction-code changes; the
   church's closure measurement is the honest settle refusal with S-113 cited as owner.
   Addenda written into design.md / structure.md / plan.md.
