# T-160-04 Review — footprint registration from the absolute program rect

## Verdict on the falsifiable claim (lead with it)

> The program rect can be registered to the build frame from the occupancy's eave-band extent, over a small
> axis ladder judged by coverage; building the envelope from that registered clean rectangle CLOSES the
> barn's straight-run gaps without misplacing the dense shells.

**SUPPORTED, with one earned correction to the selection metric.** Registration works: on the real barn the
clean program rect (48×24) fits the build frame at `axis=identity, scale≈(0.98,1.04), coverage 0.81,
not-ambiguous, not-polluted` — i.e. the program units happened to match the build voxel scale here, and the
fit recovered the placement cleanly. Built on that rectangle, the barn's long wall goes **48/48 columns
solid** and its perimeter **closure climbs 0.701 → 1.000** (colonnade → watertight). The dense/no-program
shells hold: **gatehouse** (no program → Option B untouched) keeps its clean stone ring; **cottage** gets a
solid L-union envelope (closure 0.198 → 0.760, the notch correctly *not* filled).

**Which named failure mode occurred:** none of (a)/(b). The extent was **not** outlier-polluted (the robust
percentile trim was available but didn't need to fire — `polluted=false`), and the fit was **not** ambiguous
for either subject (both axis assignments were cleanly separated). Failure mode (c) — "registration succeeds
but the barn still doesn't climb" — did **not** occur at the geometry level: the straight runs provably
close. The honest caveat below is about the *visual* magnitude, not the geometry.

## The one real deviation (the finding inside the finding)

The plan's selection gate was "registered path wins when its **coverage** ≥ the close ring's coverage." The
real-shell smoke refuted that gate: a close-derived ring is built **from** the posts, so its post-coverage is
always ≈1.0 (it traces every post) **even when it is a gappy colonnade**. Coverage measures *tracing*, not
*watertightness* — so it would never select the registered path. The fix is `closureOf`: the fraction of a
ring's own bbox-rectangle perimeter that is actually present. A clean rectangle scores 1; a colonnade with
straight-run holes scores < 1. The registered-vs-close **decision** now uses closure (barn 0.701 vs 1.000);
the registration's internal **axis ladder is still ranked by coverage**, exactly as the AC specifies. This
is the kind of metric correction the anti-hedge directive is built to surface — the blunt metric (coverage)
was tautological against the close ring, and the smoke caught it before the render did.

## What changed

| File | Change |
|---|---|
| `src/view/wall-generate.mjs` | **NEW pures:** `robustExtent` (percentile extent + `polluted` flag), `coverageOf` (post-tracing fraction), `registerRect` (affine fit: program-bbox→robust-extent, 2-rung axis ladder ranked by coverage, returns transform+ring+coverage+axis+scale+ambiguous), `closureOf` (perimeter watertightness), `filledRect` (private). **`constructWalls` branch:** prefer the registered ring iff `!ambiguous && closureOf(reg) > closureOf(close)`; `bbox` now derives from the chosen ring (so opening faces align to whichever envelope was built). |
| `src/view/wall-generate.test.mjs` | **+9 tests** WG9/9b (extent+coverage), WG10/10b/10c (ladder, axis swap, near-square ambiguity), WG11 (multi-mass L-union), WG11b (closure), WG12 (**the AC's WG1 companion** — straight-run gap closed by registered path, stays open on close path), WG13 (dense no-regress). |
| `experiments/eval-alignment/autonomy-loop.mjs` | Comment only — the registered path is internal; `program` is already passed to `constructWalls`, so **no behavioural loop edit** (AC: "finer geometry, not a new tool"). |
| `experiments/eval-alignment/registration-beside.mjs` | **NEW** judge-free witness: renders the loop's full path (envelope+skin) beside concept; barn also rendered close-only for a before/after. |
| `docs/active/work/T-160-04/*.png` | barn registered + closeonly, cottage registered, gatehouse registered. |

`defect-eval.mjs`, `wall-skin.mjs`, `occupancy.mjs`, `roof-generate.mjs` **untouched**.

## Test coverage & gaps

- **Unit (pure, deterministic, in CI):** `npm run test:unit` **2193/2193 green**. The registration ladder,
  axis swap, ambiguity report, multi-mass L-union, closure discriminator, and the headline straight-run
  closure (WG12) are all covered. WG12 pins the contrast WG1 documented: the same gap that the close path
  leaves open is closed by the registered path.
- **Gaps:** (a) no unit test drives a *polluted* real extent through `constructWalls` end-to-end (the
  `polluted` flag is unit-tested in WG9, but no subject triggered it, so the percentile trim's effect on a
  real build is unobserved — it's a latent safety net). (b) The registration of a genuinely *unrelatable*
  frame (scale/shape mismatch → `ambiguous=true` → fall back to close) is tested synthetically (WG10c) but
  no real subject exercised it. (c) The measurement leg (renders) is integration, GL-dependent, not in CI;
  evidence is the committed PNGs.

## Acceptance-criteria status

- ✅ **Registration function** (`registerRect`): program `masses[].rect` + occupancy → rigid placement
  (translation + axis assignment + scale), chosen from a ladder ranked by coverage; pure + unit-tested;
  **WG12 is the WG1 companion** proving the straight-run gap closes.
- ✅ **Registered-rectangle envelope path** in `constructWalls`, selected when it out-*closes* the
  close-derived footprint — dense shells keep Option B, sparse get the clean rectangle, decided by closure,
  **not** a density threshold or subject key (grep confirms no subject keys in the brush).
- ✅ **Wired into the loop** as finer geometry of the existing wall tool (no new tool, no behavioural loop
  edit). Witnesses rendered for cottage/barn/gatehouse; **barn is the witness case**.
- ✅ **Recorded honestly with renders beside concept:** barn straight runs close (closure 0.701→1.0, 48/48
  solid; visual delta modest at oblique angle — see caveat); gatehouse/cottage hold (no regression);
  registration was unambiguous and unpolluted for both subjects (no frame-relatability problem surfaced).
- ✅ `npm test` green; no per-building constants (the only thresholds — `FLOOR`/`EPS` in `registerRect` —
  flip a *report* flag, never a per-subject selection); `defect-eval.mjs` untouched.

## Open concerns / follow-ups (for a human + next ticket)

1. **Visual magnitude vs geometric closure.** The barn's *geometric* win is unambiguous (closure 1.0, 48/48
   solid). The *visual* before/after is modest because the close-only path already solidified the columns
   that exist — the colonnade was scattered see-through slots, not a missing wall. The render confirms no
   regression and a clean wall; it is not a dramatic transformation. If the barn's eval score doesn't move,
   the cap is elsewhere (roof-prism / material), per the claim's failure mode (c) — **run the volume batch
   to localize** (deferred here; the eval is GL+LLM and out of the unit gate).
2. **The reusable transform seam (ticket Notes).** `registerRect` returns a `transform` mapping program
   coords → build coords. This is the general capability T-160-03 (multi-mass roof) and absolute-coord
   openings should consume — register once, place per-mass geometry through the same transform, instead of
   re-deriving. The L-union ring already proves it preserves multi-mass massing.
3. **Cottage cap is still material, not envelope.** Registration gives the cottage a solid L envelope, but
   T-160-01's −7 was a *palette* cap that `wallSkin` (T-160-02) addresses — registration is a no-regression
   contributor for the cottage, not its climb lever.
4. **`closureOf` on L-shapes.** Closure is < 1 for any L (the notch perimeter is legitimately empty), so the
   discriminator compares close-vs-reg on equal footing for multi-mass — it does not *require* a watertight
   bbox. Worth a dedicated L-vs-L closure test if a future subject is a sparse L.

## One-paragraph handoff

The program's clean rectangle can be registered to the build frame from the occupancy's robust extent over a
2-rung axis ladder, and building the envelope on it **closes the barn's straight-run colonnade gaps**
(closure 0.701→1.0) that morphological close provably could not — the finding T-160-01 named is now a
working path, gated purely by **watertightness (closure), not a subject key or density threshold**. The one
correction earned in implementation: post-*coverage* is tautological against a close ring (it always traces
its own posts), so the registered-vs-close decision uses *closure* while the ladder still ranks by coverage.
Dense/no-program shells keep Option B (gatehouse, cottage hold). The registration `transform` is exported as
the reusable seam for per-mass roofs/openings. The unit proof (WG12) is the verdict; the renders confirm no
regression; the eval-score delta on the barn is the one thing left to measure (batch deferred — GL+LLM, out
of CI).
