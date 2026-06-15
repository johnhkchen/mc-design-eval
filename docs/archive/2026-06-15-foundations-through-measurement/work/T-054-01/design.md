# T-054-01 — design: glb-voxel-breadth

Decide how to generalize the E-16 GLB-voxel build (koi+heart) to the full 7-subject E-17 sweep and emit
the R1 form-IoU table. Grounded in research.md.

## The decision in one line

**Add a new self-contained runner `benchmarks/sculpture/glb-voxel-breadth.mjs`** that loops the
already-proven pure core (`glbVoxelBuild`) over all 7 subjects, writes per-subject artifacts/renders/
scores under `glb-voxel/<subject>/`, and emits the durable **`glb-voxel/r1.{md,json}`** table. Reuse the
pure `src/` logic unchanged; keep the thin impure GL/host glue local to the runner. Do **not** modify the
E-16 `glb-voxel-run.mjs` or any `src/` module.

## Option A — extend `glb-voxel-run.mjs` in place to 7 subjects (rejected)

Flip `subjects = ["koi","heart"]` → 7 and add r1 emission.
- **Pro:** least new code; one runner.
- **Con (decisive):** conflates the E-16 record with the E-17 deliverable. `glb-voxel-run.mjs` is a
  committed E-16 artifact whose `summary.md` documents the *2-subject* head-to-head ("Real koi + heart
  GLBs…"). Overwriting it to mean "7 subjects" rewrites history and muddies which epic produced which
  number. It also changes a file outside this ticket's stated surface ("generalize the proven path"),
  not "edit the proven runner". Breaks the per-ticket-harness precedent (T-052-01, T-053-01 each added a
  *new* harness rather than mutating the prior one).

## Option B — extract shared impure glue into a module, both runners import it (rejected)

Pull `decodeTexture` (dwebp) + `judgeIoU` into e.g. `glb-render-util.mjs`; refactor both runners onto it.
- **Pro:** DRY; one copy of the host-tool glue.
- **Con:** to actually de-duplicate I must edit the committed E-16 runner — and that runner is GL/host
  code **not covered by `npm test`**, so a refactor regression is invisible to the suite and only catchable
  by a live re-render. The `parallel-roots-duplicate-shared-deps` lesson cuts the other way too: a shared
  dep deserves its own upstream ticket, not a drive-by extraction inside a breadth ticket. The duplicated
  surface is ~25 lines of well-understood, stable host glue. Cost of sharing > cost of duplicating here.
- The established precedent (research.md §2) is explicit: **reuse pure `src/` exports; each harness owns
  its own render/host glue.** `glb-voxel-surgical.mjs` follows exactly this — it imports the pure
  `formVerdictOf` but keeps its own GL glue. Option B violates the second half of that rule.

## Option C — new self-contained breadth runner (CHOSEN)

A new `glb-voxel-breadth.mjs` that:
1. reuses the **pure** `glbVoxelBuild` (+ `assertArtifact`, silhouette utils) from `src/` — zero core
   change, zero risk to the proven path;
2. carries its **own** thin `decodeTexture`/`judgeIoU` glue (the same ~25 lines `glb-voxel-run.mjs`
   already proved) — matching the "each harness owns its render glue" precedent;
3. iterates **all 7 subjects**, writing `glb-voxel/<subject>/{artifact.json,render-3q.png,summary.json}`
   (reusing koi/heart dirs, adding the 5 new ones);
4. emits **`glb-voxel/r1.{md,json}`** — the AC's 7-row table.

- **Pro:** zero risk to E-16 core and runner; matches the per-ticket-harness precedent; the E-16
  `summary.md` stays a faithful 2-subject record while R1 is its own durable artifact; the only "duplicated"
  code is stable host glue the project already treats as harness-local.
- **Con:** ~25 lines of glue exist in two files. Accepted — see Option B rejection. A future dedicated
  refactor ticket can consolidate if a third consumer appears.

**Why C over A:** separation of epochs (E-16 vs E-17) + precedent. **Why C over B:** avoids editing
GL-untested committed code; honors the "harness owns its glue" half of the DRY rule.

## Key sub-decisions

### D1 — Subject list as explicit `{key, glb}` rows
The runner declares the 7 subjects as `[{key:"dancing-man", glb:"dancing-man.glb"}, …]`. `key` is the
output-dir / table-row name; it equals the GLB basename for all 7 (research.md §3), so `glb` could be
derived, but listing it explicitly documents the mapping and survives any future rename. Sword is **not**
in the list (excluded by design); a one-line comment records why so the absence is legible, not a bug.

### D2 — "Occupancy count" = `artifact.placements.length`
The AC table column "occupancy count" is exactly the number of occupied cells, which is the number of
voxel placements (one per cell). Read it straight off `artifact.placements.length` — unambiguous and
independent of the render report's `placed` (which equals it when `unmapped===0`, but coupling the table
to the artifact is cleaner). Record it explicitly in `summary.json` as `occupancy`.

