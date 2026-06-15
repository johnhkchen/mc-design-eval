# T-106-01 component-aware-skinning — Progress

## Completed (commits on main, path-scoped)

1. **reconstruct-compose pure core** (`a601…` "delta diff, disjoint composition") —
   `src/view/reconstruct-compose.mjs` + 8 tests. Disjointness THROWS naming both deltas; empty
   delta list is a byte-identical passthrough.
2. **component-plan pure core** ("per-seam definitions with named occupancy fallback") —
   `src/view/component-plan.mjs` + tests. Plan members null with named findings; pin mismatch
   THROWS.
3. **Inert parameters** (`bd6cd9d`) — `stripStraySalt.regions`, `paintFace.skip`,
   `placementGrammar.frames` (+ `frameSource` recorded). Defaults byte-identical, suites green.
4. **buildSkin seams** (`8db75f7`) — roof-program region/skip/conformance, family preserve at the
   renaming point, plan census (`splitZoneOf` → later `planCensusZoneOf`), `seamSources` in the
   return. `skin:cottage --repro` byte-identical (fallback proof on real data).
5. **runChain reconstruct stage** (`4a5172a`) — pinned roof+shaped deltas composed behind the disk
   seam; `reconstructed-artifact.json` + serialized `component-plan.json` written beside the shell.
6. **Styled chain + gate consumption** (`0853909`) — grammarStage plan threading; settle = joint
   grammar+dressing fixpoint; gate revives the persisted plan; blocked shutter mounts carry
   positions and tolerate DEFINED geometry. **Live: styled:cottage chain COMPLETE, kit presence
   PASS** (AC #3's survival claim).

## Plan deviations (all live-run discoveries, each recorded in its commit)

- **Roof protection narrowed to SHAPED course cells** (plan said "generated cells"): full-block
  wedge/gable cells are recolor-safe and the skin owns their material — protecting them starved
  the wall bands (T-104 concern #5 resolved the other way around).
- **Seam 4 grew teeth.** The plan treated re-pin as a record-maintenance step; live, the
  occupancy-derived `upperTop` (+1 on the program roof) conjured a phantom 2-row band and the
  cage-solid shell read EVERY layer as a floor line (1456 phantom beam cells). The definitions
  now pin both: `wallTop` from the slab bounds, floor lines from the concept-band boundaries.
- **Census routing extended**: program cells census as roof; classified frame cells census as
  `<band>:frame` — both "measured, never silently gated" applications of the same rule.
- **Settle covers dressing** (plan had grammar only): the kit-presence checker re-runs BOTH ops.
- **Blocked-shutter tolerance**: the checker now distinguishes defined-geometry blockage
  (reconstruction edits ∪ raw-base concept cells, positions carried in the conflict) from junk.
- **No separate buildSkin integration test file**: the (a) no-plan byte-identity proof is
  `skin:cottage --repro` against the committed record (real data beats synthetic); (b) the seam
  behaviors are unit-tested in component-plan/zone-fill/face-paint/surface-pattern suites.

## Steps 7–8 (complete)

7. **component-skin runner + reskin:\*** (`reskin:*` scripts; chain choice is registry data).
   Zone-map re-pins land as `zone-map/<subj>.reconstructed.json` (NEW pinned records — the
   committed zone-map/v1 describes the unchanged standalone E-24 path).
8. **Live evidence** (commits `a041c84` source, `557a2f8` artifacts):
   - Pin arbitration: the gatehouse wall-top pin rejected by extraction readability (tower slab ≠
     eave) → occupancy wins, named, effective value persisted (attempt-ladder semantics).
   - Settle convergence aligned with the kit-presence checker's own criteria (the lintel/sill ↔
     run-rule ping-pong is the checker's tolerated class, not non-convergence).
   - Church: component layer re-cut from the chain-canonical caged shell (the standalone T-102
     artifact is stale pre-cage-wiring evidence; the pin tripwire caught it exactly as designed);
     roof program honest FALLBACK (every fitted gable pair insane on the blob geometry).
   - **cottage**: styled chain COMPLETE, kit presence PASS, fresh-process REPRODUCES, zone map
     re-pinned. **gatehouse**: same — chain COMPLETE, kit presence PASS, REPRODUCES, re-pinned.
   - **church (AC #4)**: T-088 refusal re-measured on the reconstructed shell — band0 stone
     0.327 < 0.5 WITH the measured cause in the record: the defined wall field is 59%
     polished_basalt with on-slab ≈ offslab composition, i.e. a material-assignment divergence
     (concept says stone-dominant; the provisioned wall is basalt-dominant kept as a declared
     secondary), NOT blob noise.
   - Offline re-asserts: reskin:{cottage,gatehouse,church} + skin:cottage all MATCH; npm test
     1364 pass.
