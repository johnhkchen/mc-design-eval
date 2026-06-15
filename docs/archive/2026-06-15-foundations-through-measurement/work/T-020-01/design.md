# T-020-01 — Design: portable CIE-Lab color engine

Five decisions, each grounded in the research. Then the resolved public API.

## D1 — Input convention: 8-bit sRGB (0–255), normalized internally

**Options.** (a) accept 0–1 floats; (b) accept 0–255 ints; (c) accept both via a flag.

**Decision: (b) 0–255**, divided by 255 inside `srgbToLab` before the inverse-gamma step.

**Why.** Every real caller carries 0–255: T-019's representative color is the mean of opaque
texture **pixels**; T-022 downsamples an image to 0–255 cells. Choosing 0–255 means callers
pass pixel data straight through with no pre-scaling, which is where off-by-255 bugs hide.
(a) would force every caller to divide first. (c) adds a mode flag to a hot, tiny function —
ambiguity for no benefit. The math thresholds (0.04045) stay defined on the post-normalization
0–1 value, exactly as the knowledge doc specifies. White is unambiguously `[255,255,255]`.

**Validation.** `srgbToLab` rejects non-arrays, wrong length, and non-finite or out-of-[0,255]
components with a clear `Error` — a NaN silently propagating to Lab would corrupt every match.

## D2 — ΔE pluggability: an exported function passed as an option

**Options.** (a) strategy object/registry keyed by name (`"cie76"`); (b) plain function
passed where needed, default exported as `deltaE`; (c) hard-code CIE76, refactor later.

**Decision: (b).** Export `deltaE76(lab1, lab2)` as the canonical metric and re-export it as
`deltaE` (the default). `nearest` takes `{ metric = deltaE76 }`. A future CIEDE2000 is just
another exported function callers pass in — no registry, no string indirection, no caller
churn (satisfies the "swap without touching callers" criterion: callers that take the default
never change; one that wants CIEDE2000 passes `{ metric: deltaE2000 }`).

**Why not (a).** A name-keyed registry is the heavier version of the same idea and invites a
lookup-miss failure mode; the function-as-value form is idiomatic JS and trivially testable
(the metric-swap test passes a stub). (c) fails the acceptance criterion outright.

## D3 — `nearest` return shape: `{ key, deltaE, lab }`, not a bare key

**Options.** (a) return the bare `key` string; (b) return `{ key, deltaE, lab }`.

**Decision: (b).** The ticket phrases the contract as "→ key", and `result.key` *is* the key —
but downstream both consumers need the distance: T-021 wants a per-cluster match-quality signal
and a coverage measure; T-022 wants a palette-adherence ΔE (§9 of its ticket). Recomputing ΔE
at the call site would duplicate the argmin work. Returning `{ key, deltaE, lab }` hands back
everything the scan already computed. `lab` (the matched palette entry's Lab) is included
because adherence/quality reporting wants the matched color, and the caller otherwise can't
recover it from the key alone without the table.

**Why not (a).** Forces callers to re-scan or re-convert for the distance they almost always
want; throws away work the function already did.

## D4 — `nearest` target input: an sRGB triple, converted internally

**Options.** (a) accept an sRGB `[r,g,b]` and convert via `srgbToLab` inside; (b) accept a
pre-computed Lab triple; (c) accept either, sniffed by range.

**Decision: (a).** The headline use ("for a given target color … which real block") starts
from a color, not a Lab value. Converting inside keeps the call site one line and keeps the
sRGB→Lab convention in exactly one place. Palette entries, by contrast, are `{ key, lab }`
(pre-converted, cached once by T-019) — asymmetric on purpose: the palette is converted once
and reused across thousands of targets; the target is converted per call. (c) range-sniffing
is fragile (Lab a*/b* overlap 0–255). If a caller ever holds Lab already, a thin
`nearestLab(lab, palette)` can be added later; not needed now.

## D5 — No k-d tree; linear scan with a documented note

**Decision.** Linear `argmin` over the palette. Palettes are 5–30 entries (knowledge doc §6);
a scan is O(n) on a tiny n and beats tree build/teardown. Leave a one-line comment at the scan
marking where a k-d tree on Lab would go if a future caller matches against the *full* block
set (hundreds of entries). Premature now.

## D6 — Module layout: one file, `src/color/cielab.mjs`

A new `src/color/` directory (none exists). One file holds `srgbToLab`, `deltaE76`/`deltaE`,
`nearest`, plus private helpers (`inverseGamma`, `f`, constants). Test colocated as
`src/color/cielab.test.mjs`, auto-discovered by the `src/**/*.test.mjs` glob. No barrel/index
file — callers import named exports directly, matching how `src/palette.mjs` is consumed.

## Resolved public API

```js
// src/color/cielab.mjs  — zero project / Minecraft / DesignArtifact imports.

/** @typedef {[number, number, number]} RGB  8-bit sRGB, each 0–255. */
/** @typedef {[number, number, number]} Lab  CIE L*a*b* (L* 0–100, a*/b* ~ ±128). */
/** @typedef {{ key: string, lab: Lab }} PaletteEntry */

export function srgbToLab(rgb): Lab            // [0..255]^3 → L*a*b*
export function deltaE76(lab1, lab2): number   // CIE76 Euclidean
export const  deltaE = deltaE76                // default metric (pluggable)
export function nearest(rgb, palette, { metric = deltaE76 } = {}):
                 { key: string, deltaE: number, lab: Lab }
```

## Test strategy (independently-derived expectations)

Reference values from published Lindbloom sRGB/D65 tables (NOT printed by our code):

| input (0–255) | expected Lab (published)            | tolerance |
|---------------|-------------------------------------|-----------|
| `255,255,255` | `100, 0, 0`                         | L ±0.01, a/b ±0.01 |
| `0,0,0`       | `0, 0, 0`                           | ±0.01 |
| `128,128,128` | `≈53.59, 0, 0` (mid-grey, computed) | L ±0.3, a/b ±0.01 |
| `255,0,0`     | `53.24, 80.09, 67.20`               | ±0.5 |
| `0,0,255`     | `32.30, 79.19, -107.86`             | ±0.5 |

- **deltaE76**: symmetry `deltaE(a,b)===deltaE(b,a)`; a hand-computed known pair (e.g.
  `[50,0,0]`↔`[53,4,0]` → `√(9+16)=5`); identity `deltaE(x,x)===0`.
- **nearest**: small hand-built palette (white/black/red as Lab via `srgbToLab`); a near-red
  query returns `red`; result carries the right `deltaE` (≥0, small for a close match).
- **metric swap**: pass a stub metric (e.g. one that returns `-distance`, or favors a fixed
  entry) and assert `nearest` honors it — proves pluggability, not a copy of the default.
- **validation**: `srgbToLab` throws on wrong length / out-of-range / NaN; `nearest` throws
  on an empty palette.

## Rejected, summarized

0–1 input (pushes scaling to callers); name-keyed metric registry (heavier, lookup-miss
failure mode); bare-key return (discards the distance both consumers need); Lab-or-RGB
range-sniffing (fragile); k-d tree (premature for 5–30-entry palettes); index/barrel file
(unneeded indirection).
