# T-116-01 fourth-subject-milestone — Research

## The ticket and its guard

E-29 terminal (S-116). A fourth building subject — never seen by any pipeline code — goes through
generate-first end-to-end on its first run, judged by the frozen gates. The ticket carries a guard:
targets were bracketed "PINNED AFTER T-111-01" and the brackets are still in the ticket file.
**T-111-01 is `phase: done` with its record committed** (work/T-111-01/review.md, six commits on
main), so the pin *source* exists even though the planner never copied it into the brackets. This
research records the pin material verbatim; Design pins the numbers. (Deviation from the literal
"stop and request the pin" — the authoritative record the pin was waiting on is in the repo.)

## Pin material: the T-111 repair-path baseline (committed)

Per `work/T-111-01/review.md` + committed `multi-angle/*.json`:

| subject | repair (T-111, styled label) | post-T-113 styled | generate-first (T-115) |
|---|---|---|---|
| cottage | FAIL 10/2; 135°+225° **same object**; kit PASS; instrument `diffs: []` | FAIL 10 gaps, kit PASS | FAIL 12/2 (1 same-object @135°), kit PASS, zero-blob PASS (5,069) |
| gatehouse | FAIL 12/2; 4/4 drifted; kit PASS | FAIL 12, 4/4 drifted, kit PASS | FAIL 12/2, kit PASS, zero-blob PASS (4,732) |
| church | refused @ settle pre-gate (13/168) | **FAIL 12/2, 4/4 drifted, kit PASS, settles in 1 iter** (T-113) | FAIL 12/2, kit PASS, zero-blob PASS (7,859) |

"The cottage's latest run" = T-111 cottage profile: **FAIL 10 gaps / budget 2, 2 of 4 azimuths
same-object, kit presence PASS**. Craft censuses (E-27 baseline → T-111 → T-115 generated):
cottage 51→86→53 spikes, gatehouse 25→43→26, church 202→204→62; ragged church 14.0→15.9→9.9%.

## Pin material: the T-111 residual list (committed, with post-T-112…115 status)

1. **Gatehouse 4/4-drifted regression** — per-mass membership vs the judge's per-column perception;
   roof-form major on every azimuth. T-112 named the mechanism, nothing closed it; both paths sit at
   12/2. **OPEN** — roof-form fitting coverage is "THE seam" named by T-115's records.
2. **Spike-census meaning shift** — declared sheet/cap cells read as spikes in the naive ≥4/6 census;
   numbers beside E-27 baselines are not like-for-like without a declared-cell ledger. T-115's
   generated runner censuses "beside declared cells"; legacy records still lack a formal ledger.
   **OPEN** (records/journal-level; instrument frozen).
3. **Church verdicts** — (a) styled chain settle refusal: **CLOSED by T-113** (vocabulary authority;
   settles in 1 iteration, frame 1/foreign 0; kit presence PASS 536/0); (b) challenge-label 225°
   REFUSAL `unparsed:-x-z`: **CLOSED by T-114** (re-judged under the bounded reply policy → decided
   FAIL, "different object", 3 majors; aggregate 11 gaps).
4. **`reskin:<subj>` distillation records not re-cut** after the fresh chains — `component-skin/
   <subj>.json` pins reference pre-T-111 milestone shas; T-111 called the re-cut "cheap, named, and
   deliberately left out". Styled chains have since been re-run again (T-113). **OPEN, actionable**
   via `npm run reskin:{cottage,gatehouse,church}` (component-skin.mjs, registry-driven).

## How a subject is registered (all data, zero pipeline code)

