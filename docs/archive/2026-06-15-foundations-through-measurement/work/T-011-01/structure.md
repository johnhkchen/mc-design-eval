# Structure — T-011-01: ground-on-arc

The shape of the work: which files change, which are produced, which are frozen, ordering. This ticket is
**experiment-shaped** — most "structure" is artifacts + a journal append, with a code edit only as a
conditional contingency. No new modules.

## Files — source code

### Reverted/edited (the guaranteed code action)
- **None.** The working tree is already **clean vs HEAD** on `benchmarks/temple-facade/run.mjs`
  (`git diff --stat HEAD` empty at session start). HEAD *is* the champion (015 menu). Like T-008-01 and
  unlike T-007-01, there is **no un-promoted edit to revert**. Net code diff for this ticket = **zero**
  unless a pre-registered trigger fires.

### Conditionally modified (ONLY if a pre-registered trigger fires — Design E)
- **`benchmarks/temple-facade/run.mjs`** — a *single minimal clause* in exactly one of:
  - the **P12 color-hold bullet** (`composeRefRevisionPrompt`, L433–436) — extend "white" to also name
    the **cream / pale-limestone** capture mode (only if the render reads monochrome cream stone); and/or
  - the **P13 one-plane block** (L419–423) — generalize the engaged-relief wording to name a **heavy
    attic/cornice as engaged, not a detached cap** (only if the single-arch massing went top-heavy or the
    2nd pass detached the attic).
  - **NOT the detail clause (L429–432):** a flat-field persistence is the expected P15 holdout, not a
    trigger (Design E). The detail clause is tuned only under the S-006/S-010 tickets' ≥2-generation gate.
  - Boundaries: append/replace within the existing bullet/block only; no new function, no signature
    change, no call-site change. `composeRefRevisionPrompt` has exactly one call site (stage 3, L920).

### Frozen (must not change — per AC)
- `benchmarks/temple-facade/task.mjs` (brief, seed=11, view), `judge.mjs` + `baml-judge.mts` +
  `baml_src/*` (rubric `v2-categorical-baml`), the AJV schema, `src/config.mjs` (model pin),
  `composeHighResBuildPrompt` (round-0 control), `composeReferenceDesignDocPrompt` (stage-1 doc).

## Files — work artifacts (`docs/active/work/T-011-01/`)

- `research.md` *(done)* — map + the Arc's flat-field structure + the P13-reframing nuance.
- `design.md` *(done)* — Decisions A–E (incl. Decision C reframing P13, Decision D making the
  attic/spandrel read primary, Decision E fencing detail out of the trigger set).
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification.
- `progress.md` — live tracker + the A/B scoreboard (round-0 vs render, per dimension) + the three
  verdicts. **Already pre-classified:** stage-1 `design-doc.md` ("Temple of the Solar Triumph") shows the
  model read the reference as **pale** ("No white wall … the reference's pale stone is *translated* into
  warm desert stone") and committed to a colorful red-sandstone/granite/gold/lapis scheme → **conflict
  condition**, P12 split fired at the doc stage. The doc also *plans* relief for the attic (rondel
  shields) and spandrels (winged Victory) — so the detail read is whether the build/render delivered it.
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (proven helper;
  scores any PNG via `judgeRender` median-of-3 against the frozen brief). Same relative-import depth
  (`../../../../benchmarks/temple-facade/…`) — no path edit. Satisfies AC #1's "round-0.png … scored"
  without touching `run.mjs`'s `main()`.
- `review.md` — handoff.

## Files — the journal (the substantive deliverable)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)"
  section (append at EOF; the log currently ends at the run-020 / Sainte-Chapelle entry). Content
  (AC #2/#3):
  - run id (`021-vRefRevise-designdoc`), reference (Arc de Triomphe), config (champion, 015 menu, tree
    clean — no revert).
  - **The massing framing up front:** the Arc is a *single colossal opening* unlike any prior reference —
    no standalone parts, so the P13 *detachment* mode is un-exercised; the proportion read is
    "coherent-silhouette on a one-arch massing."
  - **A/B per-dimension table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 verdict (load-bearing):** held/failed; this is a **fourth pale reference** (cream limestone) →
    another conflict point. The model read it as pale and committed to color at the doc stage; the render
    must confirm color survived to the build.
  - **P13 verdict (on this massing):** held/failed for proportion on one giant arch; explicitly note the
    detachment mode was not exercised.
  - **Detail verdict (the headline):** **did the lever resolve the attic/spandrel flat fields** — a
    confident render-grounded yes/no on visible articulation, plus the `detail` category with the P15
    noise caveat.
  - judge `notes` excerpts grounding each verdict in the render.
  - if any minimal prompt edit was made: the diff + `npm test` green confirmation.
  - **Refine/scope the Principles section** as the result warrants — most likely (a) add the Arc as a
    *fourth* pale-reference point under P12, and (b) record the attic/spandrel outcome under P15 (the
    sharpest flat-field probe to date). Leave rubric/brief untouched.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC)

`benchmarks/temple-facade/runs/021-vRefRevise-designdoc/`: `reference.JPG`, `design-doc.md`,
`*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`, `transcript.jsonl`. README
gallery regenerates automatically. Durable evidence; do not prune.

## Ordering (where it matters)

1. **Clean tree → green test → launch.** Confirmed: tree clean, `npm test` 133/133 green, run launched
   (021, in flight — stage-1 doc already on disk and read).
2. **Run → judge.** `render.png` auto-judged by `main()`; `round-0.png` judged after with the helper.
   Both before the journal entry (the entry needs both columns).
3. **Judge → verdicts → journal → (conditional edit) → review.** Any conditional edit is decided from the
   render *before* writing it, then re-tested.

## Risk / blast radius

- **Zero guaranteed code change** (tree clean). A conditional edit, if any, is confined to one bullet in
  one single-call-site function; `npm test` (133) re-run guards artifact validity (a string edit cannot
  break the schema, but the gate is cheap).
- No frozen file is touched; no schema/rubric/brief drift; the generalization signal is preserved.
- The detail dimension is **fenced out** of the trigger set, so the expected flat-field holdout cannot be
  mistaken for a generalization failure and patched off a single noisy run.
