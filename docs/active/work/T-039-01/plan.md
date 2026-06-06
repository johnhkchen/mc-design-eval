# T-039-01 — Plan: value-true-palette-snap

Ordered, independently verifiable steps. One atomic commit at the end (single logical unit; the
module is meaningless without its test, and the test cannot pass without the module).

## Testing strategy

- **Unit only.** Everything is pure arithmetic + a committed-JSON read. No model, no GL, no network —
  AC #1's mandate is satisfied structurally by the dependency choice, not by mocking.
- **Fixtures from the committed table**, not synthetic: the ACs name real ids (`gray_concrete`) and
  real absences (`oak_stairs`, `gold_leaf`). Tests assert *properties* (snapped, real-id membership,
  determinism) rather than pinning to brittle exact Lab numbers, except where the table row is the
  point (passthrough equals its own row).
- **Verification per AC:**
  - AC1 (exists, pure, GL/network-free, under the glob) → file lands in `src/color/`, test file
    auto-collected by `node --test "src/**/*.test.mjs"`; imports are engine-only (grep-checkable).
  - AC2 (real passthrough; imaginary + non-cube snap with flag + original name; deterministic) →
    test groups A, B, D.
  - AC3 (value-honest card produced) → test group F + the shape asserted in A/B.
  - AC4 (`npm test` green) → final run.

## Steps

### Step 1 — Write the module `src/color/value-palette.mjs`
Implement per Structure: imports, `VALUE_TRUE_SCHEMA`, lazy memoized `candidatesOnce()`
(`resolvePalette()` + `byName` Map + `tokenIndex`), pure helpers (`normalizeName`, `hexToRgb`,
`toRgbHint`, `stemTokens`, `toEntries`, `deriveProxyRgb`, `makeCard`), and
`resolveValueTruePalette(input, opts)`.
- Watch items: namespace strip (`minecraft:` → bare); hint must NOT override a direct table hit;
  dedupe card by normalized name preserving first-seen order; total tiebreak in `deriveProxyRgb`;
  round `value`/`deltaE`.
- *Verify:* `node -e` smoke — `resolveValueTruePalette(["minecraft:gray_concrete","oak_stairs",
  "gold_leaf"])` prints a 3-row card with row0 `snapped:false`, rows 1–2 `snapped:true` and real
  `block` ids; `gold_leaf` → `gold_block`.

### Step 2 — Write the tests `src/color/value-palette.test.mjs`
Groups A–F from Structure. Key assertions:
- A: passthrough `gray_concrete` equals its table row; namespaced input normalizes identically.
- B: `oak_stairs` & `gold_leaf` → `snapped:true`, `byName.has(block)`, `name` preserved; `gold_leaf`
  → `gold_block`.
- C: hinted snap produces `deltaE>0`; exact-rgb hint lands on that block.
- D: two calls deep-equal; card deduped; `manifest` deduped/ordered; `snappedCount` correct.
- E: `string[]`, `{manifest}`, `{palette:{manifest}}` accepted; empty + no-signal-name throw.
- F: every row `value===round1(lab[0])` and `/^#[0-9a-f]{6}$/` hex; card length === unique names.
- *Verify:* `node --test src/color/value-palette.test.mjs` green.

### Step 3 — Full suite + commit
- `npm test` (artifact self-test/validate + `test:unit` glob). Confirm `reuse-boundary.test.mjs`
  still green (cielab untouched).
- Commit both files: `feat(E-14 T-039-01): resolveValueTruePalette — value-honest palette card`.

## Risks & mitigations

- **Token snap picks a surprising block** for a name dominated by a generic token (e.g. a bare
  `block`). Mitigated: ACs (`oak_stairs`, `gold_leaf`) have specific tokens; documented as a known
  limitation in Review; callers can override with a hint. Not a blocker for S-039.
- **Namespace mismatch** silently misses real blocks → mitigated by Step-1 normalization + an
  explicit namespaced-input test in group A.
- **Hint overriding a real block** would corrupt value-honesty → guarded by the direct-hit-first
  ordering and not exercising hints on real ids.

## Done when
All four ACs check, `npm test` green, both files committed, `progress.md` reflects the run, and
`review.md` summarizes changes/coverage/concerns.