`benchmarks/sculpture/durable-skin.mjs:96–215` SUBJECTS is the registry (E-25 Rule 3: subjects are
DATA). Fields and consumers (cottage entry is the template, lines 97–131):
- `key`, `concept` (immutable PNG path), `glb` (gitignored binary), `map` (material-map/<s>.json),
  `build` (input artifact for skin-only runs), `zoneMapRecord`/`valueSelectRecord`/`kitRecord`
  (nullable committed records), `policy` (NAMED-space fallback zone policy), `legacy` (E-23
  counterfactual palette), `plasterInvariant` (nullable), `frontDir`/`sideDir` (`"+z"`/`"+x"` on all
  three), `generated: {scale}` (T-115; 32/32/48), `provision: {scale}` (challenge subjects only;
  church 48), `regularizedShell` (challenge resume pin, added by the chain).
- Two sibling DATA lists duplicate paths per E-25 Rule 3: `kit-extract.mjs:40` and
  `material-map.mjs:40` keep their own SUBJECTS arrays (key, concept/runDir, map, zoneMapRecord).
- `package.json` scripts are per-subject: `challenge:*`, `styled:*`, `reconstructed:*`,
  `generated:*` — all `--subject <key>` lookups; a new subject adds script lines only.
- Generalization self-grep (`generated-milestone.mjs:385–389`): no SUBJECTS *key* may appear as a
  substring in the runner source — key naming must avoid words used in comments.

## The generate-first chain's actual input needs (generated-milestone.mjs)

- `--subject` registry lookup (line 426). **kit record is MANDATORY** (lines 475–478, kit/v1).
- Evidence = `voxelizeGlb(def.glb, {scale: def.generated.scale})` + in-memory `shellStage`
  conditioning (imported from challenge-milestone) — no committed base needed for evidence.
- Generation bands: reads `def.zoneMapRecord` **if present** (lines 141–149); "Absent record →
  policy fallback, named" (`bandSource.used=false`). `sheetBlock` from the zone record's roof
  dominant, else null.
- Skin: `buildSkin({...def, build: paths.baseRel, zoneMapRecord: null, componentPlan: plan})`
  (line 269) — the generated base replaces `def.build`; bands re-derived on this geometry.
- Then SHARED `styledStretch` → frozen gate (label `generated`, `--reference` = generated base) →
  cage evidence → instrument-diff → head-to-head rows → record; double-run byte-equality in-process;
  `--repro` fresh-process sha match; `--offline` re-assert.

## The new-subject bootstrap (church precedent, T-094→T-110→T-115) and its one cycle

1. **Concept**: `provision-concept.mjs --subject "<phrase>"` (design-doc via `claude -p`, image via
   Nano Banana/Gemini; GEMINI_API_KEY present in `.env`). Writes `runs/NNN-vBuilding-<slug>/
   {concept.png, design-doc.md}`; next seq is **017**. NOT auto-registered: judge against the S-094
   checklist (docs/active/stories/S-094.md:28–31 — single building · clean background · one
   canonical 3/4 view · ≥3 material zones · readable silhouette · bulky throughout), record
   `concept-checklist.md` beside it (church precedent includes the glb-smoke single-mass sign-off);
   regenerate with `--run-dir` + `--attached` on failure (attempts preserved). Registered ⇒ immutable.
2. **GLB**: `trellis-glb.mjs <concept.png> glb/<key>.glb` (MODAL_ENDPOINT_URL in `.env`,
   unsandboxed; seed 42 pinned in the script). Smoke: `glb-smoke.mjs glb/<key>.glb --scale N`
   (26-conn single-component check). Thin-subject failure mode known (sword ×4) — checklist's
   "bulky" criterion exists for this.
3. **Material map**: `material-map.mjs --subject <key>` (BAML MaterialMap over concept +
   design-doc.md from the run dir; writes `material-map/<key>.{json,raw.json}`; committed maps are
   PINS). Registry `policy`/`legacy` are transcribed from this map (church precedent).
