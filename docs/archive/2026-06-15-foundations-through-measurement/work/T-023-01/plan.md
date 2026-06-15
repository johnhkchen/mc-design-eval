# T-023-01 — Plan: ordered, verifiable steps

Four commits, each independently green. Baseline before any change: `npm test` **196/196**.

---

## Step 1 — Reuse-boundary test (AC1)

**Do:** create `src/color/reuse-boundary.test.mjs` per Structure: a static import-scan of
`cielab.mjs` (no relative imports, none in the Minecraft/asset denylist, specifier set empty today)
plus two functional standalone-usage tests (`nearest` with a literal palette; `nearestLab` with a Lab
target). The test reads cielab as text and imports only `nearest`/`nearestLab` — its own module graph
stays Minecraft-free.

**Verify:** `node --test src/color/reuse-boundary.test.mjs` → 4/4 green (cielab is already clean).
Then full `npm test` → **200/200**.

**Commit:** `test(E-10): assert cielab engine has no project/Minecraft imports (T-023-01)`.

**Why first:** it must be green against the *current* tree (it is), and it then covers the
dependency-direction change made in Step 2 the moment it lands.

---

## Step 2 — De-dupe block-table's `srgbToLab` (consolidation)

**Do:** in `src/color/block-table.mjs`: import `srgbToLab as srgbToLabRaw` from `./cielab.mjs`;
delete the duplicated math (`srgbChannelToLinear`, `linearRgbToXyz`, `D65`/`DELTA`/`DELTA3`, `fLab`);
replace `srgbToLab`'s body with `round3`-wrapped delegation; rewrite the DUPLICATION NOTE into a
CONSOLIDATION NOTE. Keep `round3`, the boundary note, the build/runtime code.

**Verify (three gates):**
1. **Output identity** — re-run the 4096-triple equality probe (Research): `block-table.srgbToLab`
   must equal its pre-change values (i.e. `round3(cielab.srgbToLab)`), max-abs-diff **0**.
2. **Table unchanged** — `git diff --stat src/color/block-lab-table.json` shows **no change** (the
   file is not touched; no rebuild). Confirms the committed data is untouched.
3. **Suite** — `npm test` → **200/200**, including the AC1 test (cielab still imports nothing) and
   `block-table.test.mjs`'s srgbToLab band assertions.

**Commit:** `refactor(E-10): block-table delegates srgbToLab to cielab engine (T-023-01)`.

---

## Step 3 — Name E-09 as the engine's third consumer (AC1 contract, D3)

**Do:** add one header line to `src/color/cielab.mjs` naming E-09's voxelizer (stage 4) as the third
consumer and pointing at `reuse-boundary.test.mjs`. Comment-only.

**Verify:** `npm test` → **200/200** (no code change). The AC1 test still passes (no new import).

**Commit:** folded into Step 4's doc commit if trivial, or `docs(E-10): name E-09 voxelizer as cielab
consumer (T-023-01)`.

---

## Step 4 — Journal + README (AC2, AC3)

**Do:**
- `docs/knowledge/design-learnings.md`: append the `## E-10 — color-layer consolidation + E-09 reuse
  hook (S-023, T-023-01)` section — what the layer delivers, the conversion/ΔE/clustering choices, the
  extracted-vs-declared finding, the reuse-boundary statement, and the **E-09 stage-4 handoff
  paragraph** (AC3).
- `src/README.md`: add the consolidation/boundary note under the color layer.

**Verify:** `npm test` → **200/200** (docs don't affect tests). Re-read both for accuracy against the
shipped code (block-table now imports cielab; the test name; the table block count).

**Commit:** `docs(E-10): color-layer consolidation journal + E-09 stage-4 handoff (T-023-01)`.

---

## Testing strategy

- **Unit:** the 4 new boundary/usage tests are the only new tests. Everything else is covered by the
  existing 196 (block-table, cielab, adapters) — the de-dupe is output-preserving, so they are the
  regression guard for it.
- **No integration test needed:** there is no new runtime path; the de-dupe changes an internal
  implementation with proven-identical output, and the boundary test is a static+functional unit.
- **Determinism:** unaffected — no change to extractor/grid. Not re-measured (no code touched there).
- **Manual probe:** the 4096-triple equality check (Step 2 gate 1) is the de-dupe's correctness proof;
  run it ad-hoc via `node --input-type=module`, not committed (it compares old-vs-new behavior, which
  only exists across the edit).

## Verification criteria (maps to ACs)

| AC | Met by | Check |
|----|--------|-------|
| 1 — engine has no MC/project imports | Step 1 test + Step 3 contract line | `reuse-boundary.test.mjs` green; cielab specifier set empty |
| 2 — design-learnings color-layer section | Step 4 | section present with capability + conversion/ΔE/clustering + extracted-vs-declared + reuse statement |
| 3 — E-09 stage-4 handoff paragraph | Step 4 | one paragraph: voxel surface color → `nearest()` over design palette → DesignArtifact |
| 4 — `npm test` green | every step | **200/200** |

## Risks

- **R1 — de-dupe changes the table.** *Mitigation:* output-identity proven (max-diff 0) before commit;
  the JSON file is not touched and `git diff` must show it unchanged. Low.
- **R2 — boundary test too strict (flags a legit future node import).** *Mitigation:* the rule allows
  `node:*` builtins; only relative + denylisted packages fail. The "empty set" test is a separate,
  softer signal (would need updating if a builtin is added — by design, so the change gets a look).
- **R3 — circular import (cielab ↔ block-table).** *Mitigation:* cielab imports nothing (AC1 test
  guarantees it); the arrow is strictly table→engine. None possible.
