# T-023-01 — Review: color-layer consolidation & reuse hook

Self-assessment and handoff. The terminal E-10 ticket: consolidate the four color modules, remove the
one intentional duplication, and **prove the reuse boundary** that lets Epic E-09's voxelizer reuse the
color engine — plus write the stage journal. **Done; `npm test` 200/200 green.** Three commits on
`main`.

## What changed

| File | Action | Summary |
|------|--------|---------|
| `src/color/reuse-boundary.test.mjs` | **created** | AC1 guard: static import-scan of `cielab.mjs` (no relative/Minecraft imports; empty set today) + functional standalone-usage proof of `nearest`/`nearestLab`. 4 tests, ~93 lines. |
| `src/color/block-table.mjs` | modified | De-dupe: deleted the inlined sRGB→Lab math; `srgbToLab` now delegates to `cielab.mjs` + re-applies `round3`. DUPLICATION NOTE → CONSOLIDATION NOTE. Net −24 lines of math. |
| `src/color/cielab.mjs` | modified | Header: names E-09's voxelizer (stage 4) as the third consumer; points at the boundary test. Comment-only. |
| `docs/knowledge/design-learnings.md` | modified | New H2 consolidation section: capability, conversion/ΔE/clustering choices, extracted-vs-declared finding, reuse-boundary statement, E-09 stage-4 handoff paragraph (+68 lines). |
| `src/README.md` | modified | "Consolidation & reuse boundary (S-023)" subsection; updated engine + delegation notes. |

Commits: `f2887c8` (test) → `46a9d67` (refactor) → `7ab8f26` (docs).

## How it works (one paragraph)

The color layer is strictly bottom-up: engine (`cielab.mjs`) ← table (`block-table.mjs`) ← adapters
(`palette-extract.mjs`, `image-grid.mjs`). The engine imports **nothing** — it takes a caller-supplied
`[{key, lab}]` palette and a color, returns a key. This ticket makes that boundary *enforced* rather
than *promised*: `reuse-boundary.test.mjs` scans the engine's import specifiers (failing on any
relative or `minecraft-*`/`prismarine-*` import, asserting the set is empty today) and separately
exercises `nearest`/`nearestLab` against a literal palette with no block-table in the test's own graph
— the exact call shape E-09 will make. The lone remaining duplication (block-table's private copy of
the sRGB→Lab math) was removed: `block-table.srgbToLab` now delegates to the engine and re-wraps
`round3`, so there is one copy of the color math, living in the portable module.

## Test coverage

4 new tests (196 → **200**). By acceptance criterion:

- **AC1 (engine has no MC/project imports):** `reuse-boundary.test.mjs` tests 1–2 (static scan: no
  relative, no denylisted package, specifier set empty) and tests 3–4 (functional: `nearest` over a
  literal palette resolves the expected key with a finite ΔE; `nearestLab` resolves a Lab target
  without an rgb round-trip). The scan encodes the *rule* (relative + denylist), so it still guards if
  a legitimate `node:` import is ever added; the "empty set" test is the stronger present-day signal
  and would flag any new coupling for review.
- **AC2 / AC3 (docs):** not unit-testable; verified by reading — the journal section contains all five
  required parts, the E-09 stage-4 handoff paragraph is present in both the journal and the README.
- **AC4 (`npm test` green):** 200/200 at every step.

The de-dupe (Step 2) has **no new test of its own by design** — it is output-preserving, so the 196
existing tests (especially `block-table.test.mjs`'s `srgbToLab` band assertions and the whole
table-consuming suite) *are* its regression guard. Correctness was proven before commit by an ad-hoc
4096-triple equality probe (max abs diff **0** vs the prior behavior) and by confirming
`block-lab-table.json` is untouched in `git diff`.

## Verification beyond unit tests

- **Output identity of the de-dupe:** `block-table.srgbToLab(rgb)` === `round3(cielab.srgbToLab(rgb))`
  across 4096 RGB triples, max abs diff 0 — so the committed table would rebuild byte-identical.
- **Committed data untouched:** `git diff src/color/block-lab-table.json` empty (no rebuild, no
  `minecraft-assets` needed).
- **Boundary holds after the cielab header edit:** the comment naming E-09 contains no quoted import
  specifier, so the scan is unaffected (re-ran 4/4).

## Open concerns / limitations

1. **The boundary test parses imports with regex, not an AST.** It is intentionally light (no new dep)
   and matches the three import forms. A pathological case (an import specifier built by string
   concatenation, or one hidden in a template literal) would evade it — but the "empty set" assertion
   catches *any* real import regardless of form, so the practical coverage is complete for a module
   that imports nothing. If cielab ever legitimately gains imports, consider an AST/`madge` check then.
2. **`round3` now lives only in block-table.** The engine returns unrounded Lab; the table's
   3-decimal contract is re-applied at block-table's boundary. This is deliberate (the table is a
   stored artifact; the engine is live math), but means a future caller wanting rounded engine output
   must round themselves. Documented in both the code and the journal.
3. **The de-dupe is the only behavioral change, and it is a no-op by construction.** Nothing about the
   match results, ΔE, extractor, or grid changed. If a reviewer expects *functional* movement from a
   "consolidation" ticket, there is none — that is the intended outcome (consolidate without drift).
4. **The E-09 reuse hook is confirmed, not exercised.** AC3 is a contract + handoff paragraph + a
   standalone-usage test proving the call shape works; no E-09 voxelizer code exists yet (out of
   scope). The hook is validated to the extent a consumer-less boundary can be.

## Critical issues for a human reviewer

None. The single risk in the plan (R1: the de-dupe altering the committed table) was retired by the
output-identity proof and the untouched-JSON check before the commit landed. The dependency direction
is correct and cycle-free (engine imports nothing — guaranteed by the very test added here; only
block-table gained an import, pointing *down* at the engine).

## Suggested follow-ups (out of scope here)

- **E-09 stage 4 itself** — implement the voxel→block step against this engine per the handoff.
- **CIEDE2000** — the `nearest`/`nearestLab` `metric` seam is pluggable; swap it in if CIE76 banding
  on flat fields becomes visible at higher voxel resolutions.
- **k-means clusterer** for the extractor, to give richer dominance weighting than median-cut's dyadic
  coverage (the clusterer seam is already open).
