# T-094-01 — subject-roster-refresh — Research

Phase artifact 1/6 (RDSPI). Descriptive only: what exists, where, how it connects.

## 1. The ticket in one sentence

Retire moai from the measurement roster (bad concept → ambiguous verdicts), and provision a
never-seen challenge subject (`church`) — concept image + sanity checklist + textured GLB +
voxelization smoke-check + a paths-only registry entry — so the E-25 building pipeline can later
run it untuned (E-25 Rule 3: generalization needs a subject the code has never seen).

## 2. Where moai lives today

### 2.1 The roster named by the AC — `benchmarks/sculpture/resemblance.mjs`

- `SUBJECTS` (lines 64–95): `gatehouse`, `cottage`, `moai`, `pineapple`. Each entry:
  `{ key, glb, concept, artifact, committedRender }`, paths relative to the sculpture root.
  Header comment (line 60–63) calls it "the immutable-reference registry (Rule 1)" and names
  moai + pineapple as "the two sculpture form-type poles".
- Exported at line 301 (`export { SUBJECTS, resolveSubject }`); the only importer is
  `benchmarks/sculpture/resemblance-consolidation.mjs` (line 29), whose default run iterates
  `Object.keys(SUBJECTS)` (line 159) — removing moai from the object shrinks the default
  consolidation sweep from 4 subjects to 3, which is the intent. Its header comment (line 3)
  also names moai.
- `resolveSubject(def)` (line 98) joins every field against `HERE` — a `null` field would
  `TypeError` in `join()`. Relevant to where/whether a partial `church` entry can sit in
  `SUBJECTS` proper (it has no build artifact yet, by design).

### 2.2 Building-pipeline rosters — moai is NOT in any of them

- `durable-skin.mjs` `SUBJECTS` (line 94): cottage + gatehouse only (build/map/policy/records).
- `multi-angle-gate.mjs` `GATE_SUBJECTS` (line 70): spreads durable-skin's `SUBJECTS` +
  `synthetic-hut` fixture. No moai.
- `shell-integrity.mjs` `SUBJECTS` (line 54): cottage + gatehouse. No moai.
- `material-map.mjs` `SUBJECTS` (line 37): array of `{key, runDir}` — gatehouse (run 015) +
  cottage (run 014). No moai. NOTE: its `main` loops over ALL entries, so adding church here
  would change what `npm run material:map` does on its next live run.

