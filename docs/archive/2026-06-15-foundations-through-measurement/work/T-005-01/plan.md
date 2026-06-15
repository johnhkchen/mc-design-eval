# T-005-01 — Plan: ordered, verifiable steps

Each step is independently verifiable and small enough to commit atomically. Testing
strategy: the palette is gated by the CLI validator; the brief + palette-load are
gated by `npm test` (unit). No integration/render test in scope.

## Step 1 — Author the palette and validate it

- Create `palettes/neoclassical.json` with the exact id set from `structure.md`
  (structure / columns / trim / glazing / lighting), `minecraftVersion: "1.20.1"`,
  a one-line pale-stone/marble `description`, and a `blocks` array equal to the
  union of all group members (unique, no ungrouped extras).
- **Verify:** `node palettes/validate.mjs palettes/neoclassical.json` exits 0 and
  prints `✓ neoclassical: N blocks valid & survival-obtainable for Minecraft 1.20.1`.
  This proves: schema-valid (Layer A), every id real + survival-legal for 1.20.1
  (Layer B), and `groups ⊆ blocks` (invariant). Hard gate — do not proceed on `✗`.
- **Commit:** `T-005-01: add neoclassical style palette (1.20.1)`.

## Step 2 — Add the style brief

- Append `neoclassical: Object.freeze({ name, brief })` to `STYLE_BRIEFS` in
  `src/briefs.mjs`, after `industrial`. The `brief` string names symmetry, columned
  portico, entablature/cornice, pediment, stepped base/stylobate, tall windows, and
  pushes for detail + scale.
- **Verify:** `npm test` still green (no test references the new key yet, so this is
  a non-regression check); manual read confirms feature words present.
- **Commit:** `T-005-01: add neoclassical style brief to STYLE_BRIEFS`.

## Step 3 — Palette-load coverage

- Add a `loadPalette("neoclassical")` test to `src/palette.test.mjs` mirroring the
  industrial test: id, `minecraftVersion === "1.20.1"`, non-empty blocks, includes
  `quartz_pillar`, has a `groups` object with `columns`/`trim`.
- **Verify:** `npm run test:unit` — the new test passes.
- **Commit:** can fold into Step 4's commit or commit separately as
  `T-005-01: test neoclassical palette loads`.

## Step 4 — Brief-present coverage

- Create `src/briefs.test.mjs`: neoclassical present + named features (regex),
  industrial regression, map frozen.
- **Verify:** `npm test` — full suite green, new file picked up by the
  `src/**/*.test.mjs` glob.
- **Commit:** `T-005-01: add briefs unit test (neoclassical features + industrial regression)`.

## Step 5 — Final verification + AC sign-off

Run, in order, and record outputs in `progress.md`:
1. `node palettes/validate.mjs palettes/neoclassical.json` → `✓`.
2. `node palettes/validate.mjs palettes/industrial.json` → `✓` (no regression to the
   shared validator path).
3. `npm test` → full suite green, note the count vs. the prior ~95.

Map each AC bullet to its evidence:
- AC#1 palette exists, 1.20.1, validator passes → Step 1 + Step 5.1.
- AC#2 materials coherent for neoclassical → Step 1 content (design.md rationale).
- AC#3 `STYLE_BRIEFS["neoclassical"]` names the features → Step 2 + Step 4 regex.
- AC#4 existing tests pass + new coverage → Step 5.3 + Steps 3–4.

## Testing strategy summary

- **Unit (in `npm test`):** palette-load (palette.test.mjs), brief-present
  (briefs.test.mjs). Deterministic, offline, no SDK/network.
- **CLI gate (not in `npm test`):** `palettes/validate.mjs` on the new file — the
  authority for "valid & survival-obtainable." Run manually per AC.
- **No render/integration test:** rendering the neoclassical style is T-005-03/04;
  this ticket ships data + coverage only.

## Rollback / risk

- If the validator flags an id, remove/replace it (research has the verified list) and
  re-run before committing — never commit a palette that fails the validator.
- Each step commits independently; a failure in Steps 3–4 doesn't touch shipped data
  from Steps 1–2.
