# T-206-01 Structure — file-level blueprint

Five files touched. No files created in `src/` (the metric is an edit to an existing function); one new
evidence probe under the work dir. Nothing under `measurements/` (frozen instrument) changes.

## 1. `src/view/wall-generate.mjs` — the metric edit (core)

### `eaveRingClosure(occ, { floor, eaveY, openCols, program, coverageFloor=0.5 })` (≈L300–326)
- **Add** `program` and `coverageFloor` to the destructured params (both optional; default
  `coverageFloor = 0.5` to mirror `closeShell`/`registerRect` FLOOR).
- **Remove** the `robustExtent`/`PROUD_TRIM` clamp block (L311–318): the lines computing `ext`, the
  `footprint` filter loop, and `ring = perimeterColumns(footprint)`.
- **New body** after the `cols` collection + empty guard:
  1. `const reg = program?.masses?.some((m) => m?.rect) ? registerRect(program.masses, cols) : null;`
  2. If `reg && reg.coverage >= coverageFloor`:
     - `const ring = reg.ring;`
     - `let present = 0; for (const c of ring) if (cols.has(c) || openCols?.has(c)) present++;`
     - `return ring.size ? present / ring.size : 0;`
  3. **Fallback** (no program / below trust) — the existing no-clamp path:
     - `const ring = perimeterColumns(cols);`
     - `if (!openCols || openCols.size === 0 || ring.size === 0) return closureOf(ring);`
     - reproduce the closure-except-aperture present/perimeter loop over
       `perimeterColumns(filledRect(bboxOf(ring)))` (unchanged from today, just on the unclamped `cols`).
- **Docstring** (L274–299): rewrite. Drop the "INVARIANT TO PROUD DETAIL via robustExtent clamp"
  paragraph; replace with "measured on the **absolute program footprint** (`registerRect`): a
  footprint-perimeter column with no wall cell reads OPEN; cells proud of the footprint are ignored
  (off-ring). Reuses the ONE closure authority. `coverageFloor` gates trust; below it (or no program)
  falls back to the raw band-perimeter `closureOf`. Cross-ref T-206-01 (S-206, E-53); supersedes the
  T-202 clamp." Keep the CLOSURE-EXCEPT-APERTURE paragraph (still accurate for both paths).

### `PROUD_TRIM` (L24–30)
- **Remove** the `export const PROUD_TRIM = 0.05;` declaration and its doc comment (no other importer
  besides the test, which is being rewritten). Confirms "clamp removed".

### `closeShell(occ, { program, floor, eaveY, wallField, coverageFloor=0.5 })` (≈L353–402)
- `closureBefore` (L363): change `cols.size ? closureOf(perimeterColumns(cols)) : 0` →
  `cols.size ? eaveRingClosure(occ, { floor, eaveY, program: params.program, coverageFloor }) : 0`.
  (Both empty-band branches still return their `closureBefore`/0.)
- `closureAfter` (L399): change `eaveRingClosure(out, { floor, eaveY })` →
  `eaveRingClosure(out, { floor, eaveY, program: params.program, coverageFloor })`.
- **Effect:** `closeShell` now reports closure through the same footprint metric the gate reads →
  byte-identical agreement. Decisions still made on `reg.coverage >= coverageFloor` (unchanged).
- `robustExtent` stays exported and used by `registerRect`/`constructWalls`/`band-profile` — **only its
  use inside `eaveRingClosure` is removed**. Do not delete the function.

## 2. `src/view/wall-generate.test.mjs` — test rewrite + additions

- **Import line (L10):** drop `PROUD_TRIM` (no longer exported). Add nothing else (all helpers present).
- **WG-CS6 (L373–385):** pass `{ ..., program: T202_PROGRAM }` to the two `eaveRingClosure` calls on
  the relief'd build. Keep the `naiveBandClosure < 0.2` assertion (the raw measure still craters — that
  is *why* the footprint path is needed). Assert the footprint reading ≥ `FORM_READY_CLOSURE`.
- **WG-CS7 (L389–399):** pass `{ ..., program: T202_PROGRAM }` to all `eaveRingClosure` calls. Assert
  bare-reopened < threshold, relief-on-reopened < threshold, and reopened+relief < closed+relief.