So the only registry edit required for retirement is `resemblance.mjs` (plus its header
comment and the consolidation runner's stale comment).

### 2.3 Other moai references (history — untouched per AC)

- Scale-study/e18/e19/sweep benchmarks under `benchmarks/sculpture/` reference moai run dirs
  and artifacts; these are committed history, explicitly out of scope ("Scale-study history and
  artifacts on disk untouched").
- `src/sculpture.test.mjs` / `src/building.test.mjs` use the literal string "moai" only to
  exercise pure prompt/spec builders (e.g. `assertSculptureSpec({subject:"moai"...})`) — no
  registry import; retirement cannot break the unit suite.
- `glb/moai.glb` on disk (gitignored) + manifest row in `glb/README.md` — history, stays.

## 3. The vConcept building-mode concept path (how gatehouse run 015 was made)

`npm run bench:building` → `benchmarks/sculpture/run.mjs --mode building`:

- **Stage 1** — design doc: `composeBuildingDesignDocPrompt({subject, scale})`
  (`src/building.mjs:141`) → metered `claude -p` shim (`requestText`). Output saved as
  `design-doc.md` in the run dir.
- **Stage 2** — concept image: `runBamlConcept(...)` (run.mjs:87) spawns
  `npx tsx benchmarks/sculpture/baml-concept.mts` with a JSON job on stdin:
  `{ designDocPath, images, targetBlocks, model:"pro", outPath, variant:"building" }`.
  `variant:"building"` selects the BAML `BuildingConceptPrompt` (single building, single 3/4
  view, in the round); the composed prompt text goes to Nano Banana via
  `generateImage` (`src/nano-banana.mjs:28`, `NANO_BANANA_PRO = gemini-3-pro-image-preview`),
  which reads `GEMINI_API_KEY` from the environment (gitignored `.env`; key names confirmed
  present in `.env`: `GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`).
- **Stage 3** — metered 3-D build (claude, multimodal on the concept) + GL render + turntable.
  NOT needed by this ticket's AC (the challenge subject must have no build yet).
- Run-dir naming: `runIdForBuilding(seq, subject)` (`src/building.mjs:108`) →
  `runs/NNN-vBuilding-<kebab-subject>/`; `nextSeq()` scans `runs/` (next is **016**).
  Sculpture `runs/` are committed (only `temple-facade/runs/` is gitignored).
- Scale: `BUILDING_DEFAULT_SCALE = 48`, envelope 16–96 (`src/building.mjs:42-44`). The
  gatehouse smoke-check precedent used @48.
- Precedent for a concept-only one-off: `benchmarks/sculpture/building-concept.mjs` — the
  E-20 de-risk helper that produced the cottage concept (inline prompt → Nano Banana flash),
  documented in `glb/README.md` as a "one-off helper". The formal mode (gatehouse) ran the
  full `bench:building`.

## 4. The TRELLIS GLB path

- `benchmarks/sculpture/trellis-glb.mjs` — CLI + `generateGlb`/`inspectGlb`. POSTs
  `{image: b64, decimation_target:150000, texture_size:1024, seed:42}` to
  `MODAL_ENDPOINT_URL` (never printed); returns raw GLB; validates glTF magic.
  Usage (per `glb/README.md`): `set -a; . ./.env; set +a; node benchmarks/sculpture/trellis-glb.mjs <concept.png> glb/<name>.glb`.
  Requires real network — the ticket says run unsandboxed.
- `.gitignore` line 24: `benchmarks/sculpture/glb/*.glb` — binaries gitignored; the durable
  record is the `glb/README.md` manifest (verts/tris/size + provenance + smoke-check notes).
  9 GLBs on disk today (7 sculpture + cottage + stone-gatehouse).
- Known failure mode (memory + README): thin/elongated subjects 500 (sword ×4). A church
  with a thin spire/cross would risk this — the AC pre-empts it ("bulky throughout").
- TRELLIS cold start: minutes (the CLI warns).

## 5. Voxelization smoke-check building blocks

- `voxelizeGlb(glb, {scale})` (`src/form/glb-voxelize.mjs:83`) — solid occupancy via parity
  ray-casting; returns `{scale, voxelSize, dims, bounds, occupied:Int32Array, count}`.
  "Longest mesh edge ≈ scale voxels" — the vConcept convention.
- `componentLabels(occupancy, {connectivity: 6|26})` (`src/form/voxel-components.mjs:51`) and
  `strayVoxelStats(occupancy, {connectivity})` (line 99) — the latter returns
  `{components, largestCount, largestFraction, strayCount, subFloorCount}`; doc-comment
  explicitly: "TRELLIS debris shows as extra components".
- Precedent numbers (gatehouse, recorded in `glb/README.md`): voxelized @48 → dims 41×48×41,
  27,620 cells, **1 component at 26-conn, largestFraction 1.0000**; 6-conn fragments to 26
  components / 0.83 — a thin-shell surface artifact, called out as NOT a form defect. The
  moai failure this gate exists to catch was *two masses* (multi-statue concept).

## 6. The concept sanity checklist

No checklist artifact or code exists today. The AC defines its six items (single building ·
clean background · one canonical 3/4 view · ≥3 material zones · readable silhouette · no
clutter) and requires it "recorded beside the image" — i.e., a file in the run dir next to
`concept.png`. The judging is human/agent visual inspection (this session can read the PNG).
E-25 Rule 2: once registered, the concept is immutable — regeneration only before registration.
Related history: moai's concept (`runs/003`) shows three statues — exactly the checklist's
first item; gatehouse pro run produced a white background despite the prompt's #000000
(TRELLIS's rembg coped; README recommends black-bg regen if segmentation struggles).

## 7. Where a `church` registry entry could live (facts only; choice is Design's)

- `resemblance.mjs SUBJECTS` — the file the AC names for retirement. Entries require
  `artifact` + `committedRender`; church has neither (no build exists, by design), and
  `resolveSubject` + the consolidation default loop would crash on nulls/missing files.
- `durable-skin.mjs SUBJECTS` — entries require build/map/records/policy; `zone-map.mjs`
  iterates all keys (`--subject all`, line 97). A partial church entry breaks those runs.
- `material-map.mjs SUBJECTS` — `{key, runDir}` only, but `main` runs ALL entries live.
- `glb/README.md` — the existing durable manifest for every GLB (provenance + smoke-check
  notes); a church row is required there regardless.
- The AC's requested shape — concept path, GLB path, **scale** — matches none of the existing
  rosters exactly (none records scale today).

## 8. Verification & journal surfaces

- `npm test` = artifact validator self-test + `npm run test:unit` (node --test; 1084 tests as
  of T-092). No unit test imports any benchmark roster — registry edits are runner-level.
- Journal: `docs/knowledge/design-learnings.md` (exists; E-24 section is the tail). The AC
  wants: why moai was retired, the checklist, the church registration.
- Work dir for this ticket did not exist before this session; no concurrent T-094 commits in
  the last hours (double-dispatch check done).

## 9. Constraints carried into Design

1. Secrets: `GEMINI_API_KEY` / `MODAL_ENDPOINT_URL` sourced from `.env`, never printed/committed.
2. E-25 Rule 2: concept immutable after registration → checklist gate BEFORE GLB + registry.
3. E-25 Rule 3: zero pipeline-code changes for church — data/paths only; nothing that makes
   existing runners behave differently until a future ticket deliberately runs church.
4. Bulky-throughout subject phrasing (no spire/cross) to dodge the TRELLIS thin-subject 500.
5. GLB gitignored; the manifest + smoke-check record are the durable evidence.
6. Moai retirement must be visible (commented/RETIRED block + rationale), not a silent delete.
