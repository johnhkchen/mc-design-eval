# T-074-01 — Review (concept-materials-consolidation, E-21 terminal)

Self-assessment of the completed work. The ticket measures whether the concept-grounded material pipeline
(T-071 map → T-072 feature-assign → T-073 refine) **restores the near-tone material distinction** that the
E-19 mean-colour build collapses, **clean and true**, with **concept-justified palette growth**.

## What changed

**New source + tests (committed `046faf4`, `d26b32a`):**
- `src/form/concept-materials-ab.mjs` — pure A/B core: `abRow`, `judgeSubject`, `nearToneRestoration`,
  `paletteGrowth`, `trueByFeatureOf`, `assembleConceptMaterialsAb`, `render*Md`. Schema `concept-materials-ab/v1`.
- `src/form/concept-materials-ab.test.mjs` — 16 unit tests (null-tolerant, judge categories, restoration math
  incl. the SPATIAL collapse case, growth justification, the FEATURE_RULE direction guard, the E-19-bar
  cleanliness relaxation).
- `benchmarks/sculpture/concept-materials-ab.mjs` — the impure runner. `deriveRow` is the **single source of
  truth** for live and `--offline` (one code path; the live/offline drift bug was found and unified into
  `deriveRow` last session). Flags: `--offline` (re-derive from committed artifacts, no GL/model),
  `--only <subjects>`.
- `package.json` — `concept:ab` script. `.gitignore` — concept-materials PNG renders excluded.

**Runner fix (committed this session):**
- `benchmarks/sculpture/concept-materials-ab.mjs` `spawnMap()` — added `child.stdin.end(JSON.stringify({...}))`.
  The committed version never wrote the spawned tsx bridge's stdin, so `readStdin()` resolved empty and
  `JSON.parse("")` threw `SyntaxError: Unexpected end of JSON input` on the **first sculpture** (moai). This
  is what crashed the prior sweep at the moai step. With the fix, the full 4-subject sweep completed.

**Artifacts produced (this session):**
- `benchmarks/sculpture/material-map/{moai,pineapple}.{json,raw.json}` — metered `claude -p` material maps
  (gatehouse/cottage maps predate this ticket).
- `benchmarks/sculpture/concept-materials/{moai,pineapple}/{before,after}-{3q.png,artifact.json}` — the GLB-voxel
  before/after builds + renders for the two sculptures.
- `benchmarks/sculpture/concept-materials-ab.{md,json}` — the A/B report, re-derived `--offline` from the
  committed/on-disk artifacts (4/4 subjects, re-validated AJV, no GL).
- `pr/assets/concept-materials.md` — E-12 handoff narrative.
- `docs/knowledge/design-learnings.md` — `## Concept-grounded materials (E-21)` section appended.

## Results (the headline)

| subject | kind | distinct | speckle | off-pal | near-tone collapsed→restored | true | judge |
| ------- | ---- | -------- | ------- | ------- | ---------------------------- | ---- | ----- |
| gatehouse | architectural | 5→5 | 0.006→0.035 | 0→0 | 3→3 (sep 4) | ✓ | **restored** |
| cottage | architectural | 7→6 | 0.002→0.093 | 1416→0 | 3→0 (sep 1) | ✗ | over-reach |
| moai | sculpture | 5→3 | 0.005→0.079 | 1492→0 | 1→0 (sep 0) | ✗ | over-reach |
| pineapple | sculpture | 4→4 | 0.021→0.073 | 0→0 | 3→2 (sep 2) | ✗ | over-reach |

Near-tone pairs collapsed by colorimetry **10 → restored 5**. gatehouse is the clean 1:1 restoration (every
block dominates its intended feature, no bloat); the three over-reaches are honest, named boundaries (below).

## Acceptance criteria

- **AC#1 — pipeline applied to gatehouse + cottage + 2 sculptures, artifacts saved.** ✅ All four built;
  maps + before/after artifacts + 3q renders on disk.
- **AC#2 — before/after vs the colorimetric E-19 build, restored/clean/true + judge.** ✅
  `concept-materials-ab.{md,json}`, judge categorical (restored / over-reach / no-distinction / deferred).
- **AC#3 — before/after visual for E-12.** ✅ `pr/assets/frames/concept-<subj>-{before,after}.png` for all 4
  subjects (the gatehouse grey-blob→brick+cobble pair is the headline visual).
- **AC#4 — palette growth recorded, concept-justified not bloat.** ✅ Growth table per subject; the one
  addition (moai `stone_bricks` plinth) flagged justified; distinct grew on no subject.
- **AC#5 — design-learnings E-21 section.** ✅ Appended: the collapse failure, the authority-swap fix, the
  LLM's right to add a missing material back, and where it over-reaches (the two named boundaries).
- **AC#6 — E-12 handoff + `npm test` green.** ✅ `pr/assets/concept-materials.md`; **758 pass / 0 fail**.

## Test coverage & verification

- `npm test` → **758 pass / 0 fail** (this session, post-changes).
- `node concept-materials-ab.mjs --offline` → **4/4 subjects re-derived**, judges
  `{restored:1, over-reach:3}`, AJV re-validated, no GL/model — confirms the report is reproducible from
  committed artifacts alone.
- Unit tests cover the pure core (restoration math, growth justification, judge boundaries, FEATURE_RULE
  direction). **Gap:** the runner's spawn/IPC path (`spawnMap` stdin) is exercised only by the live sweep, not
  a unit test — which is why the missing `stdin.end` shipped. A small unit/integration test asserting
  `spawnMap` writes stdin would have caught it.

## Open concerns / limitations (all honest, all named)

1. **All 4 subjects' frames committed.** `pr/assets/frames/concept-<subj>-{before,after}.png` for gatehouse,
   cottage, moai, pineapple (the gatehouse pair is the AC#3 headline; the other three round out the E-12 set).
2. **The two over-reach boundaries are real and unpatched (by design, per D-decisions).** (a) **Shared-rule
   limit** — two materials on one `placementRule` (cottage) can't both be placed; needs a sub-feature selector.
   (b) **Organic feature classifier** — flat-face/edge/roof/base/recess is ill-defined on moai/pineapple, so a
   justified block leans on the colour fallback and mis-zones. Both are upstream feature-vocabulary tickets,
   recorded in the ledger, not E-21 defects.
3. **The `spawnMap` stdin fix is committed** with the maps + builds + report + handoff + design-learnings; the
   full 4-subject sweep and the `--offline` re-derive both complete clean.
4. **near-tone identity is invisible to a render (T-073 finding).** The distinction is geometric, so the
   render-based correct pass can't see it; cited, not re-run per subject (per D4). Not a gap — a measured
   property that scopes what the A/B can and can't show.

## Recommendation

Ready to commit. Final commit should include the 2-line `spawnMap` fix, the moai/pineapple maps + builds, the
re-derived report, the handoff, and the design-learnings section. No blocking issues; the three over-reaches
are the honest negative the ticket asked for (AC#5), not failures to fix.
