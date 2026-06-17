# T-183-01 — Plan

Ordered, independently-verifiable steps. Model-free throughout (deterministic mutation + GL render +
schema validation). Commit after each green unit.

## Step 1 — Schema
Write `schema/style-corpus.schema.json` (draft 2020-12) per structure §1. Inline `cellType`/`subject`/
`intendedFaithfulness` enums; `additionalProperties:false` on states; `states` minItems 8.
**Verify:** `node -e "JSON.parse(require('fs').readFileSync('schema/style-corpus.schema.json'))"` parses;
Ajv compiles it (covered once the loader exists). Commit.

## Step 2 — Loader
Write `src/workshop/style-corpus.mjs` per structure §3, copying the `defect-corpus.mjs` idioms
(memoized Ajv2020 strict, parse-returns-value, fail-fast load, semantic asserts incl. the **coverage**
assert: 4 crux types + ≥2 hard-middle + ≥3 subjects). Export the partition helpers.
**Verify:** `node -e "import('./src/workshop/style-corpus.mjs').then(m=>console.log(Object.keys(m)))"`
loads without throwing on the schema (no manifest yet → loader fns defined). Commit with step 3.

## Step 3 — Loader test
Write `src/workshop/style-corpus.test.mjs` (SC1–SC5 per structure §4). Until the manifest exists, SC1/
SC4 fail (expected red). **Verify:** the test file parses and the non-manifest tests (SC5 malformed-input
on an inline fixture) pass in isolation. Commit (steps 2+3 together — loader + its test).

## Step 4 — Replay script
Write `experiments/eval-alignment/corpus-build.mjs` per structure §5: asset guard, `mutateMaterial`,
synth render, `composeTwo` reuse beside-PNGs, manifest assemble + `parseStyleCorpus` self-validate +
write. Local helpers `composeTwo`/`toB64` lifted from the referee.
**Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/corpus-build.mjs` → asset guard passes (all
reuse builds/concepts/packs present), exits clean, **no spend, no writes**. Commit.

## Step 5 — Generate the corpus (run the script)
`node experiments/eval-alignment/corpus-build.mjs` → emits `builds/gatehouse/faithful-covered-mid/`
(artifact + SOURCE.md + 4 views + beside), all `corpus/beside/<id>.png`, and `style-corpus.json`
(self-validated before write).
**Verify:** script prints the ~12-state summary; `style-corpus.json` exists and re-loads via
`loadStyleCorpus()` without error; all beside-PNGs on disk. Commit the generated corpus + renders.

## Step 6 — Inspect the hard-middle (the contestability AC)
Read (view) the beside-concept PNGs for the 3 hard-middle states — especially `gh-mid-material` (the
synth one-wrong-material) — and the match cell beside it for reference.
- **Pass:** the synth state reads as *slightly* less crafted / a missing-dressing wobble — a human could
  rank it either way vs the match. Record the call in the manifest `note` + review.md.
- **Fail (obvious):** if `stone_bricks→cobblestone` reads obviously-bad or invisible, switch the mutation
  to a subtler/stronger single factor (e.g. roof family `dark_oak→spruce`), re-run step 5, re-inspect.
  Iterate until contestable or record honestly that a controlled contestable synth state could not be
  produced (and lean on the naturally-partial `new-roof` middles).
**Verify:** every hard-middle state has an explicit contestability call recorded. Commit any manifest
note/mutation change.

## Step 7 — Full guard + test
`npm test` → green (validate-artifact self-test + `test:unit`; the new SC1–SC5 pass; SC4 confirms every
manifest asset exists). Confirm `git status` shows **nothing under `measurements/`** touched.
**Verify:** `npm test` exits 0; `git status --porcelain measurements/` is empty. Commit if any fixups.

## Step 8 — Honest reporting
Ensure the manifest top-level `notes` records: (a) all four crux cell types were constructible (the
referee decouples by handing `(pack,concept)` independently); the structural-confound failure is a
*production-pipeline* property, not a corpus one; (b) single-rater limitation; (c) per-hard-middle
contestability calls. This is an AC ("recorded honestly: which crux cells were constructible; any the
pipeline refuses and why"). Captured in `style-corpus.json` + summarized in review.md.

## Testing strategy
- **Unit (`npm test`)** — the loader test (SC1–SC5) is the standing guard: schema validity, enum
  membership, AC-shape coverage, **asset existence** (reproducibility), parse-value semantics. This is
  the only automated coverage and it is sufficient — the corpus is *data*, the scoring is S-184.
- **Manual gate** — the hard-middle contestability inspection (step 6) is a human/render judgment the AC
  mandates; it cannot be unit-tested (it is the anti-hedge "is the fixture genuinely hard" check).
- **Replay verification** — re-running `corpus-build.mjs` re-derives the synth artifact (deterministic)
  and re-emits the manifest; renders are evidence not a byte-gate (GL pixels aren't byte-stable, memory:
  reproducibility-excludes-GL-from-decisions).

## Risks & mitigations
- *GL flakiness on synth render* → `assertGlAvailable` fails loud; `--no-render` re-emits the manifest
  from committed synth renders if GL is transiently absent.
- *Synth state reads obvious* → step 6 iterates the mutation; falls back to naturally-partial middles
  with the limitation recorded (anti-hedge: report, don't fake).
- *Asset path drift* → SC4 catches it in `npm test`.
- *Accidental `measurements/` write* → step 7 explicit `git status` check; the script writes only under
  `builds/`, `corpus/`.

## Commit sequence
1. schema. 2. loader + test. 3. replay script (GUARD_ONLY verified). 4. generated corpus + renders.
5. contestability fixups (if any). 6. green `npm test` + review. Each is atomic and independently
verifiable.
