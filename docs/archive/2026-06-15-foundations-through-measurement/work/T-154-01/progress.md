# T-154-01 — Progress (unify-chain)

## Status: Implement complete (deterministic spine proven live; metered loop is the billed step)

### Commits (on `main`)
1. `feat(T-154-01): artifact-base workshop seed — loop, replay, articulate` — Steps 1–4 (pure core).
2. `feat(T-154-01): workshop runner accepts --seed-artifact (artifact-base seed)` — Step 5.
3. `feat(T-154-01): build.mjs — one entry point (recognize→generate-seed→workshop→final)` — Step 6.
4. (this artifact + STRUCTURE.md) — Step 8.

### Steps vs plan
| step | what | state |
| --- | --- | --- |
| 1 | `articulateArtifact` (artifact-input relief twin) | ✅ + test AA1 |
| 2 | loop `seedArtifact` mode (paint-only surface revision) | ✅ + tests AB1–4 |
| 3 | replay/offline artifact-base branch (`replaySeedArtifact`) | ✅ + tests AR1–3 |
| 4 | `BUILD_BUDGET` + `buildRels` (build path/budget seam) | ✅ + test AS1 |
| 5 | workshop runner `--seed-artifact` (declarations from recognition; paint-only; `<key>-build` ns) | ✅ syntax + isolation green |
| 6 | `build.mjs` orchestrator + `build:{cottage,barn}[:repro]` scripts | ✅ usage guard + self-grep clean |
| 7 | live proof | ✅ deterministic spine (see below); ⏸ metered workshop loop = billed step |
| 8 | `STRUCTURE.md` | ✅ |

### Test state
`npm test` → **2138/2138 green** after every src-touching step (was 2127; +11 from the new
`seed-artifact.test.mjs` and isolation/seed assertions). The workshop **isolation test** stays green
(no judge seam added to `workshop.mjs`/`build.mjs`). No per-building constants; subscription shim only.

### Live proof (Step 7) — real artifacts, real GL, NO model spend
Ran on the **committed** cottage seed (`generated/cottage/artifact.json`, 6306 placements, 9 blocks)
+ **committed** recognition (`recognition/cottage.program.json`), pack `rustic`:
- declarations derive from the recognition via `compileProgram` (`bands,symmetry,openings`) — data-driven.
- the artifact-base loop runs on the real seed (synthetic exchange: paint **accepted**, then `done`);
  `ledger.seedArtifact` carried.
- **replay byte-identical** (`serializeArtifact(replay) === serializeArtifact(final)`) — the AC#5
  determinism, artifact-anchored.
- `renderBesideConcept(seed, concept)` produced a real 5-panel PNG (`/tmp/t154-beside-cottage-seed.png`,
  568 KB) — the E-36 judge-free glance works on the seed.

### Deferred to the billed creation run (named, not hidden)
The **live metered workshop loop** (Stage 5 critique on the real subscription model) is not run in this
autonomous pass — it is a metered spend, exactly parallel to this ticket's own rule that **the gate is
a separate billed step**. The loop's logic is fully covered by the unit tests (AB/AR) and the live
integration proof above (real seed + real source + byte-identical replay). To produce the committed
unified-chain record for a subject, an operator runs:

```
npm run build:cottage          # recognize → generate-seed → workshop (metered) → final beside concept
npm run build:cottage:repro    # prove the deterministic stages reproduce
```

This writes `build/cottage.json|.md`, `workshop/cottage-build/{final-artifact.json,…}`, the
`<key>-build` ledger, and `pr/assets/frames/beside-concept-cottage-build.png`. The committed
pattern-book program-seed ledger at `workshop/cottage.json` is untouched (distinct `-build` namespace).

### Deviations from the plan
- **Spawn, not import, for generate-seed** (Structure §Orchestration): `build.mjs` spawns
  `generated-milestone.mjs --skip-gate` rather than importing its core — avoids the "import runs
  main()" hazard and any refactor of the generate-first runner (one realizer, untouched).
- **`-build` record namespace** (added in Step 5): the unified ledger writes under
  `workshop/<key>-build` so it never clobbers the committed pattern-book ledger; the program-seed
  records stay replayable until S-156 archives them. `buildRels` extended accordingly (test updated).
- Steps 1–4 landed as **one** commit (one cohesive test file), not four — the pure core is tightly
  coupled and was greener verified together.

### Open items for Review
- The metered live run (above) — operator/billed.
- Declarations come from the recognized program while the seed geometry is generate-first's; round-0
  `before` conformance may carry baseline findings (the cage rolls back only regressions). Named in
  `design.md`/`structure.md` as the expected "cleaner seed, surface-refining loop" difference.
- S-156 will archive the retired pattern-book/terminal-chain runners; S-157 adds the STRUCTURE.md
  enforcement test. Both out of scope here.
