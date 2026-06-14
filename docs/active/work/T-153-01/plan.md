# T-153-01 Plan — ordered, committable steps

Strategy: one commit per runner, each `node --check`-clean and suite-green. The reframe is
mechanical and identical in shape across the three files, so verify the first thoroughly, then apply
the same shape to the other two.

## Testing strategy

- **Unit:** none added — the freeze sites are CLI mode blocks (I/O flow), not pure functions. The
  existing suite is the regression net; it must stay green (`npm test`).
- **Regression net:** `replay.test.mjs` (R1/RG1 workshop replay), `facade-milestone.test.mjs` (FM6
  determinism), `loop.test.mjs` (SC2/L2 loop) — all exercise KEEP sites; they prove we did not touch
  the workshop / determinism / glance paths.
- **Behavioral verification (Implement):**
  - `node benchmarks/sculpture/generated-milestone.mjs --subject=barn --repro` →
    prints `DETERMINISTIC` and exits 0 on the current improved (T-150-01) chain. (Before this ticket
    it would print `DIVERGES`/exit 1 because the committed shas predate the gable fix.)
  - `node benchmarks/sculpture/generated-milestone.mjs --subject=barn --offline` → still gates on the
    gate-record/sheet/AJV; prints the informational draft drift line; exits 0 iff the measurement is
    intact.
- **AC5:** confirm pin-guard behavior unchanged (gate records still refuse without `--rotate-pins`)
  and workshop replay still byte-identical.

## Steps

### Step 1 — `generated-milestone.mjs` (the live E-36 example)

1. Edit `--repro` block: replace fresh-vs-committed with twice-fresh determinism (compare two
   `generatedChain` results across base/grammar/styled/fit; `same` ⇔ identical). Reframe message +
   exit code. Keep the pipeline-failed short-circuit.
2. Edit `--offline` block: remove `base`/`grammar`/`styled`/`fit` `=== want.*` from `checks`; keep
   `schema`/`zeroBlob`/`gate`/`sheet`/`assertArtifact`. Add informational `draftsMatch` line.
3. `node --check` the file.
4. Run behavioral verification (barn `--repro` DETERMINISTIC; `--offline` still gates).
5. `npm test` green.
6. Commit: `feat(T-153-01): generated-milestone --repro=determinism, --offline drops draft-sha freeze`.

### Step 2 — `challenge-milestone.mjs`

1. Apply the same `--repro` reframe (twice-fresh over base/shell/reconstructed/final). Update the
   stale leading comment.
2. Apply the same `--offline` change (drop shell/final/base from `ok`; keep skinGate/closure/gate/
   sheet/assertArtifact; informational line).
3. `node --check`; `npm test` green.
4. Commit: `feat(T-153-01): challenge-milestone --repro=determinism, --offline drops draft-sha freeze`.

### Step 3 — `styled-milestone.mjs` + header comments

1. Apply the same `--repro` reframe (twice-fresh over base/shell/reconstructed/skinFinal/grammarFinal/
   styled).
2. Apply the same `--offline` change (drop shell/grammar/styled/base from `ok`; keep schema/kit/gate/
   overall/sheet/evidence/assertArtifact; informational line).
3. Update the header doc lines (≈25, 43–44) to the new semantics.
4. `node --check`; `npm test` green.
5. Commit: `feat(T-153-01): styled-milestone --repro=determinism, --offline drops draft-sha freeze`.

### Step 4 — verification + review

1. Full `npm test` green.
2. Behavioral checks recorded in `progress.md`.
3. Write `review.md`.

## Verification criteria (Definition of Done, mapped to ACs)

- **AC1** (strip no-regress-vs-committed-draft): sites 1–6 from research no longer reject a fresh
  build for differing from committed draft bytes. Listed in review.md.
- **AC2** (keep instrument no-regress): no edits to gate / cage / relief-calibration / monotone
  tests / workshop replay; `--offline` still gates the gate-record + sheet.
- **AC3** (reframe better→glance): `--repro` reports determinism; `--offline` separates measurement
  integrity from informational draft drift; messaging no longer says "REPRODUCES the committed
  artifacts."
- **AC4** (honesty / no blanket unlock): every KEEP recorded with its "guards a measurement /
  determinism / glance" reason (design.md table); nothing else loosened.
- **AC5** (`npm test` green; reproducibility-by-replay of measurements unchanged; no new ceremony):
  suite green; pin-guard + workshop replay untouched; mode names/flags/exit-contract preserved.

## Rollback

Each step is a self-contained commit touching one runner's two mode blocks. Reverting any single
commit restores that runner's prior behavior without affecting the others.
