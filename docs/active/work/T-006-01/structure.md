# Structure — T-006-01

The shape of the change: which files change, the exact prompt edit, and the artifacts the
experiment produces. No code logic changes — one prompt string and a throwaway judging helper.

## Files MODIFIED

### 1. `benchmarks/temple-facade/run.mjs` — the only source edit
Function `composeRefRevisionPrompt` (lines 408–460). Rewrite the single bullet that currently
reads (≈ lines 429–433):

```
- Detail — NO LARGE FLAT FIELDS: any wall plane wider than ~6 blocks must carry layered relief —
  recessed panels, pilaster strips, string-courses, banding, or inset ornament. Add the reference's
  character (arch profiles, framing, motifs, texture) where your build is bare; treat any blank
  field as unfinished, especially the base/plinth and the flanks.
```

into the **mandatory recessed-panel + string-course grammar** (relief-only, palette held).
Constraints the new text must satisfy:
- Imperative, countable recipe (not a menu): EACH flat field > ~6 → a framed sunken panel;
  a string course every ~6–8 rows of height across the body.
- Relief-sourced: recess by exclusion (no air op — P11), frame with pilaster strips + courses,
  trim with stairs/slabs. Use `fill`/`box`/`line` so it is cheap at scale.
- Explicitly **hold the palette / dominant-supporting-accent hierarchy** — no new materials or
  related-block grain for "texture" (fences off the v5 color crash, P9).
- Name the worst offenders to attack: flanking wall fields, spandrels, base/plinth, window
  insets (from the 014/015 render reading).
- Leave every other bullet (proportion/one-plane/relief/color-restore/fixups) untouched and
  ahead of it, so the proportion/crown gains of 014 are preserved.

No other function changes. `composeHighResBuildPrompt` (the build) is deliberately left as-is so
`round-0` remains the unchanged control.

### 2. `docs/knowledge/design-learnings.md` — attempt-log entry (APPEND)
Append one dated attempt-log entry (newest last) for the run, recording: the prompt diff
(before/after of the bullet), the A/B per-dimension scores (round-0 vs render) for **both
generations**, the 015 baseline comparison, judge notes, and the **verdict** (promote / scope /
discard). If the verdict is discard/scope, also note that the prompt change was reverted. May
add/refine a principle (P15) only as the result warrants.

## Files NOT touched (ticket constraints / scope)
- `baml_src/judge.baml` — rubric frozen.
- `benchmarks/temple-facade/task.mjs` — brief frozen.
- `baml_src/facade.baml` — irrelevant to this approach (Research Finding 1); no `baml:gen`.
- Any schema/render/harness code.

## Files CREATED

### Throwaway helper (run dir, not committed source): score round-0
`main()` only judges `render.png`. To judge `round-0.png` (AC: both rounds, median-of-3) I
write a tiny one-off node script under `docs/active/work/T-006-01/` (e.g. `judge-round0.mjs`)
that imports `judgeRender` from `benchmarks/temple-facade/judge.mjs` and prints the categorical
score for a given PNG path + the Taj brief. It lives in the work dir as an experiment artifact,
not in `src/`. Reused for each generation's round-0 and for re-confirming the 015 baseline if
needed.

### Run outputs (auto, by the harness)
Each `vRefRevise-designdoc` invocation creates `benchmarks/temple-facade/runs/<NNN>-vRefRevise-
designdoc/` containing: `design-doc.md`, `build.prompt.txt`, `revise.prompt.txt`, `round-0.png`,
`render.png`, `artifact.json`, `summary.json` (final = render score), `transcript.jsonl`,
`reference.png`. The README gallery regenerates. **Retained** per AC.

### Work-dir record
`progress.md` (Implement) and `review.md` (Review) under `docs/active/work/T-006-01/`. Raw A/B
score JSON captured inline in `progress.md`.

## Ordering of changes (dependencies)
1. Edit `composeRefRevisionPrompt` (the lever).
2. `npm test` — confirm green (prompt-string change must not break anything).
3. Run generation 1 of the variant → judge `render.png` (auto) + `round-0.png` (helper).
4. Run generation 2 of the variant → judge both rounds.
5. Compare both generations + the 015 baseline; decide the verdict per the AC rule.
6. If NOT promoting: `git revert` the prompt edit in run.mjs (record negative result).
7. Append the attempt-log entry to `design-learnings.md` with diff, A/B, verdict.
8. Write `review.md`.

## Interfaces / invariants relied on
- `judgeRender({imagePath, brief, samples})` → `{proportion,color,detail,fidelity,overall,
  notes,perSample}` (judge.mjs:22). Stable; used as-is.
- `TEMPLE_FACADE_TASK.goal` is the brief string the judge needs (task.mjs).
- Run sequence numbers auto-increment via `nextSeq()`; new runs become 016, 017, …
- Generation = a fresh full run (no seed/temperature control on `claude -p`), so two runs of
  the identical variant config supply the robustness samples the AC requires.
</content>
