# T-205-01 — Plan: the capstone run, step by step

Ordered, independently verifiable. Run-and-judge: "tests" = the verification gate after each step. One source
commit (the round-budget knob) + one work-dir commit at the end.

## Step 0 — The round-budget knob (source, zero spend)
- Edit `picture-climb.mjs:78` to add the `CLIMB_MAX_ROUNDS` env override (per structure.md).
- **Verify:** `node --check experiments/eval-alignment/picture-climb.mjs` parses; `git diff` is exactly the
  one-line change + comment.

## Step 1 — Baseline invariants (independent of the run)
- `git status --short benchmarks/sculpture/measurements/` → empty (record "clean").
- `npm test` → green; record the count (expect 2411 per T-203 progress). Capture up front so a post-run red is
  attributable to environment, not the run.
- **Verify:** test count recorded; measurements clean. The knob defaults to 5 → count must equal HEAD's.

## Step 2 — Pre-flight, zero spend
- `GUARD_ONLY=1 CLIMB_OUT=docs/active/work/T-205-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`
- **Verify:** prints `GL available`; writes `builds/gatehouse/picture-climb/round-0/` (4 azimuths + beside);
  exits clean; **zero spend**. A failure here (no GL, missing asset) aborts before any metered cost.
- T-203/T-204 zero-spend probes (`REBUILD_ARCH_PROBE`, `ROOF_MATERIAL_PROBE`) are already evidenced in their
  work dirs — relied on, not re-run.

## Step 3 — The metered climb (the one expensive step)
- Background, long: `CLIMB_MAX_ROUNDS=8 CLIMB_OUT=docs/active/work/T-205-01/trajectory.json node
  experiments/eval-alignment/picture-climb.mjs > docs/active/work/T-205-01/climb.log 2>&1`
- Strong-tier `claude -p` per vote × VOTES=3 × ≤9 scored builds; per-call 180 s timeout guard ⇒ cannot hang.
- **Monitor** `climb.log` for the round narration, then either the `==== PICTURE-DRIVEN CLIMB ====` verdict
  block or an `[ABORT]` line (all votes failed → `writeAbortRecord`, exit 2).
- **Verify (completion):** `trajectory.json` exists, parses, has a terminal entry (or `aborted:true`).

## Step 4 — Collect the glance evidence
From `builds/gatehouse/picture-climb/`:
- round-0 beside → `beside-first.png`
- max-`score` round beside → `beside-best.png`
- final-kept round beside → `beside-final.png`
- **Verify:** three PNGs present in the work dir.

## Step 5 — Read the trajectory (the autonomous-sequencing verdict)
Parse `trajectory.json`; answer the acceptance rubric, each cited to a concrete field:
1. Did the climb reach a **higher plateau without oscillating**? — `inventory.verdict.oscillated`,
   `closureFirst→closureLast`, and crucially whether `closureAfter` **stays ≥ FORM_READY_CLOSURE through
   relief** (the T-202 fix; T-201 cratered 1.000→0.068 here).
2. Did **arch, slate roof, pitch** all land? — `rebuild_arch` kept (`accepted:true`, OPENING majors fall);
   `recolor_roof` ran and kept; `framing` residual on the final build (ridgeToEave flag cleared?).
3. **Round-by-round picks** — the autonomous tool sequence + each keep/rollback + reason.
4. `stopReason`, `delta`, `votesTimedOut`, `actionableFrac`, cost (votes × scored rounds × tier).
- **Verify:** every answer cites a field (no prose-only claims).

## Step 6 — The glance judgment (human, calibrated honesty)
Open `beside-final.png` (and `beside-best.png` if they differ) vs concept. Judge:
- closed dressed grey walls? **wide arched gate?** **dark slate gabled roof?** pitch plausible (proportion, not
  pixels)? orientation/scale right?
- **Verdict:** *reached-its-picture (M1 landed)* **or** the *named sixth gap* (→ E-53), at full strength.

## Step 7 — Re-verify invariants
- `npm test` → still green, same count as Step 1.
- `git status --short benchmarks/sculpture/measurements/` → still empty.
- **Verify:** both hold; if `npm test` regressed, investigate environment before reporting.

## Step 8 — Write `progress.md`, then `review.md`, then commit
- `progress.md`: the run as executed, any deviation, the trajectory read, the glance call.
- `review.md`: handoff — verdict (picture or sixth gap), the sequencing answers, autonomy (autonomous picks vs
  scripted = none), metered cost (votes × rounds × tier), open concerns, frozen-instrument attestation.
- Commit: the one-line runner knob + `docs/active/work/T-205-01/*`. Message:
  `feat(T-205-01): round-budget knob + metered gatehouse re-climb — <picture | sixth gap: …>`.

## Testing strategy summary
| What | How verified | When |
|---|---|---|
| Knob is inert under the suite | `npm test` green, count == HEAD (Steps 1, 7) | before + after |
| Wiring + render seam | GUARD_ONLY clean (Step 2) | before spend |
| Frozen instrument untouched | `measurements/` clean (Steps 1, 7) | before + after |
| Fixes took live | trajectory: arch kept, recolor ran, closure stays ≥ form-ready through relief (Step 5) | after run |
| Reached picture / sixth gap | glance on `beside-final.png` (Step 6) | after run |
| No hang | 180 s per-call guard; `votesTimedOut` / abort reported (Steps 3, 5) | during/after |
| Subscription only | `runTieredOp → claude -p`; no `ANTHROPIC_API_KEY` (Step 3) | inherent |
