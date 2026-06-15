# Structure — T-012-01: ground-on-mausoleum

The shape of the work: which files change, which are produced, which are frozen, ordering. This ticket is
**experiment-shaped** — most "structure" is artifacts + a journal append, with a code edit only as a
conditional contingency. No new modules.

## Files — source code

### Reverted/edited (the guaranteed code action)
- **None.** The working tree is already **clean vs HEAD** on `benchmarks/temple-facade/run.mjs`
  (`git diff --stat HEAD` empty at session start). HEAD *is* the champion (015 menu). Like T-008-01/
  T-011-01 and unlike T-007-01, there is **no un-promoted edit to revert**. Net code diff for this ticket =
  **zero** unless a pre-registered trigger fires.

### Conditionally modified (ONLY if a pre-registered trigger fires — Design E)
- **`benchmarks/temple-facade/run.mjs`** — a *single minimal clause* in exactly one of:
  - the **P12 color-hold bullet** (`composeRefRevisionPrompt`, ~L433) — extend it to name that **even a
    reference that is already colorful is a CRAFT anchor, not a palette mandate** (only if the render
    captured the reference's blue+white instead of the brief's scheme); and/or
  - the **P13 one-plane block** (~L419) — name **stacked roof tiers + engaged buttress-walls as bonded,
    not detached** (only if a roof tier or a wing-wall floated, or the 2nd pass detached the roof cap).
  - **NOT the detail clause (L429):** a flat-field persistence on the calcite wing-walls is the expected
    P15 holdout, not a trigger (Design E). The detail clause is tuned only under the S-006/S-010 tickets'
    ≥2-generation gate.
  - Boundaries: append/replace within the existing bullet/block only; no new function, no signature change,
    no call-site change. `composeRefRevisionPrompt` has exactly one call site (stage 3, ~L920).

### Frozen (must not change — per AC)
- `benchmarks/temple-facade/task.mjs` (brief, seed=11, view), `judge.mjs` + `baml-judge.mts` + `baml_src/*`
  (rubric `v2-categorical-baml`), the AJV schema, `src/config.mjs` (model pin), `composeHighResBuildPrompt`
  (round-0 control), `composeReferenceDesignDocPrompt` (stage-1 doc).

## Files — work artifacts (`docs/active/work/T-012-01/`)

- `research.md` *(done)* — map + the mausoleum's blue-white palette + stacked-roof/battered-wing massing +
  the rubric-incommensurability hazard + run 008's two named defects.
