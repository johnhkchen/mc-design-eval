# T-103-01 component-decomposition — Progress

Implementation tracked against plan.md's 10 steps. All code steps complete and committed; full
suite green (1274 pass / 0 fail).

## Step log

| step | what | commit | status |
| --- | --- | --- | --- |
| 1 | `openings()` withCells opt-in seam | `6b538fe` | done — default path byte-identical, 14/14 structural-read tests |
| 2 | core skeleton: plane LSQ, run codec, heightfield, median | `bce40a4` | done |
| 3 | `segmentMasses` — height classes, protrusions, junctions | `0ada03a` | done (deviation 1) |
| 4 | `roofPlanes` — region grow, eaves, ridges | `76538bc` | done (deviations 2, 3) |
| 5 | `wallSlabs` + `openingGroups` — modal depth, head/jamb lift, arch flag | `a76791e` | done |
| 6 | `component-glb-fit` — triangle stats, alignments, per-plane fits | `d0bc267` | done (deviation 4) |
| 7 | `decompose` orchestration + `component-record/v1` schema | `d997801` | done (deviation 5) |
| 8 | runner + npm scripts + .gitignore | `c00d939` | done |
| 9 | three subject records + evidence frames, `--offline` re-verified | `858b17b` | done |
| 10 | review.md | — | this phase |

Module tests: 23/23 component-decompose, 5/5 component-glb-fit, 14/14 structural-read (1 new).
Net new test count over the ticket: +29.

## Deviations from plan

1. **Mass segmentation gained a protrusion ring-outlier pass** (step 3). The design's gap-clustered
   height classes alone let chimney-class single-column outliers ride along with the primary mass on
   raw shells; a pre-pass that flags columns standing ≥3 above their 8-neighbor ring as protrusion
   candidates made the chimney detection robust on both raw and regularized inputs (the tolerance AC).
2. **roofPlanes BFS growth is angle-gated** (step 4). Plain residual-gated growth (design D3.1,
   residual ≤1.25) snaked across hip lines — a pyramid segmented as one plane. Growth now also
   requires local orientation agreement (`growAngleDeg`, default 35°); the pyramid fixture segments
   to its 4 planes.
3. **Seam-band absorption added between dissolve and merge** (step 4). One-cell boundary bands at
   plane seams survived as fragment regions; they are now absorbed into the adjacent plane of
   minimum residual before the merge pass.
4. **`glbFitForPlane` fits from the area-weighted mean normal, not centroid LSQ** (step 6). The
   designed centroid-anchored LSQ + normal-cone filter returned null on the synthetic gable fixture
   (cone too aggressive around a noisy centroid estimate); seeding from the area-weighted mean
   triangle normal recovers the plane (<1° on the fixture).
5. **Step-7 schema validation initially failed 1/23** — the GLB fit was not attached to a roof plane
   (`roof-1`) whose extent fell outside the aligned triangle pool in the test mesh; root-caused and
   fixed; 23/23 since.

## Input resolution (note, not a deviation)

T-102 landed first, so the runner's preferred input — the regularized shell
(`regularize/<subj>/artifact.json`) — was live for all three subjects and is what the committed
records pin (sha256 recorded per record). The raw-shell fallback and `--shell` override keep the
ticket DAG-independent as designed.

## Acceptance criteria

- [x] Component-record schema + decomposition core, pure/deterministic/unit-tested on synthetic
      shells: masses (primary/attached/protrusion + junction surfaces), roof planes (normal, extent,
      eave, ridge), wall slabs, opening groups (head/jamb, arch candidates). Tolerant of raw and
      regularized shells (median analysis surface + ring-outlier pass).
- [x] Per-subject records committed with evidence renders: cottage (7 pitched + 1 flat plane —
      2 dominant gable planes split at the ridge in the render — chimney as `protrusion/protected`),
      gatehouse (4 wall slabs, roof planes, **2 arch candidates** in the gate opening group),
      church (tower + nave as separate masses with their own roof forms; 5 masses, 17 planes).
      Frames: `pr/assets/frames/components-{cottage,gatehouse,church}.png`.
- [x] Single contract: `component-record/v1`, `schema/component-record.schema.json`, ajv-gated in
      the runner and in unit tests; no consumer-specific variants.
- [x] Registry-only (no subject constants in code); `npm run components:{cottage,gatehouse,church}`
      (+ `--offline` re-assert); `npm test` green (1274/1274).

## Evidence summary

- Determinism: double-run record bodies byte-identical for all three subjects (sha256s in each
  record .md); `--offline` re-asserts all three committed records (shell hash + ajv + minimums).
- Pinned minimums all met: cottage ≥2 pitched planes (7), ≥1 protrusion (1), ≥1 ridge (2);
  gatehouse ≥1 arch candidate (2); church ≥2 masses (5), ≥2 roof planes (17).
- Honest findings recorded, not hidden: `glb-fit-missing` on fragment planes, `slab-low-coverage`
  on raw-skin walls (0.36–0.45 cottage). Named residuals carried to review.md.
