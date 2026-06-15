# T-089-01 durable-consolidation — Research

Goal restated: one named `npm run` script per subject that produces the skinned build **end-to-end**
(zone-fill → value-true blocks → secondaries splat → coherent surface → coverage-aware gate), reproducibly,
on **cottage + gatehouse**; refreshed triptychs + before/after vs the E-23 splat-only skin; a durable
design-learnings section; an E-12 handoff. This phase maps what exists. No solutions proposed here.

## 1. The four upstream stages, as they landed

All four dependency tickets are done (review.md each). The stages live as **pure cores in `src/`** plus
**per-ticket impure runners in `benchmarks/sculpture/`** that do NOT compose into one pipeline today:

| Stage | Pure core | Runner (npm script) | Consumes | Produces |
|---|---|---|---|---|
| Zone-fill base coat (T-085) | `src/view/zone-fill.mjs` — `zoneFill`, `surfaceZoneHistogram`, `surfaceVoxelEntries`, `FILL_FACES` | `spray-paint.mjs` (`spray:paint`) §0c | `concept-materials/cottage/after-artifact.json` | `spray-paint/cottage/artifact.json` + record |
| Value-true selection (T-086) | `src/color/value-select.mjs` — `estimateBorderColor`, `sampleRoleSwatches`, `selectValueTrueMap`, constants | `value-select.mjs` (`value:select`) | material-map + concept PNG + **spray-paint artifact** | `value-select/cottage/artifact.json` + record (`map`, `substitution`) |
| Coherent surface (T-087) | `src/view/surface-pattern.mjs` — `courseMetrics`, `regularizeRoofCourses`, `stripStraySalt`, `overlayPlacements` | `surface-pattern.mjs` (`pattern:cottage`) | **spray-paint artifact** + record's `fill.policy` | `surface-pattern/cottage/artifact.json` + record |
| Coverage-aware gate (T-088) | `zone-fill.mjs` `dominantCoverage` + `face-resemblance.mjs` `coverageGate`, `acceptWithCoverage`, `DEFAULT_COVERAGE_THRESHOLD` (0.5) | wired inside `spray-paint.mjs` (§2b reject-proof, §4 precondition, §5b throw) | — | `zones.coverageGate` in the spray-paint record |

Supporting cores the chain also uses (all pure, all in `src/view/` unless noted):
`occupancy.mjs` (`artifactOccupancy`, `bareBlock`), `surface-grid.mjs` (`projectSurface`),
`structural-read.mjs` (`structuralZones` — geometry-derived base/upper/roof + `storeyDivide`/`upperTop`),
`surface-coherence.mjs` (`sealRoof`, `sealWalls`, `applyDeltas` — the S-084 seal),
`reference-quantize.mjs` (`quantizeToFace` — concept→face material target, deterministic),
`glb-splat.mjs` (`loadGlbSplat`, `resampleBlockGrid` — side-face target from the textured GLB),
`face-paint.mjs` (`paintFace` with zone gate, `mergePaints`, `applyPaint`),
`palette-cans.mjs` (`allowedPalette`), `multi-angle.mjs` (`renderViews`, named angles incl. 135°/225°),
`src/color/palette-extract.mjs` (`decodeImage`), `src/artifact.mjs` (`assertArtifact`, the live AJV gate).

## 2. The current chain on disk — and why it is not the ticket

The runners chain **by file path**, cottage-only, in landed-order not ticket-order:

```
concept-materials/cottage/after-artifact.json          (E-21 input build)
  └─ spray:paint      → spray-paint/cottage/artifact.json     [seal → zone-fill → splat → coverage gate]
       ├─ value:select → value-select/cottage/artifact.json   [substitution white_terracotta→sandstone,
       │                                                       stone_bricks→tuff — applied AFTER the fact]
       └─ pattern:cottage → surface-pattern/cottage/artifact.json  [course fill + salt strip —
                                                               reads the spray-paint build, NOT value-select's]
```

