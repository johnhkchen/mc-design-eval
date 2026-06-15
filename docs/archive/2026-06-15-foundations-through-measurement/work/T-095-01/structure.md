# T-095-01 challenge-milestone — Structure

File-level blueprint. No new `src/` math: every build-transforming step is an existing unit-tested
pure core; all new code is one impure composing runner + registry data.

## Created

### `benchmarks/sculpture/challenge-milestone.mjs` (~420 lines) — THE runner
`npm run challenge:cottage|gatehouse|church` → `node … --subject <key> [--offline]`.

Internal organization (mirrors durable-skin.mjs / shell-integrity.mjs):
1. **Header** — the E-25 terminal contract: chain order, determinism rule, gate spawn, exit codes.
2. **Imports** — shell cores (`componentStrip, rebuildArtifact, openingRegions, fillVoids,
   plugClosure, closureCheck` from `src/view/shell-integrity.mjs`), `applyDeltas`,
   `buildSkin, SUBJECTS` from `./durable-skin.mjs`, provision cores (`voxelizeGlb`,
   `parseGlbColoredSurface`, `sampleSurfaceColors`, `classifyFeatures`, `assignFeatureBlocks`,
   `fallbackPalette`, `keysToArtifact`), `structuralZones`, `surfaceZoneHistogram`,
   `artifactOccupancy`, `decodeImage`, `assertArtifact`, crypto/fs/path.
3. **Consts** — `OUT_DIR=challenge/`, `FRAMES_DIR`, `OBLIQUE="-x-z"` (the durable witness angle),
   `MIN_DEPTH=3`, `MAX_PLUG_ITER=8` (T-091 values, op parameters), `GATE_LABEL="challenge"`.
4. **`EXTRAS`** — challenge-only registry data for the *existing* subjects:
   `{ cottage: { e23Before: "spray-paint/cottage/artifact.json" }, gatehouse: { e23Before:
   "building/best/artifact.json" } }` (the witnessed grey-roof / pink-patch states, D8). No church
   key here — all church data lives in its one durable-skin entry (AC3 grep hygiene).
5. **Helpers** — `decodeTexture` (dwebp bridge; the established runner-local idiom, 4th copy —
   noted), `tryRenderAngle` (best-effort GL lens), `sha()`, `writeArtifact()`.
6. **`provisionBase(def)`** — data-gated (D4): runs only when `def.provision` exists; GLB +
   committed map + `def.provision.scale` → feature-assigned artifact (pure-core composition,
   in-memory; AJV-asserted). Returns `{ artifact, stats }`.
7. **`shellStage(artifact)`** — T-091 chain on the in-memory base: strip → rebuild → zones/census
   → openings → fillVoids → plugClosure → closureCheck (throws unclosed). Returns
   `{ artifact, strip, voids, plug, closure }`. No `expect` pins (chain inputs ≠ witnessed inputs).
8. **`runChain(def)`** — the deterministic core: `[provisionBase] → shellStage → write
   challenge/<s>/{base-,shell-}artifact.json → buildSkin({...def, build:
   "challenge/<s>/shell-artifact.json", zoneMapRecord: null})` (the D5 uniform transform) →
   returns all stage results + the final artifact. Writes only the two intermediates (buildSkin
   reads `def.build` from disk — the file seam is deliberate; double-run overwrites identical
   bytes or the byte-compare fails).
9. **`main()`** — `--offline` re-assert (hashes, statuses, gate-record well-formedness, AJV) |
   live: `runChain` ×2 + byte-equality over base/shell/final → write `challenge/<s>/artifact.json`
   + sha256s → renders (final + `e23Before` at `OBLIQUE`, front, top) → frames
   `pr/assets/frames/challenge-<s>-{before,after}.png` → **spawn**
   `node multi-angle-gate.mjs --subject <s> --label challenge --artifact
   challenge/<s>/artifact.json` (stdio inherited; gate writes its own record + sheet) → read back
   `multi-angle/<s>-challenge.json` → assemble `challenge/<s>.{json,md}` → exit = gate's code.
   A deterministic-stage throw is caught → `challenge/<s>.json` gets
   `{ status: "pipeline-failed", stage, error }`, no artifact/sheet, exit 1 (D6).
10. **`renderMd(record)`** — the human record: chain table, zone-map diff vs committed record,
    gate verdict + per-view gaps, frames, reproducibility note.