### D3 — Form IoU = the E-16 `judgeIoU`, byte-for-byte
Reuse the identical silhouette comparison: render silhouette (`extractSilhouette`/`normalizeSilhouette`/
`iou`) vs the GLB's own rasterized silhouette at `SCULPTURE_VIEW_3Q`. This is *the* E-16 metric, so koi
and heart must reproduce ~0.622 / ~0.877 — a free regression check that the breadth path is faithful.

### D4 — Scale fixed at `DEFAULT_SCALE` (32), overridable via argv
Mirror E-16 so the 2 reused subjects stay comparable and the sweep is one consistent rung. Accept an
optional `node …/glb-voxel-breadth.mjs [scale]` arg (validated by `glbVoxelBuild`'s own `assertScale`)
for future scale studies, defaulting to 32. (Memory: scale↔fidelity is form-dependent — but R1 is a
*fixed-scale* rung; scale sweeps are a later ablation, out of scope here.)

### D5 — Missing-GLB handling (AC #3): detect → optionally regenerate → note, never crash
All 7 GLBs are present, so this is a safety branch. If a subject's GLB is absent the runner records it as
`{subject, regenerated|skipped}` in the row and continues (skip-not-error, per the harness precedent). To
satisfy AC #3 literally without making the hot path depend on the network/secret, regeneration is
**opt-in** via a `--regen-missing` flag: only then does it shell to `trellis-glb.mjs <concept.png>
<glb>` (which reads `MODAL_ENDPOINT_URL` from `.env`, never printed). Default run = pure local; the r1
table notes any subject that needed regeneration. Concept-image paths come from the run dirs
(`runs/<NNN>-…/concept.png`) per the §3 mapping.

### D6 — Outputs: r1 is durable, renders are gitignored
`r1.{md,json}` + per-subject `artifact.json`/`summary.json` are committed; `render-3q.png` is already
covered by the existing `.gitignore` glob. The `.md` is the human table (subject | occupancy | form IoU,
plus scale/blocks/manifest for context); the `.json` is the machine record (array of summaries + metadata
+ method/view provenance + any regen notes).

### D7 — Side-effect-free import + small exported surface
`main()` behind the `import.meta.url === file://${process.argv[1]}` guard. Export `SUBJECTS`,
`buildR1` (pure rows→{md,json} formatter), and `runBreadth` so the logic is importable/inspectable —
consistent with the surgical harness. No suite test is added (the test glob is `src/**` only and the pure
core is already covered); the breadth runner is GL/host and stays out of CI by construction (AC #4: "no
new GL in the suite").

## What stays untouched
`src/form/glb-voxel-build.mjs`, `glb-voxelize.mjs`, `glb-silhouette.mjs`, `form-fidelity.mjs`,
`glb-voxel-run.mjs`, all `src/**` tests, and the schema. This ticket is **pure orchestration over proven
parts** — the lowest-risk way to ship a breadth rung.
