# T-158-01 — Review: canonical-flow-proof, and the E-37 epic (S-158)

Handoff for a human reviewer. This ticket is the **terminal** ticket of epic E-37; this review
covers both *its* work and the *epic* it closes. The headline: the unified chain is real — it ran
both living subjects end-to-end — and the proof earned its keep by catching a runtime break that
`npm test` could not see.

## What this ticket changed

Three commits on `main`:

| commit | kind | what |
| --- | --- | --- |
| `1ed7338` | fix | restore `challenge-milestone.mjs` + `styled-milestone.mjs` + 4 `material-map/*.json` to the live tree (wrongly archived by S-156); repoint 3 conformance lists; correct STRUCTURE.md + `_archive/README.md` |
| `c201c08` | feat | barn + cottage end-to-end: `builds/<key>/…` + `pr/assets/frames/beside-concept-<key>-build.png` |
| `24e3fa2` | docs | E-37 capstone in `design-learnings.md`; cross-links in STRUCTURE.md + pipeline-philosophy.md; `pr/assets/E-37-handoff.md` |

**No stage was changed.** No `src/` runtime logic was edited — the fix is `git mv` + conformance
**list** repoints (test data, not behaviour) + docs. The philosophy's stage assignment is unchanged
(realized, not re-derived), as the AC required.

## Acceptance criteria — status

- ✅ **Barn + cottage end-to-end through the ONE chain**, landing in `builds/<subject>/`, rendered
  beside the concept (E-36, judge-free). Sheets committed to `pr/assets/frames/`. Both reached the
  final-beside-concept step; receipts have no `pipeline-failed`; `generalization.clean: true`.
- ✅ **Recorded honestly.** Drafts, not verdicts: the commit messages, the capstone, the handoff, and
  this review all name the cottage roof (flat-brown, thin eaves) and the barn surface (holey, spiky,
  trim dropped). The render is the evidence.
- ✅ **The canonical-flow narrative.** `design-learnings.md` gained the seven-beat relay-race
  retelling (each beat: the broken alternative → what the native representation allows), cross-linked
  from STRUCTURE.md and the philosophy realization map.
- ✅ **E-12 handoff** (`pr/assets/E-37-handoff.md`) + this **review.md for S-158**.
- ✅ **`npm test` green** (2161/2161) at every commit boundary; **no per-building constants** (the
  chain self-greps; `generalization.clean: true`); philosophy stage assignment unchanged.

## The epic, in five claims (the AC's epic checklist)

1. **Chain unified (T-154-01).** `build.mjs` is the single `build-chain/v1` entry point (TOPO3
   enforces exactly one). recognize → generate-seed → workshop → final-beside-concept; the gate is a
   separate billed step it never spawns (`isolation.test.mjs`). **Verified** — both subjects ran
   through it this ticket.
2. **Home established (T-155-01).** Location encodes status: `builds/` draft (free), `measurements/`
   + `packs/` frozen (the pin-guard prefix), `_archive/` dead. **Verified** — the proof wrote only
   `builds/` + `pr/assets/`; the pin-guard never tripped because nothing under `measurements/` was
   touched.
3. **Archive moved (T-156-01).** The retired chains/epoch sediment is under `_archive/`. **Verified
   with a caveat the proof corrected:** S-156 over-reached — it archived two modules and a data dir
   that the live Stage 4 still depends on. Fixed here (see below). The archive is otherwise sound (no
   live import reaches into it — TOPO4 green).
4. **Guardrails red-on-violation (T-157-01).** The topology conformance suite reads the map + the
   tree and fails on drift. **Verified — and a gap found:** the suite is green-on-violation for one
   class (a spawned stage whose *own import* points at a moved file); named as a follow-up.
5. **Frozen records re-derive unchanged.** **Verified** via `build:cottage:repro`: two fresh
   generate-seed runs byte-identical; workshop replay byte-identical from program + ledger. Repro is
   *determinism* (two fresh runs), not equality-with-a-committed-draft (E-36 / T-153-01) — drafts are
   free.

