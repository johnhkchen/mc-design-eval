# T-201-01 — Research: metered gatehouse re-climb on the fixed + de-noised gate

Story **S-201** / Epic **E-49** — the M1 capstone. This is a **run-and-judge** ticket: no new hand or eye,
no production-source change. The work is to *run* the metered gatehouse climb end-to-end on the now-fixed
gate, capture the evidence, and judge the result on the glance. This research maps the runner, the fixes it
now carries, the environment, and the failure modes the run must distinguish.

## The runner: `experiments/eval-alignment/picture-climb.mjs`

The single entry point (NOT in `npm test`; metered via the strong-tier `claude -p` subscription shim). Key
structure:

- **Subject pinning** (lines 58–72): `gatehouse`; seed `benchmarks/sculpture/generated/gatehouse/artifact.json`;
  program `benchmarks/sculpture/recognition/gatehouse.program.json`; pack `packs/rustic.json`; material-map
  `benchmarks/sculpture/material-map/gatehouse.json`; concept `…/runs/015-…arched-gate/concept.png`.
  `CFG.ridgeAxis` is **recognition-driven** (`program.masses[0].roof.ridgeAxis`, loaded at line 72) — NOT a
  footprint guess. This already corrects the 90° rotation the reviewer flagged 2026-06-17 (the runner used to
  hardcode `"z"`); the framing eyes should therefore read orientation **quiet**.
- **Climb constants** (74–80): `AZIMUTHS` = the 4 multi-angle-gate corners; `TIER="strong"` (= `claude-opus-4-8`,
  my model); `VOTES=3` (median out the 0–76 same-seed swing); `AGENT_MODEL="claude-sonnet-4-6"`; defaults
  `{margin, stallK, maxRounds, minRounds}` from `CLIMB_DEFAULTS`.
- **The ten HANDS** (97–319): `apply_gable_roof`, `recolor_roof`, `construct_walls`, **`close_shell`** (the FORM
  hand, T-197), `add_timber_framing`, `frame_arch`, **`carve_arch`** (T-194, the only widener; self-reverts on
  a failed coherence gate), `articulate_walls`, **`relief_walls`** (T-195, proud construction), `band_eave`.
  Each is department-scoped so the accept-gate's department/form overrides can keep it on a whole-build wobble.
- **The gradient** (334–425): `scoreBuild` renders 4 azimuths + a beside-concept sheet, runs `framingReport`
  (the wider eyes — GL-free, rides even GUARD_ONLY), then VOTES median `DiagnoseBuild` with a **per-vote
  subprocess-timeout guard** (T-198): a timed-out/malformed vote is *dropped* (median survives); if **every**
  vote fails it throws `RoundAbortedError` → `writeAbortRecord` (recorded, exit 2, never a fabricated 0).
