# T-036-02 — Progress

## Step 1 — Pre-flight ✅
- `npm test` → **312 pass / 0 fail** (baseline). Environment healthy.
- Next seq confirmed.

## Step 2 — Launch live run ✅
```
npm run bench:sculpture -- --subject "a moai statue" --scale 32 \
  --note "T-036-02 build (E-13/S-036): angular monolith — text-JSON best case"
```
- Completed end-to-end. **Deviation from plan:** run id is `003-vConcept-a-moai-statue`, not the
  expected `002` — a sibling E-13 ticket (`002-vConcept-a-dancing-man`) ran concurrently and took
  seq 002 (lisa runs build tickets in parallel on the same branch; `nextSeq()` simply took the next
  free number). No conflict — run dirs are independent. The subject slug in the run id is correct.
- Stages: doc 2285 chars → concept gemini-3-pro-image-preview 20.7s → build **58 ops** → 3/4 still
  **2402 blocks, 0 unmapped** → rock turntable **24 frames**. $0.5684, 20379/14273 tok, ~6.5 min.

## Step 3 — Validate artifact ✅
- `summary.json`: subject "a moai statue", scale 32, `unmapped == 0`, blocks 2402, bounds height
  31 ≈ 32 longest edge. Schema-valid (enforced by the build seam).
- Palette manifest = `gray_concrete` (80%), `stone` (14%), `red_sandstone` (4%), `andesite` (2%) —
  exactly the design doc's named monochrome-stone + warm-accent palette.

## Step 4 — Read images (fidelity-vs-concept) ✅
- Inspected `concept.png`, `render-3q.png`, turntable frames 000 & 012.
- Key finding: form/proportion/silhouette/topknot/plinth transferred faithfully; the concept→voxel
  gap is **tonal value** — real `gray_concrete` is dark charcoal vs the concept's light tuff — plus
  some facial-legibility softening from bright light-stone recesses (tiki-leaning).

## Step 5 — Author fidelity.md ✅
- `runs/003-vConcept-a-moai-statue/fidelity.md`: one-line verdict + concept→render comparison +
  categorical judgement table (overall **Competent**, form **Strong**) + single-view notes +
  prediction check (angular-best-case holds for geometry, not for palette value).

## Step 6 — Regression + provenance ✅
- `npm test` → **312 pass / 0 fail** (unchanged — no source touched).
- README RUNS block regenerated → lists run 003.
- `git status` scope: `benchmarks/sculpture/README.md` (regen) + `runs/003-…/` (new) +
  `docs/active/work/T-036-02/*`. NOTHING under `src/`, `baml_src/`, `render/`, or the runner. ✔
  (Modified ticket `.md` files are lisa's phase bookkeeping, not this ticket's edits.)

## Step 7 — Review
- See `review.md`.

## Deviations from plan
1. Run seq 003 not 002 (concurrent sibling ticket). Cosmetic; documented above.
2. None other. No re-run needed; no source changes; no fallback-to-001 needed (live run succeeded).
