# T-025-01 Progress — massing-bookend

## Status: implementation complete, all AC verified, suite green

Followed `plan.md` step by step. No deviations of substance; one test simplification
(noted below). `npm test` → **244 pass / 0 fail** (baseline was 230; +14 massing tests).

## Steps completed

- **Step 1–3 — `src/sculptor/massing.mjs` (new).** `MassingSource`/`Proportions` typedefs,
  `MASSING_BLOCK`/`MASSING_STYLE` constants, and the four functions:
  - `conceptGridSource(gridResult, {flipY=true})` — the only concept-grid-aware code;
    duck-types `{grid,n,m}`, yields `{x,y}` in build coords with the default Y-flip
    (image top row → max build Y, so the facade renders upright).
  - `mass(source)` — sets `occupied:true` per yielded cell via a single "massing" stage run
    through `runStages`, which locks exactly `occupied`. Returns `{state, proportions}`.
  - `proportionsOf(state)` — pure projection of the locked occupancy: grid, bbox bounds,
    width/height, aspect, occupied count, fill.
  - `compileMassing(state, opts)` — `toDesignArtifact` with `defaultBlock:MASSING_BLOCK`
    + massing style; single-material gray because no cell carries a `material`.
  - Imports the spine only (`build-state`, `orchestrator`, `compile`). Does **not** import
    `image-grid.mjs` — no decode/color leaks in (AC #4 structural guarantee).
- **Step 4 — `src/sculptor/massing.test.mjs` (new).** 14 tests across the 8 planned
  groups: adapter occupancy/flip, no-leak, mass sets occupied / leaves material+relief
  unset, locks only `occupied` (+ lockLog), S-024 enforcement (write-time
  `LockViolationError`, accept-time `StageRejectedError`, and a material/relief write that
  *succeeds* over the shell), proportions (incl. empty state), gray compile + live-AJV
  round-trip (manifest === `[MASSING_BLOCK]`), metadata override, end-to-end Y-flip.
- **Step 5 — barrel + README.** `index.mjs` re-exports the massing surface (additive);
  `README.md` gains the massing-bookend subsection. No spine source modified.
- **Step 6 — suite + commit.** `npm test` green; committed.

## Deviation

- Plan's empty-state proportions test originally inspected a one-cell grid then an empty
  one; simplified to a single all-air grid (`gridOf([".","."])`) → empty unlocked massing
  state → `proportionsOf` returns `bounds:null` + zeros. Same assertion, cleaner setup.

## AC check

- [x] `MassingSource` interface + concept-grid impl produce a state with `occupied` set
      and **locked**; material/relief unset. *(mass + conceptGridSource; groups 3–4)*
- [x] Shell carries proportion metadata (bounds, width/height) for the review critic.
      *(`proportionsOf`; `mass` returns it; group 6)*
- [x] Tested: occupancy locked (later stage cannot change it — S-024 enforcement); shell
      compiles to a gray single-material `DesignArtifact` passing AJV. *(groups 5, 7, 8)*
- [x] Form dependency behind the interface — no concept-grid specifics leak past
      `MassingSource`; GLB is a drop-in. *(no `image-grid` import; group 2; `flipY` switch)*
- [x] `npm test` green (244/244).

## Notes for downstream

- **T-027 (material) / T-028 (relief)** receive `mass().state`: `occupied` is locked, but
  `material`/`relief` are unlocked — write them through `runStages` and they lock on accept.
- **T-026 / S-026 (review critic)** call `proportionsOf(lockedState)` for bounds/aspect; it
  is re-derivable any time from the locked occupancy (never stored).
- **GLB source (later):** implement `{width, height, occupied()}` directly in build coords
  and pass `conceptGridSource`-free to `mass`; use `flipY` only at an image adapter.
- **Image entry point:** a script does `gridFromImage(path)` → `conceptGridSource(result)`
  → `mass`; decode stays out of the sculptor (kept pure).
