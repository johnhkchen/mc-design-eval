# builds/ — the unified-chain DRAFT home

**Location encodes status (E-37 / T-155-01).** Everything under `builds/` is a **draft**: a creation
artifact in the E-36 *free zone*. Drafts regenerate freely — **no pin-guard** applies here (the guard's
allowlist is the `measurements/` + ratified `packs/` prefix; `builds/` is frozen by *nothing*).

One subject, one self-contained directory:

```
builds/<subject>/            # <subject> = <key> or <key>--<style> (buildRels runKey)
  seed-artifact.json         # the generate-first seed the workshop iterates
  ledger.json  ledger.md     # the workshop loop record (paint + relief rounds)
  final-artifact.json        # the delivered build
  build.json   build.md      # the chain receipt (recognition→seed→workshop→final shas)
  renders/                   # gitignored — image-heavy, regenerable per run
```

Written by the unified chain (`npm run build:<subject>` → `benchmarks/sculpture/build.mjs`, paths from
`buildRels` in `src/workshop/seed.mjs`). The architecture of record is
`docs/knowledge/pipeline-philosophy.md`: **creation is free, measurement is frozen.** Frozen records live
under `measurements/`; dead code lives under `_archive/`.
