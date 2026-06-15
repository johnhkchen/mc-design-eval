# Review — T-011-01: ground-on-arc

Handoff. What a reviewer needs without reading every diff. This is an **experiment ticket**: the
deliverable is a render-grounded verdict + journal entry, not a code change.

## TL;DR

Ran the champion `vRefRevise-designdoc` on `references/arc_de_triomph.JPG` (run **021**) — a Roman
triumphal arch, a **single colossal opening**, the massing most unlike anything the champion's principles
were derived on. **No source code changed** (pre-registered triggers did not fire). Headline:

1. **The reference principles generalize to this novel massing.** `overall = strong` on **both** rounds.
2. **P12 (color from brief) held off a FOURTH pale reference** (cream limestone) — `color = strong` both
   rounds; the model took "structure, not pallor" and built a warm red-sandstone/gold/blue scheme.
3. **P13 (proportion) held strong** on the single-arch massing — and, notably, the **2nd pass did NOT
   regress it** (the inverse of runs 013/017/020). Caveat: the Arc has no freestanding parts, so P13's
   *detachment* mode was **un-exercised** — this run tests proportion-on-novel-massing, not detachment.
4. **The headline detail question is MIXED:** the lever **resolved the specific attic + spandrel fields**
   the ticket named (articulated rondel band + gold spandrel ornament), but the **flat-field class did not
   die — it migrated** to the oversized central arch void. The `detail` category flipped competent→strong
   (first time the revision lifted detail), read with the P15 noise caveat.

## What changed (files)

**Source code:** *none.* `git diff HEAD -- benchmarks/temple-facade/run.mjs` is empty. Tree was already
clean at session start (no un-promoted edit to revert, like T-008-01); HEAD already is the 015-menu
champion. No trigger fired → no minimal generalizing edit.

**Journal (`docs/knowledge/design-learnings.md`):**
- Appended the **run-021 attempt-log entry** (massing framing, A/B table, P12/P13/detail verdicts, the
  P14 hold/lift, the whack-a-mole detail finding, no-edit rationale).
- Updated **Principle P12** scope: THREE → **FOUR** pale palettes (added cream-limestone Arc); the
  genuine-agreement converse still marked untested.
- Updated **Principle P15**: added the **whack-a-mole** finding — a named-field clause clears the field it
  names and blankness migrates to the largest unnamed surface; argues for a whole-facade ornament pass.

**Work artifacts (`docs/active/work/T-011-01/`):** `research.md`, `design.md`, `structure.md`, `plan.md`,
`progress.md`, `review.md`, and `judge-round0.mjs` (copied helper).

**Run outputs (retained, `benchmarks/temple-facade/runs/021-vRefRevise-designdoc/`):** `reference.JPG`,
`design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`,
`transcript.jsonl`. README gallery regenerated.

## Results (median-of-3, rubric `v2-categorical-baml`)

| dim | round-0 (build) | render (2nd pass) |
|-----|:---------------:|:-----------------:|
| proportion | **strong** | **strong** |
| color | **strong** | **strong** |
| detail | competent | **strong** |
| fidelity | **strong** | **strong** |
| **overall** | **strong** | **strong (3/3)** |

12,696 blocks, 0 unmapped, 30,973/71,671 tok, **$2.13**, 1006s. round-0 perSample [strong, competent,
strong]; render perSample unanimous [strong, strong, strong]. Judge flagged the render's
exceptional-blocker as "the enormous central tympanum is one large flat lattice field … brick side fields
fairly plain … side bays squeezed against the oversized arch."

## Acceptance criteria

- **AC1 — both rounds scored with the categorical judge (median-of-3), per P14:** ✅ `render.png`
  auto-judged by `main()`; `round-0.png` scored via the copied `judge-round0.mjs` helper. Both median-of-3.
- **AC2 — journal attempt-log entry: per-dimension A/B, held/failed for P12/P13 on this massing, and
  specifically whether the detail lever resolved the attic/spandrel flat fields; any diff recorded; `npm
  test` green:** ✅ All present. **P12: HELD** (4th pale palette). **P13: HELD** (proportion strong both
  rounds; detachment mode noted un-exercised). **Detail: the named attic/spandrel fields RESOLVED, but the
  flat-field class migrated to the arch void** — recorded explicitly, with the category lift read under the
  P15 caveat. No prompt diff (no trigger fired; recorded as such). `npm test` 133/133 green before & after.
- **AC3 — renders + `summary.json` retained under `runs/<id>/`:** ✅ All outputs retained under
  `runs/021-vRefRevise-designdoc/`.

## Test coverage

`npm test` (133) guards artifact/schema validation only; green throughout. There is **no unit test** for
prompt strings or the experimental verdict — by design, the "test" is the frozen categorical judge on both
renders. Single generation (Design D): color (P12) and proportion (P13) are structural/low-variance and
reliable from one render; the single `detail` score carries the P15 boundary-noise caveat — which is why
the detail verdict leans on the *qualitative, single-render-answerable* attic/spandrel articulation read,
not the category flip. **Gap:** the detail competent→strong lift is one generation; whether the 2nd pass
*systematically* lifts detail on flat-field-heavy references (vs the known noise) would need a confirmer
run — but the qualitative "flat field migrated" finding is robust regardless of the category.

## Open concerns / follow-ups (for human attention)

1. **The flat-field cure needs to be whole-facade, not named-field.** Run 021 is the cleanest evidence yet
   that the "NO LARGE FLAT FIELDS" menu clause is **whack-a-mole**: it articulates the example fields it
   lists, and the model relocates blankness to the largest *unnamed* surface (here, the oversized arch
   void). P15's "dedicated, fenced ornament pass" should **audit every plane wider than ~6 blocks**, not
   enumerate example fields. This is the standing detail-lever frontier (S-006/S-010 territory).
2. **The genuine P12 agreement case is STILL untested after four references.** Every supplied reference
   (white/timber/pale-stone/cream-limestone) read *pale* to the model, so the color-hold clause has only
   ever been exercised in the *conflict* condition. To test "P12 is a no-op when the reference agrees," a
   reference that reads **genuinely polychrome to the model** is required (a saturated building image, or a
   stained-glass interior). Recommend a dedicated ticket; do **not** keep treating pale references as the
   agreement case.
3. **The 2nd pass oversized the central arch** (squeezed side bays) — a sub-categorical proportion blemish
   the judge named but didn't penalize. It is the same *enlarge-a-feature* behavior that *regressed* run
   020 (gold pediment); here it cost nothing because the enlarged feature (a grand arch) is period-correct
   for a triumphal gate. Worth watching as a 2nd-pass tendency: the revision likes to inflate one dominant
   element. The "judge both rounds, keep the better" fix (open since run 020) would have kept the render
   here — confirming the fix is symmetric (it keeps lifts, drops regressions), not just a regression guard.
4. **P14 tally is now helped/held 014, 019, 021 vs regressed 013, 017, 020** — a near-even split, still
   reference-dependent. The keep-the-better-round selection remains the indicated instrument fix.

## Bottom line

A correctly-scoped generalization result — the success condition for this ticket. The champion's
reference-grounding principles transfer cleanly to a single-colossal-opening massing they were never
derived on (`overall = strong`, both rounds); P12 is confirmed across a fourth pale palette; proportion
held through a 2nd pass that for once didn't regress it. The sharpest finding is on detail: the flat-field
lever is whack-a-mole — it fills the field you name and blankness migrates elsewhere — which strengthens,
not weakens, P15's case for a whole-facade ornament pass. Zero source risk (no diff, tests green).
