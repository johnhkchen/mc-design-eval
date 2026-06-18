# T-193-01 — RESEARCH: run-completion-climb-and-m1-glance-proof

Epic E-50 / Story S-193 — the **M1 capstone**. This is a *run-and-prove* ticket: the code is built
(T-191-01 override + T-192-01 hands); the deliverable is the **completion climb run** + the **human-glance
proof** vs the concept, recorded honestly. Descriptive map of what exists and what running it entails.

## 1. The runner — `experiments/eval-alignment/picture-climb.mjs`

The picture-driven climb (T-188/E-48), already wired with everything S-193 needs. Structure:

- **Seed:** `benchmarks/sculpture/generated/gatehouse/artifact.json` (the box that climbs).
- **Concept (the judge's reference):** `…/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png` — dark peaked gable + arched gate + pale stone walls.
- **Program / pack / material-map:** `gatehouse.program.json`, `packs/rustic.json`, `material-map/gatehouse.json`. `ridgeAxis` is **recognition-declared** (=x, gable faces the −x gate) — the T-192 orientation fix; the critique is blind to rotation so this is a deterministic recognition correction, not a climbed one.
- **Gradient:** `diagnose()` → BAML `DiagnoseBuild`, concept-anchored, 4 azimuths, `TIER="strong"`, `VOTES=3` median. Score = `styleFidelityScore` (0–100, higher=closer). **Metered.**
- **Accept-gate:** `acceptsRound` with the **department-dominant override** (T-191): keep a tool that cleared a major in a department it targets, added no new major there, and grew no targeted dept's total burden — even on a whole-build scalar regression. Net-item guard (c) rejects "cleared a major, added minors in own target". Backstopped by the no-op digest guard (T-190).
- **Stopping:** `stoppingDecision` — `agent-done`, `stall` (`stallK=2` no-accepts), or `maxRounds=5` (`minRounds=3`). `CLIMB_DEFAULTS = {margin:4, stallK:2, maxRounds:5, minRounds:3}`.
- **Agent:** `agentPick` via `requestText` (`claude -p` shim, `AGENT_MODEL="claude-sonnet-4-6"`) picks one tool from the 8-item MENU given the top-5 items + KEPT/ROLLED-BACK history.

### The seven HANDS (the levers)
`apply_gable_roof` (ROOF form), `recolor_roof` (ROOF colour, concept-true grey — T-189), `construct_walls`
(WALL envelope+skin), `add_timber_framing` (WALL upper-storey relief), and the **S-192 three**:
`frame_arch` (OPENING — frames both ±x passages; the gatehouse passage is a **1-wide slot**, so it FRAMES
and RECORDS that a true wide arch needs a widen=rebuild→E-49), `articulate_walls` (WALL — recolors the dark
field `polished_basalt`→pale `stone_bricks`, keeps cobblestone quoins), `band_eave` (ROOF MINOR — lighter
eave/verge band; minor-only so the major-gated override can't protect it).

`TOOL_DEPARTMENTS`: frame_arch→OPENING, articulate_walls→WALL, band_eave→ROOF (CG17 proves the override
generalizes to OPENING).

## 2. What "completion run" means here

`node experiments/eval-alignment/picture-climb.mjs` with `CLIMB_OUT` pointed at this work dir. The loop runs
round 0 (seed score + first pick) then up to `maxRounds=5` apply→score→gate rounds, writing:
- `builds/gatehouse/picture-climb/round-{n}/` — 4 azimuth views + `beside-concept.png` per round.
- the trajectory JSON at `CLIMB_OUT` (schema `picture-climb/v1`): per-round score, evidence, items, pick,
  gate decision, dept major/item counts, `inventory` (acted-on vs eyes-only) + `verdict`.

The terminal trajectory entry carries the **final kept build's** score so `classifyInventory` reads the
kept build. Beside renders are the **glance** deliverable; the first / best / final are the AC artifacts.

## 3. Prior runs — what the completion run is expected to resemble

- **T-190** (pre-override): roof cleared then **rolled back**, climb stalled — the box stayed a box.
- **T-191** (override live, S-192 hands NOT yet wired): trend `0→0→0→0→32`, `agent-done`, climbed=true,
  oscillated=false, actionableFrac=1.0. `apply_gable_roof` KEPT (tie), `recolor_roof` **KEPT via override**
  (ROOF cleared a major on a tie-at-0), `construct_walls` +32. Agent then chose **done** — *the remaining
  gap was the arched OPENING, and no tool framed an arch.* That is exactly the gap S-192 built `frame_arch`,
  `articulate_walls`, `band_eave` to fill. **S-193 is the first run with those three hands in the MENU.**
- **T-192** free-GL glance (no metered run): applying the three hands to the T-191 plateau visibly moves the
  build closer — wall field dark→pale, quoins contrast, both passages framed, eave banded.

## 4. The vote-noise constraint (the known instrument hazard)

`styleFidelityScore` swings 0–76 on the *same* build across VOTES draws (T-187). T-191's run floored the
scalar at 0 for rounds 0–2 where T-190 saw 60. **Consequence for S-193:** the literal scalar trend is
illegible run-to-run; the AC deliberately makes the **human glance the judge, not the scalar** ("the
picture-critique is the steering proxy; the glance is the judge"). The override reads dept major/minor
counts, not the noisy scalar, so it is robust — but the agent's picks and the reported numbers will be noisy.
This must be reported, not smoothed.

## 5. The falsification surface (from the ticket)

The claim: the run lands the gatehouse **recognizably at its concept** on the glance, mostly autonomous.
Fails if: (a) it **plateaus short** — a hand not built / a rebuild the loop can't reach → name for E-49;
(b) the gate **keeps a glance-rejected change** → S-191 override leaked; (c) it needs **heavy per-round human
steering** → not autonomous, report how much. The known residual already named: the **wide arched gate** is a
widen=air-op the facade charter forbids (frame_arch frames the 1-wide slot but cannot arch it) → E-49; and
**scale/proportion** (build reads larger than concept) → E-49/E-33.

## 6. Constraints / boundaries

- **Frozen instrument untouched.** S-193 changes no source; the runner already carries every lever. The only
  expected edit is `CLIMB_OUT`-driven output location (an env var, no code change) — and possibly the round
  output dir is fixed at `builds/gatehouse/picture-climb/`. No measurements/ writes.
- **Metered + non-deterministic.** Run once to completion; report the actual trajectory. A re-run would draw
  different votes (anti-hedge: run the attack, report what happened — do not re-roll for a prettier number).
- **GL confirmed available** (`GUARD_ONLY=1` clean this session; round-0 + beside written, zero spend).
- **`npm test` must stay green** and no frozen file may change — trivially satisfied since no source edits.
- **Autonomy honesty:** the run is unattended by design (the agent picks); "human intervention" = anything I
  do to keep it going (restarts, manual picks). Target: zero. Report the true count.
