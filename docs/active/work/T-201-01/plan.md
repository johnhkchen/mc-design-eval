# T-201-01 — Plan: the run, step by step

Ordered, independently-verifiable steps. Since this is run-and-judge, "testing strategy" = the verification
gates after each step. No source commits (no source changes); the commit at the end is the work-dir artifacts.

## Step 0 — Pre-flight (zero spend) ✅ done in Research

`GUARD_ONLY=1 CLIMB_OUT=docs/active/work/T-201-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`

- **Verify:** prints `GL available`, writes `builds/gatehouse/picture-climb/round-0/` (4 views + beside),
  exits clean, **zero spend**. ✔ (assets present, GL up, no FRAMING flags on seed → orientation quiet).

## Step 1 — Baseline invariants (independent of the run)

- `git status measurements/` → clean (record the baseline).
- `npm test` → green (record the count). Nothing source-side changed, so this should already pass; capture it
  up front so a post-run red is attributable to the environment, not the run.

## Step 2 — The metered climb

`CLIMB_OUT=docs/active/work/T-201-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs
> docs/active/work/T-201-01/climb.log 2>&1`

- Run **in background** (long: strong-tier `claude -p` subprocess per vote × VOTES × rounds; the per-call
  180s timeout guard means it cannot hang — a stuck vote is killed and dropped/aborted).
- **Monitor** for: the round-by-round narration in `climb.log`, then either the
  `==== PICTURE-DRIVEN CLIMB ====` verdict block (success/degraded) **or** an `[ABORT]` line (all votes failed
  → `writeAbortRecord`, exit 2).
- **Verify (completion):** `trajectory.json` exists and parses; it has a terminal entry (or an `aborted:true`
  block).

## Step 3 — Collect the glance evidence

From `builds/gatehouse/picture-climb/`:
- `cp round-0/beside-concept.png  docs/active/work/T-201-01/beside-first.png`
- best round (max `score` in trajectory) `beside-concept.png` → `beside-best.png`
- final kept round `beside-concept.png` → `beside-final.png`

- **Verify:** three PNGs present in the work dir.

## Step 4 — Read the trajectory (the autonomous-sequencing verdict)

Parse `trajectory.json` and answer the Decision-3 rubric:
1. round-0 pick = `close_shell`? (and were any detail picks form-gate **blocked** first?)
2. the `close_shell` round: `accepted===true`? `gate.reason === "form-credit"` (NOT a tie rollback)?
   `closureAfter ≥ FORM_READY_CLOSURE`?
3. later rounds: `carve_arch` + `relief_walls` picked and **applied** (not blocked)?
4. WALL / OPENING `deptMajorsAfter` < `deptMajorsBefore` on their rounds?
5. `stopReason`, `closureFirst→closureLast`, `votesTimedOut`, `framingResidual`, `inventory.verdict`.

- **Verify:** each answer cited to a concrete trajectory field (no prose-only claims).

## Step 5 — The glance judgment (human)

Open `beside-final.png` (Read tool renders it) and judge vs concept on the calibrated-honesty register:
- closed dressed grey walls? arched gate? dark gabled roof? orientation right? proportion plausible?
- **Verdict:** *reached-its-picture* **or** the *named fifth gap* (→ E-52), stated at full strength.

## Step 6 — Re-verify invariants

- `npm test` → still green (same count as Step 1).
- `git status measurements/` → still clean.

- **Verify:** both hold; if `npm test` regressed, investigate the environment before reporting (Decision 5).

## Step 7 — Write `progress.md`, then `review.md`, then commit

- `progress.md`: the run as executed, any deviation, the trajectory read, the glance call.
- `review.md`: the handoff — verdict (picture or fifth gap), the autonomous-sequencing answers, autonomy
  (autonomous picks, no scripting), metered cost (votes × rounds × tier), open concerns, frozen-instrument
  attestation.
- Commit the work-dir artifacts (`docs/active/work/T-201-01/*` + the draft beside renders under `builds/` if
  tracked). Commit message: `docs(T-201-01): metered gatehouse re-climb — <picture | fifth gap: …>`.

## Testing strategy summary

| What | How verified | When |
|---|---|---|
| Wiring + render seam | GUARD_ONLY clean (Step 0) | done |
| No source regression | `npm test` green (Steps 1, 6) | before + after |
| Frozen instrument untouched | `git status measurements/` clean (Steps 1, 6) | before + after |
| The fix took live | `close_shell` round `gate.accept` + reason `form-credit` (Step 4) | after run |
| Reached its picture / fifth gap | glance on `beside-final.png` (Step 5) | after run |
| No hang | per-call 180s guard; `votesTimedOut` / abort block reported (Steps 2, 4) | during/after |
| Subscription shim only | runner uses `runTieredOp`→`claude -p`; no `ANTHROPIC_API_KEY` set | inherent |

## Risk register (pre-decided, per Decision 5)

- **All votes time out** → abort record; infra/auth/spend signal, not a gate-fix refutation; report as such.
- **close_shell rolls back live** → failure-mode (a); name why at the gate (the `gate` object will say).
- **close_shell sticks but carve/relief don't read** → failure-mode (b); name the hand defect.
- **A fifth gap (roof/sequencing)** → name at full strength → E-52. Complete result.