- **The agent** (429–477): `agentPick` builds the prompt with (a) the top-5 critique items, (b) the
  **FORM-READINESS** line (closed vs open colonnade, detail tools LOCKED below `FORM_READY_CLOSURE`), (c) the
  FRAMING flags (shown so the agent isn't blind; no tool fixes them → `done` is honest if only these remain),
  (d) the KEPT/ROLLED-BACK history. Reply parsed by the shared `parseFirstJsonObject`; re-asks once on a
  malformed reply, then degrades to a recorded `done` (never crashes).
- **The loop** (480–669): seed score (round 0) → `agentPick` → per round: form-before-detail gate
  (`formReadyGate`, blocks a detail pick on an open shell with NO spend), no-op guard (`buildDigest`),
  `scoreBuild`, then `acceptsRound`. On accept `occ=cand`. `stoppingDecision` converges. Writes
  `trajectory.json` (→ `CLIMB_OUT`, defaults to the T-188 path — **must override to T-201-01**) + per-round
  beside renders, and prints the trend / verdict / closure-first→last / acted-on / eyes-only / framing residual.

## The two fixes this run exercises (the whole point of the ticket)

Both landed in `src/workshop/climb-gate.mjs` (pure, unit-tested) and are wired into the runner's `acceptsRound`
call (line 618). They are what T-198 lacked.

1. **Form-credit (T-199-01).** `CLOSURE_GAIN_MARGIN=0.1`; `formCredit(...)` (private) returns a KEEP when a
   form gap remains (`closureBefore<0.9`), closure rises ≥0.1, **no new department major anywhere**, and **no
   targeted dept's total burden rose**. Consulted after the department override, before the regression reject —
   so a real shell closure is KEPT on a picture-score tie (the exact T-198 deadlock: 16→16 tie rolled back
   close_shell). Unit-falsified both ways (CG-FC1–6).
2. **Form-move routing (T-200-01).** `closureDecidedMove(tool)` → true for `close_shell`/`construct_walls`
   (WALL form moves). When `isFormMove` is set and a form gap remains, the decision is **closure-only** — the
   noisy picture vote is removed from the keep/rollback, so the close decision is **stable across re-runs**
   (CG-FS1/FS2 sweep the 0–76 swing → invariant). Roof-form/detail keep the picture gradient (CG-FS3/FS4).
   Also landed: the shared `parseFirstJsonObject` (`src/workshop/agent-reply.mjs`, AR1–8) both runners decode
   through, killing the two-object reply crash.

The runner at line 618 threads `closureBefore: closure`, `closureAfter: closureNow(cand)`, and
`isFormMove: closureDecidedMove(pick.tool)` — i.e. both fixes are live in the call. The recorded `closureAfter`
bug (T-199 review §"Bug fix") is also fixed: the trajectory records the candidate closure the gate evaluated.

## The expected live sequence (the falsifiable claim, operationalised)

1. Round 0: seed scores low; shell is an **open colonnade** (closure ≈ 0.615 < 0.9). Agent told form is OPEN →
   should pick `close_shell`.
2. `close_shell` applied → closure 0.615→1.000. `isFormMove=true` + gap remains → **closure-only decision** →
   `formCredit` fires → **KEPT** (this is the fix; T-198 rolled it back on the tie).
3. Closure ≥ `FORM_READY_CLOSURE` → detail tools **unlock**.
4. Agent picks `carve_arch` (widen+frame the gate) and `relief_walls` (proud dressed stone) on the now-closed
   shell; WALL + OPENING majors should clear (the colonnade hid whether these hands *read*).
5. Framing eyes stay quiet on orientation (ridgeAxis is program-correct), may flag residual scale.
6. Glance: dressed grey-stone gatehouse + arched gate + dark gabled roof — *or* a precisely-named fifth gap.

## Environment (verified this session)

- `claude` shim present at `/Users/johnchen/.local/bin/claude`; `strong` tier = `claude-opus-4-8`;
  `CLAUDE_SUBPROCESS_TIMEOUT_MS = 180_000` (overridable via `CLAUDE_TIMEOUT_MS`).
- **GUARD_ONLY smoke ran clean**: assets present, **GL available**, round-0 4 views + beside sheet written to
  `builds/gatehouse/picture-climb/round-0/`, zero spend. The wiring + render seam is proven; only the metered
  diagnose/agent calls remain untested live.
- Framing eyes printed **no flags on the seed** (orientation quiet — the ridgeAxis correction holds).
- No `timeout(1)` binary on this macOS shell — the per-call guard is in-process (`runTieredOp` timeoutMs), so
  the climb cannot hang on a subprocess; an external wall-clock cap is not needed (and is the T-198 finding).

## Constraints & failure modes the run must distinguish (anti-hedge)

- **Frozen instrument untouched.** `measurements/` must not change. Only the subscription shim — never
  `ANTHROPIC_API_KEY` / the metered API.
- **`npm test` green** must hold (the runner isn't in it, but nothing source-side should regress).
- Three distinct outcomes to name honestly: (a) **close_shell still rolls back** (fix didn't take live → back
  to the gate, name why); (b) **it sticks but carve/relief don't read** (a hand defect the colonnade hid);
  (c) a **fifth gap** (roof pitch/material — the E-50 residual — or a live sequencing failure → E-52). A
  precisely-named fifth gap is a complete result.
- **An all-votes-timed-out abort is itself a finding** (the guard worked, the metered diagnose is unreachable
  here) — reported via `writeAbortRecord`, not scored.
- Scale judged on **proportion, not render pixels** (a uniform zoom is a framing caveat, not a divergence).
