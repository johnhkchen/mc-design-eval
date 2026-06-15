# T-134-01 — steep-pitch-construct — Progress

Phase artifact 5/6. Plan executed step by step; deviations named.

## Completed

- **Step 1** (`782cf45`) — `gableRecord` + `colsOf` extracted from idiom-registry.mjs into
  roof-generate.mjs (exported, shared). Suite green at 1938; byte-identical emission.
- **Step 2** (`e2e8c28`) — `src/view/roof-steep.mjs` (STEEP_PITCH_CLASSES [2,3], STEEP_REFUSALS
  named data, gates → gableRecord → generateRoof → steep invariant post-check) +
  `src/view/roof-steep.test.mjs` ST1–ST10. An extra gate emerged while writing: an *unreachable*
  ridge (above the footprint's apex) is its own named refusal — without it the invariant would
  fail with a misleading "drift" message.
- **Step 3** (`3f9704a`) — registry entry (sorted seat; paramsSchema pitch enum [2,3]); three
  card specs (gable-steep-z/x at 2:1, gable-steep-3); SYNTH_SPECS; brush-count baseline 22→23
  with growth history; `roof-steep` joined the brush-door guarded set with a roof-generate
  intra-layer allowance (the roof-swap pattern — the closed sweep caught the direct import as
  designed). Catalog regenerated: 23 brushes, unmapped 0, steep plots visible on the sheet.
- **Step 4** (`4c718f9`) — roof.gable refuses pitch >1 naming the steep brush (paramsSchema
  maximum 1); ROOF_LAYOUTS row; roofBlocks rides the pack's roof.gable row for the steep idiom;
  REALIZABLE_PITCHES {0.5,1,2,3}; **dormer seat made pitch-aware** (eaveY + ⌈pitch⌉ — at the
  legacy classes this is exactly the old eaveY+1; on steep classes the old seat floods the 1×1
  light with a tread, found by the ST5 geometry). Proven inert on committed chains:
  patternbook:offline (both packs, incl. the dormered cottage) and measured:offline all
  REPRODUCE byte-identically.
- **Step 5** (`609fb9d`) — `benchmarks/sculpture/steep-pitch.mjs` evidence runner (the
  measured-proportions sibling conventions: pin-guard, packNs rels, self-grep, run-twice
  determinism, --repro/--offline) + npm scripts. Results:
  - `barn--saltcrag`: class 2 on the hall, ridge 21→33, ridge:eave 2.4444→3.7778, conformance
    PASS (courses-even included), 4-azimuth before/after renders committed, REPRODUCES.
    The silhouette visibly steepens (renders inspected).
  - `barn` (rustic): **named refusal** — the style declares no steep class (vocabulary [1]);
    widening rustic is a pack decision. Status "refused", exit 0, reproducible.
- **Step 6** — full suite green (**1949 pass, 0 fail**); offline replays green; records
  committed; no pins touched (git clean apart from Lisa's ticket frontmatter).

## Deviations from the plan

1. **Renders live in `benchmarks/sculpture/steep-pitch/` (committed), not `pr/assets/frames/`** —
   followed the T-133 sibling's committed-views convention (it landed mid-flight and is the
   epic's fresher precedent). The AC's "committed" is satisfied; frames can be copied for a PR
   later if wanted.
2. **The rustic barn realization became a named refusal, not a build** — discovered during
   research: rustic declares pitchClasses [1] (and its barn build has zero stair treads via the
   roofBlocks field-match rule — a separate pre-existing finding). The runner refuses at the
   style level by name; the saltcrag barn (whose pack declares 2) carries the realization AC.
3. **The runner reads the steep class list through the registry door** (getBrush paramsSchema
   enum) instead of importing roof-steep.mjs — the brush-door sweep flagged the direct import;
   the door is the cleaner source anyway.
4. **A mid-flight `--amend` briefly swallowed a sibling T-133 commit** (two sessions share the
   branch); recovered via reflog `reset --soft` — content was never lost; the allowlist change
   moved into the Step 3 commit. No further amends used.

## Concurrent-session note

T-133-01 (measured-proportions) landed mid-flight (8a3a51d, dc6f167, 54cdd04) — its review
explicitly hands the pitch-vocabulary widening to this ticket; its measured barn record
(ridge:eave target 2.1 vs achieved 2.4 under the 45° ceiling) is referenced as demand context.

## Remaining

review.md (phase 6). No code work outstanding.
