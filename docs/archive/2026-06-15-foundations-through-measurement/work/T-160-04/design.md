# T-160-04 Design — register the program rect to the build frame, build the envelope from it

Grounded in research. Lead with the falsifiable claim, enumerate options, decide, justify.

## The claim (anti-hedge), restated as the design target

Register the program rect to the build frame from a **robust shared feature — the occupancy eave-band
extent** — by fitting the clean `w×d` rectangle to that extent over a **small ladder judged by occupancy
coverage** (no per-subject constants). Build the envelope from the **registered clean rectangle** → the
barn's straight-run gaps close (climbs where Option B left it a colonnade), without misplacing the dense
shells (gatehouse/cottage hold). **Fails if** (a) extent is outlier-polluted → walls misplace → regress
(sub-fix: robust/percentile extent); (b) program rect can't match the extent up to axis swap → ambiguous,
*that is the finding* (report, don't force); (c) registration succeeds and the barn still doesn't climb →
the colonnade wasn't the cap (roof/material is) → report where.

## The key realization from Research

The program's `w,d` are **not** in build voxel units (barn program eave 9 vs build eave 12; the rect's 48×24
will not equal the build's voxel extent). So a *rigid* placement is wrong by construction. What the program
genuinely supplies is **shape**: the assertion "this mass is one clean rectangle of aspect w:d" (and, for
multi-mass, the masses' *relative* layout in a shared 0-based frame). The build occupancy supplies **where
and how big**. Registration is therefore an **affine fit of the program's overall bbox onto the occupancy's
robust extent** (translation + per-axis scale + axis assignment), with the program's shape carried through
that transform. This is exactly the general transform the ticket's Notes say "unlocks building per-mass."

## Options for the registration

### Option A — anchor the program rect at its raw absolute coords (rigid, no fit)
Place `rect` at `{x0,z0}` literally in the build frame. **Rejected:** the frames share no origin; barn x0=0
is meaningless in a negative-coord build. T-160-01 explicitly refused this gamble. Dead on arrival.

### Option B — fill the occupancy's raw bbox as a clean rectangle (ignore the program rect)
`perimeterColumns(filled bboxOf(cols))` closes straight runs (full clean ring). **Rejected as the primary
path:** (1) raw bbox is outlier-prone (failure mode a) — one stray post inflates it and the wall misplaces;
(2) it discards the program's L-shape for the cottage (a bbox fills the L-notch → wrong massing, violates
WG8's spirit); (3) it can't disambiguate orientation for openings. Useful only as a *degenerate* fallback.

### Option C — affine-fit the program bbox → robust occupancy extent; ladder over axis assignment; rank by coverage (CHOSEN)
1. Compute the wall-band column set (the brush already has it) and a **robust extent** per axis (percentile,
   not raw min/max — dodges failure mode a).
2. Compute the program's **overall bbox** (union of all `masses[].rect`).
3. **Ladder = {identity, axis-swap}**: for each, build the affine `T: program(px,pz) → build(bx,bz)` that
   maps program-bbox → robust-extent (translation = extent min corner; per-axis scale =
   extentSpan/programSpan; swap exchanges which program axis feeds build-x). 2 candidates (small ladder).
4. **Rank by coverage** = fraction of actual wall-band columns lying within tol(=1, a voxel adjacency) of
   the candidate's transformed-rectangle **perimeter ring**. The posts ARE the perimeter of a hollow shell,
   so the assignment whose ring traces the most real posts wins. (A too-big/too-small candidate scores low;
   coverage handles both over- and under-shoot with no tuned size constant.) Tie-break: the assignment whose
   aspect (pw:pd) better matches the extent aspect — where the *square* case ties and is flagged ambiguous.
5. **Output**: `{T, ring, coverage, axis, ambiguous, robustVsRaw}`. `ambiguous` = best coverage below a
   *diagnostic* floor OR a near-tie on a near-square extent → report, don't change a constant-gated decision.

**Why C:** it is the only option that (a) recovers a real build-frame placement from a build-frame signal
(C's coverage rank vs B's blind bbox), (b) is robust to outliers (percentile extent vs raw), (c) preserves
the cottage's L (transform each mass's rect → union of perimeters, not a bbox), and (d) is *comparative*, so
the selection needs **no per-subject constant** — honoring the self-grep discipline. The "fit judged by
coverage" and "scale only if the data demands it" map 1:1 onto the AC wording.

## Options for choosing registered-path vs Option-B close-path in `constructWalls`

### D1 — density threshold / subject key
**Rejected:** the AC forbids a per-building density threshold or subject key (and the self-grep would catch
a `=== "barn"`).

### D2 — comparative coverage (CHOSEN)
Compute both candidate rings — `closeRing` (Option B) and `regRing` (the registered rectangle, only when a
program rect is present and registration is **not** ambiguous) — and pick the one whose **solidified
envelope better covers the build's true footprint**, measured as the same post-coverage metric. The
registered full-bbox ring out-covers the close-derived ring **exactly when straight runs are missing**
(sparse barn); on a dense shell the close ring already traces every post, so the two tie and we keep Option
B (no behavioural change → gatehouse/cottage-dense hold). Gatehouse has **no program** → `regRing`
unavailable → Option B unconditionally → its +20 is untouched. **The route is decided by the data, not the
subject.**

## Multi-mass (cottage) — the reusable transform seam

The registration fits the program's **overall bbox**; the transform `T` then maps **each** `masses[].rect`
independently into the build frame, and the envelope ring is the **union of each mass's transformed
perimeter** — which preserves the L-notch (the cottage's two perpendicular masses) instead of a bbox that
fills it. This is the seam T-160-03 (multi-mass roof) and absolute-coord openings will reuse: export `T` (or
the `registerRect` result) so callers can place per-mass geometry. **Honest scope for THIS ticket:** the
cottage's measured cap is **material** (T-160-01 −7, T-160-02's `wallSkin` territory), so the cottage is a
*no-regression* witness here, not the climb case. The barn is the witness for the *climb*.

## What stays out of scope (deliberately)

- Per-storey material assignment (T-160-02's `wallSkin`, already wired after `constructWalls`).
- Multi-mass *roof* (T-160-03) — we export the transform seam but don't build roofs per-mass.
- The eval (`defect-eval.mjs`) — untouched (S-161 boundary).

## Decision summary

Add a pure `registerRect(programMasses, wallBandCols)` to `wall-generate.mjs` returning an affine transform
+ chosen ring + coverage + an `ambiguous`/`robustVsRaw` diagnostic, selected from a 2-rung axis ladder by
post-coverage over a robust (percentile) extent. In `constructWalls`, when a program rect is present and
registration is unambiguous, compute the registered union-of-masses ring and use it **iff it out-covers**
the close-derived ring; otherwise keep Option B. Loop wiring is already in place (program is passed) — the
change is finer geometry inside the brush. Witness the barn beside its concept; report honestly which of
(a)/(b)/(c) actually happened.
