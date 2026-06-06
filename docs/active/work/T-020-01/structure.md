# T-020-01 — Structure: file-level blueprint

## Files

| Path | Action | Notes |
|------|--------|-------|
| `src/color/cielab.mjs` | **create** | The engine. ~110 lines incl. header + JSDoc. |
| `src/color/cielab.test.mjs` | **create** | `node:test` suite, ~120 lines. |

No files modified or deleted. **No `package.json` change** — zero new deps (pure `Math`).
The `src/**/*.test.mjs` glob in `test:unit` auto-discovers the new test; no script edit.

## `src/color/cielab.mjs` — internal organization (top to bottom)

1. **Header comment** — what this is (the portable CIE-Lab color core for E-10), the
   load-bearing boundary (*zero* mc-design-eval / Minecraft / DesignArtifact imports; takes a
   palette as plain `[{key, lab}]`, returns a key), input convention (8-bit sRGB 0–255), and
   the pluggable-metric note. Mirrors the seam-documenting style of `src/palette.mjs`.

2. **`@typedef`s** — `RGB` (`[number,number,number]`, 0–255), `Lab`
   (`[number,number,number]`), `PaletteEntry` (`{ key, lab }`), `NearestResult`
   (`{ key, deltaE, lab }`).

3. **Constants** (module-private):
   - `D65 = { Xn: 95.0489, Yn: 100, Zn: 108.8840 }`
   - `DELTA = 6 / 29`, `DELTA_CUBED = DELTA ** 3`, `THREE_DELTA_SQ = 3 * DELTA * DELTA`
   - sRGB→XYZ matrix rows as three const arrays (or inline) — the Lindbloom D65 coefficients.

4. **Private helpers**:
   - `inverseGamma(c)` — `c` in 0..1 → linear (the 0.04045 / 12.92 / `^2.4` branch).
   - `f(t)` — the Lab `f` with the `δ³` branch, using `Math.cbrt`.
   - `assertRgb(rgb)` — shared validation: array, length 3, each finite and in [0,255].

5. **Public exports** (in dependency order):
   - `srgbToLab(rgb)` — validate → /255 → inverseGamma ×3 → XYZ (×100) → normalize by D65 →
     `f` ×3 → `[L*, a*, b*]`.
   - `deltaE76(lab1, lab2)` — Euclidean.
   - `deltaE` — `export const deltaE = deltaE76` (the default/canonical alias).
   - `nearest(rgb, palette, { metric = deltaE76 } = {})` — validate palette non-empty;
     `targetLab = srgbToLab(rgb)`; linear argmin; return `{ key, deltaE, lab }`. One-line
     comment marking the k-d-tree insertion point.

## Public interface (signatures + contracts)

```
srgbToLab(rgb: RGB) -> Lab
  pre:  rgb is [number×3], each finite ∈ [0,255]   (else throws Error)
  post: L* ∈ [0,100] (numerically), a*/b* unbounded; pure, deterministic.

deltaE76(lab1: Lab, lab2: Lab) -> number   // ≥ 0, symmetric, identity 0
deltaE: alias of deltaE76

nearest(rgb: RGB, palette: PaletteEntry[], opts?: { metric?: (a,b)=>number })
        -> { key: string, deltaE: number, lab: Lab }
  pre:  palette non-empty array of { key, lab }   (else throws Error)
  post: key = argmin metric(srgbToLab(rgb), entry.lab); deltaE = that min; lab = matched.
```

## Boundary assertions (what makes this "portable")

- **Imports allowed:** none (pure `Math`). Certainly no `../*`, no `minecraft-*`, no
  `../artifact.mjs`, no `../palette.mjs`. The test file imports only `node:test`,
  `node:assert/strict`, and `./cielab.mjs`.
- The module knows nothing about block ids, DesignArtifacts, or files. "block" never appears
  except as a neutral `key` string supplied by the caller.

## `src/color/cielab.test.mjs` — test groups

1. **srgbToLab — anchors**: white→`100,0,0`; black→`0,0,0` (tight tol).
2. **srgbToLab — published primaries/grey**: red, blue, mid-grey vs Lindbloom values (tol 0.5;
   grey L tol 0.3). Comment cites the source so the values read as independent.
3. **srgbToLab — validation**: throws on length≠3, non-finite, <0, >255.
4. **deltaE76**: identity 0; symmetry; a hand-computed pair (`√(9+16)=5`).
5. **nearest**: hand-built palette → correct key for a near-red target; result `deltaE`
   matches a direct `deltaE76` recompute; `lab` is the matched entry's Lab.
6. **nearest — metric swap**: stub metric proves pluggability (default never invoked).
7. **nearest — validation**: throws on empty/non-array palette.

## Ordering of changes (for Plan)

Engine first (so the test has something to import), then the test, then run `npm test`. The
two files can also be written together since the test is the spec — either way, the verifiable
gate is `npm test` green at the end. No inter-file ordering hazard beyond that.

## Out of scope (explicit)

CIEDE2000 implementation (only the seam for it); k-d tree (only the note); any image/PNG
decode (that is T-022); any block→Lab table (that is T-019); 0–1 input mode; barrel/index file.
