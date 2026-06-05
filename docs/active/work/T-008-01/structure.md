# Structure — T-008-01: ground-on-sainte-chapelle

The shape of the work: which files change, which are produced, which are frozen, ordering. This ticket is
**experiment-shaped** — most "structure" is artifacts + a journal append, with a code edit only as a
conditional contingency. No new modules.

## Files — source code

### Reverted/edited (the guaranteed code action)
- **None.** The working tree is already **clean vs HEAD** on `benchmarks/temple-facade/run.mjs`
  (`git diff --stat HEAD` empty at session start). HEAD *is* the champion (015 menu). Unlike T-007-01,
  there is **no texture-grain edit to revert**. Net code diff for this ticket = **zero** unless a
  pre-registered trigger fires.

### Conditionally modified (ONLY if a pre-registered trigger fires — Design D)
- **`benchmarks/temple-facade/run.mjs`** — a *single minimal clause* in exactly one of:
  - the **P12 color-hold bullet** (`composeRefRevisionPrompt`, L433–436) — extend "white" to also name
    the **grey-stone / pale-limestone** capture mode (only if the render reads monochrome stone); and/or
  - the **P13 one-plane block** (L419–423) — generalize "corner towers/minarets" to also name
    **pinnacles / spirelets / buttresses** as engaged relief (only if verticality detached the crown or
    broke proportion).
  - Boundaries: append/replace within the existing bullet/block only; no new function, no signature
    change, no call-site change. `composeRefRevisionPrompt` has exactly one call site (stage 3, L920).

### Frozen (must not change — per AC)
- `benchmarks/temple-facade/task.mjs` (brief, seed=11, view), `judge.mjs` + `baml-judge.mts` +
  `baml_src/*` (rubric `v2-categorical-baml`), the AJV schema, `src/config.mjs` (model pin),
  `composeHighResBuildPrompt` (round-0 control), `composeReferenceDesignDocPrompt` (stage-1 doc).

## Files — work artifacts (`docs/active/work/T-008-01/`)

- `research.md` *(done)* — map + the reference-premise discrepancy.
- `design.md` *(done)* — Decisions A–E (incl. Decision C, the discrepancy resolution).
- `structure.md` *(this file)*.
- `plan.md` — ordered steps + verification.
- `progress.md` — live tracker + the A/B scoreboard (round-0 vs render, per dimension) + P12 verdict
  scratch. **Already partly resolved:** stage-1 `design-doc.md` shows the model read the reference as
  **pale stone** and committed to a colorful palette → Path 2 (see Design C).
- `judge-round0.mjs` — **copied** from `docs/active/work/T-006-01/judge-round0.mjs` (proven helper;
  scores any PNG via `judgeRender` median-of-3 against the frozen brief). Same relative-import depth
  (`../../../../benchmarks/temple-facade/…`) — no path edit. Satisfies AC #1's "round-0.png … scored"
  without touching `run.mjs`'s `main()`.
- `review.md` — handoff.

## Files — the journal (the substantive deliverable)

- **`docs/knowledge/design-learnings.md`** — append ONE dated entry to the "Attempt log (newest last)"
  section (append at EOF; the log currently ends at the run-014 entry). Content (AC #2/#3):
  - run id (`020-vRefRevise-designdoc`), reference (Sainte-Chapelle de Vincennes), config (champion, 015
    menu, tree clean — no revert).
  - **The premise discrepancy, stated up front:** ticket framed this as the *agreement* case (colorful
    glass); the provided image is the **grey-limestone exterior**, and the stage-1 doc confirms the model
    read it as **pale** ("I take its structure, not its pallor"). So this is effectively a **second
    conflict-condition** run, not the agreement case.
  - **A/B per-dimension table**: round-0 vs render × {proportion, color, detail, fidelity, overall}.
  - **P12 verdict (the load-bearing one):** *neutral vs additive*, correctly scoped. Expected shape given
    the doc: P12 was **NOT neutral** here — it stayed **load-bearing** because the image is pale exterior,
    so the ticket's "agreement → no-op" hypothesis is **refuted on its premise**, while the deeper
    mechanism (color from brief overrides a pale reference) is **confirmed robust** across a third pale
    reference. (Render must confirm `color` actually landed strong.)
  - **Secondary observations:** `proportion` under Gothic **verticality** (cf. P13 — did the 1.6:1
    soaring massing + pinnacles hold a coherent one-plane elevation?); `detail` on dense **tracery** (did
    the S-006 lever transfer — rose medallion, crockets, lancets — or did fields still read flat?).
  - judge `notes` excerpts grounding each verdict in the render.
  - if any minimal prompt edit was made: the diff + `npm test` green confirmation.
  - **Refine/scope the Principles section** (P12 wording especially) as the result warrants — most likely
    *scope P12's condition* to "any pale/monochrome reference (white, timber, OR stone)", and note that
    the true *agreement* case (a genuinely polychrome reference image) **remains untested** because this
    image was an exterior.

## Files — run outputs (auto-produced by `run.mjs`, retained — AC)

`benchmarks/temple-facade/runs/020-vRefRevise-designdoc/`: `reference.png`, `design-doc.md`,
`*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`, `transcript.jsonl`. README
gallery regenerates automatically. Durable evidence; do not prune.

## Ordering (where it matters)

1. **Clean tree → green test → launch.** Confirmed: tree clean, `npm test` 133/133 green, run launched
   (020, in flight — stage-1 doc already on disk).
2. **Run → judge.** `render.png` auto-judged by `main()`; `round-0.png` judged after with the helper.
   Both before the journal entry (the entry needs both columns).
3. **Judge → verdict → journal → (conditional edit) → review.** Any conditional edit is decided from the
   render *before* writing it, then re-tested.

## Risk / blast radius

- **Zero guaranteed code change** (tree clean). A conditional edit, if any, is confined to one bullet in
  one single-call-site function; `npm test` (133) re-run guards artifact validity (a string edit cannot
  break the schema, but the gate is cheap).
- No frozen file is touched; no schema/rubric/brief drift; the generalization signal is preserved.
- The one *interpretive* risk — mislabeling the condition (agreement vs conflict) — is mitigated by
  Decision C: the verdict is grounded in the stage-1 doc + render, not the ticket's a-priori label.
