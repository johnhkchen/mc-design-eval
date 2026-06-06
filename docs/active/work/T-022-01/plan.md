# T-022-01 — Plan: image → real-block grid

Five commit-sized steps. Each is independently verifiable; `npm test` is the gate after every step
that touches code. Maps 1:1 to the ordering in structure.md.

## Step 1 — Refactor: export `decodeImage` from `palette-extract.mjs`

**Do:** lift the JPEG/PNG magic-sniff + lazy-decode body out of `extractPaletteFromImage` into a new
`export async function decodeImage(path) → {width,height,data}`. Rewrite `extractPaletteFromImage` to
`decodeImage` then `extractPaletteFromPixels`. No other change.

**Verify:** `npm test` — the existing 182 tests stay green (pure-refactor; `palette-extract.test.mjs`
exercises the core and, if it touches the shell, still passes since behavior is identical). Confirm
`extractPaletteFromImage` still works via a quick CLI run of `palette:extract` on a real concept.

**Commit:** `refactor(E-10): export decodeImage from palette-extract (T-022-01)`

## Step 2 — Core: `src/color/image-grid.mjs`

**Do:** implement, in order: imports + `TABLE`/`BY_BLOCK`; `gridDims`; `aggregateCells` (single
forward pass, fg/bg split per cell using reused `isBackground`); `gridFromPixels` (resolve palette →
dims → aggregate → per-cell fill/air + `nearestLab` → grid, `blockCounts`, `usedBlocks`, `legend`,
`outOfPalette`, `meanDeltaE`, `description`); `comparePalettes`; `renderGridSwatch`; `describeGrid`;
`gridFromImage` (via `decodeImage`).

**Verify:** a scratch Node one-liner builds a synthetic buffer (black field + colored region),
calls `gridFromPixels`, and prints dims + a filled cell + an air cell — sanity only (real assertions
in Step 3). No commit without Step 3 tests.

**Commit:** folded into Step 3 (core + tests land together, matching T-021's "engine + tests" commits).

## Step 3 — Tests: `src/color/image-grid.test.mjs`

**Do:** the six groups from structure.md:
- A geometry (dims, row lengths, non-square),
- B cell assignment (known region → expected block; background → null),
- C palette adherence (validate → `outOfPalette === 0`, every cell ∈ whitelist; `missing` surfaced),
- D `comparePalettes` (present/missing/added partition),
- E swatch render (dims, known cell rgb, air alpha 0),
- F determinism (two runs deep-equal).

Expectations derived independently: for Group B, compute the expected block by hand from the table
(pick a region color, find which table block `nearestLab` should select, assert that id) — or assert
the **property** (the matched block's table color is the argmin ΔE over the candidate set) rather than
hardcoding a brittle id, per the repo's "derive expectations independently" idiom.

**Verify:** `npm test` green; new tests counted (expect ~14–18 added → ~196–200 total).

**Commit:** `feat(E-10): image→block-grid core + tests (T-022-01)`

## Step 4 — CLI + npm script; validate on real concept

**Do:** `scripts/image-to-grid.mjs` (parseArgs mirroring `extract-palette.mjs`, `gridFromImage`,
human summary + `--json`, lazy `pngjs` swatch write to `--out`/default). Add
`"grid:build": "node scripts/image-to-grid.mjs"` to `package.json`.

**Verify:**
- `npm run grid:build -- benchmarks/temple-facade/concepts/taj-C-flash.png` → prints a sane summary,
  writes a `.grid.png`; eyeball the PNG is a recognizable low-res taj facade.
- **Discover** run → capture `usedBlocks`.
- **Validate** run with `--whitelist palettes/neoclassical.json` → confirm `outOfPalette` reported 0
  and `missing` lists neoclassical's non-full-cube ids.
- **Determinism:** run discover twice with `--json`, diff → byte-identical.
- Confirm `.grid.png` path is gitignored (`git status` shows it untracked-ignored).

**Commit:** `feat(E-10): image-to-grid CLI + swatch viz (T-022-01)`

## Step 5 — Docs + journal (extracted-vs-declared)

**Do:**
- `src/README.md`: add an `image-grid.mjs` subsection (core + decode shell + swatch) and the
  `grid:build` CLI, beside the existing `palette-extract.mjs` section.
- `docs/knowledge/design-learnings.md`: record the **extracted-vs-declared** result for one real
  concept — run discover on (e.g.) taj-C, run `comparePalettes(usedBlocks, neoclassical.blocks)`,
  and write the `{present, missing, added}` sets + a one-line read on whether the concept honored the
  doc, plus the palette-adherence number (validate → 0) and the resolution cap observation.

**Verify:** `npm test` still green (docs-only after code is frozen); re-read journal entry for accuracy.

**Commit:** `docs(E-10): image-grid CLI docs + taj extracted-vs-declared (T-022-01)`

## Testing strategy summary

- **Unit (pure core):** Groups A–F above, on synthetic RGBA buffers — no binary fixtures, no decode
  dep, runs under `node --test "src/**/*.test.mjs"`. This is where correctness is proven.
- **Integration (manual, via CLI):** real concept decode → grid → PNG; discover vs. validate; the
  extracted-vs-declared comparison. Reproducible but image-heavy, so local-only (the journal is the
  durable record), consistent with the repo's render policy.
- **Determinism:** asserted in unit Group F *and* spot-checked via byte-diff of two CLI `--json` runs.

## Acceptance-criteria traceability

| AC | Covered by |
|----|-----------|
| Function/CLI samples to N×M, assigns block via engine+palette; N param default 48 | Steps 2,4; D3,D5 |
| Visualization produced & saved (gitignored) | Step 4; `renderGridSwatch` + CLI `--out`; D8 |
| Palette adherence: validate → 0 out-of-palette; discover → only extracted blocks; tested | Step 3 Group C; D6 |
| Extracted-vs-declared computed & recorded for one real concept | Step 5; `comparePalettes`; D7 |
| Tests on synthetic image: dims, every cell a palette block, known region → expected block; `npm test` green | Step 3 Groups A–B; gate every step |

## Risks & mitigations

- **R1 — refactor breaks palette-extract suite.** Mitigation: behavior-preserving lift; run `npm test`
  immediately (Step 1) before building on it.
- **R2 — coverage threshold mis-tuned** (facade edges eaten or background bleeding in). Mitigation:
  default 0.5 documented + `--coverage` flag; eyeball the real-concept PNG in Step 4.
- **R3 — non-full-cube manifest ids** (neoclassical stairs/slabs) absent from table. Mitigation:
  already handled by `resolvePalette` `missing`; surfaced in result + CLI, asserted in Group C.
- **R4 — viz output accidentally committed.** Mitigation: default `--out` beside the gitignored
  concept image; verify `git status` in Step 4.