Gaps vs the acceptance criteria:
- **No single command**; three runs in a specific undocumented order, and the two leaves **fork** —
  value-select and surface-pattern both consume the spray-paint artifact, neither consumes the other. No
  on-disk artifact is simultaneously value-true AND patterned.
- **Order mismatch**: the ticket composes value-true *before* the splat; today value-select substitutes
  *after* everything. Consequence of today's order: the spray-paint splat quantizes the concept against the
  OLD manifest (white_terracotta), and ZONE_POLICY dominants name the old blocks.
- **Cottage-only everywhere**: `spray-paint.mjs`, `value-select.mjs`, `surface-pattern.mjs` all hardcode
  cottage paths and `ZONE_POLICY` (spray-paint.mjs:73-89). No gatehouse path exists in any of the three.
- **Gate placement**: the coverage gate lives only inside spray-paint; the patterned (T-087) build was
  never coverage-gated as a final artifact (it adds/recolors after the gate ran).

## 3. Subject inputs available

| Input | cottage | gatehouse |
|---|---|---|
| Build artifact (E-21 lineage) | `concept-materials/cottage/after-artifact.json` | `concept-materials/gatehouse/after-artifact.json` — 8,076 placements, 5-block manifest (stone_bricks, cobblestone, deepslate_tiles, dark_oak_log, dark_oak_planks) |
| Concept PNG | `runs/014-vConcept-a-cottage/concept.png` | `runs/015-vBuilding-a-stone-gatehouse-…/concept.png` |
| Textured GLB | `glb/cottage.glb` | `glb/stone-gatehouse.glb` |
| Material map (roles + rationale) | `material-map/cottage.json` | `material-map/gatehouse.json` — 1:1 role→block (the E-21 "restored" subject; placementRules: walls / corners-edges / roof / trim / openings) |
| Existing zone policy | `ZONE_POLICY` in spray-paint.mjs | **none** — must be defined |
| Value-select record | `value-select/cottage.json` (committed) | **none** — must be computed |

Alternative gatehouse builds rejected from consideration: `building/best/artifact.json` (57k placements —
the [[surgical-edit-path-scale-limit]] scale, and a 4-block manifest missing the door planks) and
`material-correct/gatehouse/artifact.json` (same 8,076 placements as concept-materials but the
concept-materials after-artifact is the same lineage the cottage path standardized on).

Gatehouse structure notes (affect zoning): single-material wall body (stone_bricks) for both prospective
base/upper zones; cobble corners + under-eave band; dark roof (deepslate_tiles); timber arch ring + plank
door leaf (both low, in any "base" zone). The arch is a ground-touching air region (`openings` classifies it
as a door). `structuralZones` derives `storeyDivide` from `floorLines[1]` when ≥2 floor slabs exist, else
`minY+6`; `upperTop` from `floorLines[last]` when ≥3, else `+7`. Whether the gatehouse has detectable floor
slabs is unmeasured — but with base and upper sharing one dominant, divide placement is low-stakes; the
roof zone is membership+`upperTop`-based. Needs a live measurement, not new theory.

## 4. Determinism inventory (AC: "state how determinism is achieved")

Every stage in the default path is **deterministic given the committed inputs**: seal, structural zoning,
zoneFill, `quantizeToFace` (pure color math), GLB splat (mesh+texture decode → grid), paintFace/merge,
value-select cores (border estimate, sampling, selection — pure), surface-pattern ops, coverage gate, AJV.
**No LLM call is on the default path** — spray-paint's `--refine` is off by default and remains a stub; the
LLM-authored inputs (concept PNG, material-map roles, the design doc) are **committed upstream artifacts**,
i.e. frozen data, not run-time calls. Renders are PNG side-effects (gitignored), not inputs to any decision.
Known nondeterminism in the *neighborhood*: the resemblance **judge** (`claude -p`, metered) and GL render
byte-output (driver-dependent) — both evaluation/evidence, not build steps. So "fresh re-run reproduces the
result" is testable as record/artifact equality, modulo PNG bytes.

## 5. Triptych + before/after machinery

