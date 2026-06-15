# T-003-03 — Review: headless-render (fixed, comparable views)

Handoff for a human reviewer. What changed, how it's verified, what to watch. The work
adds a **fixed, configurable, comparable camera** and a **path-returning render entry
point** on top of T-003-01's headless scaffold, which deliberately left view angles for
this ticket.

## Acceptance criteria — status

| AC | Status | Evidence |
| --- | --- | --- |
| #1 prismarine-viewer renders an in-memory world to a PNG headless (no server) | ✅ | `renderBuild` reuses the scaffold's headless wiring (no server, no bot); `view.test.mjs` asserts a valid PNG signature + non-trivial bytes. `render:sample` writes 35326 bytes. |
| #2 Camera fixed **and** configurable, **comparable framing across builds** | ✅ | Pure invariant test: *angular size is invariant under uniform build scaling* (k∈{1,3,10}). Empirical GL test: two scales → footprints 0.115 vs 0.099 (ratio 1.16) across a 3× size gap. All of `DEFAULT_VIEW` is overridable via `opts.view`. |
| #3 Callable programmatically, **returns the image path** | ✅ | `renderBuild(build, opts?) → { path, bytes, view }`; test asserts the returned `path` exists on disk. |
| #4 A rendered image of a known build is **visually correct** | ✅ | GL test renders a known floor+marker build and asserts an in-frame, non-overflowing footprint (`∈ (0.02, 0.95)`); `render:sample` is the human-eye artifact. |

## Files changed

**Created**
- `render/src/camera.mjs` (~110 lines) — pure framing math (imports only `vec3`):
  `DEFAULT_VIEW`, `boxOf`, `boundingSphere`, `framedCamera`, `viewDistanceFor`. No
  THREE/GL/files. The comparable-camera primitive.
- `render/test/view.test.mjs` (~190 lines) — 7 pure framing tests (always run) + 2
  GL-gated render-correctness tests (skip without GL).

**Modified**
- `render/src/render.mjs` — additive `opts.bounds` branch on `renderWorldToPng` (framed
  camera + scaled `viewDistance` + streaming centered on the framed target); new
  `renderBuild` export. The constant-offset path is unchanged when `bounds` is absent.
- `render/src/cli.mjs` — `render:sample` now goes through `renderBuild` with an explicit
  sample-bounds literal (kept here so `world.mjs` is untouched).
- `render/README.md` — module table rows for `camera.mjs`/`view.test.mjs`; the
  "Fixed, comparable framing" contract section replacing the old "fixed offset" note;
  out-of-scope updated.

Committed in two atomic commits (`2c4bd0f` implementation+tests, `a489ed4` CLI+README).

## How it works (the one idea)

A `PerspectiveCamera` can't make different-sized builds comparable from a constant
offset. So `framedCamera` fits the build's **bounding sphere** into the frustum: fixed
direction (azimuth/elevation), distance `d = R / sin(min(vHalf, hHalf)) · margin`. Because
`d ∝ R`, the build's *angular* size — hence its on-screen footprint — is identical
regardless of scale. That equation is pure arithmetic, so the invariant is proven without
a GPU; the GL test then confirms it empirically on real pixels.

## Test coverage

- **Strong on the core claim.** Comparability (AC #2) is tested twice: analytically
  (angular-size invariance, exact to 1e-9) and empirically (footprint band on rendered
  pixels). The analytic test needs no GPU, so CI keeps defending AC #2 even where GL is
  absent.
- **Regression-safe.** `scaffold.test.mjs` (4) and `world-build.test.mjs` (9) untouched and
  green; the `renderWorldToPng` change is a strictly additive branch. Full suite: 22/22,
  0 skipped (GL present on this machine).
- **Gaps / not covered:**
  - No **golden-image** (pixel-exact) test — correctness is asserted via footprint
    fraction and PNG validity, not a checked-in reference image. Deliberate: golden images
    are brittle across driver/GPU and add binary churn; the footprint band is the portable
    proxy. A reference image could be added later if exact-pixel regressions matter.
  - The **fallback path** (empty build, `bounds == null` → constant offset) is exercised
    only indirectly; no dedicated test renders a `bounds: null` build.
  - `viewDistanceFor`'s scaling is unit-tested, but no test renders a build large enough to
    *prove* far-side chunks stream in before the snapshot (it would be a heavy render).

## Open concerns / TODOs (for human attention)

1. **`margin = 1.18` and the footprint band are empirical.** Tuned on this GPU. If a CI
   GPU frames slightly differently, the `ratio < 1.8` / `∈ (0.02, 0.95)` bounds are the
   things most likely to need widening — they're intentionally loose, but watch the first
   CI run with GL. Numbers are documented in `progress.md`.
2. **Single canonical angle.** AC #2 asked for *a* fixed comparable view, delivered. Multi
   -angle/montage observation was explicitly deferred (design.md option D). The API is
   parameterized (`opts.view`), so a later ticket adds angles via a caller loop, no
   redesign. The README's old "multi-angle … (T-003-03)" out-of-scope line was corrected.
3. **Perspective, not orthographic.** Comparable apparent *size*, but perspective
   foreshortening remains (near voxels larger than far). Orthographic was rejected to avoid
   fighting prismarine-viewer's camera (design.md option C); revisit only if scoring shows
   foreshortening hurts. Phase-2 question.
4. **`y ≥ 0` assumption inherited.** The mesher doesn't render sections below `y=0` (noted
   in `world.mjs`). Framing handles any bounds, but a build placed below `y=0` would frame
   correctly yet render empty — an upstream world constraint, not a framing bug.
5. **Cross-ticket seam.** `renderBuild` consumes T-003-02's `BuildResult` (`{ world, bounds,
   center }`) directly, and is the surface T-003-04 (Agent SDK tool) will wrap — small,
   named, returns both bytes and a path. No changes needed there to integrate.

## Verdict

All four ACs met and verified; suite green; working tree clean; footprint disjoint from
concurrent tickets (only the render half touched, `world.mjs`/`version.mjs` read-only).
**Safe to advance.** The only items a reviewer should actively weigh are the empirical
tolerances (concern 1) on the first GL-enabled CI run.
