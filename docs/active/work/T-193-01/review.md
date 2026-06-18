# T-193-01 — REVIEW: the M1 capstone, run and judged on the glance

**Verdict against the falsifiable claim:** the completion climb **climbed substantially and reached its
picture on the ROOF** (form + colour) **fully autonomously**, then **plateaued on the WALL and OPENING** —
the gatehouse is *recognizably a gabled stone gatehouse* but not yet *its* gatehouse (no pale walls, no arched
gate, larger/squatter than the compact concept). This is the ticket's **"plateau short"** outcome, named for
E-49 — not a gate-kept-bad-change (the override was vindicated) and not a steering failure (zero human
intervention).

## Files changed
- **Source / tests / measurements / packs / schemas: NONE.** S-193 is a run-and-prove ticket; the runner
  (`experiments/eval-alignment/picture-climb.mjs`) already carried the T-191 override and all seven hands.
  `git status` confirms no `.mjs`/schema/measurements change. The frozen instrument is untouched.
- **Work-dir artifacts created** (`docs/active/work/T-193-01/`): `research.md`, `design.md`, `structure.md`,
  `plan.md`, `progress.md`, this `review.md`; `trajectory.json` (schema `picture-climb/v1`), `run.log`;
  `first-beside.png` (round-0 seed), `best-beside.png` (round-1, score 52), `final-beside.png` (round-2, the
  kept grey-roof build).

## What the run produced (evidence)
Trend **0→0→52→44→44→44**, Δ **+44**, stop `stalled (2 rolled back)`. KEPT: `apply_gable_roof` (+52),
`recolor_roof` (−8, kept via override). ROLLED BACK: `articulate_walls` (−20), `construct_walls` (−12).
**Final kept build = dark-grey gabled roof on the dark seed walls.** Full per-round table in `progress.md`.

## The three AC questions, answered

### AC-1 — completion climb run; first/best/final beside renders in the work dir. ✔
Ran to its own stall; trajectory + per-round besides written; first/best/final copied into the work dir.

### AC-2 — human-glance check; the E-48 divergences confirmed gone or residual named. ✔
Judged by eye against the concept (the glance is the judge, the critique only the steering proxy):
- **Roof form — GONE.** Clean peaked, overhanging gable.
- **Roof colour — GONE.** Dark charcoal-grey (deepslate_tiles) matches the concept's dark roof. *This is the
  headline E-48 win, and it stuck.*
- **Wall field / quoin contrast — RESIDUAL.** The pale recolor was modest (medium grey, not the concept's
  clearly-pale stone), the critique scored it down −20, it rolled back. Walls stayed dark in the final build.
- **Eave banding — RESIDUAL.** `band_eave` never picked (stall).
- **Arched gate — RESIDUAL (the dominant remaining gap).** No arch in any render; `frame_arch` never applied
  (it was the round-5 pick the stall pre-empted) and even applied would only *frame* the 1-wide slot — the
  true wide arch needs the opening *widened*, an air-op the facade charter forbids → a rebuild for **E-49**.
- **Scale / proportion — RESIDUAL.** The build reads larger and squatter than the compact concept → **E-49 / E-33**.

### AC-3 — how much human intervention + the residual ceiling. ✔
- **Human intervention: ZERO.** Unattended; the agent picked every tool and stopped itself. On the M1→M4
  autonomy honesty scale this is the fully-autonomous end for *this subject* — the qualifier matters (E-49 is
  exactly the generalization question).
- **Residual ceiling → E-49:** (1) the **wide arched gate** (widen=rebuild the loop can't reach);
  (2) **scale/proportion** (build larger/squatter than concept); (3) a **working WALL lever** — `articulate_walls`
  exists but neither the critique nor the glance clearly rewarded the modest recolor (see open concern #1);
  (4) **frame_arch / band_eave got no live trial** — the stall pre-empted them.

### AC-4 — recorded honestly at full strength. ✔
**Plateau short**, named. Not "reached its picture" (walls/arch/scale unmet); not "gate kept a bad change";
not "heavy steering." Reported as-is, no re-roll despite the live vote-noise (round-4 votes `0/32/32`).

## Two findings worth the reviewer's attention

1. **The S-191 override was VINDICATED on a LIVE regression.** Round 2: `recolor_roof` cleared the ROOF major
   but the whole-build scalar *fell* 52→44 (the judge promoted an untargeted WALL major — attention-shift).
   The override kept it; the glance confirms the dark-grey roof is concept-correct. T-191 only had this as a
   unit test (CG14) because that run floored at a tie-0; **this run is the live regression-path keep.** The
   override read the department signal, not the noisy scalar — exactly its design intent.

2. **The WALL lever did not climb — a CRITIQUE-COVERAGE / lever-efficacy gap, not a gate leak.** Both wall
   tools rolled back. `articulate_walls` did *not* clear the WALL major (`WALL 1→1`) and *added* an OPENING
   major, so the override correctly did **not** fire — the gate behaved as specified. But on the glance the
   pale recolor barely moved the needle (the stone_bricks read medium-grey, not the concept's pale stone), so
   the rollback is also glance-defensible. The honest read: the lever is too weak (recolor ≠ the concept's
   wall *relief/material*), and the critique's attention-shift (adding an OPENING major when walls change)
   starves the WALL department of a clean clear. This is an **E-49/E-50 input** (CRITIQUE COVERAGE + a real
   wall-relief hand), distinct from the S-191 "keeps a bad change" failure mode — which did **not** occur.

## Test coverage / gates
- `npm test`: **2335 pass / 0 fail.** No source/test/measurements/pack/schema changed (run-only ticket).
- The climb itself is GL+LLM, non-deterministic, **not** in `npm test` by design; its evidence is
  `trajectory.json` + the beside renders. The deterministic keep/reject proofs remain CG14–CG17 (T-191/192).

## Open concerns / handoff
1. **frame_arch + band_eave got no live trial** (stall pre-empted the round-5 frame_arch pick). A re-run with
   `maxRounds`↑ or a luckier vote draw would exercise them; not required — the wall plateau is the real
   ceiling, and the arch residual is independently known (1-wide slot → E-49).
2. **The vote-noise scalar is still illegible** (0–52 same-build swing this run). It is the standing co-lever
   (T-191 open #2), out of S-193 scope; the glance carried the verdict as designed.
3. **The WALL relief gap** is the most actionable E-49 lever: the concept wants pale *dressed* stone with
   quoin/clinker *relief*, not a flat recolor. `articulate_walls` recolors; it does not build relief.
4. **`builds/gatehouse/picture-climb/` is volatile scratch** (round-0..4 this run, plus a stale `roof-material`
   probe dir). The stable AC artifacts are the three `*-beside.png` copied into the work dir.

## M1 capstone, stated plainly (calibrated honesty)
The loop, under its own steam, took a featureless box to a **recognizable dark-roofed gabled stone
gatehouse** — and the accept-gate *held the glance-correct grey roof through a scalar regression*, the exact
thing T-190 could not do. That is a real M1 result on the roof. It is **not** the full picture: the walls are
still dark, there is no arched gate, and it reads bigger than the concept. M1 is *reached on the roof,
plateaued on the walls/opening/scale* — and that plateau is precisely the input E-49 (generalize the climb)
and the E-50 CRITIQUE-COVERAGE thread were scoped to take on.