## The significant finding (read this)

The first real end-to-end run **broke at Stage 4** and that is the most valuable thing this ticket
produced. `generated-milestone.mjs` (the spawned realizer, the heart of the live chain) imports
`shellStage` / `styledStretch` / `spawnGate` / `distillGate` from `challenge-milestone.mjs` /
`styled-milestone.mjs`, and its skin stage reads `material-map/<key>.json` — all moved to `_archive/`
by S-156, **despite STRUCTURE.md saying "styledStretch is reused inside Stage 4, not retired."**

Why the guardrails missed it (the gap a reviewer should weigh):
- **TOPO2** checks the chain's *spawned* stages (`generated-milestone.mjs`, `workshop.mjs`) exist and
  are mapped — but not that those stages' *own imports resolve*.
- **TOPO4** catches a literal `_archive/` import string — but the broken import was `./challenge-
  milestone.mjs`, a stale sibling path to a moved file, which contains no `_archive`.
- Nothing in `src/**` imports `generated-milestone.mjs`, so `node --test` never loads it.

Result: **`npm test` was green while the chain threw `ERR_MODULE_NOT_FOUND` at runtime.** The lesson
is the project's recurring one — green tests are not a delivered build; the glance (here, the run)
beats the gate. The fix is minimal and architecturally honest: the two modules + four maps are
demonstrably live (imported by Stage 4, spawned by `component-skin.mjs`), so they belong in the live
tree. I did **not** repoint live imports to `_archive/` (that violates TOPO4) and did **not**
refactor-extract the shared stages (a larger change, named as its own ticket).

## Test coverage

- **Full suite green** (2161/2161) at each commit; the conformance suites
  (topology / pin-guard / material-vocabulary / brush-door / isolation) all pass with the restored
  live paths.
- **The proof is its own integration test:** two `build.json` receipts with no `pipeline-failed`,
  two beside sheets on disk, `generalization.clean`, and a clean `--repro`.
- **Gap (flagged):** no test asserts that a *spawned stage's own imports resolve*. This is the hole
  that let the regression hide. Closing it is a named follow-up; until then, **running the chain is
  the only thing that catches this class** — so the E-36 "done = delivered, render it" rule is
  load-bearing, not ceremony.

## Open concerns / follow-ups (each its own ticket)

1. **Extract the shared Stage-4 stages** (`styledStretch`/`shellStage`/`spawnGate`/`distillGate`/
   `runChain`) into a dedicated live module so the terminal *chains* (`styled-milestone.mjs`,
   `challenge-milestone.mjs`) can archive cleanly without dragging live code. Right now they sit in
   the live tree as shared-stage hosts that also happen to carry retired CLI mains.
2. **Teach the topology suite** to resolve a spawned stage's transitive imports (the TOPO2/TOPO4
   gap), so this regression class goes red in CI rather than only at runtime.
3. **Quality, not plumbing:** the barn surface (holey/spiky walls, dropped trim) and the cottage roof
   (flat-brown, no shingle texture, thin eaves) are the real open design gaps — the chain runs; the
   *builds* still need work. These are creation-quality tickets, not pipeline tickets.

## Reviewer's quick check

```
npm test                      # 2161/2161
npm run build:cottage:repro   # deterministic generate-seed + byte-identical workshop replay
open pr/assets/frames/beside-concept-cottage-build.png  # the half-timber reads; roof flat
open pr/assets/frames/beside-concept-barn-build.png     # long-barn form; walls rough — honest draft
```

The chain is one. The home encodes status. The narrative is the map, not the history. The two
builds are honest drafts, and the one thing the proof proved beyond the run is that **only running
it catches a broken leg** — which is exactly why E-36 made "render it beside the concept" the
definition of done.
