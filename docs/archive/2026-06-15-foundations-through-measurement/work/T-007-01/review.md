# Review — T-007-01: ground-on-horyuji (generalization stress test)

Handoff for a human reviewer. What changed, the result, test/verification status, and open concerns.
Unlike T-010-01's checkpoint review, this ticket is **complete**: the metered trial ran, both rounds
are judged, the verdict is reached, and the journal entry is written.

## TL;DR / status

- **Complete and clean.** Champion `vRefRevise-designdoc` ran on `references/horyu_ji.JPG`
  (run `019`). Both `round-0.png` and `render.png` judged (median-of-3); **overall = strong (3/3)** on
  both. **P12 HELD, P13 HELD** — both generalized off-domain with **no prompt edit**. Journal entry
  appended. `npm test` 133/133 green. The only code action was reverting an un-promoted working-tree
  edit to the committed champion, so **`run.mjs` ends byte-identical to HEAD**.
- **Headline result:** the reference-grounding principles (P11–P15) are **not Taj-specific**. On a
  reference deliberately unlike the Taj — vertical, tiered, near-monochrome timber, two freestanding
  3-D masses — the champion held `strong` and both principles under test survived intact.

## What this ticket tested

Whether two principles derived on the domed Taj generalize to the Hōryū-ji (wooden pagoda + hall):
- **P12** — a reference supplies CRAFT, not COLOR; color comes from the brief.
- **P13** — a facade is ONE connected plane; borrow rhythm, not 3-D standalone parts.

## The result (grounded in the renders + judge notes)

| dimension | round-0 (build) | render (2nd pass) |
|-----------|-----------------|-------------------|
| proportion | strong | strong |
| color | strong | strong |
| detail | competent | competent |
| fidelity | strong | strong |
| **overall** | **strong (3/3)** | **strong (3/3)** |

- **P12 — HELD.** The model wrote "white plaster, dark wood, gray tile — *information, not mandate*" and
  built a vermilion / jade-green / gold / grey scheme. Boldly colorful; the monochrome timber did not
  leak. Strongest off-domain P12 confirmation yet (the reference is white **+ wood + tile**, a fuller
  monochrome trap than the white Taj).
- **P13 — HELD.** The freestanding five-storey pagoda was folded into a **crowning tiered spire on one
  connected elevation** — no floating tiers, no detached tower. Proportion held `strong` through the 2nd
  pass (the *inverse* of Taj runs 013/017, where the revision detached masses and regressed proportion).
  P13 covers vertical stacked-tier references, not only lateral corner-towers.
- **Neither pre-registered trigger fired** (Decision C), so no minimal generalizing edit was needed.

## Files changed / created

- **`benchmarks/temple-facade/run.mjs`** — `git checkout HEAD --` to drop S-010's **un-promoted**
  texture-grain working-tree edit, restoring the committed **015-menu champion**. Net vs HEAD: **no
  diff** (tree clean). This is the inherited-champion decision (see "Decision to flag" below).
- **`docs/knowledge/design-learnings.md`** — appended one dated attempt-log entry (run 019: A/B table,
  P12/P13 held verdicts, the cross-finial blemish, attribution) and added a one-line generalization
  note to the distilled **P13** principle. No rubric/brief content touched.
- **`docs/active/work/T-007-01/`** — `research.md`, `design.md`, `structure.md`, `plan.md`,
  `progress.md`, `review.md`, and `judge-round0.mjs` (copied from T-006-01; used to A/B round-0).
- **`benchmarks/temple-facade/runs/019-vRefRevise-designdoc/`** — run outputs retained (reference,
  design-doc, prompts, both PNGs, artifact.json, summary.json, transcript); README gallery regenerated.

## Files NOT touched (frozen, as required)

`task.mjs` (brief/seed/view), `judge.mjs` / `baml-judge.mts` / `baml_src/*` (rubric), the AJV schema,
`src/config.mjs` (model pin), `composeHighResBuildPrompt` and `composeReferenceDesignDocPrompt`. No
prompt was edited (champion run as-is).

## Test coverage

- **Automated (`npm test`): 133 / 0.** Run before the trial (pre-spend gate) and after all edits. It
  guards artifact validation only; no code logic changed (the revert restores HEAD; everything else is
  markdown), so this is the appropriate and sufficient automated gate.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on **both** renders,
  read against the live renders for P12/P13. Single generation (Decision D): P12/P13 are structural,
  low-variance reads that a strong render answers reliably; both rounds agreed unanimously
  (`strong/strong/strong`), so there is no noise ambiguity to resolve. `detail`'s `competent` is read
  with the P15 noise caveat and is not the dimension under test.

## Acceptance criteria — status

1. ✅ Trial runs end to end; **both** `round-0.png` and `render.png` scored (median-of-3, P14).
2. ✅ Journal attempt-log entry: per-dimension A/B scores + explicit **held/failed** for P12 and P13,
   grounded in the render.
3. ✅ No principle failed, so no scoping was required; no prompt edit was made (champion as-is), so
   there is no diff to record beyond the revert; `npm test` green.
4. ✅ Renders + `summary.json` retained under `benchmarks/temple-facade/runs/019-vRefRevise-designdoc/`.

## Decision to flag for human review

- **D1 — Inherited-champion = committed HEAD (the 015 menu), and I reverted S-010's dirty WT edit.**
  The ticket inherits "whatever champion the two detail experiments left." Neither promoted (S-006
  never committed; S-010's texture grain produced run 017's `proportion` regression + no `detail` lift,
  with no promotion journal entry — and T-010-01's own review names the 015 menu as the non-promotion
  revert target). So I ran the committed champion and reverted the un-promoted edit. **This is
  reversible** (T-010-01 artifacts document the texture edit) and **immaterial to P12/P13** (those
  blocks are identical across variants). If a reviewer intended texture-grain to be the standing
  champion, re-apply it and the P12/P13 verdict still stands — only the `detail` framing would shift.

## Open concerns / follow-ups (not actioned — out of scope)

- **C1 — Cross-form finial (fidelity hazard).** The gold crown rendered as a Latin-cross-like shape on
  an East-Asian pagoda; judge: "an oddly syncretic signal that muddies the cultural identity." It did
  not cost a category (fidelity stayed strong) but is a real *crowning-motif* slip distinct from
  P12/P13. Candidate future lever: ask the crown's motif to stay within the reference's tradition.
  Filed in the journal, not fixed (generalization run).
- **C2 — `detail` still the holdout.** Flat white window/wall panels persist (competent both rounds),
  exactly as P15 predicts. The lever that targets it is S-010's texture grain, which did not promote;
  the holdout is unchanged by this ticket.
- **C3 — Single generation.** P12/P13 are structural and read cleanly here; if a reviewer wants
  belt-and-suspenders robustness, one confirmer generation (~$1.5, ~12 min) would re-test, but the
  unanimous both-rounds `strong` makes this low-value.
- **C4 — Stray background processes (carried from T-010-01).** Earlier sessions left concurrent
  `run.mjs` processes that auto-numbered run dirs independently (016/017/018 from S-006/S-010). Run 018
  has only `round-0.png` (no summary) — an incomplete sibling. A human may want to prune `runs/018-*`;
  this ticket's run is cleanly `019` and complete.

## Bottom line

A clean, complete generalization result: **both principles under test held off-domain**, the champion
scored `strong (3/3)` on both rounds, no prompt change was needed, tests are green, and the verdict is
recorded in the auto-injected corpus (with P13 generalized to cover vertical tiered references). The
only judgment call — treating the committed HEAD as the inherited champion — is flagged above and is
both reversible and immaterial to the verdict.
