# T-198-01 — Research

Story **S-196** / Epic **E-51**. *Metered gatehouse re-climb on the closed form, with a subprocess-timeout
guard.* Descriptive map only — what exists, where it connects, where the hang lives, what the metered run
already depends on. No solutions here (those are `design.md`).

## The two coupled deliverables (from the ticket)

1. **A subprocess-timeout guard** on the `claude -p` spawn path the tiered diagnose/vote op uses, so a
   non-returning child cannot hang the whole climb. A timed-out vote must degrade *gracefully* AND be
   *recorded*; the all-votes-timed-out case must be *detected and abort/flag*, never silently scored 0.
2. **Run the metered gatehouse climb** end-to-end on the closed form, with all E-51 hands + framing eyes,
   and report the autonomous-sequencing verdict + the human glance.

## The spawn path of the hang (traced end-to-end)

The metered diagnose vote is image-bearing, so it routes through the *image* shim:

```
picture-climb.diagnose(renders)                          experiments/eval-alignment/picture-climb.mjs:340
  → runTieredOp({ tier:"strong", prompt, images })       src/model-tier.mjs:57
      → SHIM_INVOKERS.image  (images present)             src/model-tier.mjs:26,59
      → requestTextWithImage({ prompt, images, model })   src/sdk-binding.mjs:478
          → _runClaude({ args, stdin, onMessage })        src/sdk-binding.mjs:395
              → spawn(CLAUDE_CLI, args, …)                src/sdk-binding.mjs:396
              → await new Promise(child.on("close"…))     src/sdk-binding.mjs:425  ← THE HANG
```

`_runClaude` (lines 395–433) is the shared spawn→stream→text core for **both** plain-text paths
(`requestText` line 460, `requestTextWithImage` line 478). Its terminal `await` (line 425) resolves **only**
on the child's `error` or `close` event. **There is no wall-clock bound.** If the `claude -p` child never
exits (the observed failure: node idle 0:25 CPU / 21 min elapsed, child blocked at 0:11 CPU, spawn count
frozen), this promise never settles and the whole climb hangs. The child was killed manually — twice.

There is a **second, structurally identical** spawn core: `invokeClaude` (lines 203–268), used by
`requestDesignArtifact` / `requestDesignArtifactWithImage`. Same unbounded `await new Promise(close)` at
line 235. The climb does not use it, but it is exposed to the same hang — relevant to the ticket's note that
"the guard is reusable infra: every metered runner that spawns `claude -p` is exposed to the same hang."

### What is NOT the cause
- Not the agent pick call (`requestText`, text-only, `claude-sonnet-4-6`, line 406) — that returned fine in
  prior runs (obs 19417: sonnet responds via requestText). The hang was on the **strong-tier** diagnose.
- Not the BAML render/parse (`bamlRender`/`bamlParse`, pure string shaping, no spawn).
- Not GL/render — those completed; the hang is strictly the model subprocess.
- Not code wiring — the ticket classifies it **infra, GUARD_ONLY-clean**. The runner is correct; it simply
  has no defense against a non-returning child.

## The vote loop that must absorb a timed-out vote

`scoreBuild` (picture-climb.mjs:349–370) renders four azimuths + the beside sheet, then takes `VOTES` (=3)
median diagnoses:

```js
for (let v = 0; v < VOTES; v++) {
  try { samples.push(await diagnose(renders)); }
  catch (e) { console.error(`… vote ${v+1} dropped (malformed, no re-ask): ${e.message}`); }   // line 363-364
}
if (!samples.length) throw new Error(`scoreBuild: all ${VOTES} diagnoses failed at round ${round}`);  // line 366
const med = samples.find(s => s.score === median(scores)) ?? samples[0];                               // line 368
```

Key facts:
- A `catch` **already exists** for a malformed vote (it drops + proceeds on survivors). But a *hang* never
  throws, so the catch never fires — the timeout guard is what converts the hang into a throwable error
  this loop can absorb.
- The drop is **console-only** — it is *not* recorded into the trajectory. The ticket requires timeouts be
  **recorded per round**, so the current console-drop is insufficient for a timeout.
- All-votes-fail throws a generic message (line 366) — it does **not** distinguish "all malformed" (model
  produced bad JSON) from "all timed out" (infra: auth/spend/hang). The ticket requires the all-timed-out
  case be **detected and named**, never scored 0. Today `main()` has no catch, so a throw here aborts the
  whole climb via the top-level `main().catch` (line 581) with `process.exit(1)` — a crash, not a recorded
  finding.