Record schema `challenge-milestone/v1`: `{ subject, status: "gated"|"pipeline-failed", inputs,
provision?, shell: {strip, voids, plug, closure}, skin: {substitution, kit, zoneMap(+diffVsCommitted),
fill, splat, pattern, coverage, gates, bands}, reproducible: {doubleRun, sha256: {base?, shell,
final}}, gate: {outcome, gapCount, perView[], record, sheet}, before: e23Before?, renders, frames }`.

## Modified

### `benchmarks/sculpture/durable-skin.mjs` — registry data ONLY
Add `SUBJECTS.church` (D2): `key, build: "challenge/church/base-artifact.json"`, concept (run 016),
`glb: "glb/church.glb"`, `map: "material-map/church.json"`, `valueSelectRecord: null`,
`zoneMapRecord: null`, no kit, `policy`/`legacy` transcribed 1:1 from the committed church material
map's roles (comment cites the record), `plasterInvariant: null`, `frontDir/sideDir` from the
concept's canonical view, `provision: { scale: 48 }` (consumed by the challenge runner only —
`buildSkin` ignores it). Comment marks it THE E-25 challenge subject + the untuned contract.
No function bodies change. Consequence (documented): `zone:map`/`gate:multi` rosters now include
church; both need `build` on disk — committed in the same change as the first challenge run.

### `benchmarks/sculpture/material-map.mjs` — church row + generic filter (D3)
- `SUBJECTS` gains `{ key: "church", runDir: join(RUNS, "016-vBuilding-a-village-church-with-a-square-bell-tower") }`.
- New generic `--subject <key>` filter in `run()` (subject-agnostic; protects the committed
  cottage/gatehouse maps from accidental regeneration — documented in the header).

### `package.json`
`challenge:cottage` / `challenge:gatehouse` / `challenge:church` →
`node benchmarks/sculpture/challenge-milestone.mjs --subject <key>`. (`milestone:*` is taken.)

### `.gitignore`
Stanza for `benchmarks/sculpture/challenge/`: ignore `*.png` render outputs; keep records,
artifacts (the durable-skin stanza pattern).

### `docs/knowledge/design-learnings.md`
Append the **concept-faithful pipeline (E-25)** section (D9): full-shell lesson, concept-derived
zoning vs priors, the multi-angle gate, the church generalization result, over/under-reach.

## Generated (committed by the runs — no hand edits)

- `benchmarks/sculpture/material-map/church.{json,raw.json}` — one-time LLM pin (D3).
- `benchmarks/sculpture/challenge/<s>.{json,md}` ×3 — the milestone records.
- `benchmarks/sculpture/challenge/church/base-artifact.json`, `challenge/<s>/shell-artifact.json`,
  `challenge/<s>/artifact.json` — chain artifacts (AJV-valid).
- `benchmarks/sculpture/multi-angle/<s>-challenge.{json,md}` ×3 — gate records (gate-owned).
- `pr/assets/frames/multi-angle-<s>-challenge.png` ×3 (the contact sheets — AC2 evidence),
  `pr/assets/frames/challenge-<s>-{before,after}.png` (AC5; church: after only).
- `pr/assets/challenge-milestone.md` — the E-12 handoff (D9).

## Deleted
Nothing. Existing runners/records (shell-integrity, durable-skin, zone-map, gate baselines,
concept-materials) remain untouched measurement history.

## Boundaries & interfaces
- The challenge runner imports ONLY pure cores + the exported `buildSkin`/`SUBJECTS`; it never
  edits other runners' records. The gate is reached only through its CLI contract.
- The D5 transform `{...def, build, zoneMapRecord: null}` is the single registry mutation point,
  uniform across subjects; church-specific data exists in exactly one durable-skin entry +
  one material-map row + the (pre-existing) resemblance CHALLENGE_SUBJECTS entry.
- `npm test` is untouched by construction (no `src/` changes, runners never under the glob).

## Ordering constraints (drive plan.md)
1. material-map filter + church row → live church map → commit (pin first; registry transcription
   needs the map content).
2. challenge-milestone.mjs + scripts + gitignore (no church entry yet — runner works for
   cottage/gatehouse immediately).
3. Live cottage + gatehouse runs → commit records/frames (the before/after AC).
4. durable-skin church entry (+ policy transcribed from the committed map) + live church run →
   commit entry + base + records together (no window where zone:map's roster names a build that
   does not exist).
5. Docs: design-learnings + handoff + generalization grep record; `npm test`; RDSPI review.
