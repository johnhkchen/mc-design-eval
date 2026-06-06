# T-039-01 — Design: value-true-palette-snap

Decisions for `resolveValueTruePalette`, grounded in Research. One new pure module in `src/color/`.

## What we are deciding

1. Input shape(s) the resolver accepts.
2. How an unresolved (non-cube / biome-tinted / imaginary) name gets snapped "by ΔE" when a name
   alone carries no color.
3. The output contract — the card that S-040 and S-041 both import.
4. Determinism / tiebreak rules.

## Decision 1 — Input: union of `string[]`, a `{manifest}`/DesignArtifact, and optional color hints

Accept, in priority order, any of:
- a `string[]` of block ids (namespaced or bare),
- a DesignArtifact-shaped object with `palette.manifest` (the real harness input),
- a bare `{ manifest: string[] }`.

List items may be either a plain string or `{ name, hex?|rgb? }` — the richer form lets a concept
stage attach the *proposed hue* it wants for each block. A separate `opts.hints` map (`name → hex|rgb`)
provides the same colors out-of-band. **Rationale:** E-14 is a co-design loop; the concept proposes
colors, so the resolver must be able to take a color *with* a name. The bare-names form (the ACs)
is the degenerate case with no hint.

*Rejected:* names-only API. It would force name-derived snapping for every imaginary block and make
the concept's proposed hue unusable downstream — defeating the co-design premise of E-14.

## Decision 2 — Resolution order per name (the heart of the ticket)

After normalizing each name (strip `^namespace:`, lowercase, trim):

1. **Direct table hit → passthrough.** If the name is in the table it is, by the table's construction
   (Research), a real survival full-cube untinted block. Return its table `lab/rgb/hex/value`,
   `snapped:false`, `deltaE:0`. **A color hint does NOT override a real block** — value-honesty means a
   real block renders as *itself*; the hint is the wish, the table is the truth.
2. **Hinted snap.** Not in the table, but a color hint (hex/rgb) is supplied → `srgbToLab(hint)` then
   `nearestLab` over the full table. `snapped:true`, `deltaE` = the *honest distance* from the wished
   color to the nearest real block, original `name` preserved, `block` = matched id.
3. **Name-derived snap.** Not in the table, no hint → derive a *proxy color* from the name by matching
   table block names on **stemmed tokens** (split on `_`, drop a trailing plural `s`). Score each table
   block by count of shared stemmed tokens; the winning block's exact table color becomes the proxy,
   then `nearestLab` confirms (returns that block, ΔE 0). `snapped:true`, original `name` preserved.
   - `oak_stairs` → tokens `{oak, stair}`; best shared-token match is an `oak_*` cube → snaps to an oak
     wood block. `gold_leaf` → `{gold, leaf}`; `gold_block` shares `{gold}` and is the fewest-token
     candidate → snaps to `gold_block`. Both deterministic, both real full-cube.
4. **Unresolvable → throw.** No hit, no hint, zero shared tokens (e.g. a wholly invented `mithril`):
   throw an actionable error naming the block. **Rationale:** fabricating a color for a name with *no*
   signal would silently corrupt the value-honest card — the one thing this ticket exists to protect.
   Better to fail loud. (Callers who have a color should pass it as a hint.)

*Why "proxy color then `nearestLab`" rather than just returning the token-matched block directly:* it
keeps a single snap mechanism (`nearestLab` over the table) for *all* non-direct cases, so the hinted
and name-derived paths share one code path and the `deltaE` field always means the same thing.

*Rejected — shape-suffix base-material map* (`_stairs`→planks, `_brick_stairs`→`stone_bricks`, …): a
hand-maintained suffix→material table is large, Minecraft-version-coupled, and drifts. Stemmed-token
matching is data-driven off the table itself and needs no maintenance. The suffix approach's only edge
(e.g. `stone_brick_stairs` → `stone_bricks`) is already covered by token stemming (`brick`+`stone`
shared = 2). Accepted the rare imprecision (a generic `block` token can dominate, e.g.
`grass_block`) as a documented limitation, since it is outside the ACs and callers can override with a
hint.

## Decision 3 — Output contract (shared by S-040 and S-041)

```js
{
  schema: "value-true-palette/v1",
  card: [
    {
      name,        // requested id, normalized (namespace stripped) — original preserved here
      block,       // resolved REAL full-cube table id (what S-041 actually places)
      hex,         // true rendered color "#rrggbb"  ─┐ what S-040's swatch grid shows
      rgb,         // [r,g,b] 0–255                    ┘
      lab,         // [L*,a*,b*] from the table (3-dec) — for downstream ΔE math
      value,       // L* rounded to 1 dec — the value-honest number, the whole point
      snapped,     // boolean provenance
      deltaE,      // 0 for passthrough; honest ΔE(wished→matched) for a hinted snap
    },
    ...
  ],
  manifest,        // deduped resolved block ids in first-seen order — clean place-list for S-041
  snappedCount,    // how many entries were snapped (quick health signal for the co-design gate)
}
```

- `card` is **deduped by requested name**, first-seen order preserved → a palette is a *set*. S-040
  wants unique swatches; dups in a manifest would otherwise produce dup swatches.
- `name` carries the original (post-namespace) id, satisfying "original name preserved." `block` is the
  real id. When `!snapped`, `name === block`.
- **Why these fields serve both consumers:** S-040 reads `hex`/`rgb` (swatch grid) + `name`/`snapped`
  (to show "you asked X, you get Y"); S-041 reads `block` (place this) + `value`/`lab` (build-target
  values for its nearest-block snap). One card, two readers, no second pass over the table.

## Decision 4 — Determinism

- Table candidate set comes from `resolvePalette()` (stable table order) — reused per the ticket.
- Name-derived tiebreak is total: **max shared tokens → fewest total tokens (closest) → shortest
  name → lexicographic**. No `Math.random`, no `Date`, no Set-iteration-order dependence in scoring.
- All numeric outputs rounded (`value` 1-dec, `deltaE` 2-dec) so JSON snapshots are stable.

## Reuse & boundary

Imports only `srgbToLab`/`nearestLab` from `cielab.mjs`, `resolvePalette`/`rgbToHex` from
`palette-extract.mjs`. Adds **no** Minecraft/GL/network deps; stays on the pure runtime/test path.
`cielab.mjs` is untouched, so its reuse-boundary guard stays green.
