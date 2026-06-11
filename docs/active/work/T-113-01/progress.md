# T-113-01 vocabulary-authority — Progress

All plan steps complete. Commits on `main` (each `npm test` green at commit time):

| step | commit | content |
|---|---|---|
| 0 | — | baselines: `npm test` 1434/1434 (×2 clean; one transient run reported `fail 3`, unreproducible — noted in review), cottage/gatehouse `--repro`+`--offline` all PASS at HEAD |
| 1 | `4536842` | `src/form/material-vocabulary.mjs` + 11 unit tests (authority, no consumers) |
| 2 | `62eb806` | chain migration: buildSkin / grammarStage / settle / dressing; cottage+gatehouse `--repro` byte-identical |
| 3 | `95ee722` | gate + presence: multi-angle-gate (guarded ship delegated, shipped treatments), kit-presence core (`ownSetsOf`) + runner, dress-openings runner; all `--offline` asserts pass |
| 4 | `e9c0616` | conformance tripwire (closed source sweep, mutation-checked) + last two durable-skin band instruments migrated; `--repro` re-verified |
| 5 | `5114619` | the church proof: live `styled:church` run, records + evidence + artifacts; settle-trail display fix |

## Deviations from plan

1. **buildSkin composes the vocabulary in TWO authority calls** (early: renaming map only, before
   the substituted build exists; full: once policyNamed/plan/allowed exist). The plan assumed one
   call; the chain's sequencing (combined → artifact0 → zones → policy) forces the split. Same
   module, same rule — documented in buildSkin.
2. **Two extra composition sites found during implement** and migrated: `bandEvidence` in the
   grammar runner and `zoneMaterialsFraction`/`wallForeignResidue` own-sets in durable-skin
   (step 4 commit). The research's site inventory had subsumed them under "coverage gates".
3. **dress-openings runner** had no substitution on its input path; it now loads the durable-skin
   record beside its target (data-gated, named on console) so its treatments ship like the chain's.
4. **Display fix (pre-existing)**: settle-trail rendering read `t.fill` (renamed to
   `t.foreignFill` in T-106) → "fill undefined" in console/md. Fixed in step 5; church.md
   re-rendered from the committed record (no judge re-run).
5. **Sibling concurrency**: T-112-01 (roof hip-cap) landed two commits between my steps 4 and 5,
   touching the roof-fit path the styled chain runs. Church `--repro` was re-verified at the
   post-T-112 HEAD before committing step 5 — REPRODUCES.

## AC status

- **AC1 (authority)**: `src/form/material-vocabulary.mjs`, pure, 11 unit tests; output `record`
  embedded in `styled/<subj>.json` (`vocabulary`) and `multi-angle/<subj>-<label>.json`
  (`zones.vocabulary`). ✔
- **AC2 (consumers + conformance)**: zone-fill (callers feed `vocab.zones`), grammar (vocab opts),
  dressing (shipped treatments), settle (`vocab.ownSets`), coverage gates (vocab zones), kit
  presence (`ownSetsOf` + shipped treatments + guarded sub) — conformance test enumerates them and
  sweeps src/form, src/view, benchmarks/sculpture for re-composition (mutation-checked). ✔
- **AC3 (behavior-preserving)**: cottage + gatehouse `--repro` REPRODUCE byte-identically and all
  `--offline` asserts pass after every migration step (chain, gate, presence, dressing). ✔
- **AC4 (church proof)**: settle converges in **1 re-run** (trail `frame 1 + foreign fill 0 +
  gating dressing 0`; was refusal at frame 13 / foreign fill 168 after 4). Kit presence **PASS**:
  frame `536 sites / 0 missing` (was 169/544 missing-by-naming), named `stone_bricks` shipped
  `polished_basalt` in grammar AND dressing. No remaining placement gap. Convergence count
  recorded in `settle.iterations`. ✔
- **AC5**: no subject keys/constants added; judge contract, azimuths, thresholds untouched;
  resemblance left an honest FAIL (major roof form, gaps 12/2); `npm test` 1476/1476 green. ✔
