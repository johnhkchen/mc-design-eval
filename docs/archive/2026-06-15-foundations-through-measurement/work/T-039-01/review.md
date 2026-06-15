# T-039-01 — Review: value-true-palette-snap

Handoff for a human reviewer. Story S-039, epic E-14 — the keystone color contract that gates the
whole epic.

## What changed

| File | Change | Notes |
|---|---|---|
| `src/color/value-palette.mjs` | **created** (~210 lines) | `resolveValueTruePalette` + `VALUE_TRUE_SCHEMA` + `hexToRgb`/`normalizeName`/`stemTokens` (helpers exported for reuse/tests). Pure, GL-free, network-free. |
| `src/color/value-palette.test.mjs` | **created** (15 tests) | Groups A–G; offline/deterministic; auto-collected by the `src/**/*.test.mjs` glob. |
| `docs/active/work/T-039-01/*.md` | **created** | research / design / structure / plan / progress / review. |

No existing source modified. `cielab.mjs` untouched → its reuse-boundary guard stays green.
Commit: `33894f5`.

## What it does

`resolveValueTruePalette(input, opts)` takes a design's proposed palette — a `string[]`, a
`{manifest}`, or a DesignArtifact `{palette:{manifest}}`; items may be `"name"` or `{name, hex|rgb}`,
with an out-of-band `opts.hints` map — and returns a **value-honest card**:

```
{ schema, card:[{ name, block, hex, rgb, lab, value /*L**/, snapped, deltaE }], manifest, snappedCount }
```

Resolve order per (normalized, namespace-stripped) name:
1. **Real table block → passthrough** — returns its true table value; a color hint never overrides
   a real block (value-honesty: the table is truth, the hint is the wish).
2. **Snap by ΔE** — for a non-cube / biome-tinted / imaginary name, `nearestLab` over the full table
   against a proxy color: the caller's hint if present, else a color derived from name-token matching.
   `snapped:true`, original `name` preserved, honest `deltaE`.
3. **Throw** — a name with no table token match and no hint fails loud rather than fabricate a value.

## Acceptance criteria

- **AC1 — exists in `src/color/`, pure & GL-free, under the test glob, no model/GL/network** ✅
  Imports only `./cielab.mjs` + `./palette-extract.mjs`; call chain is committed-JSON read +
  arithmetic. `value-palette.test.mjs` runs under `node --test "src/**/*.test.mjs"`.
- **AC2 — real passthrough; imaginary + non-cube snap with `snapped:true` + original name; deterministic** ✅
  Tests A (passthrough `gray_concrete`), B (`oak_stairs`→`oak_log`, `gold_leaf`→`gold_ore`, both real,
  names preserved), D (deep-equal repeat, dedupe, ordered manifest, snappedCount).
- **AC3 — value-honest card produced** ✅ Group F: every row `value===round1(L*)`, `#rrggbb` hex, real
  `block`. The card carries exactly what S-040 (hex/rgb swatch grid) and S-041 (block/value/lab build
  targets) need.
- **AC4 — `npm test` green** ✅ 327 pass, 0 fail.

## Test coverage

15 tests: passthrough + namespacing + hint-no-override (A); non-cube & imaginary snap (B); hinted
snap incl. exact-rgb landing (C); determinism + dedupe + schema (D); input unions + empty/bad/no-
signal errors (E); value-honesty invariant across all rows (F); exported helpers (G).

**Gaps / not covered (intentional):**
- No test pins exact Lab numbers for snapped blocks beyond the deterministic *target id* — the table
  values are themselves covered by `block-table.test.mjs`; re-asserting them here would be brittle.
- The biome-tinted case is covered structurally (such names are absent from the table → snap path),
  not with a named fixture like `grass_block`; the non-cube fixture exercises the identical code path.

## Open concerns / known limitations

1. **Name-token snap is coarse — a deliberate fallback, not the primary path.** `gold_leaf`→`gold_ore`
   (not `gold_block`) because the tiebreak prefers the shortest name among equal-token matches. Names
   dominated by a generic token (e.g. a bare `block`, or `grass_block` matching `*_block` via `block`)
   can snap to a semantically odd cube. **Mitigation already in place:** callers in the co-design loop
   should pass the concept's proposed color as a hint, which makes the snap an exact ΔE match and
   bypasses token guessing entirely. This is the intended E-14 flow (S-040 emits colors). Documented in
   the module header and design.md. *Recommend S-040 always supplies hints.*
2. **Prediction vs reality** (logged in progress.md): design.md predicted `gold_leaf`→`gold_block`;
   real deterministic output is `gold_ore`. Tests pin reality. No functional issue.
3. **Module-load table read** via `resolvePalette()` (memoized) mirrors the established
   `palette-extract` pattern; if the committed table is ever swapped at runtime the memo would be
   stale — not a real scenario (table is a build artifact), but worth knowing.

## Recommendation

Ready to merge and to unblock S-040 (T-040-01) and S-041 (T-041-01), which can now import
`resolveValueTruePalette`/`VALUE_TRUE_SCHEMA`. Suggest S-040 pass concept colors as hints so the
value-honest card is driven by exact ΔE rather than the token fallback.
