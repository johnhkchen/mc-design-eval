# T-177-01 — Plan

Ordered, independently-verifiable steps. The runner has no production-code change, so testing strategy =
unit suite stays green (regression guard) + the **glance** (4-azimuth beside-concept) is the acceptance
judge, per the ticket.

## Testing strategy

- **No new production unit tests** — `src/` geometry is untouched; `generateRoof` covering is already
  unit-proven by T-172-01 (hollow/watertight/byte-identity/closure-invariance). Adding tests for code we
  didn't change would be noise.
- **Runner correctness** — verified by *running* (metered-harness posture, like `roof-climb.mjs`):
  console-printed census (prism→covering fraction) + `closureOf`, and the rendered glance.
- **Regression guard** — `npm test` green after the change (proves no accidental `src/` edit).
- **Acceptance judge** — the 4-azimuth beside-concept render: roof reads as a *covered, eave-banded
  roof*, not a solid mass; walls still stone; no `unmapped` blocks.

## Steps

### Step 1 — write `experiments/eval-alignment/faithful-roof.mjs`
Per `structure.md`: flags + the four helpers (`eaveFromProgram`, `deriveFamily`, `modalBlock`) + `main()`.
- Derive `eaveY/ridgeAxis/pitch` from the program; detect roof field + gableBlock by modal block.
- Carve `y > eaveY`, single-bbox gable, covering, `gableBlock`.
- Census + closure + render + `SOURCE.md`.
- **Verify:** `node experiments/eval-alignment/faithful-roof.mjs` runs without throwing; prints
  `eaveY=19 ridge=x`, a covering census well below the prism's 53 %, and a closure number.
- *Commit:* `feat(T-177-01): program-driven carve+cover runner for the faithful gatehouse`.

### Step 2 — run + inspect the glance (the acceptance gate)
- Open `builds/gatehouse/faithful-covered/beside-concept.png` and the 4 azimuth views.
- **Verify (AC #2):** the roof is a covered gable, not a solid prism; walls read stone; the dark-oak
  covering + stone gable-ends read; no `unmapped` (magenta) blocks.
- **Verify (AC #1):** census `dark_oak_*` fraction dropped from ~53 % (prism) to the covering fraction;
  no `dark_oak_planks` *solid prism* remains (the interior is hollow).
- If the glance fails (reads worse than the prism / unmapped blocks): localize — adjust `ridgeY`/pitch or
  the family derivation, re-run. Record any deviation in `progress.md`.

### Step 3 — closure guard (AC #3)
- Compute `closureOf(eaveCols)` for the **faithful input** and for the **covered** build (same eave ring,
  since the carve keeps `y ≤ eaveY` verbatim). They must be equal (the roof never touches walls).
- **Verify:** report the number in console + `SOURCE.md` + `review.md`. Any regression is a finding.

### Step 4 — witnesses to the work dir + provenance
- Copy `beside-concept.png` + the 4 azimuth views into `docs/active/work/T-177-01/`.
- Write `builds/gatehouse/faithful-covered/SOURCE.md`: source build + program, the seam (post-realize
  artifact swap — *not* a compile-path merge), derived eaveY/ridgeAxis/pitch, family, census, closure,
  and the explicit "crater-ready, S-178 `CRATER_BUILD` → here" note.
- *Commit:* `docs(T-177-01): faithful-covered build dir + witnesses + provenance`.

### Step 5 — regression guard + honesty record
- `npm test` → green (no `src/` change; guards against accidental edits).
- **Verify (AC #5):** `git status` shows nothing under `measurements/` changed.
- **Verify (AC #4):** record honestly whether the pipelines composed cleanly or needed a seam — they did
  **not** compose in-path (the compile `roofBlocks` prism can't take covering without tripping the
  conformance gate); the clean composition is the post-realize artifact swap. Name it in `review.md`.

### Step 6 — Review
- Write `review.md`: files changed, the seam finding, census + closure numbers, the glance verdict, test
  coverage + gaps, open concerns (overhang/eave-band deferred to S-179), and the crater-ready handoff.

## Acceptance-criteria → step map
- AC #1 (faithful materials + constructed covering, no prism, program-driven) → Steps 1, 2.
- AC #2 (4-azimuth beside concept, in work dir, reads as covered) → Steps 2, 4.
- AC #3 (`closureOf` not regressed; report the number) → Step 3.
- AC #4 (record honestly; name the seam; crater-ready dir) → Steps 4, 5, 6.
- AC #5 (`npm test` green; instrument untouched) → Step 5.

## Rollback / failure branches (anti-hedge)
- **Pipelines don't compose without a prism fallback:** they don't compose *in-path* — and that is the
  recorded finding, not a paper-over. The deliverable is the post-realize swap, which is a *real*
  constructed roof, so the "prism fallback" failure does not apply (the carve removes the prism).
- **Covering reopens closure:** guarded in Step 3; if it moves, halt and report — do not ship.
- **Reads worse than the prism:** localize in `review.md` (covering not gatehouse-ready); the build dir is
  still delivered with the honest glance verdict so S-178 can decide.
