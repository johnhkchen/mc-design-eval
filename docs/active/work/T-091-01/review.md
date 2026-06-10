# T-091-01 shell-integrity-and-debris — Review

## What changed

**Created**
- `src/view/shell-integrity.mjs` — five pure cores: `componentStrip` (keep largest + grounded
  6-connected components, strip floating debris, declare every decision; reuses `componentLabels` via a
  shape adapter), `rebuildArtifact` (canonical one-voxel-per-cell artifact rebuild — the contract has no
  air op, so a strip is a rebuild), `openingRegions`/`inRegion` (the allow-list: the structural read's
  through-openings as world AABBs), `fillVoids` (per-face depth-basin repair with relief floor
  `minDepth=3`, sharing the `spillLevels` hydrology with the T-087 course fill), `closureCheck` +
  `plugClosure` (ground-solid six-direction watertightness of the standing build; plug loop converges or
  throws).
- `src/view/shell-integrity.test.mjs` — 16 unit tests on synthetic occupancies.
- `benchmarks/sculpture/shell-integrity.mjs` — impure runner (`npm run shell:cottage|gatehouse`,
  `--offline` re-assert), double-run determinism + sha256, AC numbers hard-asserted, before/after
  renders + committed frames.
- `benchmarks/sculpture/shell-integrity/{cottage,gatehouse}.{json,md}` + repaired artifacts;
  `pr/assets/frames/shell-*-{before,after}.png`.

**Modified**
- `src/view/surface-pattern.mjs` — private priority-flood extracted as exported `spillLevels`
  (`regularizeRoofCourses` delegates; behavior pinned by its existing tests).
- `package.json` (two scripts), `.gitignore` (render stanza).

Commits: `e6d3e00` (cores), `9143d63` (runner + records), this one (RDSPI artifacts).

## Results vs the ACs

- **Component strip**: cottage `spray-paint` artifact **23 → 1 components, 126 cells removed** — the
  exact ticket numbers, hard-asserted in the runner so input drift fails loudly. The gatehouse's
  1259-cell grounded inner passage structure is *kept and declared* (the keep-grounded exception); a
  literal keep-only-largest would have deleted a visible standing structure — divergence from the AC's
  literal phrasing, justified in design.md D1 and declared per S-091's wording.
- **Void repair**: gatehouse upper-right cavity basin-filled (11071 cells incl. the noisy E-20 roof
  channels), arch preserved via its declared `door` region; before/after 225° frames committed. Cottage:
  1126 cells, 10 columns skipped at declared windows.
- **Closure**: both subjects **CLOSED** from all six directions after repair (cottage was 2483 interior
  cells exterior-reachable, gatehouse 22069). The check is a throwing stage (plugClosure throws at cap;
  the runner re-asserts; `--offline` re-asserts the committed verdict).
- **Hygiene**: everything behind named npm runs; no subject constants (`minDepth`/`maxIterations` are op
  parameters; zone dominants census-derived from the build's own exposure shell); `npm test` 1082/1082.

## Test coverage

Every export has direct unit tests (strip ×4, rebuild ×3, regions ×1, fillVoids ×4, closure ×5,
plug ×2) including the semantics that bit during implementation: per-direction breach attribution (a
roof-hole shaft reports `+y`, not the lateral crossing axis), ground-solid bottoms, arch-tube benignity,
honorary-skin openings. Gaps: `fillVoids` is untested on `+y` (side faces + synthetic pockets only;
the live gatehouse roof exercise is recorded, not unit-pinned); `rebuildArtifact` drops per-voxel
`state` (no fixture ever reaches this path today — E-26 will care); no unit test feeds `closureCheck` a
diagonal-only leak (6-conn flood can't traverse edge-touching gaps — see concerns).

## Open concerns / follow-ups

1. **Durable-skin wiring deferred — needs a follow-up ticket.** plan.md Step 3 intended to wire the
   three stages into `durable-skin.mjs`; mid-implementation, concurrent T-092-01 landed and kept
   iterating its own durable-skin rework (its zone:map gate failing at the time), so editing it from
   this ticket would collide (the RDSPI missing-DAG-edge case; precedent: per-ticket runners stay
   separate, consolidation was T-089's dedicated job). The cores are designed for that wiring
   (policy-fed dominants, regions measured pre-seal) — the consolidation belongs after T-092 settles.
2. **Sight-lines that never cross interior air** (e.g. a 1-cell slit through a thin verge) are invisible
   to the closure flood, and a 26-conn light path through edge-touching gaps can exist with no 6-conn
   air path. The basin stage catches the deep ones; the committed oblique frames are the honest residual
   evidence. A render-side sky-through-silhouette pixel counter would make AC4 fully mechanical.
3. **Gatehouse void volume**: 11071 fill cells on the 57k build (19%) — dominated by `+y` roof-channel
   fills (4456) on the noisy E-20 reconstruction. Renders confirm form is preserved (bumps are never
   touched; fills only raise to the rim), but the number deserves a reviewer's eye. The witnessed
   gatehouse zone census also reads oddly (`base: deepslate_tiles` — the E-20 build's storey lines sit
   high), which only affects patch *material* in already-recessed (shadowed) areas; the durable pipeline
   will feed real policies instead.
4. **`minDepth=3` is a default, not a law**: cottage ±z had a handful of 3-deep pockets that are now
   filled; the after-renders read clean, but a subject with intentional 3-deep relief would need the
   parameter passed per call (it is data).
5. The repaired artifacts are **new committed results**, not replacements: `spray-paint/cottage/...`
   and `building/best/...` inputs are untouched (they remain the witnessed-defect records).

## Risk for human attention

Low mechanically (pure, tested, deterministic, gated). The judgment calls a human should eyeball:
the keep-grounded strip rule (D1), the ground-solid closure semantics (D3), and the gatehouse
before/after frames (`pr/assets/frames/shell-gatehouse-*.png`) for whether the 19% fill respects the
design's intent.
