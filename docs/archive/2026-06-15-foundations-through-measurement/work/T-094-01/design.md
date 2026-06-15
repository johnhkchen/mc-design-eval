# T-094-01 — subject-roster-refresh — Design

Phase artifact 2/6. Options, tradeoffs, decisions with rationale. Grounded in research.md.

## D1 — How to generate the church concept

The AC requires "the existing `vConcept` path". Three candidates:

**(a) Full `npm run bench:building -- --subject "..."`** (stages 1+2+3, like gatehouse 015).
Rejected. Stage 3 is a metered claude build + GL render the AC does not ask for, and the
challenge subject must arrive with *no build* (Rule 3 — the pipeline later runs it untuned;
shipping a text→JSON build now adds an artifact nothing should consume and makes every
checklist-failure regeneration expensive).

**(b) Concept-only provisioning runner reusing the existing stages 1+2.** CHOSEN. A small
one-off script (strong precedent: `building-concept.mjs`, the cottage de-risk helper) that:
stage 1 — `composeBuildingDesignDocPrompt({subject, scale:48})` → the same metered `claude -p`
shim run.mjs uses; stage 2 — the same `baml-concept.mts` job with `variant:"building"`
(BAML `BuildingConceptPrompt` → Nano Banana **pro**), writing into a real
`runs/016-vBuilding-<slug>/` dir named by `runIdForBuilding(nextSeq(), subject)`. This *is*
the existing vConcept concept path — same pure builders, same BAML prompt, same image model,
same run-dir convention — minus the build stage. Cheap to re-run on checklist failure.

**(c) Edit `building-concept.mjs`'s inline prompt.** Rejected: bypasses the design-doc stage
and the locked BAML prompt — not "the existing vConcept path", and the cottage helper is
documented as a pre-formalization one-off; the formal mode exists now.

Subject string: **"a village church with a square bell tower"** (the AC's words). The
design-doc model may volunteer a cross/finial (thin member); the checklist (D3) gates it and
the BAML job's `attached` field is the documented lever for a steering note on regeneration
("bulky throughout; no thin freestanding spire or cross") — used only if attempt 1 fails on
thinness. Scale: 48 (`BUILDING_DEFAULT_SCALE`, the gatehouse smoke-check precedent).

## D2 — Where the church registry entry lives

The AC: "concept path, GLB path, scale — paths/config only, zero pipeline-code changes".
Candidates from research §7:

**(a) `resemblance.mjs SUBJECTS` proper.** Rejected for now: entries need
`artifact`/`committedRender`; church has neither (no build exists, deliberately). Nulls crash
`resolveSubject`/the consolidation default loop; future-dated paths crash live runs at
ENOENT mid-sweep. Making the loop skip partial entries is a pipeline-code change — forbidden.

**(b) `durable-skin.mjs` / `material-map.mjs` rosters.** Rejected: both are iterated by live
runners (`zone:map --subject all`, `material-map` main loops ALL entries) — a church entry
changes existing-runner behavior today, i.e. the pipeline would half-run church *now*,
violating both "zero pipeline-code changes" and "later, untuned".

**(c) A new data-only export in `resemblance.mjs` + the `glb/README.md` manifest row.**
CHOSEN. `export const CHALLENGE_SUBJECTS = { church: { key, concept, glb, scale } }` sits
directly under `SUBJECTS` in the file the AC names, with a comment block stating the
contract: registered 2026-06-10, concept immutable (Rule 2), no build/map/skin exists, the
pipeline must consume this entry untuned (a future ticket adds church to the runner rosters
as pure data, pointing at these same paths). Nothing imports it yet — by design: a registry
entry is a *record*, and the AC's requested shape (concept, glb, **scale**) matches no
existing roster (none records scale), confirming it's a new section, not a forced fit.
The README row carries provenance + smoke-check numbers (the durable record for gitignored
GLBs, per the established pattern).

## D3 — The concept sanity checklist

A markdown file beside the image: `runs/016-…/concept-checklist.md`. Items = the AC's six
(single building · clean background · one canonical 3/4 view · ≥3 distinct material zones ·
readable silhouette · no environmental clutter) **plus** the ticket-specific "bulky
throughout — no thin freestanding spire/cross" (it gates TRELLIS viability, so it must be
checked at the same moment). Each item: pass/fail + one-line evidence from visual inspection
of the PNG (this session reads the image). Failed attempts are kept as
`concept-attempt-N.png` with their failing rows — regeneration happens *before registration*
(Rule 2), and keeping the failures is the honest record (moai's lesson is exactly that a bad
concept silently registered poisons everything downstream). The checklist file also gets a
sign-off section filled after the GLB smoke-check (D5), since the AC ties sign-off to it.

