# T-107-01 reconstructed-milestone — Review

Self-assessment / handoff. The E-27 terminal ticket ran all three subjects through the full
reconstructed chain with the instrument frozen (and PROVEN frozen by recorded diff), re-took the
verdicts through a lens this ticket had to fix first, and recorded honest movement: deterministic
form metrics improved ~5×, two previously-failing views now judge same-object, the gatehouse arch
major gap is gone — and `form @ roof` remains honestly named at the views where the gable
massing is genuinely wrong. Church's refusal reproduces with its measured cause.

## The load-bearing discovery

**The stairs were never invisible because of "viewer limitations" — one substring check ate them.**
prismarine-viewer's `getModelVariants` short-circuits `block.name.includes('air')`; every
`*_stairs` name contains "air" (st-AIR-s), so every stair at every state meshed as air while its
models sat unused in blocksStates. T-097 had pinned the symptom; this ticket found the cause,
proved the one-line fix live, and shipped it as an E-22-class lens correction — without it, AC #4
(stair-course roofs *visible*) was unsatisfiable and every re-verdict would have re-measured lens
debt instead of the epic's claim.

## What changed

**Created**
- `render/scripts/patch-viewer-lens.mjs` — pure `patchSource` (idempotent; THROWS on viewer
  drift) + CLI, wired as render/'s `postinstall`. On-disk because the mesher runs in
  worker_threads (`require('./models')` from the package dir — monkey-patches can't reach it).
- `render/src/lens-guard.mjs` — import-time tripwire: any render through an unpatched install
  THROWS with a named error. Imported by `render/src/render.mjs`.
- `render/test/stair-mesh.test.mjs` — GL-free regression: patch core, installed-state assert,
  mesher emits stair geometry (oak default + explicit state, spruce + deepslate_brick roof
  families), no collateral (slab still meshes, true air still empty).
- `benchmarks/sculpture/reconstructed-milestone.mjs` + `reconstructed:{cottage,gatehouse,church}`
  — the terminal runner: spawns the milestone chain (styled/challenge by registry kit data),
  pre-captures + deep-diffs the gate contract & judge model (AC #2 recorded, not asserted),
  censuses protrusions/ragged on the pinned E-26 baseline vs the fresh final, distills roof fit
  (fit error separated from attempt-ladder rejection divergence), cage outcomes, coverage-refusal
  re-measurement, renders before/after sheets to `pr/assets/frames/`, embeds a self-grep proof
  (zero subject keys). Flags: `--repro` (forwarded fresh-process re-proof, judge never re-run),
  `--offline` (re-assert committed records), `--distill-only` (rebuild the record from committed
  outputs — the no-re-roll rule made operational).
- `benchmarks/sculpture/reconstructed/<subj>/e26-baseline.json` ×3 — provenance-stamped snapshots
  from history (cottage styled final @5574d70, gatehouse @2201052, church pre-component shell
  @48582f3 — church never completed a final). The cottage baseline re-derives the ticket's
  motivating census EXACTLY (265 / 21.7%).
- Evidence: `reconstructed/<subj>.{json,md}` ×3, `pr/assets/reconstructed-milestone.md`,
  `pr/assets/frames/reconstructed-<subj>-{before,after}.png` ×3, refreshed styled/multi-angle
  records + gate sheets, re-cut fixture card (stair rows visible, 25/25 read-back unchanged).

**Modified**
- `render/package.json` (postinstall), `render/src/render.mjs` (guard import).
- `component-skin.mjs` — `componentLayer` exported (shared verification, behavior unchanged).
- `fixture-card.mjs` — `stairs-invisible` residual RETIRED with the root cause; record re-cut.
- `roof-program.mjs` LENS_NOTE + `shaped-vocab.mjs` comments — pins updated; the full-cube arch
  ring now stands on the native-arch rationale alone.
- `.gitignore` — reconstructed working renders (evidence frames live in pr/assets, per
  convention); `package.json` scripts.
- `docs/knowledge/design-learnings.md` — the E-27 section (five-whys, the second E-22-class lens
  lesson, frozen-instrument proof, per-subject outcomes, over/under-reach, E-12 handoff).

## Acceptance criteria

1. **One named run per subject, full chain, reproducible, registry-only** ✅ — `reconstructed:*`
   spawns provision → shell → cage → reconstruct (pinned committed decompose/rebuild records,
   drift THROWS) → skin → grammar → dressing → settle → gates. Double-run byte-equality inherited
   from the milestones; `--repro` fresh-process re-proofs PASS (church reproduces the same THROW,
   same cause); generalization self-grep recorded `clean: true` (no subject keys in the runner).
2. **Verdicts recorded, instrument unchanged** ✅ — recorded `instrument.diffs: []` for both gated
   subjects vs their committed pre-run gate records; judge `claude-opus-4-8` pinned; coverage is
   occupancy-censused (pixel-independent — verified). Target outcome: the honest-residual branch.
   `form @ roof` is NO LONGER named at every oblique azimuth — cottage 135°/225° and gatehouse
   315° judge same-object; the remaining majors are named per angle/region/attribute (cottage
   45°/315° gable-end massing; gatehouse ridge + upper edges ×3). One gate run per subject; no
   re-rolls.
3. **Metrics before/after** ✅ — cottage 265→51 spikes / 21.7%→6.8%; gatehouse 118→25 / 14.1%→9.9%;
   church 602→202 / 24.3%→14.0% (last completed stage, named); roof fit per subject (church:
   named fallback); cage outcomes (church's standalone record labeled STALE per T-106 #4); church
   band0 re-measured at stone=0.327 with the full census decomposition in the record.
4. **Contact sheets + before/after vs E-26** ✅ — `reconstructed-<subj>-{before,after}.png` (same
   four azimuths, same fixed lens) + the gate sheets; stair-course roofs clearly visible at the
   previously failing azimuths; the generated arch reads at 225° (its verdict gap dropped
   major→minor).
5. **Learnings + E-12 handoff, tests green** ✅ — E-27 section appended (template-conformant);
   E-12 handoff names the three artifacts per subject and the components-never-collapsed rule.
   Root suite 1364/1364, render suite 46/46.

## Test coverage

5 new render-suite tests (patch core ×2, installed-state, mesher emission ×2 incl. roof families
+ no-collateral). The terminal runner follows the sibling-runner convention (no unit tests; pure
distillation over committed records) — its integration proof is the live `--repro`/`--offline`
asserts and the milestones' own hard gates. **Gaps**: `patchSource` is exercised against the real
installed file but a future prismarine-viewer upgrade will THROW (by design) rather than degrade —
the upgrade path needs a human re-verify; `--distill-only` has no automated test (used once,
logged in progress.md).

## Open concerns (for the human reviewer)

1. **The lens fix changes every future render containing stairs.** Prior epochs' committed PNGs
   stand as their eras' evidence; cross-epoch pixel comparisons straddle two lenses. The
   instrument-diff records are the receipt that thresholds/azimuths/judge never moved. If this is
   judged to move the bar rather than fix the camera, the counter-argument is in the learnings
   (E-22 precedent; AC #4 literally requires stair visibility).
2. **Resemblance still FAILs cottage (10/2) and gatehouse (11/2).** The epic's DoD rests with the
   reviewer per the E-25/E-26 convention: the named residuals are now TRUE form gaps (gable-end
   massing, ridge form) — component-fit territory, not lens debt and not skinning.
3. **Verdict movement is judge-sampled** (single sample per view, pinned model). The movement
   direction is consistent with the geometry change, but a marginal view could flip on a re-judge.
   The records are the verdicts; the no-re-roll rule was held.
4. **Church remains twice-blocked** (E-21 material assignment for the coverage gate; kit/zone-map
   for styling). Both named in the record; both downstream tickets if pursued.
5. **The npm `postinstall` in render/ mutates node_modules.** Idempotent and tripwired, but a
   `node_modules` wipe + install with scripts disabled (`--ignore-scripts`) leaves the lens
   unpatched — the guard then refuses to render, loudly. patch-package was considered and
   rejected (extra dep, same failure mode); noted in design.md D1.
6. **Working-tree hygiene** — sibling Lisa noise (`.lisa*`, ticket files, scheduled_tasks.lock)
   never staged; all 8 commits path-scoped.

## Commits

1. stair-lens fix (patch + tripwire + suite) → 2. fixture card re-cut + pins retired (48bcedb) →
3. E-26 baselines pinned → 4. terminal runner → 5. cottage evidence → 6. gatehouse evidence →
7. church evidence → 8. learnings + epic sheet → this docs commit.
