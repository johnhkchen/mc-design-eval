# Review — T-012-01: ground-on-mausoleum

Handoff for a human reviewer. What changed, what it found, test coverage, open concerns.

## What this ticket did

Re-ran the **champion** `vRefRevise-designdoc` pipeline on `references/sys_mausoleum.JPG` (Sun Yat-sen
Mausoleum) — **the reference that first proved grounding (run 008)** — to measure **how far the accumulated
technique has moved one fixed reference**. Run 008 predates every technique since (P12 craft/color split,
P13 one-plane, NO-LARGE-FLAT-FIELDS, high-res deep relief, the P14 2nd pass) and was scored on the retired
**v1 numeric** rubric; this run holds image/brief/seed fixed and changes only the pipeline. Result =
**run 022-vRefRevise-designdoc**, judged both rounds, journal entry written. **No code change** — the run
confirmed the champion's principles held on this reference, so neither pre-registered edit trigger fired.

## Files changed

**Source code:** *none.* Working tree on `benchmarks/temple-facade/run.mjs` is **clean vs HEAD** before and
after (verified). HEAD already is the 015-menu champion; no revert, no edit, no conditional trigger fired.

**Journal (the deliverable):** `docs/knowledge/design-learnings.md`
- Appended the **run-022 attempt-log entry** (A/B table, the two-leg 008-vs-now comparison, P12/P13/detail
  verdicts, judge `notes` excerpts, no-edit rationale, Net summary).
- Extended **P12's scope note** to record run 022 as the first *mildly-colorful / partial-agreement*
  reference — the first partial evidence on the long-open "is P12 a no-op under a colorful reference"
  question. (A concurrent lisa thread had already extended P12 to four pale references for run 021; my edit
  builds on that cleanly.)

**Work artifacts:** `docs/active/work/T-012-01/` — `research.md`, `design.md`, `structure.md`, `plan.md`,
`progress.md`, this `review.md`, and `judge-round0.mjs` (copied helper, unmodified).

**Run outputs (retained — AC #3):** `benchmarks/temple-facade/runs/022-vRefRevise-designdoc/` —
`reference.JPG`, `design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`,
`summary.json`, `transcript.jsonl`. `benchmarks/temple-facade/README.md` gallery regenerated (auto).

## Results (median-of-3, both rounds, all samples unanimous 3/3)

| dim | round-0 | render (2nd pass) |
|-----|---------|-------------------|
| proportion | strong | strong |
| color | strong | strong |
| detail | competent | competent |
| fidelity | strong | strong |
| **overall** | **strong (3/3)** | **strong (3/3)** |

11,325 blocks, $1.41, 640s. The 2nd pass **held every dimension** and added framed base panels, pilaster
strips, upturned gold roof-corner brackets, and a string-course — the good edge of P14 (like 019, unlike
the 020 regression).

**008-vs-now (headline):** measured on two rubric-independent legs because v1 numeric and v2 categorical
are not commensurable. **Leg 1 (failure-named):** run 008's judge named "shallow portico" + "blank base
register"; run 022 moved both from *absent → present-but-shallow* (base now panelled, portals framed-
recessed) but did **not** break the flat-field/relief-depth ceiling — still the P15 holdout. **Leg 2
(categorical):** run 022 reaches overall strong (3/3), same band as the best Taj/Hōryū-ji runs, with
`detail` named as the sole gap. **P12 HELD** (first two-tone/agreement reference — near-neutral but still
protective against white-collapse). **P13 HELD** (stacked roof + battered wings → one bonded plane, no
detachment, held through the 2nd pass).

## Test coverage

- `npm test` = **133/133 green**, at the pre-run gate and re-confirmed after the run. This is the only
  automated gate; it validates artifact schema conformance.
- **Gap (by design, not a regression):** no unit test covers prompt-string content or judge behavior — a
  prompt edit would have no unit of its own. None was made here, so the gap is not exercised. The real
  "test" is the frozen categorical judge on both renders (median-of-3), which is experimental, not a
  unit test, and inherently carries `claude -p` generation noise.

## Open concerns / known limitations

1. **`detail` is the unbroken ceiling — now confirmed on the founding reference too.** Across the entire v2
   chain (014/019/020/021/022) and back to v1 run 008, `detail` never exceeds *competent*; broad flat wall
   fields persist. The NO-LARGE-FLAT-FIELDS menu clause helps less than structural clauses (P15) and
   relocates blankness rather than eliminating it (run-021 whack-a-mole). The indicated fix remains a
   **dedicated, fenced ornament pass** (structured/incremental I/O) — out of scope here; tracked by the
   S-006/S-010 detail-lever tickets under their ≥2-generation promotion gate.
2. **P12's converse is only *partially* tested.** The mausoleum is two-tone (blue+white+gold), not fully
   polychrome, and the model could draw color from the reference *or* the brief. A clean neutrality test
   still needs a *saturated, many-hue* reference image where the reference alone would satisfy the brief.
3. **Single generation.** Per Design D, color/proportion are structural/low-variance and a single render
   answers them; the single `detail=competent` carries the P15 boundary-noise caveat. Not re-run to
   de-noise (cost not justified for a known holdout).
4. **Upstream housekeeping (not this ticket's scope):** run 021 (Arc / T-011-01) finished during this
   session via a concurrent thread (journal entry + render now present), but its `runs/021-…/` directory
   was incomplete at this session's start (round-0 only). If a reviewer audits T-011-01's outputs, confirm
   they were backfilled; this ticket did not touch them.

## Verdict

Acceptance criteria met: the mausoleum trial ran end-to-end; **both** `round-0.png` and `render.png` scored
with the categorical judge (median of 3, P14); the journal carries a dated entry with per-dimension A/B
scores, an explicit **008-vs-now comparison**, and P12/P13 held notes; any-diff recorded (there was none —
no trigger fired); `npm test` green; renders + `summary.json` retained. A correctly-scoped "detail still the
holdout, but 008's named defects measurably improved and the build is strong (3/3)" is the **successful**
cumulative-progress result this measurement ticket set out to produce.
