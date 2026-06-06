# T-023-01 — Structure: file-level blueprint

The shape of the change, not the code. Five touched paths; ordering matters only where noted.

## Files

| Path | Action | Why |
|------|--------|-----|
| `src/color/reuse-boundary.test.mjs` | **create** | AC1: static import-scan of cielab + standalone-usage proof. |
| `src/color/block-table.mjs` | **modify** | D2: delete duplicated color math; delegate `srgbToLab` to cielab + `round3`; rewrite the DUPLICATION NOTE. |
| `src/color/cielab.mjs` | **modify** | D3: one header line naming E-09's voxelizer as the third consumer. |
| `docs/knowledge/design-learnings.md` | **modify** | AC2 + AC3: consolidation journal section + E-09 stage-4 handoff paragraph. |
| `src/README.md` | **modify** | Developer-facing consolidation + boundary note. |

No deletions of whole files; no new dependencies; no change to `package.json`, the committed
`block-lab-table.json`, or any adapter (`palette-extract.mjs`, `image-grid.mjs`).

---

## `src/color/reuse-boundary.test.mjs` (new)

Node test module, same idiom as the sibling suites (`import { test } from "node:test"`,
`assert from "node:assert/strict"`). Reads source as text — does **not** import block-table or any
Minecraft package itself (so the test's own graph also stays clean, reinforcing AC1).

Top comment: states the load-bearing rule and cross-references `cielab.mjs`'s header (D3) and the
ticket.

Constants:
- `ENGINE_PATH = fileURLToPath(new URL("./cielab.mjs", import.meta.url))`.
- `DENYLIST` — regexes for Minecraft/project couplings: `/^minecraft-data/`, `/^minecraft-assets/`,
  `/^prismarine-/`, `/^mineflayer/`, `/^node-minecraft/`.

Helper `importSpecifiers(src)`: regex-extract specifiers from the three import forms
(`import … from "X"`, bare `import "X"`, dynamic `import("X")`). Returns `string[]`.

Tests:
1. **`cielab.mjs imports nothing project-specific`** — scan specifiers; assert none is relative
   (`startsWith('.')`) and none matches `DENYLIST`. (Encodes the rule, not "length 0".)
2. **`cielab.mjs currently imports zero modules (pure leaf)`** — assert the specifier set is empty;
   documents today's stronger truth, and would flag *any* new coupling for review.
3. **`engine is usable with a plain palette and no block table`** — `import { nearest, nearestLab }
   from "./cielab.mjs"`; build a literal `[{key:'a', lab:[...]}, …]`; assert `nearest([r,g,b], pal)`
   returns the expected key and a finite `deltaE`. Proves the E-09-shaped call works standalone.
4. **`nearestLab accepts a Lab target without rgb round-trip`** — the voxelizer-centroid path; assert
   argmin over a small palette. (Mirrors the contract E-09 stage 4 uses.)

~60–80 lines. Adds 4 tests to the suite.

---

## `src/color/block-table.mjs` (modify)

**Add** to the import block (lines 23–25 region):
```
import { srgbToLab as srgbToLabRaw } from "./cielab.mjs";
```

**Delete** the duplicated math (current lines ~32–56): `srgbChannelToLinear`, `linearRgbToXyz`, the
`D65`/`DELTA`/`DELTA3` constants, and `fLab`. **Keep** `round3` (line 58).

**Replace** the `srgbToLab` body (lines 65–75) with a thin delegator preserving the rounded contract:
```
export function srgbToLab(rgb) {
  const [L, a, b] = srgbToLabRaw(rgb);
  return [round3(L), round3(a), round3(b)];
}
```
Signature, export name, and 3-decimal output unchanged → `block-lab-table.json` rebuilds identical;
`buildBlockTable`'s call at line 252 and `block-table.test.mjs` are unaffected.

**Rewrite** the DUPLICATION NOTE (lines 18–21) into a CONSOLIDATION NOTE: the conversion now lives in
`cielab.mjs` (S-020) and is imported here; `round3` is re-applied locally to keep the table's rounded
contract; output is byte-identical to the pre-S-023 copy (verified). Keep the boundary note above it
(build-time deps lazy; runtime path Minecraft-free) intact.

Net: block-table loses ~24 lines of math, gains 1 import + a 4-line delegator. Its public surface is
unchanged.

---

## `src/color/cielab.mjs` (modify)

Header-comment only. The block currently lists two application points ("concept-image→grid, 2D;
voxel-grid→blocks, 3D"). Make the third consumer explicit by name so the E-09 author finds it:

> The third consumer is **E-09's voxelizer (stage 4)**: voxel surface color → `nearest()` over the
> design's `[{key, lab}]` palette → block id → `DesignArtifact` placement. Same engine, one dimension
> up. The reuse boundary below is enforced by `reuse-boundary.test.mjs`.

No code change → no risk to the 196 green tests; cielab still imports nothing (AC1 test stays green).

---

## `docs/knowledge/design-learnings.md` (modify)

**Append** after the T-022-01 worked example (current last line 1241) one new H2 section:

`## E-10 — color-layer consolidation + E-09 reuse hook (S-023, T-023-01)`

Subsections (covers AC2 + AC3):
- *What the color layer delivers* — the four-module stack, one line each; the thesis (canonical
  palette extraction + real-block grounding).
- *Conversion / ΔE / clustering choices* — sRGB→Lab D65; CIE76 default, pluggable metric; median-cut
  in Lab with count×range split; background-as-tolerance; full-cube-only table.
- *Extracted-vs-declared* — the taj-C ~1/43 neoclassical finding restated as the consolidated lesson
  (metric, not verdict; high-`present`/low-`added` = faithful when run against the concept's *own*
  manifest).
- *Reuse boundary* — cielab is the portable voxelizer color core; zero project imports; enforced by
  the new test.
- **Handoff to E-09 stage 4 (AC3)** — the one-paragraph consumption recipe (voxel surface color →
  `nearest()` over the design palette → DesignArtifact placement), with the explicit statement that
  this color layer *is* E-09's voxelizer color core.

~45–60 lines, matching the density of the two preceding E-10 sections.

---

## `src/README.md` (modify)

Under the existing color-layer documentation, add a short **Consolidation (S-023)** note: the layering
(engine ← table ← adapters), the de-dupe (block-table now imports cielab's conversion), and the reuse
boundary guarded by `reuse-boundary.test.mjs`. Locate the insertion after the `image-grid.mjs` (S-022)
subsection.

---

## Ordering

1. `reuse-boundary.test.mjs` — write the guard first; it should be green immediately (cielab is
   already clean). Establishes the boundary before touching anything.
2. block-table de-dupe — run full suite; confirm 196 + 4 = 200 green and (spot-check) srgbToLab
   output unchanged.
3. cielab header line — trivial; re-run.
4. docs (design-learnings + README) — no test impact.

Each of 1–3 is independently committable; the docs are a final doc commit. The boundary test must
land before or with the de-dupe so the dependency-direction change is covered the moment it is made.
