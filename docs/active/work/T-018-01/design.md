# T-018-01 · Design — concept stage consolidation

The work is decided in shape by the ticket: synthesize, lock, hand off. The design questions are not
"what to build" but "what to write, where, and how much to re-verify." Each is decided below against
the research reality.

## Decision 1 — Re-generate to illustrate, or not?

The ticket permits **at most one** small re-generation "to illustrate the final locked behavior."

- **Option A — regenerate one reference (e.g. taj) under the default path.** Pro: a fresh artifact
  stamped at this ticket. Con: burns a Nano Banana call; image generation is non-deterministic, so a
  fresh draw could *lottery* into a white background or a stray figure — turning a synthesis ticket
  into an accidental re-litigation of S-017, and risking a worse "illustration" than the audited set.
- **Option B — do NOT regenerate; rely on the T-017-01 final audit.** T-017-01 *just* regenerated all
  5 under the identical locked prompt and recorded a 5/5 PASS table (taj ✓✓ … mausoleum ✓✓). That is
  the freshest possible evidence and it is already in the journal. **Chosen.**

**Decision: Option B — no re-generation.** The "at most one" allowance is a ceiling, not a quota. The
locked behavior is already illustrated by T-017-01's audited 5/5 table; a fresh single draw would add
non-determinism risk without adding confidence. The synthesis section will *cite* that audit rather
than redraw. (Recorded honestly as a deliberate choice, per the constraint to be honest.)

## Decision 2 — Where does the synthesis live?

- **Option A — a new top-level `## Stage-1 concept-art · CONSOLIDATION` section appended to
  `design-learnings.md`.** Matches the existing pattern: the file already has three `## Stage-1
  concept-art · …` sections (matrix, lock, hardened) and a precedent for a synthesis section
  (`### Consolidation · overnight chain S-006…S-009 … (T-014-01 — synthesis, NOT a trial)`). **Chosen.**
- **Option B — edit/rewrite the three existing stage-1 sections into one.** Rejected: destroys the
  append-only journal history (the per-ticket sections are the reproducibility trail); the chain's
  convention is newest-last append, not rewrite.
- **Option C — a separate new doc.** Rejected: the ticket names `design-learnings.md` explicitly, and
  fragmenting the durable knowledge defeats the point of a single journal.

**Decision: Option A.** One new `##`-level section at the end of `design-learnings.md`, titled to mark
it as the terminal consolidation for the stage-1 chain, mirroring the T-014-01 consolidation precedent.

## Decision 3 — What does the synthesis section contain?

The acceptance criteria pin the content. The section must distill, not merely summarize, and must be
self-contained (a reader who reads only this section understands stage 1). Structure:

1. **Status line — stage 1 is DONE.** Explicit, up front.
2. **Best input variant + why.** C (render-only). The *why* is the structural argument, not just the
   matrix score: C never sees the reference photo, so the two failure modes that need a photo to
   trigger — palette-copying and figural-relief-copying — are *impossible by construction*, and the
   background is reliably black because nothing imports a studio backdrop. The matrix score (C 0/5
   white vs A/B 2/5 white) is the evidence; the no-photo input is the mechanism.
3. **Voxel-ready criteria** — the four properties that define a TRELLIS-consumable concept:
   *isolated* (single subject, margin), *cleanly-segmentable* (pure-black bg, bright outermost
   edges), *resolution-disciplined* (no figures/text/filigree; every feature a few whole blocks),
   *faithful + colorful* (doc palette and massing, never a monochrome wall).
4. **The load-bearing prompt rules** — the small set of clauses that actually move the needle, each
   with the failure it prevents (so a future editor knows what *not* to remove): HARD-LIMITS-override-
   the-doc, name-the-specific-text-offender + frieze clause, pure-black-bg + bright-edges, and the
   wording trap (keep "white/light" out of the background paragraph).
5. **Residual caveats** — non-determinism ("held" ≠ guaranteed; redraw before re-editing on a
   regression); the concentric-square medallion in former-nameplate panels (intended, not glyph).
6. **Handoff to stage 2** — one paragraph: what the concept output guarantees to TRELLIS.

Target ~50–70 lines — proportional to a synthesis that points at three detailed predecessor sections
rather than restating them.

## Decision 4 — Confirm the lock, or re-lock?

The acceptance criteria require *confirming* the locked prompt and default, not changing them.
Research already verified: `conceptart.baml` clean at 33de8c8 with all three clause tightenings;
`conceptart.mjs` line 76 defaults to `"C"`, committed 565f32f matching the S-016 decision; client
regenerable via `npm run baml:gen`. **No source edit.** The synthesis section states the confirmation;
no code changes, so no `baml:gen` and no new commit of source is needed for this ticket.

**Decision: confirm-only.** If confirmation had found drift (e.g. default reverted, or a clause
missing), the design would pivot to a corrective edit + `baml:gen` + recommit. It did not — so the
ticket is pure synthesis, and that is the lowest-risk outcome consistent with the criteria.

## Decision 5 — Test strategy

- **Gate:** `npm test` must stay green (133/133). Already confirmed green pre-write. Re-confirm after
  the doc edit (a markdown-only change cannot affect tests, but the criterion is explicit).
- **No new tests.** Consistent with the entire stage-1 chain's rationale: concept quality is an image
  judgment ("eyeball-only"); a string-assert on prompt text or on the literal default `"C"` would
  test a constant and add no behavioral coverage. The acceptance test for the *knowledge* deliverable
  is human review of the journal section. Recorded as a deliberate, consistent gap.

## What was rejected and why (summary)

- Regenerating images → adds non-determinism risk, no confidence gain (Decision 1).
- Rewriting prior journal sections → destroys the reproducibility trail (Decision 2).
- A separate consolidation doc → fragments durable knowledge (Decision 2).
- Any source/prompt edit → out of scope; confirm-only is the criteria-faithful, lowest-risk path
  (Decision 4).
- New unit tests → would test constants, not behavior; eyeball-only is the chain's standing convention
  (Decision 5).

## Net

A markdown-only, append-only synthesis: one new `##` section in `design-learnings.md` that locks the
stage-1 knowledge and states the stage-2 contract, backed by a confirm-only check of the already-
committed prompt + default and a green `npm test`. Zero source risk; the deliverable is knowledge.
