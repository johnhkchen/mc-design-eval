# Style Palettes

A **style palette** is *data*: a JSON whitelist of survival-obtainable Minecraft
block IDs scoped to a named architectural/interior style. It is the binding
material constraint of the design instrument (spec §6).

Two consumers read a palette:

1. **Prompt injection** (`single-shot-archetype`, T-004-02) — the `blocks`
   whitelist is injected into the trial prompt as *the* allowed material set.
2. **Palette-adherence scoring** (evaluation, E-04) — after a build, placements
   whose block type is outside `blocks` are counted as violations (spec §9).

The whole point is that `blocks` is a single canonical set both sides agree on.

## Format

A palette is a JSON object matching [`palette.schema.json`](./palette.schema.json)
(JSON Schema, draft 2020-12). Fields:

| Field              | Req | Type     | Meaning |
|--------------------|-----|----------|---------|
| `id`               | yes | string   | Kebab-case style id, unique across palettes. Pattern `^[a-z][a-z0-9-]*$`. |
| `name`             | yes | string   | Human display name. |
| `minecraftVersion` | yes | string   | Java version the block IDs are valid against, e.g. `1.20.4`. Pattern `^\d+\.\d+(\.\d+)?$`. |
| `description`      | yes | string   | One-line, prompt-facing statement of the style's material intent. |
| `blocks`           | yes | string[] | **The whitelist — the single source of truth.** Non-empty, unique, bare block IDs. |
| `groups`           | no  | object   | Advisory grouping of `blocks` for human/prompt legibility. |

### Block identifiers — bare names

Block IDs in a palette are **bare** (`stone`, `iron_block`), not namespaced
(`minecraft:stone`). The schema enforces the pattern `^[a-z][a-z0-9_]*$`, which
forbids the `minecraft:` prefix *in the palette file* — so authored data has
exactly one spelling. Bare names match `minecraft-data`'s `name` field directly
and read cleanly in a prompt.

Downstream, when the validator (and the future E-04 adherence check) compares a
palette against *artifact placements*, it strips a leading `minecraft:` from
placement IDs before matching — so a model that emits namespaced IDs still scores
correctly against a bare-name whitelist. The normalization rule is: **strip a
leading `minecraft:`, then compare.** Both sides apply it identically.

### Why `minecraftVersion` is required

Block IDs are version-dependent (`copper_grate` is 1.21+; `mud_bricks` is 1.19+).
Pinning the version is what makes "is this a valid block ID?" a decidable check —
the validator resolves the block list for *this* version and checks against it.
The render harness and any Litematica round-trip also need a pinned version; this
field is the single source for it per palette.

### `groups` — advisory, and a strict subset of `blocks`

`groups` exists only to make a palette legible — to a human and to a prompt that
wants to present "structure / metal / glazing / accent" rather than a flat dump.

It is **not** a second source of truth. The validator enforces the invariant:
**every block named in any group must also appear in `blocks`.** Groups organize
the canonical set; they never extend it. A block can appear in `blocks` without
being in any group, but never the reverse.

## Validation

```sh
npm install                       # once, fetches ajv + minecraft-data
npm run validate <palette.json>   # validate any palette
npm test                          # validate industrial.json (the shipped palette)
```

`validate.mjs` runs two layers and exits non-zero on any failure:

- **Layer A — structural:** the file matches `palette.schema.json` (Ajv).
- **Layer B — semantic:** for the declared `minecraftVersion`, every block ID
  exists in `minecraft-data` (validity) **and** is absent from the validator's
  `NON_SURVIVAL` exclusion set (survival-obtainability). It also checks the
  `groups ⊆ blocks` invariant.

`NON_SURVIVAL` is a curated, commented denylist of blocks that exist in the game
data but a survival player cannot obtain or place legally (air variants, `barrier`,
command/structure blocks, `bedrock`, portals, fluids, etc.). It lives in
`validate.mjs` because it is cross-palette *policy*, not per-file shape. It is
intentionally conservative — only unambiguous creative/technical blocks are
excluded.

## Authoring a new style

1. Copy `industrial.json` to `<style>.json`.
2. Set `id`, `name`, `description`; keep or update `minecraftVersion`.
3. Replace `blocks` with the style's survival-obtainable roster (bare IDs).
4. Update `groups` so every member is also in `blocks` (or drop `groups`).
5. `npm run validate <style>.json` until it exits 0. A block that fails Layer B is
   either misspelled, version-gated, or creative-only — fix or swap it. **No block
   ships unverified.**

## Shipped palettes

- [`industrial.json`](./industrial.json) — exposed concrete/stone structure, bare
  and dark metal, oxidized copper, functional glazing, stark task lighting.
  37 blocks, Minecraft 1.20.4.