4. **The cycle**: generated runner *requires* kit; `kit-extract` *requires* a concept-derived
   zone-map record (`bandRefsFromZoneRecord` throws otherwise, src/form/kit.mjs:117–123);
   `zone:map` runs `buildSkin` which reads **`def.build`** (durable-skin.mjs:304) — and a fresh
   subject has no build. The church broke this with the **challenge provision**: challenge-milestone
   writes `challenge/<key>/base-artifact.json` (line 345) from `def.provision.scale` voxelization +
   map assignment, with stage-resume (line 423) — the base persists even if later stages refuse
   (church T-111 precedent). There is no provision-only flag; a full `challenge:<key>` run includes
   shell/cage/reconstruct/skin/settle and spawns the multi-angle gate (line 328, label challenge).
5. Then `zone:map -- --subject <key> --no-render` (GL-free records mode) → `kit:extract
   --subject=<key>` (live STRONG-tier multimodal; commits kit/<key>.{json,raw.json}) → registry
   `zoneMapRecord`/`kitRecord` flip from null → `generated:<key>`.

## The subject-choice question (L-plan inn vs tithe barn)

The candidate inn's two test features are the **L-valley roof junction** and the **jettied upper
storey**. What the T-115 component set can express:
- `component-decompose.mjs` (D2, lines 195–210): masses come from a protrusion pass + a
  **height-class pass** ("a tower above a nave produces one [split]"). Two same-height L-wings have
  one height class and one 4-connected plan component ⇒ **one mass**.
- `provision-fit.mjs` roof ladder per mass-group (lines 77–110): sane ridge-pair gables →
  `fitHipCap` rung → `flat-cap` fallback. **No valley rung exists anywhere** (no `valley` hypothesis
  in src/form). A single L-footprint mass cannot carry two perpendicular ridges.
- Jetty: `provision-generate.mjs` **omits unsupported protrusions** (`mass-unsupported`, the
  gatehouse ×3 / church ×2 precedent) — a jettied overhang whose support is the storey below may
  survive only if decompose reads it as supported; the overhang band is exactly the geometry the
  support check prunes.
- Camera constraint: registry assumes `frontDir "+z"` / `sideDir "+x"` projections; an L-plan
  self-occludes one wing at the canonical 3/4 view, stressing the concept checklist's "one canonical
  view" and the front/side splat grids.

The fallback barn is a single rectangular mass + one gable ridge — the exact shape the ladder's
first rung (end-fitted gable pair) accepts on the cottage. ≥3 material zones must come from the
concept design (S-094 criterion), not the massing.

## Environment / state

- `.env` has `GEMINI_API_KEY` and `MODAL_ENDPOINT_URL`. Suite was 1514/1514 green at T-115 close.
- Working tree: only `.lisa*` runtime files + ticket frontmatter edits (Lisa's) are dirty; no
  sibling session is on T-116 (no work dir existed before this one; latest commits are T-115).
- Judge: pinned `claude-opus-4-8` via gate; T-114 reply policy governs unparsed replies (bounded
  same-prompt re-asks; never prompt-mutating retries). E-28 Rule 4 / E-29: one run per view, no
  re-rolls; known cottage budget-edge judge flap (11↔12 on byte-identical artifact) is on record.
- `design-learnings.md` has no E-29 section yet; the E-28 section (line 2364) is the structural
  template (five-whys → instrument-frozen → milestone outcomes → over/under-reach → E-12 handoff).
  `pr/assets/generate-first.md` (T-115) is the head-to-head sheet to extend (15 rows × subject×path
  columns).

## Constraints carried into Design

- Registry/data entries only — zero pipeline-code changes (AC 1); self-grep must stay clean, so the
  subject key must not collide with any substring in generated-milestone.mjs source.
- Concept + GLB immutable once registered (E-25 Rule 2); raw LLM replies committed beside processed
  records (E-24 Rule 2); committed maps/records are pins asserted on every later run.
- Frozen gates: resemblance verdicts committed as judged; honest-fallback convention (named
  residuals, DoD with reviewer) is the recorded failure mode, not a re-roll.
- `npm test` must stay green; reproducibility = in-process double-run + `--repro` + `--offline`.
