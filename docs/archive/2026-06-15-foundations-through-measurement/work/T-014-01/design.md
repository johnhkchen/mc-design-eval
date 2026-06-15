# Design — T-014-01: consolidate-overnight-run

Decisions for the synthesis, each grounded in the run dirs / journal entries from Research. The "options"
here are editorial (where text goes, what each principle's verdict is), not architectural.

## A. Per-principle verdict (the core decision — AC #1)

For each principle the night tested, the verdict + one-line reason, grounded in cited runs:

| principle | verdict | one-line reason (cited) |
|-----------|---------|--------------------------|
| **P12** color from brief | **PROMOTE (reinforce)** | Held across 4 new references this chain — 019 timber/white/grey, 020 pale stone, 021 cream limestone, 022 two-tone cobalt; color=strong every time, never leaked. |
| **P13** one connected plane | **PROMOTE (reinforce)** | Held across pagoda tiers (019), Gothic verticality (020), single colossal opening (021), stacked roof-eaves + battered walls (022); proportion never regressed *from* the rule. |
| **P14** 2nd-pass double-edge | **SCOPE** | Reference-dependent ≈coin-flip: helped/held 019/021/022, regressed 020 (strong→competent, traded a recessed portal+rose for a flat gold slab). "Judge both rounds, keep the better" now strongly indicated. |
| **P15** detail holdout | **REINFORCE; the two dedicated detail levers DISCARDED** | Both detail experiments failed — S-006 relief panels (016) left detail competent; S-010 texture grain (017) left detail competent *and* regressed proportion strong→competent. Whack-a-mole confirmed (021). Cure = whole-facade fenced ornament pass, not a menu clause. |
| **persona** `--system-prompt` (S-013) | **INCONCLUSIVE — experiment incomplete** | Only the OFF arm finished (023, strong 3/3); ON arm (025) built round-0 but never rendered/scored. No verdict. Wiring landed (inert by default). |
| **effort** `--effort` (S-009) | **INCONCLUSIVE — experiment incomplete** | Only the DEFAULT arm finished (024, strong 3/3); HIGH arm never launched. No verdict. Wiring landed (inert by default). |

**Why these and not others:** P11 (surface-the-invariant) and P1–P10 were not under test this chain — no
edit. The two knobs are *experiments*, not principles, but the AC's "each principle the night tested"
fairly covers "each thing the night set out to learn," and honesty (the explicit AC) demands the two
incomplete A/Bs be recorded as inconclusive rather than silently dropped.

### Promote vs scope vs discard — the rationale

- **P12/P13 = promote (reinforce), not merely "held."** Four independent off-domain confirmations in one
  night is exactly the evidence that upgrades a Taj-derived hypothesis into a load-bearing principle. The
  principle *text already* documents these runs (it was updated live per-run); consolidation's job is to add
  the **chain-level verdict line**, not to rewrite the body. One genuine scope-limit survives and must stay
  visible: the *fully-polychrome reference* neutrality case is still untested (022 was two-tone, the closest
  yet). That is a scope note *inside* a promoted principle, not a reason to withhold promotion.
- **P14 = scope, not promote/discard.** It is genuinely double-edged: the same revision both lifts (021
  detail competent→strong) and regresses (020 strong→competent). The honest record is the running tally and
  the condition (reference-dependent), plus the indicated instrument fix. Not a discard (it helps more often
  than it hurts), not a clean promote (it cost a whole category on 020).
- **Detail levers = discard.** This is the night's one hard, honest negative. Two distinct mechanisms, two
  non-promotions; S-010 was actively harmful. Per the pre-registered promotion rule (T-006/T-010: keep only
  on a robust full-category detail lift to strong with no regression), both fail. Record as discarded; the
  champion does not change.
- **Knobs = inconclusive.** Not "no effect" (that would be a false negative — the treatment never ran).
  The correct, honest label is *incomplete experiment*. The deliverable that *did* land is the wiring.

## B. Champion config (AC #2)

**Unchanged.** No lever promoted, so the next chain starts from the **same committed champion**: HEAD's
`vRefRevise-designdoc` with the **015 "NO LARGE FLAT FIELDS" detail menu**. Categorical band (median-of-3,
the night's confirmation runs 019/021/022/023/024 + the canonical 014):

```
overall    strong (3/3)
proportion strong
color      strong
detail     competent   ← the lone holdout, the climb target
fidelity   strong
```

Canonical exemplar render: **run 014** (Taj, first unanimous strong). Re-confirmed off-domain on 019
(Hōryū-ji), 021 (Arc), 022 (mausoleum). The working tree carries the additive persona/effort wiring —
**inert with no `--persona-file`/`--effort` flag**, so it does not alter the champion; noted only so the
next session knows the knobs are already plumbed.

**No tie to break** ⇒ the optional re-judge the ticket permits is not used.

## C. Morning brief content (AC #3)

- **What moved:** nothing in the champion — this was a **confirmation night**, not a tuning night. P12 and
  P13 generalized to four new massings/palettes, holding overall strong 3/3; P12 got its first (partial)
  *colorful-reference* data point (022, two-tone cobalt — held as a near-neutral-but-still-protective no-op).
- **What didn't:** **detail** — still competent everywhere; both dedicated detail levers failed (016 flat,
  017 regressed proportion). The two knob A/Bs (persona, effort) are **unfinished** — only control arms ran.
  P14 regressed once (020).
- **Renders to spot-check** (cited, reproducible): `020/render.png` vs `020/round-0.png` (the P14
  regression — flat gold pediment slab replaced a recessed portal + rose); `021/render.png` (the one detail
  lift — dense gold ornament around openings, but the enlarged blue arch void stays flat = whack-a-mole);
  `022/render.png` vs `008/render.png` (cumulative progress on the founding reference).
- **Single recommended next experiment:** the **whole-facade fenced ornament pass** (the P15 cure) — a
  dedicated detail-only revision that audits *every* plane wider than ~6 blocks and adds relief without
  spending budget elsewhere. It targets the sole lagging dimension (detail → exceptional) and is the highest-
  leverage *quality* climb left. Cheap cleanup to do alongside / first: finish the two half-done knob arms
  (persona ON, effort HIGH) — the wiring is already in the tree, so each is one command + a judge.

## D. Placement decision

Three edit sites in `design-learnings.md`, chosen so the read-first zone carries the conclusions and the
log stays append-only honest:

1. **New top banner `🌅 Morning brief (2026-06-05)`** at the head of *Principles (distilled)* — carries the
   champion config block + what-moved/what-didn't + renders to spot-check + the single next experiment.
   Rationale: the file's own convention is "Principles… read it first"; the champion + brief are exactly the
   read-first payload. (The ticket allows "top of the attempt log OR a dated section" — a dated banner in the
   read-first zone satisfies "dated section" and is more useful than burying it at the tail.)
2. **One-line consolidation verdict** appended to each of **P12, P13, P14, P15** (`**Chain verdict
   (T-014-01):** …`). Keeps the per-run bodies intact; adds the distilled mark the AC requires.
3. **A single dated consolidation attempt-log entry** at the tail (`### Consolidation · 2026-06-05`) that
   records the un-journaled runs (016, 017, 023, 024, 025) and the two inconclusive knobs, so nothing the
   night did is lost and the brief is reproducible from cited run IDs. This is cheaper and more honest than
   back-filling five separate per-run entries, and it explicitly states *why* 016/017/023/024/025 lack their
   own entries.

**Rejected:** (a) back-filling five full per-run entries — high effort, and the levers/knobs are
non-promotions/incompletes that don't each merit 30-line write-ups; the inline + consolidation-entry
treatment is proportional. (b) Editing the champion into a new committed config — there is nothing to
commit (no promotion). (c) Touching P11/P1–P10 — not under test.

## E. Non-goals / guardrails

- No edit to `judge.baml` or `task.mjs` (frozen). No new trials. No frontmatter/phase edits (Lisa handles).
- Keep prior scores comparable — do not restate or "correct" any past categorical score.
- `npm test` must stay 133/133 (no source change in this ticket, so it will).
