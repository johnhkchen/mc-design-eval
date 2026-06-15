# T-142-01 Research — witness-pin-policy

Epic E-34 / Story S-142. Three witness/record families sit FAIL-not-SKIP at HEAD after the
T-138-01/02 sanctioned rotations. This maps the failure of each, the pin each depends on, and the
SKIP precedent that already exists. Descriptive only — the resolution is `design.md`.

## The four reds, reproduced at HEAD

```
proportion:repro   cottage: replayLedger: round 4 is geometry-bearing — pass the pack
                   barn:    replayLedger: round 1 is geometry-bearing — pass the pack
                   gatehouse/church: no committed witness record — skipped   (exit 1)
visibility:repro   barn-patternbook            DIVERGES
                   barn-patternbook-saltcrag   DIVERGES
                   cottage-patternbook         DIVERGES
                   gatehouse-current           SKIP (artifact pin mismatch)  ← the precedent
                   (13 other legs byte-identical)                            (exit 1)
measured:repro     cottage: re-derived silhouette ratios diverge from the committed record's
   / :offline      barn:    re-derived silhouette ratios diverge from the committed record's
                   gatehouse/church: no committed measured records — skipped (exit 1)
```

## Three families, three DIFFERENT pin states (the data, not a guess)

The runners all pin their inputs by sha256. Comparing each committed record's pinned shas to the
files on disk is what classifies the failure. The data is decisive and the three families differ:

### proportion-witness (`benchmarks/sculpture/proportion-witness.mjs`) — pinned SOURCE rotated
- `inputs.{ledger,finalArtifact,sketch,concept}` each carry a sha. For **cottage and barn**:
  `ledger` **ROTATED**, `finalArtifact` **ROTATED**, `concept` **ROTATED**, only `sketch` SAME.
  The ledgers were re-banked by T-138-01 (`5db9a86`) / T-138-02 (`487fe2e`) when the chains went
  through the proportion loop.
- Two distinct defects stack: (1) the **pack is never threaded** — `derive()` calls
  `replayLedger({ ledger })` and `replayLedger({ ledger, throughRound: r })` (lines 82, 106) with
  no `pack`; the now-geometry-bearing ledgers (E-33) throw in `geometryCtx`. (2) even with the
  pack, the records would DIVERGE — the source rotated AND T-139's skirt-aware `maskProportions`
  changes the cottage's OCCUPANCY-lens ratios (`proportionRatios` → `maskProportions`).
- Conclusion: the pinned source was retired by a sanctioned rotation → the honest verdict is a
  **named SKIP**, not a refresh (refreshing re-banks a baseline against a rotated upstream).

### visibility-witness (`benchmarks/sculpture/visibility-witness.mjs`) — pinned SOURCE rotated
- The committed witness record pins `source.sha256` = the gate record it re-censused. For the three
  pattern-book legs the pinned sha ≠ the current gate-record sha:
  - `barn-patternbook`: pinned `3dc04c97…`, gate now `21ef27d5…` (rotated by **T-138-01** `5db9a86`).
  - `barn-patternbook-saltcrag`: pinned `88055c5f…`, gate now `f018ea86…` (T-138-01 / saltcrag).
  - `cottage-patternbook`: pinned `f5567754…`, gate now `58f86001…` (rotated by **T-138-02** `487fe2e`).
- `derive()` reads the **current** gate record, re-censuses it, and `main()` byte-compares — so a
  rotated gate record yields a fresh witness that DIVERGES. The existing SKIP guard
  (`gatehouse-current`) only covers an **artifact-pin** mismatch thrown inside `derive()`; it does
  not cover a rotated **record** pin.
- Note: the pinned cottage sha `f5567754…` is exactly the content of the retired fixture
  `src/view/fixtures/cottage-patternbook.t127-retired.json` — the T-127-era gate record, preserved
  when T-138-02 rotated it. The retired-pin-as-fixture precedent already exists (`e0d000d`).

