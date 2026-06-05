# T-016-01 · Plan — ordered, verifiable steps

Each step is small, independently verifiable, and committable. Testing strategy noted per step.

## Step 1 — Edit the default literal in `conceptart.mjs`
Change line 71 `arg("variant", "A")` → `arg("variant", "C")`.
- **Verify:** `node benchmarks/temple-facade/conceptart.mjs --help`-style dry inspection isn't
  available, so verify by `grep -n 'arg("variant"' conceptart.mjs` shows `"C"`, and that `"A"` no
  longer appears as the default literal.

## Step 2 — Update the header comment to match the new default
Touch the usage examples + variant list (per structure.md): mark C as the committed default and adjust
the no-flag example. Keep explicit `--variant A/B/base` examples.
- **Verify:** read back the header; it states C is default and why.

## Step 3 — Smoke gate: regenerate one ref via the DEFAULT path
Run **without `--variant`** so the new default is exercised:
`node benchmarks/temple-facade/conceptart.mjs --ref=taj`
- **Pass criteria (gate):** command exits ok; stdout line shows `taj [C/flash]` (proves the default
  resolved to C); output file is `concepts/taj-C-flash.png` (1 img attached, not 0 or 2 — C attaches
  exactly the one render). If the log shows `[A/flash]` the edit didn't take — stop and fix.
- If credentials/env fail here, stop and surface — same fail-fast posture as T-015-01.

## Step 4 — View the smoke output
Read `concepts/taj-C-flash.png`. Confirm: black background, gold dome / doc palette, disciplined
massing, cleanly segmentable. This is the go/no-go to spend budget on the remaining four.

## Step 5 — Regenerate the remaining four refs via the default path
Run each with no `--variant`:
`--ref=horyuji`, `--ref=chapelle`, `--ref=arc`, `--ref=mausoleum`
(or a single full run with no `--ref` and no `--variant`, which loops all five as C — but per-ref
keeps the smoke discipline and clearer logs). Each must log `[C/flash]` and write
`concepts/<ref>-C-flash.png`.
- **Verify:** five `*-C-flash.png` files updated (newer mtime); each cell logged ok with 1 img.

## Step 6 — View all five regenerated C images
Read each `concepts/<ref>-C-flash.png`. Grade each against the three stage-1 targets + background:
- F = fidelity (doc palette + massing), I = inspiration-not-blueprint, D = voxel-honest detail,
  bg = background actually produced.
Compare to the T-015-01 matrix baseline (all five were black / Hi-Hi-Hi or near). Record holds /
weakened + why per ref.

## Step 7 — Append the journal entry
Add `## Stage-1 concept-art · default variant LOCKED (E-09, T-016-01) · 2026-06-05` to
`docs/knowledge/design-learnings.md`: the lock statement (C is default + why) and the per-reference
confirmation (one line each: holds / weakened + why), plus a net verdict.
- **Verify:** section present; five references each have a verdict line.

## Step 8 — Run the test suite (regression guard)
`npm test`.
- **Expected:** green (T-015-01 baseline 133/133). No source under test changed; a failure here would
  indicate unrelated breakage and must be surfaced, not worked around.

## Step 9 — Commit
Stage: `conceptart.mjs`, the five `concepts/*-C-flash.png`, `design-learnings.md`, and the
`docs/active/work/T-016-01/` artifacts. Commit on `main` (chain convention — multiple tickets share
the branch; file locking serializes). Message: `feat(E-09 stage-1): lock default concept variant to C
(T-016-01)`.
- **Verify:** `git status` clean for these paths post-commit; `git log -1` shows the commit.

## Step 10 — Write review.md
Summarize changes, test result, per-ref confirmation outcome, open concerns. (Done in Review phase.)

## Testing strategy summary
- **Unit/integration:** none added — the concept-art stage is eyeball-only by design (header comment;
  T-015-01 rationale). The meaningful "test" is the five-cell regeneration succeeding via the default
  path + the visual grade.
- **Regression:** `npm test` (Step 8) guards against collateral damage to the validated artifact path.
- **Acceptance-criteria mapping:**
  - AC1 (default = C, diff committed) → Steps 1–2, 9.
  - AC2 (regenerated + viewed for all 5, no regression) → Steps 3–6.
  - AC3 (journal records lock + per-ref confirmation) → Step 7.
  - AC4 (`npm test` green; images under `concepts/`) → Steps 5, 8.

## Risks & mitigations
- **Env/credential failure** at generation → caught at Step 3 smoke gate; surface, don't retry blindly.
- **A C cell drifts to white** (the documented regression signal) → record as "weakened + why" in the
  journal (Step 7); does not block the lock (the lock is the correct default regardless of one
  non-deterministic draw), but flags it for S-017. Could re-draw once to check if it's a lottery
  artifact vs a tendency.
- **Stale comment** misleads future readers → mitigated by Step 2.
