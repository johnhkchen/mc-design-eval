# T-107-01 reconstructed-milestone — Research

Terminal ticket of E-27. The epic's claim: removing decimated-mesh noise at the source (regularized
mass T-102, parametric roof T-104, generated arches T-105, component-fed skin T-106) moves the
E-25/E-26 verdicts honestly. This phase maps what exists; it proposes nothing.

## 1. Where the chain stands (upstream guarantees)

All four dependencies are done and committed:

- **T-102** regularization cage — `regularize/<subj>.json` (schema `shell-regularize/v1`): census
  before/after (`spikes`, `ragged`, `columns`, `raggedRate`), `cage.accepted/rejected`, per-azimuth
  IoU gates vs GLB refSils. Cottage 2/0 accepted/rejected; gatehouse 2/0. Church's STANDALONE record
  is stale evidence (cut from the pre-cage-wiring shell, T-106 review concern #4); the chain re-cuts
  the church shell every run (`challenge/church/shell-artifact.json` is chain-canonical).
- **T-104** roof-as-program — `roof/<subj>.json` (`roof-program/v1`): fitted gables (`fit.gables[]`
  with `pitch`/`glbPitch`/`pitchSource`/`eaveY`/`overhang`/`run`), stair-course artifacts
  (cottage `spruce_stairs`, gatehouse `deepslate_brick_stairs`; states `facing/half/shape=straight`,
  proven by read-back). Church roof is a NAMED FALLBACK (every fitted pair insane on blob geometry,
  no kit family) — church composes shaped-only.
- **T-105** shaped vocabulary — `shaped/<subj>.json`: generators (`stairRun`/`slabStep`/`archRing` in
  `src/form/shaped-vocab.mjs`); gatehouse `og-0` is the arch candidate; ring is FULL CUBES by design
  ("stairs invisible in current lens", `shaped-vocab.mjs:14`).
- **T-106** component-aware skin — the chain CONSUMES the component layer: `challenge-milestone.mjs`
  reconstruct stage loads `components|roof|shaped/<subj>.json`, verifies every pin against the
  in-chain regularized shell SHA (drift THROWS), composes via `src/view/reconstruct-compose.mjs`,
  builds the plan (`src/view/component-plan.mjs`), threads it through buildSkin → grammar → dressing
  → settle → gate. Kit presence PASSES on cottage and gatehouse. `npm test` 1364/0 at T-106 close.

## 2. The runners (one command per subject already exists per layer)

- `challenge:*` → `challenge-milestone.mjs` (612 ln): provision? → shell integrity (T-091) →
  regularize (T-102) → **reconstruct (T-106)** → skin (T-086/92/90/87/88) → multi-angle gate.
  Seams on disk: `challenge/<k>/{base,shell,reconstructed,}artifact.json`; record `challenge/<k>.json`.
- `styled:*` → `styled-milestone.mjs` (583 ln): kit precondition (THROWS if absent) → challenge's
  `runChain` → grammar (T-098) → dressing (T-099) → settle fixpoint (T-100, non-convergence THROWS)
  → kit-aware multi-angle gate. Seams `styled/<k>/...`; record `styled/<k>.json`; kit report
  `pr/assets/styled-<k>-kit.md`.
- `reskin:*` → `component-skin.mjs` (255 ln, T-106 record): verify component-layer pins → run the
  milestone (styled if `def.kitRecord`, else challenge — registry data) → distill (reconstruction
  stats, per-band wall-field decomposition on/offslab/:frame, conformance, kit presence, gate
  verdict) → re-pin zone map (`zone-map/<k>.reconstructed.json`).
- Registry: `durable-skin.mjs` SUBJECTS — cottage/gatehouse have kit + zone-map records (styled
  path); church has `provision:{scale:48}`, NO kit, `regularizedShell` override to the chain shell
  (challenge path). All runner logic is registry-driven; the generalization line ("no subject keys,
  constants, branches, or thresholds") is recorded in each milestone record (E-25 Rule 3).
- Reproducibility pattern (E-25 Rule 5): in-process double-run JSON-compares every artifact seam;
  `reproducible.sha256` records artifact SHAs (artifacts only — GL excluded from decisions);
  `--repro` is the fresh-process re-proof (deterministic chain only, judge NOT re-run, committed
  gate record is the pin); `--offline` re-asserts committed records without recompute.
- npm namespace: `reconstructed:*` is free (existing prefixes: challenge/styled/reskin/skin/gate/
  regularize/components/shaped/roof).

## 3. The frozen instrument and today's verdicts

`multi-angle-gate.mjs` + pure `src/form/multi-angle-gate.mjs`:

- Contract (CONFIG, no per-run flags — E-25 Rule 4): azimuths `+x+z,+x-z,-x-z,-x+z` (45/135/225/315°),
  elevation 30°, 512², `gapBudget: 2`, `coverageThreshold: 0.5`, judge = `PHASE1_MODEL_ID`
  (claude-opus-4-8), triptych prompt (concept | mesh silhouette | view), verdict schema
  `multi-angle-verdict/v1`. Aggregate: pass ⇔ every view's T-088 coverage precondition passed ∧
  every verdict "same object" ∧ total minor gaps ≤ 2. Kit presence (deterministic) composes into
  `kit-aware-gate/v1` overall.
- **Current verdicts (committed, post-T-106 reskin):**
  - `multi-angle/cottage-styled.json`: FAIL — 10 gaps; 45° drifted (roof+upper storey/form),
    135°/225° same-object (roof ridge/form, chimney/massing), 315° drifted (roof+upper massing/form).
    Kit presence PASS.
  - `multi-angle/gatehouse-styled.json`: FAIL — 12 gaps; 135°/225°/315° drifted; roof ridge/eaves/
    roofline form named at every azimuth; 225° also "colonnade/pillars instead of a single arched
    doorway". Kit presence PASS.
  - Church: NO gate record — chain THROWS at the T-088 coverage terminal gate
    (`component-skin/church.json`: pipeline-failed, "band0 stone=0.327 < 0.5", census: band0
    total 2082 = 59% polished_basalt / 33% stone; on-slab ≈ off-slab → NOT blob noise but a
    material-assignment divergence, measured cause recorded per T-106 AC#4).

`form @ roof` at every oblique azimuth is exactly the ticket's stated target.

## 4. NEW FINDING — the stair-lens root cause, located and fix proven live

T-097 pinned: prismarine-viewer 1.33.0 meshes NO stair block at any state (placement proven by
read-back + empty `unmapped`; slab/trapdoor/fence/door/lantern render fine). The judge sees a
notched solid wedge where T-104 placed stair courses — the proximate cause of the roof-form FAILs.

This research session localized the defect:

- `render/node_modules/prismarine-viewer/public/blocksStates/1.20.1.json` CONTAINS full stair
  models (53 stair keys; `oak_stairs` 40 variants, straight-bottom variant has 2 elements).
- Variant matching (`matchProperties`) matches a real 1.20.1 stair block (verified directly).
- The drop is `getModelVariants` (`viewer/lib/models.js:481`):
  `if (block.name.includes('air')) return []` — intended for `air`/`cave_air`/`void_air`, but
  **every `*_stairs` name contains the substring "air"** (st-AIR-s) → all stairs mesh as air.
- Proof: mesher-level repro (stair section → 0 vertices, slab → 24); one-line patch
  (`name === 'air' || name === 'cave_air' || name === 'void_air'`) → probe scene renders correct
  stepped stair geometry (`/tmp/stair-probe{,-patched}.png`). node_modules restored after probe.

Mechanism constraints: the mesher runs in `worker_threads` workers that `require('./models')` from
the package directory (`worldrenderer.js:30-33`) — an in-process monkey-patch CANNOT reach it; the
fix must be on disk (patch-package postinstall, or a verified vendored copy; repo precedent:
`render/vendor/node-canvas-webgl` custom build). No patches/ dir or postinstall exists today.

Instrument-freeze precedent: E-22 (design-learnings:1726-1843) fixed texture-minification aliasing
as a LENS correction — camera resolve changed, thresholds/azimuths/judge contract untouched, build
artifacts byte-identical. The stair fix is the same class: meshing only; artifact SHAs unaffected
(GL is excluded from reproducibility decisions); verdicts must then be RE-RUN — which is this
ticket's entire purpose ("moving the verdict, not the bar").

Pinned references to update if the lens is fixed: `fixture-card.mjs:45` (stairs-invisible finding),
`roof-program.mjs:66` (LENS_NOTE), `src/form/shaped-vocab.mjs:14` (comment); the fixture card
re-run refreshes the committed proof record.

## 5. Metrics inventory (AC #3)

- **Protrusion census / ragged-column rate** — pure fns `protrusionCensus()` (≥4/6 exposed faces)
  and `raggedColumnRate()` (cliff ≥3 vs 4-neighbor) in `src/view/shell-regularize.mjs:74-110`.
  Baselines in the AC: styled cottage 265/21.7% (measured on the E-26 styled FINAL artifact),
  shell 276/23.9% (= `regularize/cottage.json` census.before). Re-measure = run the pure fns over
  any artifact's occupancy (solid-only census convention for shaped vocabulary, per T-104).
- **Roof fit errors** — `roof/<subj>.json` `fit.gables[].sides[]` (pitch vs glbPitch, pitchSource);
  no single `fitError` field; the cage IoU is the arbiter (T-104 attempt-ladder).
- **Cage outcomes** — `regularize/<subj>.json` `.cage.accepted/.rejected` for the standalone runs;
  the in-chain cage outcomes are recorded in the milestone records' regularize stage.
- **Church band0** — re-measurement comes free: the chain's coverage gate error carries the full
  census decomposition (band0 + band0:offslab byBlock).

## 6. Evidence conventions (AC #4, #5)

- `pr/assets/frames/`: `styled-<k>-{before,after}.png` (renderSheet, 4 azimuths),
  `multi-angle-<k>-<label>.png` (5-panel labeled sheet written by the gate), `components-<k>.png`.
  E-26 markdown sheets at `pr/assets/styled-<k>-kit.md`.
- `docs/knowledge/design-learnings.md` (2285 ln): per-epic H2 sections; E-26's (the template) =
  five-whys paragraph → bold per-ticket work items → per-subject milestone outcomes → "over-reach,
  honestly" → E-12 handoff. ~80-190 lines.
- **E-12** = epic "evolution-showcase" (March-of-Progress video). Handoff convention (E-26 close):
  name the three artifacts per subject — chain record, per-view gate record, asset markdown — and
  keep deterministic (kit presence) and perceptual (judge) components separate.
- S-107 story file exists; this is its only ticket ("run-the-test").

## 7. Constraints, assumptions, open questions for Design

- **The instrument is frozen**: no threshold/azimuth/judge-contract diffs vs E-26 (AC #2 demands a
  recorded confirmation). The gate contract object inside records is directly diffable.
- AC #1's stage list says "decompose → rebuild" — today those are COMMITTED records consumed (and
  pin-verified) by the chain, not re-cut in-chain. Design must choose: new terminal runner that
  consumes the committed layer (established pattern) vs in-chain re-cut (T-106's church staleness
  argues for it but the pin-THROW already catches drift).
- Church cannot complete its chain (coverage gate THROWS before the judge) — the honest-finding
  branch of AC #2 applies; the band0 re-measurement is in the failure record. No kit, no zone-map,
  roof-program fallback: all named, all registry data.
- Judge cost: 4 calls/subject/gate run (~11k in + ~600 out each); a full re-verdict of cottage +
  gatehouse styled ≈ 8 calls; church short-circuits at coverage (0 calls) unless band0 moves ≥0.5.
- The lens fix will also change the per-view coverage census inputs only insofar as renders feed
  it — coverage is computed over the artifact/zone census (deterministic), so re-verdicts move on
  judge perception, not on coverage arithmetic. (Verify at implement: coverage inputs are
  pixel-independent.)
- Whether the E-26 baseline metrics row "styled cottage 265/21.7%" reproduces from the committed
  E-26 styled artifact must be re-derived (the artifact was REFRESHED by T-106's reskin run; the
  before/after comparison should pin which artifact SHA the "before" numbers describe).
- `npm test` currently green at ~1364; no unit test pins stairs-invisible behavior (the pins are
  prose notes + the fixture-card committed record).
