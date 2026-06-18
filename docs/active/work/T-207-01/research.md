# T-207-01 Research — reclimb-on-corrected-form-metric-and-glance-verdict

**Epic E-53 / Story S-207.** A *run-and-judge* ticket: adds **no new hand**, no source change. Re-run the
metered gatehouse climb with the **T-206 footprint form-metric** committed, then judge the trajectory + the
glance. The deliverable is evidence + a verdict, not code.

## The question this ticket settles

Does the **form fix alone** (T-206) restore the gatehouse to its picture (**M1 landed**), or does an
independent **detail-credit cold-start gap** remain (→ S-208)?

The T-205 capstone stalled flat at **0** because T-202's `robustExtent` clamp made the open colonnade seed
read `eaveRingClosure = 0.980` = *form-ready*, so `close_shell` was never picked, detail ran on an open form,
and the judge scored 0 / cleared nothing. T-206 replaced the clamp with closure measured on the **absolute
program footprint**: the seed now reads **0.608 = OPEN** (verified zero-spend, `wall-generate.test.mjs`
WG-CS10–14, all green; `npm test` 2416/2416). The form-before-detail gate will now *force* `close_shell` on
the seed. This ticket runs the consequence.

## The runner — `experiments/eval-alignment/picture-climb.mjs` (833 lines, committed, NOT in `npm test`)

The picture-driven climb (T-188, E-48), forked from `autonomy-loop.mjs`. Structure:

- **Subject + assets** (lines 58–72): `gatehouse`; seed `benchmarks/sculpture/generated/gatehouse/artifact.json`;
  program `benchmarks/sculpture/recognition/gatehouse.program.json`; pack `packs/rustic.json`; material-map
  `benchmarks/sculpture/material-map/gatehouse.json`; concept `…/015-vBuilding-a-stone-gatehouse…/concept.png`.
  `CFG = { eaveY: 18, ridgeAxis }`; `ridgeAxis` is **recognition-declared** (program `masses[0].roof.ridgeAxis`),
  not a footprint guess.
- **Run parameters** (74–88): `TIER="strong"` (`claude-opus-4-8`), `VOTES=3` (median out the 0–76 same-seed
  swing), `AGENT_MODEL="claude-sonnet-4-6"` (the pick), `{margin:4, stallK:2, minRounds:3}` from
  `CLIMB_DEFAULTS`. **`maxRounds = Number(process.env.CLIMB_MAX_ROUNDS) || 5`** (the T-205 budget knob).
  `GUARD_ONLY=1` renders round-0 + the beside sheet and exits **before any spend**.
- **The 11 hands** (104–416): `close_shell` (FORM — dense watertight shell from the footprint), `construct_walls`,
  `apply_gable_roof`, `recolor_roof`, `add_timber_framing`, `frame_arch`, `carve_arch`, `rebuild_arch` (WIDE
  arched gate, self-reverts on a refute), `articulate_walls`, `relief_walls` (proud quoins+plinth), `band_eave`.
  All materials READ from pack roles via `roleBlock`; `measurements/` never touched.
- **The gradient** (431–522): `scoreBuild` renders 4 azimuths + beside sheet, then `VOTES` median
  `DiagnoseBuild` (the E-47 picture-anchored critique — `styleFidelityScore` 0–100 + items). The
  **subprocess-timeout guard** (T-198) bounds each strong `claude -p` child at `CLAUDE_SUBPROCESS_TIMEOUT_MS`
  (180 s, `src/config.mjs:51`); a timed-out/malformed vote is DROPPED (median survives); if **every** vote in a
  round fails → `RoundAbortedError` → `writeAbortRecord` (recorded, exit 2 — never a fabricated 0, never a hang).
- **The accept-gate** (`agentPick` 526–574; loop 577–831): form-before-detail ordering, no-op guard, the
  department-dominant accept signal, and **form-move routing**.

## The two T-206-relevant seams the climb now exercises

1. **Form-readiness ordering** (`agentPick`, lines 529–534; loop gate 718–731). The agent is told the closure
   scalar and whether detail is LOCKED. With the seed now at **0.608 < FORM_READY_CLOSURE (0.9)**, the prompt
   says *"OPEN … Pick close_shell first"*; any detail pick is BLOCKED with no spend (`formReadyGate`,
   `climb-gate.mjs:108`). This is precisely what T-205 could NOT trigger (it read 0.980).
2. **Form-move routing** (loop 771–776). `closureNow`/`closureAfter` now thread **`program: PROGRAM`** (T-206
   commit `c7f8355`), so the live gate reads the **footprint** metric. `acceptsRound` decides a wall-shell form
   move (`close_shell`/`construct_walls`, via `closureDecidedMove`) on **closure alone** — the picture vote
   (0–76 swing) is removed from its keep/rollback so the decision is reproducible. `close_shell` raising
   0.608→~1.0 is KEPT on a picture-score tie (the T-198 deadlock the T-199 form-credit fixed).

## Prior runs (the baseline this re-climb is judged against)

- **T-201** (E-48): seed read **0.615** (pre-T-202); relief +20 (12→32) on a closed form — *detail moves score
  once the form is closed*. Hit the 5-round cap with `recolor_roof` unfired (→ the CLIMB_MAX_ROUNDS knob).
- **T-205** (E-52 capstone): seed read **0.980** (T-202 clamp bug) → `close_shell` never picked → trend
  `0→0→0→0→0`, `stopReason "stalled (3 rolled back)"`, every move rolled back `tie (0): no shrink`. Two fixes
  composed live (T-202 oscillation killed, T-204 pitch 1.34), T-203 arch did not (`head=false` on live seed),
  slate untested (stalled at r4). Named the **sixth gap**: *the measure has no gradient on a far-from-picture
  seed*. 12 strong + 4 sonnet calls; `votesTimedOut: 0`; no hang. Artifacts in `docs/active/work/T-205-01/`.

## Constraints / invariants (must hold)

- **Frozen instrument untouched.** `git status measurements/` clean (verified now). The climb is the *creation*
  critique (`DiagnoseBuild`), never the frozen measurement.
- **Subscription shim only** — `requestText`/`runTieredOp` via `claude -p`; never `ANTHROPIC_API_KEY` (the
  metered API). The spend-limit reply failure mode ([[spend-limit-reply-failure-mode]]) is a risk to watch.
- **`npm test` green** — 2416/2416 (the runner is out of the glob; this ticket changes no source).
- **Must not hang** — the T-198 180 s/call guard is the protection; T-205 proved it holds.
- **Reproducibility of the verdict** — the falsifiable claim names *score variance* (32 one run / 0 the next)
  as a failure mode. The form-move routing removes the picture vote from the `close_shell` decision, but the
  *detail* rounds still carry the 0–76 swing (median of 3).

## Open assumptions to test in the run

- The agent picks `close_shell` round 0 (it is told the form is open). **Likely** but agent-chosen.
- `close_shell` actually reaches closure ≥ 0.9 on the gatehouse footprint (the WG-CS11 fixture says a closed
  shell reads 0.9375; `close_shell.report.closureAfter` will confirm on the live seed).
- Closure **stays** ≥ 0.9 through the detail rounds (relief is off-ring; `rebuild_arch` forgives its declared-
  open columns via `openColumns`). The named residual (T-206 concern #1: closed+relief reads 0.9375 not 1.0)
  has ~0.04 margin — watch it does not dip a detail round below 0.9.
- Whether any **major clears** on a genuinely closed form — the crux of the form-alone-vs-detail-credit
  question. T-205's department-dominant override was *starved* (no major ever reported cleared).
