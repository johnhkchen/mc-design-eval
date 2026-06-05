# T-016-01 · Design — lock default concept variant

The work is small and the decision (which variant) is already made upstream (C). The design choices
here are about *how* to encode the lock and *how* to run the confirmation, not *which* variant.

## Decision 1 — Where/how to set the default

**Chosen: flip the inline default in `arg("variant", …)` from `"A"` to `"C"`.**
`benchmarks/temple-facade/conceptart.mjs:71` becomes `const variant = arg("variant", "C");`.

Rationale grounded in research:
- The default is read in exactly one place. Changing that one literal is the complete, minimal
  encoding of "the variant used when `--variant` is omitted" — precisely the ticket's wording.
- Explicit callers (`--variant=A`, `--variant=B`, `--variant=base`) are unaffected: `arg` only falls
  back to the default when the flag is absent. So the matrix remains fully reproducible.

Alternatives considered and rejected:
- **A `DEFAULT_VARIANT` named constant** (e.g. `const DEFAULT_VARIANT = "C";` then
  `arg("variant", DEFAULT_VARIANT)`). Marginally more self-documenting, but adds a symbol for a value
  used once, in a 87-line script whose header comment already enumerates the variants. The header
  comment is the better place to record *why* C is default. Rejected as over-engineering for a
  single-use literal — but see Decision 2, which captures the "why" without a constant.
- **Removing variants A/B/base entirely**, leaving only C. Rejected: the matrix must stay
  reproducible (T-015-01 review explicitly says every cell is regenerable; S-017 robustness work will
  want to re-run A/B to re-check the prompt weaknesses). Deleting them would destroy the comparison
  baseline. The variants are kept; only the default changes.
- **A config-file / env-driven default.** Rejected: there is no config layer for this eyeball-only
  stage, and introducing one is out of scope and contrary to the "one obvious behavior" goal.

## Decision 2 — Make the lock self-documenting in the file

**Chosen: update the header-comment usage examples and add a one-line note that C is the default.**
The header (lines 1–13) currently shows `--variant A` examples and lists variants "in order" with A
first. Leaving that as-is after flipping the default would be misleading — a reader would assume A is
default. Minimal change: annotate the variant list so `C` is marked as the default, and adjust the
first usage example to reflect omitting `--variant` now yields C. This carries the "why" (segmentation
/ render-only) inline without introducing a code symbol.

Rejected: leaving the comment stale (cheaper but actively misleading); rewriting the whole header
(unnecessary churn).

## Decision 3 — Confirmation run strategy

**Chosen: regenerate C for all 5 refs via the now-defaulted command (`--ref` each, no `--variant`),
then view each PNG and grade against the three stage-1 targets.**

- Running **without** `--variant` is the right confirmation because it simultaneously exercises the
  new default path *and* produces the five C images. One action, two acceptance criteria covered
  (default works; images regenerated). i.e. `node …/conceptart.mjs --ref=taj` must now produce a C
  cell.
- A **smoke gate first:** regenerate one ref (taj) with no `--variant`, confirm the output filename is
  `taj-C-flash.png` and the image is a clean black-background concept, before spending generation
  budget on the other four. This catches an env/credential or wiring problem at cell 1, mirroring the
  T-015-01 plan's smoke-gate discipline.
- **View every regenerated PNG** with the Read tool (it renders images visually) and grade F /
  I / D + background, exactly as the T-015-01 progress table did, so the comparison is apples-to-apples
  against the matrix baseline.

Rejected alternatives:
- **Trust the existing T-015-01 C images and skip regeneration.** Rejected: the acceptance criterion
  explicitly says "regenerated … for all 5 references", and regenerating is the only way to confirm
  the *defaulted command path* actually emits C (not just that C exists from an explicit run).
- **Regenerate with explicit `--variant=C`.** Rejected: that would test the variant but *not* the new
  default. Omitting the flag is the whole point.
- **Use `--pro` or change block count.** Rejected: ticket pins Flash and 48 blocks (resolution is not
  the variable here — that's S-017).

## Decision 4 — Regression bar (what "no regression" means)

Because image generation is non-deterministic, "no regression" is judged on **tendency**, not pixel
identity. A regenerated C cell **holds** if it keeps the matrix's C profile:
- **Background black** (the decisive segmentation axis — matrix was 5/5 black for C),
- **palette doc-correct** (C refines our doc-grounded render, so palette should track the doc),
- **no reference-copied figures/filigree/text** beyond what the matrix already noted (e.g. mausoleum's
  reference-driven plaque was present across all variants and is not a C-specific regression),
- **cleanly segmentable** chunky voxel ornament (no fine filigree).

A cell is recorded **weakened + why** if any of these slips (e.g. drifts to white, palette bleeds,
filigree appears). Per the T-015-01 review, a C drift to white would be the signal to revisit — this
ticket's job is to detect and record it, not to fix the prompt (S-017).

## Decision 5 — Journal + tests

- **Journal:** append a short section to `docs/knowledge/design-learnings.md` recording (a) the lock —
  C is now the orchestrator default — and (b) one line per reference for the all-reference
  confirmation (holds / weakened + why). This satisfies the third acceptance criterion and keeps the
  durable record next to the matrix section it confirms.
- **Tests:** run `npm test` and expect it to stay green (133/133). No source under test changes; this
  is a collateral-damage guard. No new unit tests — the stage is eyeball-only by design, consistent
  with T-015-01's reasoning. Adding a test that asserts the default literal would be testing a
  one-line constant and is not warranted.

## Net change footprint
One code edit (default literal) + a header-comment touch-up in `conceptart.mjs`; five regenerated PNGs
under `concepts/`; one appended journal section. No prompt, schema, client, or `src/` change. This is
the minimal change that satisfies all four acceptance criteria.
