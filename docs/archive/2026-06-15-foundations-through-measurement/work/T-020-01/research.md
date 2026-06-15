# T-020-01 — Research: portable CIE-Lab color engine

## Ticket in one line

Implement a **project-agnostic** color engine — `srgbToLab`, `deltaE` (pluggable, CIE76
default), `nearest` — in `src/color/cielab.mjs`, with unit tests against independently-derived
expectations. **Zero** mc-design-eval / Minecraft / DesignArtifact imports.

## Where this sits in the epic

Epic E-10 (block-palette + CIE-Lab matching) decomposes into five tickets:

- **T-019-01** — block→Lab table builder (Minecraft adapter; pulls textures from
  `minecraft-assets`, emits `{ block, rgb, lab }[]`). *Wave-0, parallel to this.*
- **T-020-01 (this)** — the portable color **engine**. The math core. *Wave-0.*
- **T-021-01** — canonical palette extraction (consumes engine + table). *Blocked on both.*
- **T-022-01** — image→real-block grid at N=48. *Blocked.*
- **T-023-01** — consolidation + E-09 stage-4 handoff. *Terminal.*

The engine is the shared substance both application points reuse (per
`docs/knowledge/cielab-block-matching.md` §"Two application points"): concept-image→grid
(2D, pre-TRELLIS) and voxel-grid→blocks (3D, post-TRELLIS). It is deliberately the *only*
piece with no Minecraft knowledge — it takes a palette as plain `[{key, lab}]` data and
returns a key. That zero-dependency boundary is load-bearing: it is what makes the engine
the "portable voxelizer color core."

## Authoritative spec — the math (from `docs/knowledge/cielab-block-matching.md`)

The knowledge doc is the canonical source. The exact pipeline:

**sRGB → linear** (inverse gamma, per channel, input normalized to 0–1):
```
C_lin = C/12.92                      if C ≤ 0.04045
C_lin = ((C + 0.055)/1.055)^2.4      otherwise
```

**linear RGB → XYZ** (D65 primaries — the Lindbloom sRGB/D65 matrix):
```
X = 0.4124564 R + 0.3575761 G + 0.1804375 B
Y = 0.2126729 R + 0.7151522 G + 0.0721750 B
Z = 0.0193339 R + 0.1191920 G + 0.9503041 B
```

**XYZ → Lab**, normalized by D65 white **Xn=95.0489, Yn=100, Zn=108.8840** (scale XYZ to
0–100 first):
```
f(t) = t^(1/3)               if t > δ³   (δ = 6/29 ≈ 0.206897, δ³ ≈ 0.008856)
f(t) = t/(3δ²) + 4/29        otherwise
L* = 116 f(Y/Yn) − 16
a* = 500 (f(X/Xn) − f(Y/Yn))
b* = 200 (f(Y/Yn) − f(Z/Zn))
```

**ΔE — CIE76** (plain Euclidean in Lab): `ΔE = √(ΔL² + Δa² + Δb²)`. The doc explicitly says
CIE76 is *sufficient* for nearest-block matching; CIE94/CIEDE2000 are accuracy upgrades to be
swapped in later — hence the **pluggable** requirement.

**nearest** — for each target: sRGB→Lab, then **argmin ΔE** over the palette's Lab set.
Palettes are small (≈5–30 blocks) so a linear scan is trivial; the doc notes a k-d tree on
Lab is the move only for a large block set.

## Codebase conventions this must follow

Confirmed by reading `src/palette.mjs`, `src/palette.test.mjs`, `package.json`:

- **ESM `.mjs`**, Node 20+. `"type": "module"`.
- **Tests** are colocated `*.test.mjs`, run by `node --test "src/**/*.test.mjs"`
  (`npm run test:unit`). `npm test` runs the artifact-validator self-tests **and**
  `test:unit`. A new `src/color/cielab.test.mjs` is picked up automatically by the glob.
- Tests use `node:test` (`test`) + `node:assert/strict` (`assert`). No third-party test
  runner. Offline, deterministic, no SDK, no network.
- Modules open with a **header comment** explaining the seam: what it is, who consumes it,
  what it deliberately does *not* do. `src/palette.mjs` is the model — it documents that it
  reads data by path and does NOT import the heavier `palettes/` module. The analogue here:
  document the zero-Minecraft-deps boundary explicitly.
- Public functions carry **JSDoc** with `@param`/`@returns` and `@typedef` for shapes.
- Pure functions are favored; I/O is isolated. This module is **100% pure** — no I/O at all,
  which is simpler than `palette.mjs`.
- Clear, actionable `throw new Error(...)` on bad input (see `loadPalette`'s id guard).

## Existing color/Lab code in the repo

None. `src/color/` does not exist. Grep/inspection shows no sRGB, XYZ, Lab, or ΔE math
anywhere in `src/`. `package.json` deps are baml / ajv / tsx only — **no `color`, no
`minecraft-assets`** installed (consistent with the knowledge doc's note). This ticket adds
**no dependencies**: the math is ~30 lines of arithmetic with `Math.cbrt`/`Math.sqrt`.

## Input-convention question to resolve in Design

The math thresholds (0.04045) are defined on **0–1** sRGB, but real callers carry **0–255**
8-bit values: the T-019 table's `rgb` is the mean of opaque texture **pixels** (0–255), and
T-022's image downsample yields 0–255 pixels too. The engine must pick one input convention
and document it so `white` is unambiguous in the white→L*≈100 test. (Decided in `design.md`.)

## Return-shape question to resolve in Design

The ticket says `nearest(...) → key`. Downstream, T-021 wants a per-block **coverage/quality**
signal and T-022 a **palette-adherence** ΔE — both want the matched distance, not just the
key. Whether `nearest` returns a bare key or `{ key, deltaE }` is a Design call.

## Constraints / invariants (load-bearing)

1. **Zero project/Minecraft/DesignArtifact imports.** Only `node:` built-ins (ideally none).
   This is the headline acceptance criterion and the reason the module exists separately.
2. **Pluggable ΔE**, default CIE76 — so CIEDE2000 drops in without touching callers.
3. **Independently-derived test expectations** — published Lab values (Lindbloom/colormine),
   not values printed by our own implementation. Tolerance must be stated.
4. `npm test` green — must not break the existing artifact-validator + unit gates.

## Assumptions

- 8-bit sRGB (0–255) is the natural end-to-end convention (validated against T-019/T-022
  data shapes). Final call lives in Design.
- The Lindbloom sRGB/D65 matrix in the knowledge doc matches the published reference values
  we will test against (same white point, same primaries) — so tolerances can be tight (~0.5).
- No k-d tree this ticket (palettes are small); leave a documented note where it would go.
