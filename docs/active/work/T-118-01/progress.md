# T-118-01 roof-form-seam — Progress

## Completed (all plan steps; commits on main)

1. **Step 1** `748b849` — `normalizePlacement` extracted from form-fidelity's resampleInto
   (one letterbox definition); +5 tests; suite green unchanged.
2. **Steps 2–3** `21b9b3c` — `src/view/roof-region-diff.mjs` pure core: `roofRegions`
   (gable-parametric partition ridge/ends/eaves/slopes + unpartitioned fallback),
   `projectRegions` (exposed cells under the build's own framedCamera; per-column wallTop),
   `attributeMismatch` (XOR under the cage's normalization; multi-source BFS nearest-region;
   partition-total invariant), `heightProfiles` (ridge + rakes, GLB sampled from aligned
   triangles; raw + eave-relative), `roofRegionDiff` (record assembly). 20 synthetic tests.
3. **Step 4** `be5b8b3`-adjacent — runner `benchmarks/sculpture/roof-diff.mjs` (`npm run
   diff:roof`), SUBJECTS-iterated, double-run sha256 + `--repro`, overlay PNGs (gitignored) +
   committed contact sheets + per-record `.md`; gitignore + package.json entries.
4. **Step 5** `be5b8b3` — fleet run: 6 measured records (3 subjects × 2 paths), 2 barn skip
   records naming the missing committed inputs. Sheets eyeballed before trusting numbers.
5. **Step 6** `3dcaf33` — committed findings (`benchmarks/sculpture/roof-diff/findings.md` +
   work-dir copy): per-subject region attribution behind the failing verdicts; gatehouse 315°
   decomposed (parapet band, not ridge height).
6. **Steps 7–9** `ad18214` — the findings-gated refit wave: `fitRidgeLine` evidence repair
   (footprint-cols sampling, protrusion exclusion dilated 1 cell, dominant-line selector with
   named `spike`); wired at both call sites (roof-program with `chimneyColumns`, provision-fit
   with record protrusion masses); +3 tests; roof-program re-run ×3 with placements asserted
   byte-identical; before copies in `artifacts/before/`; findings AFTER section with the
   before→after apexLine table.
7. **Step 10** — close-out: `npm test` 1575/1575; `diff:roof -- --repro` 6× repro-pass;
   roof-program `--repro` PASS ×3; importer audit (changed modules never reach legacy
   sculpture paths); no subject names in new code; no judge/sdk imports.

## Deviations from plan (each argued, none silent)

- **Self-calibration (step 4)**: instrument IoU is close to (±0.015) but not equal to the cage's
  recorded `swap.iou.final` — the cage measured the swap-time shell, the instrument measures the
  final committed artifact (post-terminations/skin). The lens is the same; the object differs.
  Documented in the runner header instead of forcing equality.
- **Ridge region definition**: nominal `ridge.y` made the instrument ridge-blind exactly where
  the ridge is wrong (cottage: fitted planes never reach the recorded ridge). Changed to the
  achieved-surface max band before the fleet run.
- **The refit list inverted under the findings** (E-30 Rule 2 working as intended): cottage
  ridge height and verge tips are RIGHT; gatehouse ridge tracks the GLB and the invalid
  intersect's impossibility is NAMED (resolving it would lower a correct ridge); the justified
  repair was the apex-EVIDENCE pollution the diff exposed (chimney/parapet/tower winning
  `fitRidgeLine`'s cluster). No constructive rungs were built — building them blind is the
  exact failure mode the epic names. Movement is therefore record-level (apexLine corrected),
  proven by the before/after table; build placements are intentionally byte-identical.
- **`fitRidgeLine` selector** went beyond the planned exclusion: column exclusion alone could
  not beat GLB protrusions wider than the recorded build columns; the dominant-line selector
  (longest contiguous within the existing `apexGap`; rejected higher cluster recorded as
  `spike`) fixed it without new tunables.
- **Generated-path records not refreshed**: `generated/<s>/provision-fit.json` keeps old
  apexLine values — re-running that chain re-judges (S-121 owns verdicts). The code path is
  repaired for all future runs.
- **Barn skip reason** is the missing-inputs list (registry zone-map/kit pins exist on disk
  since T-116, so the pin-absent clause does not fire); the T-117 linkage lives in findings
  prose, data-true either way.

## Concurrency note

Sibling sessions were live in this working tree during implement: T-119-01 landed (`ff63d6a`,
`cb59dea`) between my findings and refit commits; T-117-01 has a complete work dir (review at
07:45). Unstaged sibling edits (zone-map.mjs, kit-extract.mjs, multi-angle-gate.mjs,
styled-milestone.mjs) were left untouched; all my commits staged file-by-file.

## Remaining

Nothing for this ticket. Standing follow-ups named in findings for S-121/E-29: generated
cottage cross-ridge (−3.445), gatehouse parapet band (the 315° driver), church porch mass;
barn picked up by the instrument automatically once its chain records exist.