`resemblance.mjs` (`npm run resemblance -- --subject <s>`) owns triptychs: SUBJECTS registry (cottage,
gatehouse, moai, pineapple) → concept | GLB-silhouette | minecraft-render panels via the pure
`composeTriptych` (`src/form/resemblance.mjs`), writes `resemblance/<s>-triptych.png` (committed, not
gitignored) + perceptual row + metered judge verdict; `runResemblanceGate` is the exported per-subject
entry. Its registry currently points cottage at the **pre-E-24** build (`concept-materials/.../after-artifact.json`)
and gatehouse at `building/best/artifact.json` — "refreshed triptychs" implies re-pointing at the new final
artifacts. Whether the judge call can be skipped live (flag vs always-on) needs a check in its main() before
planning the refresh. The E-23 "splat-only skin" baseline is replayable deterministically (spray-paint §2b
builds `splatOnlyBuild` from `LEGACY_ZONE_MATERIALS`).

## 6. Documentation + handoff conventions

- `docs/knowledge/design-learnings.md` — append-style log; latest sections are the E-23 milestone narrative
  + the T-079-02 correction. The new **E-24 durable-results section** appends at the end; precedent style:
  bolded lesson paragraphs, honest over/under-reach, a one-sentence close.
- **E-12 handoff** — precedent `pr/assets/concept-materials.md` (+ copied frames under `pr/assets/frames/`,
  frames committed even where source renders are gitignored). A narrative md over committed records, with a
  per-subject table and named honest residuals.
- `.gitignore` — each runner gets a dedicated commented PNG-ignore stanza; durable record = `<subj>.{json,md}`
  + `<subj>/artifact.json` committed.
- npm script naming: colon-namespaced per concern (`spray:paint`, `pattern:cottage`, `value:select`).
- `npm test` = AJV self-test + `node --test src/**/*.test.mjs`; last known green at 1027 tests (T-087-01).

## 7. Concurrency hazard (named)

**T-090-01 (full-shell-zone-fill, E-25) is concurrently in `implement` phase** and its AC says "wired into
the spray-paint pipeline as a stage … behind the existing named `npm run`" — i.e. it will modify
`spray-paint.mjs` and possibly `zone-fill.mjs`. T-089-01's `depends_on` does **not** include T-090-01 — per
the workflow's missing-DAG-edge rule and [[parallel-roots-duplicate-shared-deps]], any T-089 design that
rewrites `spray-paint.mjs` collides head-on. T-087 already witnessed one such race on `zone-fill.mjs`.
This constrains the design space (consolidate *around*, not *inside*, spray-paint.mjs) — a design-phase
decision, recorded here as a research fact. Also a fact: T-090's 6-dir-exposure measurements show the
5-face wall-field fill leaves oblique roof-side cells grey (roof band 42.7% spruce by 6-dir census) — E-24's
coverage numbers are 5-face-census truths, honest within their stated measurement, and T-089 should not
silently re-baseline them.

## 8. Constraints & assumptions carried into Design

1. E-24 Rule 1 (pipeline reproduces, no hand edits), Rule 2 (re-run reproduces), Rule 5 (residuals named).
2. The seam invariant: pure cores in `src/` (unit-tested, no GL/IO), impure runners in `benchmarks/`.
3. Recolor/add-only ops; AJV (`assertArtifact`) on every shipped artifact; live-schema conformance
   ([[prompt-vs-live-artifact-schema]]).
4. GL renders are best-effort lenses; deterministic cores always run (`--offline` re-assert pattern).
5. Plaster-zone invariant (cottage): white_terracotta (or its value-true successor) is upper-only; base/roof
   surface plaster = 0 throw. Gatehouse has no plaster; the invariant is vacuous there.
6. The coverage gate threshold stays `DEFAULT_COVERAGE_THRESHOLD` (0.5) unless gatehouse evidence forces a
   per-zone case — T-088 review names heavily-secondaried zones as the known limit.
7. Value-true switches change dominants (cottage: upper→sandstone, base field→tuff per the committed
   record); any policy/gate keyed on block names must be derived through the substitution, and the unit-test
   fixture note in T-088 review (#4) anticipated exactly this.
