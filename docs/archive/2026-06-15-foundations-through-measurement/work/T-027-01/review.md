# T-027-01 — Review: material-noise pass

Handoff for a human reviewer. RDSPI complete; committed at `8ed09d6` on `main`. `npm test` 274/274.

## What changed

| File | Δ | Summary |
|---|---|---|
| `src/sculptor/material.mjs` | **+** ~210 | the pass: `hueFamilySet`, `cellHash`/`pickMaterial`, `materialStage`/`material`, `compileMaterial`, namespace helpers |
| `src/sculptor/material.test.mjs` | **+** 20 tests | set, noise, stage, locks, AJV round-trip, intent, determinism, barrel |
| `src/sculptor/index.mjs` | **~** +7 | export the public surface |
| `src/sculptor/README.md` | **~** +9 | pass-A bullet |
| `docs/active/work/T-027-01/*` | **+** | research / design / structure / plan / progress / this |

No spine or E-10 file was modified — the pass **consumes** the engine (`cielab.deltaE`/`srgbToLab`,
`block-table.loadBlockTable`) and the spine (orchestrator/build-state/compile), leaving both untouched.

## How it works (one paragraph)

`material(state, intent)` runs one "material" stage over the massing-locked state. The stage partitions
occupied cells into surfaces (default = the whole silhouette; `intent.material.surfaces` can carve
regions), gives each surface a **hue-family set** — the nearest block to the target *and its near
neighbours within a ΔE radius* (`hueFamilySet`, ranked by the engine's `deltaE`, ordered dark→light) —
and assigns each cell a member via `pickMaterial`: a height-driven center (bottom→darkest,
top→lightest, the light break) jittered by a deterministic per-cell hash (modest `spread`=0.7 keeps
fields clean). It writes **only `material`**, so `runStages` locks exactly `material`; `occupied` stays
locked from massing, `relief` stays free for T-028.

## Test coverage

20 tests, mapped to every AC line (see `plan.md` table). Highlights:
- **Set:** `hueFamilySet("stone")` → 2–3 namespaced same-hue blocks incl. `minecraft:stone`; bare ≡
  namespaced; rgb target resolves; unknown id throws; `size`/`radius` honoured; never empties.
- **Noise:** `cellHash` deterministic, in-range, neighbour-distinct; `pickMaterial` endpoints + `S=1`.
- **Stage:** every occupied cell painted in-set; air untouched (`undefined`); `occupied`/`relief`
  unchanged; **out-of-palette guard** (every material ∈ set); **height variation** (top row multiset ≠
  bottom row).
- **Locks (the composition proof):** `material` locked, `occupied` lock survives, `relief` free;
  `LockViolationError` on repaint; `StageRejectedError` on a draft-bypass; relief still settable.
- **Round-trip:** `compileMaterial` passes the **real** `parseArtifact`/`assertArtifact`; multi-entry
  manifest; one namespaced placement per occupied cell.
- **Intent:** palette (bare+namespaced), two-region surfaces from two families, empty-intent stone
  fallback. **Determinism:** two runs agree cell-for-cell. **Barrel:** re-exports behave.

## Open concerns / limitations (none blocking)

1. **Height = lightness is a heuristic, not physically-correct shading.** Bottom→darkest, top→lightest
   reads as a light break but assumes top-lit; a relief/AO pass (T-028) does the real self-shadow. The
   mapping is intentional and modest, not a substitute for geometry. Worth a human eye on whether the
   gradient direction matches the showcase's lighting.
2. **`spread`/`radius`/`size` are unvalidated defaults.** `spread`=0.7, `radius`=6 ΔE, `size`=3 were
   chosen from the stone neighbourhood (verified dense) and the "modest" guidance — not tuned against
   rendered output. A render-in-the-loop sweep (out of scope this ticket) may want to retune; they're
   single-sourced in `DEFAULTS` and overridable via `intent.material`.
3. **Surface segmentation is `intent`-driven only.** No auto connected-component/feature detector yet —
   `intent.material.surfaces` is the seam, but with no plan supplying it the common path is one surface
   over the whole silhouette. Multi-material *facades* therefore need explicit regions until a
   segmenter exists. Documented in design D3 / plan "out of scope".
4. **`hueFamilySet` re-ranks all 305 blocks per call** (and `resolveSurfaces` calls it per surface). A
   full O(n) scan; negligible at facade scale, but if a future pass calls it per-cell it should hoist
   the set (the stage already computes it once per surface, so today this is fine).
5. **rgb target ambiguity:** a 3-number array is treated as **rgb**, never raw Lab — a caller wanting a
   Lab target must pass `{lab:[…]}`. Documented in the JSDoc; a footgun only for a Lab-holding caller.

## Verdict

Meets all four ACs; composes cleanly after massing and feeds the relief pass a correctly material-locked
state. No changes to the spine or E-10 engine. Recommend a render-loop pass later to tune
`spread`/`radius` against actual screenshots (concern 2) — not required for this ticket.
