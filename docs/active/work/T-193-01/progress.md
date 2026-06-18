# T-193-01 — PROGRESS

## Status: completion climb RUN (metered, autonomous), glance judged, recorded. No source changes.

## What ran
- **Step 0 (pre-flight):** `GUARD_ONLY=1` → GL available, round-0 + beside written, exited clean, zero spend. ✔
- **Step 1 (the completion climb, metered, unsteered):**
  `CLIMB_OUT=docs/active/work/T-193-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`
  ran to its own stop (`stalled (2 rolled back)`). **Zero human interventions** — the agent picked every tool;
  no restart, no manual pick. Wrote `trajectory.json`, `run.log`, and `round-{0..4}/` renders.
- **Step 2–4 (read + glance + accounting):** trajectory parsed; concept + first/best/final besides read by eye;
  first/best/final copied into the work dir.
- **Step 5 (gate):** `npm test` → **2335 pass / 0 fail**; no source/test/measurements/pack/schema changed.

## The trajectory (the actual run, reported as-is)

| round | tool | dept-target | score | gate | dept signal |
|---|---|---|---|---|---|
| 0 | (seed) | — | 0 (8/0/0) | — | majors ROOF1 WALL2 OPENING2 ROOM1 |
| 1 | `apply_gable_roof` | ROOF | 0→**52** (52/52/0) | **KEPT** (+52) | whole-build majors → ROOF1 only |
| 2 | `recolor_roof` | ROOF | 52→44 (52/44/20) | **KEPT — department-dominant override** | ROOF maj 1→0 (cleared); judge promoted untargeted WALL maj |
| 3 | `articulate_walls` | WALL | 44→24 (24/32/24) | **ROLLED BACK** (regressed −20) | WALL maj 1→1 (NOT cleared) + added OPENING maj → override correctly did NOT fire |
| 4 | `construct_walls` | WALL,OPENING | 44→32 (0/32/32) | **ROLLED BACK** (regressed −12) | WALL maj 1→1 + added OPENING maj → no clear |

Trend **0→0→52→44→44→44**, Δ **+44**, stop `stalled (2 rolled back)`.
Verdict (instrument): climbed=true, oscillated=false, actionableFrac=0.5, scoreFirst 0 → scoreLast 44.
acted-on: ROOF. eyes-only (named, no working lever this run): WALL, OPENING, ROOM.
Vote spread: min 20 / max 52 (the T-187 0–76 swing, live again — e.g. round 4 votes `0/32/32`).

**Final kept build = round 2 = dark-grey gabled roof on the seed's dark walls** (rounds 3 & 4 rolled back, so
the walls never changed). frame_arch / band_eave were never applied — the stall fired before the agent's
round-5 `frame_arch` pick could run.

## The glance verdict (the JUDGE — beside the concept, by eye)

Concept: compact stone gatehouse, **dark charcoal peaked gable**, **pale grey stone walls**, prominent
**arched gate**, small/cozy proportions.

| E-48 divergence | glance vs concept | in final kept build? |
|---|---|---|
| **Roof FORM** | **GONE** — clean peaked overhanging gable | ✔ (apply_gable_roof, KEPT) |
| **Roof COLOUR** | **GONE** — dark charcoal-grey matches the concept | ✔ (recolor_roof, KEPT via override) |
| **Wall field / quoin contrast** | **RESIDUAL** — walls stayed dark; the pale-stone recolor was modest, not the concept's clearly-pale stone, and was rolled back | ✘ (articulate_walls rolled back) |
| **Eave/verge banding** | **RESIDUAL** — never picked (stall) | ✘ |
| **Arched gate** | **RESIDUAL (the big one)** — no arch anywhere; front face reads blank/void; frame_arch never applied AND would only frame the 1-wide slot (widen=rebuild) | ✘ → E-49 |
| **Scale / proportion** | **RESIDUAL** — build reads larger/squatter/blockier than the compact concept | ✘ → E-49 / E-33 |

**Outcome label (honest, AC-4): CLIMBED substantially, then PLATEAUED on WALL/OPENING.** The ROOF reached its
picture — form **and** colour — fully autonomously. Walls, arch, eave, and scale are the residual ceiling.

## Deviations from plan
1. **The agent's round-5 `frame_arch` pick never executed** — the `stallK=2` stop fired after rounds 3+4 both
   rolled back, so the loop terminated with `frame_arch` as the *next* pick (logged) but unapplied. So the two
   most-relevant S-192 hands (frame_arch, band_eave) got **no live trial this run**; only `articulate_walls`
   did (and regressed). Recorded as the central finding, not smoothed.
2. **No re-roll.** The scalar floored at 0 on some votes again (round 4 `0/32/32`); per the anti-hedge
   directive and the plan, the run stands as-is. One run, reported.

## Open for review (→ review.md)
- The override **vindicated on the glance**: it kept the grey roof on a LIVE −8 regression (52→44), and the
  glance confirms the grey roof is concept-correct — the regression-path keep T-191 only had as a unit test.
- The WALL lever (`articulate_walls`) **regressed on the critique and the glance barely moved** — the pale
  recolor is too subtle and the critique added an OPENING major (attention-shift). A CRITIQUE-COVERAGE / lever-
  efficacy finding for E-49/E-50, not a gate leak.
- The arched gate + scale are the named E-49 residual.