- **WG-CS8 (L403–411):** remove the `PROUD_TRIM` range assertion (first line). Keep the proud-free
  no-op checks (clean 7×7 = 1, gappy7 ≈ 0.7917, clean 11×11 = 1) — these run on the no-program fallback
  and stay byte-identical (clamp was a no-op here). Rename the test message: "no-program fallback is the
  raw band perimeter (no clamp); proud-free readings unchanged."
- **WG-CS9 (L417–434):** unchanged — exercises the no-program fallback's openCols forgiveness, still
  valid.
- **WG-CS1/CS2/CS3/CS4/CS5:** unchanged (CS2–CS5 may see closeShell's reported `closureBefore` shift to
  the footprint reading; they only assert `<1`/`==1`/`>before`, which still hold — verify in Implement).
- **NEW block — T-206-01 (append after WG-CS9):**
  - **WG-CS10 — colonnade seed reads ~0.6 (<0.9).** Load the real seed artifact + program
    (`artifactOccupancy`, absolute path like the T202 block). Assert
    `eaveRingClosure(seed, {floor, eaveY:18, program}) ≈ 0.608` (tolerance 0.01) and `< 0.9`.
  - **WG-CS11 — closed + real relief ≥ 0.9.** Build `closedGatehouse()` (reuse the T202 helper),
    `buildWallRelief` (224 quoins), assert footprint reading ≈ 0.9375 and `≥ FORM_READY_CLOSURE`.
  - **WG-CS12 — reopened shell < 0.9.** `closedGatehouse({ drop: 9-col run })`, assert footprint
    reading ≈ 0.839 and `< FORM_READY_CLOSURE`.
  - **WG-CS13 — agreement.** Assert `eaveRingClosure(seed, {program})` ===
    `closeShell(seed, {program, floor, eaveY:18}).report.closureBefore` (byte-identical) and both `< 0.9`.
  - **WG-CS14 — gate behaviour.** `formReadyGate({tool:"relief_walls", closure: seedReading}).allow ===
    false`; `formReadyGate({tool:"close_shell", closure: seedReading}).allow === true`;
    `formReadyGate({tool:"relief_walls", closure: closedReliefReading}).allow === true`.
  - These import `buildWallRelief` (already imported), `FORM_READY_CLOSURE`/`formReadyGate` (already
    imported), `artifactOccupancy` (add if absent), `closeShell` (already imported).

## 3. `experiments/eval-alignment/picture-climb.mjs` — thread the program

- `closureNow` (L693): add `program: PROGRAM` to the `eaveRingClosure` opts.
- `closureAfter` (L770–771): add `program: PROGRAM` to the opts.
- `PROGRAM` is loaded at L585 (in scope for both). No new load.
- REBUILD_ARCH_PROBE evidence (L644–650): add `program: PROGRAM` to those `eaveRingClosure` calls so
  the diagnostic reflects the runner-true reading (console only; safe).
- Update the `closureNow` comment (L688–692) to name the footprint metric + T-206 (supersedes T-202's
  plane clamp).

## 4. `docs/active/work/T-206-01/footprint-evidence.mjs` — NEW zero-spend probe

Mirror `T-197-01/closeshell-evidence.mjs`. Pure geometry, no LLM/render/GL, absolute-path imports.
Prints on the **real gatehouse seed**: the old-clamp reading (for contrast, recomputed inline), the new
footprint reading, `closeShell.closureBefore` (agreement), and `formReadyGate` verdicts at the seed and
closed+relief closures. Exits non-zero if the falsifiable claim fails (seed <0.9, closed+relief ≥0.9,
reopened <0.9, agreement equal). This is the "re-run the close-shell evidence probe; both read the same"
deliverable.

## 5. `docs/active/work/T-206-01/progress.md` + `review.md`

Workflow artifacts (Implement / Review phases).

## Ordering

1. `wall-generate.mjs` metric edit + closeShell reporting + remove PROUD_TRIM.
2. Rewrite WG-CS6/7/8 + add WG-CS10–14. Run `npm test` (wall-generate first, then full).
3. Thread `program` in the runner (parse-check only — no spend).
4. Write + run `footprint-evidence.mjs` (zero-spend, asserts the claim).
5. progress.md, commit, review.md.

No interface is consumed by a sibling ticket mid-flight: `eaveRingClosure`'s new params are **optional
and additive** (default `program=undefined` → fallback = today minus the no-op clamp), so any caller not
updated still compiles and behaves as before on proud-free input.
