# T-073-01 — concept-refine-pass · Review

Handoff. E-21's terminal "refine according to the concept" step ships: a concept-grounded MATERIAL-
correction pass built as the material analogue of E-15's form surgical loop — **reusing the unchanged
`reviseLoop`** with a material target + a recolor-only editor. All 6 ACs met; `npm test` green (**742**,
was 706). 6 commits, purely additive. The corrective path is proven live on the gatehouse (a probed defect
is detected, corrected, and accepted by the deterministic gate); the as-built build honestly holds.

## What changed (files)

**Created**
- `src/form/material-policy.mjs` — PURE palette policy (the AC#2/#3 core). `allowedPalette` (design-doc ∪
  ≤2 secondary ∪ additions), `gateAddition` (concept-justified, near-tone-allowed, distinct-role),
  `classifySwap`, `applyCorrection` (gates additions → grows palette → applies block-remaps + per-index
  swaps via the reused `applyFormEdit`; recolor-only ⇒ geometry immutable).
- `src/form/material-target.mjs` — PURE accept metric (the material analogue of `form-target.mjs`).
  `colorAgreement` kernel + `regionColorClusters` (reuse the E-10 colour engine), `conceptMaterialTarget`,
  `resolveMaterialTarget`, `liveMaterialScore` (the loop's `score` seam; GL leaf, lazy).
- `src/revise/material-edit.mjs` — the editor (analogue of `form-edit.mjs`). `makeMaterialEditor`
  (async-propose/sync-replay stash; one route, behind the same gate), `defaultProposeCorrection` (lazy
  live leaf spawning the bridge).
- `baml_src/materialcorrect.baml` — `CorrectRegion(subject, region, palette, placements, render, concept)`
  → `{remaps, swaps, additions}`, two images, recolor-only prompt, remaps PREFERRED for dense regions.
- `src/revise/baml-material-correct.mts` — the live two-image bridge (clone of `baml-revise.mts`).
- `benchmarks/sculpture/material-correct.mjs` — IMPURE runner (live + `--offline` + `--probe`).
- `benchmarks/sculpture/material-correct/{gatehouse,gatehouse-probe}.{json,md}` + `…/artifact.json` —
  the AC#5 records (as-built held; probe improved).
- 5 `*.test.mjs` additions across policy/target/edit (36 new pure cases).

**Modified (additive only)** — `package.json` (`material:correct` script), `.gitignore` (render PNGs).

**Generated (gitignored)** — `baml_client/**` (`npm run baml:gen`).

**Untouched (zero regression surface)** — `src/revise/loop.mjs`, `region.mjs`, `tweak.mjs`, `form-edit.mjs`;
`src/form/form-target.mjs`, `material-map.mjs`, `feature-classify.mjs`; the schema, the block→Lab table,
every frozen BAML fn, every existing runner. The E-15 loop is consumed, never modified — AC#4 by
construction.

## How it works (one paragraph)

The loop is target-agnostic (accept = `after > before + epsilon`). This pass plugs in (a) a deterministic
material target — `conceptMaterialTarget.scoreRender(renderPath, R)` returns a coverage-weighted CIE76
colour agreement between the R-framed build render and the concept; (b) a recolor-only editor — the model
(seeing render + concept, in the async `diagnose` seam) proposes block-remaps + per-index swaps + palette
additions, which `applyCorrection` gates against the augmented palette and stashes; the sync `tweakFor`
replays the stash under the region-lock + AJV. The deterministic gate accepts only if the recolor raised
concept agreement, else rolls back; accepted regions lock (P14). This is the E-16 seam move (concept→GLB)
one level over: form→material; the loop body never changed.

## AC verification

- **AC#1** render→LLM sees render+concept→bounded recolor-only→lock→accept-if-closer→roll back→bounded
  rounds→lock — ✓ The runner renders R-framed (`observeRegion`), the bridge sends render+concept, the
  editor emits recolor-only ops (remaps/swaps — no add/move/remove), `applyRegionEdit` locks, the material
  gate accepts/rolls back, the loop's fixed region walk + `locked` give bounded rounds + P14. Proven live
  (probe: a remap accepted, region locked).
- **AC#2** the right to ADD, gated by concept justification not a cap; distinct role; near-tone allowed;
  logged — ✓ `gateAddition` + the `additions` log; unit-tested incl. the near-tone-accept case
  (cobblestone beside stone_bricks → ok) and the near-duplicate reject.
- **AC#3** palette = design-doc ∪ ≤2 secondary ∪ additions; off-palette vs this augmented set, no
  full-table snap — ✓ `allowedPalette`/`classifySwap`; the runner feeds `mapPalette` (the T-071 map) +
  `secondary` (manifest ∖ map). E-19's stricter guard is superseded here (documented in the module).
- **AC#4** reuses the E-15 loop, not a new loop — ✓ `loop.mjs`/`region.mjs` untouched; the runner wires
  the unchanged `reviseLoop` (the E-16 precedent).
- **AC#5** gatehouse: corrections kept/rolled-back + agreement before/after, improves or honestly holds —
  ✓ as-built **held** (0.657→0.657, materials already correct); probe **improved** (0.628→0.645, a remap
  kept). Both recorded.
- **AC#6** pure logic unit-tested; live call metered/GL; `npm test` green — ✓ 742 pass; the `.mts` bridge
  + the runner's live branch are exercised by the committed runs + `--offline`, never by the suite.

## Test coverage

- **Unit (`npm test`, CI-safe):** policy (14) — the union, every `gateAddition` branch incl. near-tone,
  swap classification, `applyCorrection` for in-palette/needs-addition/off-palette swaps AND block-remaps,
  geometry-immutability, the additions log. Target (12) — the `colorAgreement` kernel (identity/far/
  coverage/clamp/hill-climb-monotonicity), clustering on synthetic images, the adapter via injected
  `_decode`, resolve, the no-top-level-GL scan. Editor (10) — stash/replay, the policy branches through
  the editor, the remap-on-dense-region case, accept + rollback through the UNMODIFIED `reviseLoop`, the
  additions-only-on-stash invariant, no-top-level-SDK scan.
- **Live (manual, GL + metered):** the gatehouse as-built + probe runs prove the real render→concept→
  correct→accept/rollback cycle; re-checkable via `--offline` (re-derives the verdict + re-validates the
  corrected artifact through AJV, no GL/model).
- **Coverage gaps (by design):** `baml-material-correct.mts` + the runner's live branch are NOT
  unit-tested (metered `claude -p` + render) — the project idiom (matches `baml-revise.mts` /
  `material-assign.mjs`).

## Open concerns / flags for a human reviewer

1. **The accept gate is deliberately deterministic, not an LLM judge.** AC#1 says "accept-if-closer to the
   concept's material zoning"; I implemented that as a deterministic colour-agreement metric, with the LLM
   supplying the zoning *intelligence* in the proposer. This is forced by the loud E-15 lesson (a
   non-deterministic gate confounds the hill-climb / breaks the P14 proof). If a reviewer wanted a literal
   per-iteration multimodal judge as the gate, that is a different (riskier) design — flagged explicitly.
2. **Near-tone material errors are invisible to a render-based pass (the honest limitation).** The corner
   probe (cobblestone→stone_bricks) produced 0 proposals: a near-tone collapse barely moves a render, so
   the model can't see it and the colour gate has near-zero signal. This refine pass is the complement for
   VISIBLE, semantic mis-zoning (a roof in the wall block — caught and fixed); near-tone identity is
   T-072's job (geometry). This validates the epic's thesis rather than contradicting it, but a reviewer
   should know the pass is not a near-tone safety net.
3. **The block-remap op was a mid-flight design correction.** The plan's swap-only vocabulary (cloned from
   the form editor) does not scale to dense voxel regions (~1200 cells → the LLM declines). The remap
   `{fromBlock,toBlock}` is the right granularity and more faithful to "material *regions*," but it means
   the pass corrects at MATERIAL granularity, not arbitrary per-cell — fine for zoning errors, not for a
   speckled within-material cleanup (that is E-19's job). Surfaced by the `--probe` adversarial check.
4. **The per-region gate compares R-framed render vs WHOLE concept** (no 2-D concept-region clip — mapping
   R's 3-D bounds into the concept frame needs a projection the form target also punted on). So the
   per-region signal is "do this region's colours appear in the concept" — a monotone nudge + no-regression
   guard, not region-vs-region. Documented in the honesty ledger; a finer clip is a follow-up.
5. **Trace label cosmetic.** The loop's `tweakLabel` (frozen `tweak.mjs`) emits `"noop"` for the
   `material-correct` route it doesn't know — the trace shows `tweak: noop` on an accepted material edit.
   The edit IS applied (via the stash); only the label is generic. Not worth touching a frozen E-15 module.
6. **n=1 subject.** Only the gatehouse (the AC subject). The cottage map exists (T-071) and the runner
   generalizes (regions computed from artifact bounds), but a second subject is deferred.

## Verification commands
- `npm test` → 742 pass.
- `node benchmarks/sculpture/material-correct.mjs --offline` → re-derive + re-validate (no GL/model).
- `node benchmarks/sculpture/material-correct.mjs` → live as-built (held); `--probe` → live corrective
  demo (improved). Needs the T-072 artifact + `concept.png` + GL + `claude -p`.
- `npm run baml:gen` → regenerate the gitignored client before the bridge runs.
