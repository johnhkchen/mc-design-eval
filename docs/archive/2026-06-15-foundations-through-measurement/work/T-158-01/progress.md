# T-158-01 — Progress (implement)

Three commits on `main`. The plan held; one significant deviation (a real regression the proof
surfaced) is documented below.

## Commits

1. **`1ed7338` fix — restore live shared-stage hosts wrongly archived by S-156.** *Deviation from
   plan (Step 1 expected a clean run).* The first `npm run build:cottage` died at Stage 4: the
   spawned realizer `generated-milestone.mjs` imports `shellStage` from `challenge-milestone.mjs` and
   `styledStretch`/`spawnGate`/`distillGate` from `styled-milestone.mjs`, and its skin stage reads
   `material-map/<key>.json` — all moved to `_archive/` by T-156-01. These are **live shared-stage
   hosts**, not dead code (STRUCTURE.md itself said "styledStretch is reused inside Stage 4"). Fix:
   `git mv` the two modules + the four committed subject maps (barn/church/cottage/gatehouse) back to
   the live tree; repoint the three conformance suites' enumerated lists (material-vocabulary,
   pin-guard, brush-door) from `_archive/…` to the live paths; correct `STRUCTURE.md` +
   `_archive/README.md`. `npm test` 2161/2161.
2. **`c201c08` feat — barn + cottage through the ONE chain.** Both subjects end-to-end:
   `builds/<key>/{build,ledger,final-artifact,seed-artifact}.{json,md}` + the two
   `pr/assets/frames/beside-concept-<key>-build.png` sheets. Workshop budget-exhausted 6/6 rounds
   each; generalization grep clean.
3. **`24e3fa2` docs — canonical-flow narrative + E-12 handoff.** The E-37 capstone in
   `design-learnings.md` (the seven-beat relay-race retelling + the proof + the broken leg it caught),
   cross-linked from `STRUCTURE.md` and the `pipeline-philosophy.md` realization clause (stage
   assignment unchanged); `pr/assets/E-37-handoff.md`.

## Verification done

- **Both builds ran end-to-end** (not `--repro`): recognize → generate-seed → workshop (live model)
  → final beside concept. Receipts have no `pipeline-failed`; `generalization.clean: true`.
- **Glance read honestly** (viewed both PNGs): cottage = recognizable timber-frame half-timber,
  roof flat-brown / some thin eaves; barn = long-barn form + steep roof, walls holey/spiky, trim
  dropped. Drafts, not verdicts — recorded as such in every artifact.
- **`--repro` determinism** (`build:cottage:repro`): two fresh generate-seed runs byte-identical
  (`bd1a45e743ee…`); workshop replay byte-identical from program + ledger (384 paint placements
  re-applied). The "drifted from recorded sha — drafts are free under E-36" note is the intended
  [[repro-is-determinism-not-vs-committed-draft]] semantic, not a failure.
- **`npm test` green** at every commit boundary (2161/2161). The repro run left the tree clean.

## Deviations from plan

- **The regression (above).** Plan assumed a clean run; instead the proof did its job and caught a
  broken chain. Fixing it was in-scope — the terminal proof of "one chain works end-to-end" cannot
  honestly succeed while the chain throws at Stage 4. Kept minimal: restore the demonstrably-live
  deps; do **not** repoint live imports to `_archive/` (that would violate the TOPO4 invariant) and
  do **not** extract-and-refactor the shared stages (named as a follow-up ticket instead).
- **A stale false-failure record reverted.** The first (pre-fix) failed run wrote a
  `{status:"pipeline-failed"}` record into the committed top-level `generated/cottage.{json,md}`. That
  false record was reverted to HEAD (the good "gated" record) so it is never committed; the
  successful run's `generated/cottage/*` subdir refresh (consistent with `build.json`) is kept.
- **Per-round view PNGs gitignored.** `builds/<key>/round-*/` and `final/` view PNGs are gitignored
  (regenerable renders, repo convention); the committed JSON ledger is the receipt. The AC's required
  sheet (`beside-concept-<key>-build.png`, in `pr/assets/frames/`) is committed.

## Not done here (named, out of scope)

- Extract the shared Stage-4 stages (`styledStretch`/`shellStage`/`spawnGate`/`distillGate`/
  `runChain`) into a dedicated live module so the terminal *chains* can archive without dragging them.
- Teach the topology suite to check that a spawned stage's **own imports resolve** (the gap that let
  `npm test` stay green while the chain was broken). Both are their own ticket.