- `design.md` *(done)* — Decisions A–E (incl. Decision B's two-leg 008-vs-now method, Decision C reframing
  P12 as the first mildly-colorful reference, Decision D making 008's named defects the detail headline,
  Decision E fencing detail out of the trigger set).
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification.
- `progress.md` — live tracker + the A/B scoreboard (round-0 vs render, per dimension) + the 008-vs-now
  comparison + the three verdicts. **Already pre-classified from stage-1:** `design-doc.md` ("Temple of the
  Cobalt Ascendant") shows the model **did NOT collapse to the reference's white** — it states *"The
  reference hands me one true color — that cobalt roof — and I commit to it boldly rather than collapsing
  to its white walls,"* and builds a brief-driven **complementary scheme**: `blue_glazed_terracotta`
  dominant, `calcite` field, `gold_block` accent (complement), `red_concrete` vermilion counter-accent. So
  P12 fired in the *keep-color* direction under **mild agreement** (it borrowed the reference's one
  saturated hue as a seed but structured a full dominant/supporting/accent harmony from the brief). The doc
  also *plans* relief for the entablature bracket course, arched spandrels (relief scrollwork), and stepped
  voussoir arches — so the detail read is whether the build/render delivered that on the broad calcite
  wing-wall/base fields 008 flagged blank.
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (proven helper; scores
  any PNG via `judgeRender` median-of-3 against the frozen brief). Same relative-import depth
  (`../../../../benchmarks/temple-facade/…`) — no path edit. Satisfies AC #1's "round-0.png … scored"
  without touching `run.mjs`'s `main()`.
- `review.md` — handoff.

## Files — the journal (the substantive deliverable)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)"
  section (append at EOF; the log currently ends at the run-020 / Sainte-Chapelle entry — run 021/Arc has
  no entry, see research). Content (AC #2/#3):
  - run id (`022-vRefRevise-designdoc`), reference (Sun Yat-sen Mausoleum), config (champion, 015 menu,
    tree clean — no revert).
  - **The cumulative-progress framing up front:** the mausoleum is *the reference that first proved
    grounding* (run 008), re-run under everything invented since — this is the chain's only true
    accumulated-technique-on-a-fixed-reference measurement.
  - **A/B per-dimension table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **The 008-vs-now comparison (the headline)** built on the two rubric-independent legs (Design B):
    *Leg 1 (failure-named)* — did the pipeline fix 008's *"shallow portico"* and *"wide blank base
    register"*? *Leg 2 (categorical-on-its-own-terms)* — the 022 categorical scores as the current
    instrument's reading, with an explicit statement that they are **not** numerically comparable to 008's
    v1 4/5 (only to runs 010–021).
  - **P12 verdict:** held/failed; the **first mildly-colorful reference** — note it did NOT collapse to
    white at the doc stage and committed to a blue↔gold complementary scheme; the render must confirm color
    landed. Frame as the first (partial) evidence on the long-open *colorful-reference* side of P12.
  - **P13 verdict (on this massing):** held/failed for proportion on the double-eaved stacked roof +
    battered wings; note whether tiers/wings stayed bonded and whether the 2nd pass held or regressed.
  - **Detail verdict (the headline detail read):** did the lever resolve 008's blank base register /
    wing-walls — a confident render-grounded yes/no on visible articulation, plus the `detail` category
    with the P15 noise caveat.
  - judge `notes` excerpts grounding each verdict in the render.
  - if any minimal prompt edit was made: the diff + `npm test` green confirmation.
  - **Refine/scope the Principles section** as the result warrants — most likely (a) add the mausoleum as
    the **first mildly-colorful / partial-agreement** point under **P12** (the colorful-reference side the
    chain has wanted since run 020), and (b) record the wing-wall/base-register outcome under **P15**. Leave
    rubric/brief untouched.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC)

`benchmarks/temple-facade/runs/022-vRefRevise-designdoc/`: `reference.JPG`, `design-doc.md`,
`*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`, `transcript.jsonl`. README
gallery regenerates automatically. Durable evidence; do not prune.

## Ordering (where it matters)

1. **Clean tree → green test → launch.** Confirmed: tree clean, `npm test` 133/133 green, run launched
   (022, in flight — stage-1 doc already on disk, read, and pre-classified above).
2. **Run → judge.** `render.png` auto-judged by `main()`; `round-0.png` judged after with the helper. Both
   before the journal entry (the entry needs both columns).
3. **Judge → verdicts → journal → (conditional edit) → review.** Any conditional edit is decided from the
   render *before* writing it, then re-tested.

## Risk / blast radius

- **Zero guaranteed code change** (tree clean). A conditional edit, if any, is confined to one bullet in one
  single-call-site function; `npm test` (133) re-run guards artifact validity (a string edit cannot break
  the schema, but the gate is cheap).
- No frozen file is touched; no schema/rubric/brief drift; the cumulative-progress signal is preserved
  (only the *accumulated pipeline* differs from run 008 — same image, brief, seed).
- The detail dimension is **fenced out** of the trigger set, so the expected flat-field holdout cannot be
  mistaken for a generalization failure and patched off a single noisy run.
- **Analytical risk, not code risk:** the 008-vs-now comparison could be mis-stated as a numeric jump across
  incommensurable rubrics. The two-leg method (Design B) is the guardrail; the journal entry must apply it.