`diagnose()` itself (line 340) deliberately does **no re-ask** ("a zero-token notice only burns budget" —
the [[spend-limit-reply-failure-mode]] lesson). The guard must not reintroduce a re-ask on the timeout seam.

## Where the timeout value + typed error should live

- **Config:** `src/config.mjs` is pure data, single-sources every harness constant (`MODEL_TIERS`,
  `MULTI_ANGLE_GATE`, tiers). A `CLAUDE_SUBPROCESS_TIMEOUT_MS` default belongs here by precedent.
- **Climb defaults:** `CLIMB_DEFAULTS` (climb-gate.mjs:23) = `{margin:4, stallK:2, maxRounds:5, minRounds:3}`
  — the per-climb knobs. A per-vote timeout is a *transport* concern (sdk-binding), not a climb-policy one,
  so it is better single-sourced in config and threaded down, not added to CLIMB_DEFAULTS.

## Test conventions (the guard must be unit-tested, not live)

- Tests are **co-located** `*.test.mjs`, run by `npm run test:unit` → `node --test "src/**/*.test.mjs"`.
- `src/sdk-binding.test.mjs` covers **only the PURE surface** — it never imports the SDK, never spawns,
  never calls `requestText*` (header: "keeping the suite offline and free of metered API calls"). So the
  guard's test must exercise a **testable seam that does not spawn `claude`**: e.g. a helper that takes a
  fake child (an `EventEmitter` with a `.kill()`), a tiny `timeoutMs`, and asserts timeout→kill→typed error,
  and close-first→resolve→timer-cleared. The ticket says explicitly: "Unit/abstracted test … not a live hang."
- `src/model-tier.test.mjs` already **injects** the invoker (`runTieredOp({ invoke: spy })`) — the routing is
  unit-tested with a spy, no spawn. The same injection seam can carry a `timeoutMs` assertion (spy sees it).

## What the metered run already depends on (all present)

- **Hands wired** in `picture-climb.mjs` `TOOLS`/`MENU` (lines 316–329): `close_shell` (T-197), `carve_arch`
  (T-194), `relief_walls` (T-195), plus `apply_gable_roof`, `recolor_roof`, `construct_walls`,
  `add_timber_framing`, `frame_arch`, `articulate_walls`, `band_eave`.
- **Form-before-detail ordering** (T-197): `formReadyGate` (climb-gate.mjs:87), `FORM_READY_CLOSURE = 0.9`,
  `closeShell`/`eaveRingClosure` imported (picture-climb.mjs:29). The loop blocks a detail tool below 0.9
  with no spend (lines 488–501) and tells the agent the form is open (lines 379–382).
- **Wider eyes** (T-196): `framingReport` (picture-climb.mjs:35,357) computes orientation+scale flags GL-free,
  surfaced to the agent (lines 388–390) and recorded into trajectory (`framing`, `framingResidual`). Reported,
  never scored — no hand fixes it (→ E-49).
- **Output:** `trajectory.json` path is `CLIMB_OUT ?? docs/active/work/T-188-01/trajectory.json` (line 566).
  This run should set `CLIMB_OUT=docs/active/work/T-198-01/trajectory.json` and capture `climb.log`.
- **Guard:** `main()` asset+GL guard (lines 412–415); `GUARD_ONLY=1` renders round-0 + beside and exits
  before any spend (lines 439–443) — the zero-spend smoke for the wiring.

## Constraints / invariants to honor
- **Subscription only.** `model-tier.mjs` has a HARD invariant: the metered API key / `ANTHROPIC_API_KEY`
  never enters this path; a source-guard test pins it (model-tier.test.mjs). The guard must not import or
  read the API key, and must stay on the `claude -p` shim.
- **`measurements/` untouched** (frozen instrument). This ticket touches only `builds/` + the runner + the
  transport guard + work-dir artifacts.
- **One stage.** No new hands, no new eyes. Just: make the runner robust, then run it.
- **Anti-hedge:** a precisely-named failure (no autonomous sequencing / WALL won't clear / a 4th gap /
  guard masks a real auth failure) is a complete result and the input to E-49 — not a thing to paper over.
