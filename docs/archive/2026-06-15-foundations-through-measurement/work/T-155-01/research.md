# T-155-01 — Research (one-artifact-home)

Epic **E-37** / Story **S-155**. Make **location encode status**: a thin-context agent should know
draft-vs-frozen-vs-dead by *where a file lives*, not by reading the pin-guard's hand-list. Descriptive
map of what exists today.

## The status distinction exists in CODE, not in the TREE

E-36 (T-151-01) established the rule the tree must now express:
- **DRAFT** = a creation artifact; rewrites freely even when git-tracked.
- **FROZEN** = a measurement (or input-of-record to one); rewrites only behind `--rotate-pins`.
- **DEAD** = retired from the live path (S-156 populates `_archive/`).

Today that line lives in `src/form/pin-guard.mjs` as `INSTRUMENT_ALLOWLIST` — a **hand-list of five
match-functions** (lines 48–60), each a `rel.startsWith(...)` or suffix regex. A path is FROZEN iff it
matches the allowlist **AND** is git-tracked (`guardedWriteRecord`, line 176; `preflightPins`, line
135). The five entries:

1. `benchmarks/sculpture/multi-angle/` — judge verdict records (gate verdicts).
2. `packs/` minus `packs/drafts/`, `.json` — ratified style packs.
3. suffix `-(baseline|baselines|milestone).(json|md)` ANYWHERE — committed baselines/milestones.
4. `benchmarks/sculpture/retired-pins.json` — the rotation registry.
5. `benchmarks/sculpture/kit/` — the ratified building-block kit (input-of-record, E-36 honesty clause).

The frozen files are **scattered through `benchmarks/sculpture/`**, interleaved with drafts — the same
subject's draft (`generated/cottage/artifact.json`) and frozen verdict (`multi-angle/cottage-styled.json`)
sit in sibling directories. Status is invisible in the path.

## Frozen-record inventory (tracked; the migration set)

| Class | Count | Current location(s) |
| --- | --- | --- |
| **Gate verdicts** | 40 json/md | `benchmarks/sculpture/multi-angle/*.{json,md}` (excl. `fixtures/`) |
| **Baselines / milestones** | 21 | scattered: `benchmarks/sculpture/{cleanliness,form}-baseline.*`, `multi-angle/cottage-baseline.*`, `pattern-book/{facade-baselines,facade-milestone,proportion-baselines,proportion-milestone}.json`, `reconstructed/{church,cottage,gatehouse}/e26-baseline.json`, `visibility/cottage-baseline.*`, `pr/assets/*-milestone.md` (6) |
| **Kit** | 12 | `benchmarks/sculpture/kit/*.{json,raw.json,md}` |
| **Retired-pins** | 1 | `benchmarks/sculpture/retired-pins.json` |
| **Packs** | 31 | `packs/*.json` — already a clean top-level home; **stays** |

Total to relocate under `measurements/`: ~74 files. Packs stay put (AC#2 names `measurements/` **+
ratified `packs/`** — `packs/` is already location-encoded, `packs/drafts/` being the draft exception).

## Where the paths are CONSTRUCTED (the call sites that must follow the move)

The frozen paths are **not centralized** — they are string-built at many sites:

- **multi-angle/** (gate verdicts): `multi-angle-gate.mjs` (lines 302, 632–633, 774–775),
  `styled-milestone.mjs:221`, `reconstructed-milestone.mjs:225`, `challenge-milestone.mjs:534`,
  `component-skin.mjs:182`, `visibility-witness.mjs:83`, plus calibration sinks
  (`budget-calibration.mjs:31`, `relief-calibration.mjs:45`). Also the **fixtures** subtree
  (`multi-angle/fixtures/hut/*`) is referenced by `multi-angle-gate.mjs:100–103` and is **draft test
  scaffolding, NOT a verdict** — must stay a draft.
- **pin-guard.mjs**: `INSTRUMENT_ALLOWLIST` (the allowlist itself) and `GATE_RECORD_NAMESPACES`
  (line 71 — the judge-isolation namespace, also `multi-angle/`).
- **kit/**: registry data (`def.kit` / `def.kitRecord`, e.g. `dress-openings.mjs:58`) + `kit-extract.mjs:76`.
- **baselines/milestones**: each owning runner embeds its literal (e.g. `measured-proportions.mjs`,
  `facade-milestone.mjs`, `reconstructed-milestone.mjs`, the milestone writers under `pr/assets/`).

## The build-chain draft home (AC#1) — clean, nothing committed yet

`buildRels(key, packRel)` in `src/workshop/seed.mjs:96` currently derives the unified chain's outputs to
`benchmarks/sculpture/workshop/<key>-build/...` (seed-artifact, ledger, final) and
`benchmarks/sculpture/build/<key>.{json,md}` (the receipt). **Nothing is committed under `build/` or
`workshop/*-build` yet** (`git ls-files` empty) — so redirecting `buildRels` to `builds/<subject>/` is a
pure code change with no file migration and no pin-guard interaction (drafts).

`chainRels`/`recognitionRels` (the **program-seed** pattern-book chain + recognition) are draft homes
too, but they hold committed program-seed ledgers that S-156 will archive; **out of scope here** — this
ticket touches only the unified `build` chain's draft home + the frozen-record move.

## Tests that pin these paths (the green-suite constraint, AC#5)

`npm test` reads frozen-record paths in: `src/form/pin-guard.test.mjs` (asserts each allowlist family by
literal path — lines 235–263, the `G1 isInstrumentPath` table; gate-namespace tests 186–310),
`pin-guard.conformance.test.mjs`, `material-vocabulary.{test,conformance.test}.mjs`,
`brush-door.conformance.test.mjs`, `visibility-monotone.test.mjs`, `isolation.test.mjs`,
`opening-dressing.test.mjs`, `facade-milestone.test.mjs`. A move that changes a path breaks every test
asserting the old literal — they migrate **together with** the files.

## .gitignore coupling

`.gitignore` has many per-subject render rules keyed to the old tree, notably
`benchmarks/sculpture/multi-angle/**/*.png` with a `!.../fixtures/**` un-ignore (lines ~123–126). Moving
`multi-angle/` requires moving those ignore rules to the new prefix or renders re-enter the index.

## Reproducibility surface (AC#3)

"Bytes unchanged / re-derives unchanged" is preserved structurally: `git mv` is a rename (identical
bytes, history kept); the runners that re-derive a verdict (`--repro`/`--offline`/replay) keep the same
serialization code — only the path constant changes. The replay/conformance **tests** that re-read the
committed bytes are the in-`npm test` proof; the GL+spend gate re-derivations (`gate:*`) are on-demand and
proven by their own `--offline`/`--repro` flags, not by `npm test`.

## Constraints / assumptions

- `git mv` preserves bytes and history — the identity-class discipline (E-37 Rule 1) is satisfied by
  construction; no file is re-serialized.
- The `multi-angle/fixtures/` subtree is **draft scaffolding**, not a verdict — it must NOT move into the
  frozen `measurements/` prefix (or it would freeze a test fixture).
- `GATE_RECORD_NAMESPACES` (judge isolation) must track the new gate-verdict location in lockstep with the
  allowlist, or the workshop-isolation refusal stops matching.
- Packs already satisfy "location encodes status"; only the `benchmarks/sculpture/`-buried frozen records
  need relocation.
- The blast radius is wide but mechanical: ~74 file moves + ~12 call sites + ~9 test files + `.gitignore`.
  The risk is a half-migrated class leaving a dangling path (caught by `npm test`).