### measured-proportions (`benchmarks/sculpture/measured-proportions.mjs`) — pinned inputs INTACT
- `inputs.{recognitionProgram,sketch}` are both **SAME** for cottage and barn. The divergence is in
  `ratios.before`, which `derive()` computes live from `chainRels(key).seed`
  (`workshop/<key>/program.json`) — a file that is **NOT in the record's pinned `inputs`** (verified:
  `beforeSource pinned in inputs? false`). T-138 rotated that seed; `before` drifted; `after`
  (measured seed) and `target` (sketch) are unchanged.
- `ratios.before` is computed by `silhouetteRatios` — the **PROGRAM** lens (reads element
  `eaveY/ridgeY/footprint`). It never calls `maskProportions`, so **T-139 changed nothing here**;
  the drift is the rotated seed alone (cottage before `2.25` vs the rotated seed; barn `2.4444`).
- Conclusion: the pinned inputs are intact and only an **unpinned diagnostic baseline** drifted →
  the honest verdict is to **refresh `before` under explicit rotation**, quote the retired values,
  and pin the seed sha so the next rotation is caught (not silently re-banked).

## The SKIP precedent that already works (the pattern to generalize)

`gatehouse-current` SKIPs cleanly today: its gate record's `artifact.sha256` ≠ the artifact file's
sha, so `derive()` throws *"a changed build needs a fresh gate run (T-138), not a witness"* and
`main()`'s `--all` branch logs `SKIP — <message>` and `continue`s (no `failures++`). The principle
generalizes verbatim: **a witness refuses to measure a changed pinned input — it SKIPs (named),
rather than silently measuring the new one.** The three pattern-book legs are the same situation one
level up (the *record* rotated, not the *artifact*); the proportion ledgers are the same again.

## The pin machinery (T-119, `src/form/pin-guard.mjs`)

- `decidePinWrite` (pure): tracked + differing bytes + no `--rotate-pins` → `refuse`; byte-identical
  → `skip-identical`; `--rotate-pins` → `write`. `loadTrackedSet`/`isTracked` are the cached
  `git ls-files` leaf (fail-closed: git error ⇒ everything reads tracked).
- `preflightPins` runs before any spend; `guardedWriteRecord` is the write leaf. All three runners
  already call these. A rotation here means re-running the owning runner with `--rotate-pins`.
- `GATE_RECORD_NAMESPACES` (`benchmarks/sculpture/multi-angle/`) is structurally off-limits to
  workshop writers — the witnesses write to `proportion/`, `visibility/`, `measured/`, never the
  gate namespace, so a witness refresh never crosses judge isolation.

## The cottage-challenge stray-file provenance (a separate, isolatable defect)

- `cottage-challenge`'s gate record points `artifact.path` → `challenge/cottage/artifact.json`
  (TRACKED). But `derive()` derives a sibling `component-plan.json` path and reads it when present;
  for cottage that file is **UNTRACKED** (`git status: ?? challenge/cottage/component-plan.json`).
- Hiding it flips the leg `byte-identical → DIVERGES` — the committed witness numbers **depend on an
  uncommitted input**. In a clean worktree the file is absent → the leg diverges there too.
- This is isolatable by **property, not name**: of the legs that reference a component-plan,
  `church-challenge` and `cottage-generated` have **TRACKED** plans (they reproduce); only
  `cottage-challenge`'s is untracked. A "read only tracked component-plans" rule isolates it without
  a subject key in the runner (keeps the E-25 Rule 3 self-grep clean). `reconstructed-artifact.json`
  in the same dir is **not referenced** by the witness — an unrelated stray.

## Constraints the resolution must respect

- **No judge runs, no chain re-runs** (AC4). Witnesses are model/GL-free; keep them so.
- **`benchmarks/sculpture/multi-angle/` is untouchable** (judge isolation) — the gate records are
  *read* (the witness re-censuses them); never written.
- **The SKIP-vs-FAIL test must run in `npm test`** → the decision core must be PURE and live under
  `src/**/*.test.mjs` (the pin-guard pure/IO split idiom).
- **Generalization grep**: no subject keys may appear in a runner's source (both runners self-check).
- **"Baselines never re-banked"**: a rotation is explicit, owned, and the retired value is quoted.
