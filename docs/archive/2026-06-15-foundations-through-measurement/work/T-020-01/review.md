# T-020-01 — Review: portable CIE-Lab color engine

## Summary

Implemented the portable color engine for Epic E-10 (S-020). It converts 8-bit sRGB to CIE
L\*a\*b\*, measures perceptual distance with a pluggable ΔE (CIE76 default), and resolves the
nearest palette entry by argmin. The module has **zero** mc-design-eval / Minecraft /
DesignArtifact imports — it takes a palette as plain `[{ key, lab }]` data and returns a key —
which is the load-bearing property that lets both E-10 application points (concept-image→grid
and voxel-grid→blocks) reuse one engine. Committed at `526d5bb`.

## Files

| Path | Action | Lines | Purpose |
|------|--------|-------|---------|
| `src/color/cielab.mjs` | created | ~135 | `srgbToLab`, `deltaE76`, `deltaE`, `nearest` + private helpers/constants |
| `src/color/cielab.test.mjs` | created | ~140 | 13-test `node:test` suite, published-reference expectations |

No files modified or deleted. **No dependency added** (pure `Math`). No build/script change —
the existing `src/**/*.test.mjs` glob auto-discovers the new suite.

## Acceptance criteria — all met

- ✅ `src/color/cielab.mjs` exports `srgbToLab`, `deltaE`, `nearest`; **no project/Minecraft
  imports** (verified: `grep import` hits only a comment; test imports only `node:*` +
  `./cielab.mjs`).
- ✅ Unit tests with **independently-derived** expectations: white→`100,0,0`; black→`0,0,0`;
  mid-grey `≈53.59`; red/blue vs published Lindbloom Lab; `deltaE` symmetry + a known pair
  (`√(9+16)=5`); `nearest` picks the correct key from a hand-built palette. Tolerances stated.
- ✅ ΔE metric **swappable** — `nearest(rgb, palette, { metric })`, default `deltaE76`; a test
  injects a stub metric and proves the default is bypassed.
- ✅ `npm test` green — 146 tests pass (13 new), 0 fail.

## Test coverage

Every exported function is exercised, including error paths:

- `srgbToLab` — two anchors (white/black), three published colors (red/blue/grey), four
  validation throws (bad length, NaN, <0, >255). Covers both `f()` branches (black hits the
  linear segment; grey/primaries hit the cube-root branch).
- `deltaE76` — identity, symmetry, hand-computed distance; default-alias identity.
- `nearest` — correct argmin across four palette keys, returned `deltaE`/`lab` consistency
  against a direct recompute, metric pluggability, empty/non-array palette throw.

**Gaps (intentional, low-risk):**
- No CIEDE2000 test — not implemented this ticket (only the seam exists). When added (its own
  follow-up), it gets its own published-reference tests.
- No performance/large-palette test — `nearest` is a documented linear scan for small
  palettes; the k-d-tree path is a noted future branch, not yet code, so nothing to test.
- Tolerances on primaries are ±0.5 (vs ±0.01 on the neutral anchors) to absorb rounding in the
  literature's matrix constants. Tight enough to catch a wrong matrix/scaling; loose enough not
  to be brittle. Documented inline.

## Open concerns / handoff notes

1. **Input convention is 0–255, not 0–1.** Decided in `design.md` because every real caller
   (T-019 table `rgb`, T-022 image pixels) is 8-bit. Consumers T-021/T-022 must pass 0–255 —
   the JSDoc and header say so, and out-of-range input throws rather than silently misbehaving.
2. **`nearest` returns `{ key, deltaE, lab }`, not a bare key.** The ticket says "→ key"
   (`result.key`); the extra fields exist because T-021 (match quality / coverage) and T-022
   (palette-adherence ΔE) both need the distance, and recomputing it would duplicate the scan.
   Callers wanting only the key read `.key`.
3. **`nearest` takes an sRGB target and converts internally.** If a future caller already holds
   Lab, add a thin `nearestLab(lab, palette)` rather than range-sniffing — noted in `design.md`.
4. **JSDoc `*/` hazard.** Writing `a*/b*` inside a `/** */` block silently terminates the
   comment and breaks the file at import (hit and fixed here). Flagged for the sibling E-10
   tickets that document Lab values.

## Risk assessment

Low. Pure, deterministic, dependency-free arithmetic, fully unit-tested against external
references, with input validation on both public entry points. No I/O, network, SDK, or shared
mutable state. The one boundary that matters — zero project coupling — is asserted by the test
file's import list and a grep, and is the explicit headline criterion.

## Verdict

Ready for review/merge. Unblocks T-021-01 and T-022-01, which consume this engine alongside the
T-019-01 block→Lab table.
