# T-039-01 — Structure: value-true-palette-snap

The shape of the code. Two files created, none modified, none deleted.

## Files

### CREATE `src/color/value-palette.mjs`  (the deliverable)

Pure, GL-free, network-free. Imports only from the existing `src/color/` engine.

```
imports:
  { srgbToLab, nearestLab }        from "./cielab.mjs"
  { resolvePalette, rgbToHex }     from "./palette-extract.mjs"

constants:
  VALUE_TRUE_SCHEMA = "value-true-palette/v1"
  round1, round2                   // local rounding helpers

module state (lazy, memoized once — mirrors palette-extract's TABLE-at-load pattern):
  candidatesOnce()  -> { candidates:[{key,lab,rgb}], byName:Map, tokenIndex:[{key, tokens:Set}] }
    candidates = resolvePalette().palette           // full table as [{key,lab,rgb}]
    byName     = Map(key -> entry)
    tokenIndex = candidates.map(e => ({ key, tokens: stemTokens(e.key) }))

pure helpers:
  normalizeName(raw)   // trim, lowercase, strip /^[a-z0-9_]+:/  (drops "minecraft:")
  hexToRgb(hex)        // "#rrggbb" | "rrggbb" -> [r,g,b]; throws on bad input   (EXPORTED)
  toRgbHint(v)         // hex string | [r,g,b] -> validated [r,g,b] | null
  stemTokens(id)       // "stone_brick_stairs" -> Set{ "stone","brick","stair" }  (trailing-s strip)
  toEntries(input, hints)   // union input -> [{ name, hint:[r,g,b]|null }], deduped by name
  deriveProxyRgb(name)      // token-match table -> proxy [r,g,b]; throws if 0 shared tokens
  makeCard(name, blockId, entry, snapped, deltaE)  // -> one card row

public:
  resolveValueTruePalette(input, opts={}) -> { schema, card, manifest, snappedCount }   (EXPORTED)
```

#### Control flow of `resolveValueTruePalette`

```
entries = toEntries(input, opts.hints || {})        // throws on empty / bad input shape
card    = entries.map(resolveOne)                    // each row independent, deterministic
return { schema, card, manifest: dedupe(card.map(c=>c.block)), snappedCount: count(snapped) }
```

`resolveOne(entry)`:
```
direct = byName.get(entry.name)
if direct: return makeCard(entry.name, direct.key, direct, snapped=false, deltaE=0)   // passthrough
proxyRgb = entry.hint ?? deriveProxyRgb(entry.name)   // hint wins; else name-derived; else throws
hit      = nearestLab(srgbToLab(proxyRgb), candidates)   // {key, deltaE, lab}
matched  = byName.get(hit.key)
return makeCard(entry.name, hit.key, matched, snapped=true, deltaE=round2(hit.deltaE))
```

`makeCard` row:
```
{ name, block: blockId, hex: rgbToHex(entry.rgb), rgb: entry.rgb, lab: entry.lab,
  value: round1(entry.lab[0]), snapped, deltaE }
```

#### `deriveProxyRgb(name)` — deterministic token snap

```
want = stemTokens(name)
best = null  // {key, shared, ntokens, len}
for each {key, tokens} in tokenIndex:
    shared = count(t in want where tokens.has(t))
    if shared === 0: continue
    cand = { key, shared, ntokens: tokens.size, len: key.length }
    if better(cand, best): best = cand          // ordered tiebreak (Design §4)
if best === null: throw Error(`resolveValueTruePalette: cannot resolve "<name>" ...pass a hint`)
return byName.get(best.key).rgb
```
`better(a,b)`: a.shared>b.shared, then a.ntokens<b.ntokens, then a.len<b.len, then a.key<b.key.

### CREATE `src/color/value-palette.test.mjs`  (the proof)

`node:test` + `node:assert/strict`, offline/deterministic — auto-collected by `src/**/*.test.mjs`.
Test groups:

- **A — passthrough (real full-cube blocks)**: `gray_concrete` → `snapped:false`, `block===name`,
  `deltaE===0`, `lab`/`value` equal the table row, `hex` matches table rgb. Namespaced input
  (`minecraft:gray_concrete`) normalizes to the same row.
- **B — snap of non-cube + imaginary names (the AC)**: `oak_stairs` and `gold_leaf` each →
  `snapped:true`, `block` is a real table id (assert `byName.has(block)`), original `name` preserved
  (`name==="oak_stairs"` / `"gold_leaf"`). `gold_leaf` asserted to snap to `gold_block` (token match).
- **C — hinted snap**: name absent from table + `hints` color → snaps to nearest table block by ΔE;
  `deltaE>0`; a hint that equals a real block's exact rgb lands on that block with small ΔE.
- **D — determinism**: two identical calls deep-equal; card is deduped by name; `manifest` deduped &
  first-seen ordered; `snappedCount` correct.
- **E — input unions & errors**: `string[]`, `{manifest}`, and full DesignArtifact
  (`{palette:{manifest}}`) all accepted; empty input throws; a no-signal imaginary name with no hint
  throws an actionable error.
- **F — value-honesty contract**: every card row has `value === round1(lab[0])` and a `#rrggbb` hex;
  card length === unique input names.

## Files NOT touched

- `cielab.mjs` — untouched ⇒ `reuse-boundary.test.mjs` stays green (no new imports in the core).
- `block-table.mjs`, `palette-extract.mjs`, `image-grid.mjs` — imported, not modified.
- `schema/`, scripts, sculptor — out of scope for S-039 (S-040/S-041/S-042 consume this contract later).

## Ordering of changes

1. `value-palette.mjs` (module) → 2. `value-palette.test.mjs` (tests) → 3. `npm test` green.
Single logical unit; one commit after tests pass (Plan sequences it).

## Public interface (the contract S-040/S-041 import)

```
export const VALUE_TRUE_SCHEMA = "value-true-palette/v1"
export function resolveValueTruePalette(input, opts?) -> { schema, card, manifest, snappedCount }
export function hexToRgb(hex) -> [r,g,b]      // small reusable utility for callers building hints
```