## D4 — Moai retirement mechanics

In `resemblance.mjs`: move the `moai` entry into a clearly-labeled comment block
(`RETIRED SUBJECTS`) directly below the live `SUBJECTS` object, with the ticket's rationale
verbatim (three statues in one frame / black background → TRELLIS fragmented into two masses
→ "different object" verdicts driven by debris, saying nothing about design capability — a
weird concept makes every downstream verdict ambiguous; retired 2026-06-10, T-094-01).
Update the live-roster header comment (it names moai as a form-type pole) and the stale
header comment in `resemblance-consolidation.mjs` (line 3). No other rosters contain moai
(research §2.2). Scale-study history, run dirs, `e19-build/moai/*`, `glb/moai.glb`, and the
README manifest row stay untouched (the manifest row is provenance, not roster membership —
a parenthetical "(retired as a measurement subject, T-094-01)" keeps it honest without
rewriting history). Tests: none import the roster; `npm test` guards regressions only.

## D5 — Voxelization smoke-check

A small committed runner, `benchmarks/sculpture/glb-smoke.mjs`:
`node benchmarks/sculpture/glb-smoke.mjs glb/church.glb --scale 48` → loads the GLB,
`voxelizeGlb` at the working scale, reports `dims/count`, `strayVoxelStats` at 26-conn and
6-conn, and exits non-zero unless the 26-conn check passes a single-bulky-mass rule.
Pass rule: `components(26) === 1` — with `largestFraction` printed so a near-miss is visible;
6-conn is reported but NOT gated (gatehouse precedent: 6-conn surface fragmentation 0.83 is a
thin-shell artifact, explicitly not a form defect). Committing the runner (vs a throwaway
`node -e`) makes the next subject's provisioning reproducible and gives the README numbers a
checkable source. It is provisioning/diagnostic tooling — it changes no pipeline behavior.
Alternative rejected: extending `trellis-glb.mjs` with a `--smoke` flag — that file is the
frozen E-09 Modal contract; keep the lens separate.

## D6 — Execution order & failure handling

1. Moai retirement (independent, commit 1).
2. Provisioning runner + church concept generation (live: claude shim + Gemini via `.env`,
   never printed). Checklist judged on the PNG; regenerate on failure (≤3 attempts before
   stopping to reassess; record every attempt). Commit 2 (runner + concept + checklist).
3. TRELLIS GLB (unsandboxed network, `.env` sourced; cold start minutes; thin-subject 500 is
   the known risk — mitigated by the checklist's bulkiness gate *before* spending the call).
   Smoke-check via `glb-smoke.mjs`; on fragmentation: this is a checklist-grade failure →
   regenerate concept (the concept is not yet registered) and repeat. GLB stays gitignored.
   Commit 3 (smoke runner + README manifest row + checklist sign-off).
4. Registry entry (`CHALLENGE_SUBJECTS`) + journal note in `design-learnings.md` (why moai
   retired · the checklist · church registration). Registration is LAST — after it, the
   concept is immutable. Commit 4. `npm test` before each commit that touches `src/`-adjacent
   code (the suite never pulls GL/model — fast).

## Risks accepted

- Nano Banana pro may produce a white background (gatehouse precedent); TRELLIS's rembg coped
  before. The checklist's "clean background" accepts solid-black ideally, solid-uniform as
  the documented fallback; if segmentation then fails, regenerate black-bg per README advice.
- TRELLIS endpoint availability/cold start — out of our control; retry once before reporting.
- The metered claude design-doc call is small (one text completion) on the subscription shim.
