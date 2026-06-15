# Research — T-001-04 style-palette-whitelist

## Ticket in one line

Define a JSON format for a *style palette* — a whitelist of survival-obtainable
Minecraft block IDs scoped to a named style — and author the first such palette
(`industrial`), with the palette validating against its own format definition.

## Where this sits in the system

The specification frames a palette as **data, not code**. From spec §6:

> Each style's palette is a JSON whitelist of survival-obtainable blocks,
> injected into the prompt as the binding material constraint. Violations are
> counted post-build by the validator (§9).

So a palette has exactly two downstream consumers, and they pull in opposite
directions in time:

1. **Prompt injection (upstream, future — T-004-02).** The single-shot archetype
   reads the palette and injects its block whitelist into the model prompt as the
   binding material constraint. The ticket T-004-02 (`single-shot-archetype`,
   `depends_on: [T-004-01, T-001-04]`) is the first real consumer. It needs the
   palette to be *legible to a prompt*: a compact, human-readable list of block
   IDs plus enough style framing that the brief is unambiguous.
2. **Palette validation (downstream, future — E-04 evaluation).** After a build,
   the palette validator counts placements whose block type is not in the
   whitelist (spec §9, "Automatic — palette adherence"). That consumer needs the
   whitelist to be a *fast membership set* of canonical block IDs.

Both consumers need the same core thing: a **set of canonical block-type
identifiers**. That is the load-bearing field. Everything else (style name,
rationale, grouping) is framing for humans and prompts.

## What already exists in the repo

This is a greenfield repository. Confirmed by inspection:

- Root holds only `docs/`, `CLAUDE.md`, `LICENSE`, `README.md` (one line), and
  Lisa control files (`.lisa.toml`, `.lisa/`, `.lisa-layout.kdl`). **No source
  tree, no `package.json`, no `pyproject.toml`, no committed language.**
- `docs/specification.md` is the authority. §5 (artifact contract), §6 (survival
  feasibility), §9 (evaluation) are the sections that bind this ticket.
- `docs/active/` holds the Lisa work hierarchy: 7 epics, 3 active stories
  (S-001, S-003, S-004), 11 tickets. `docs/active/work/` is empty — this is the
  first ticket to produce work artifacts.
- No palettes, schemas, or block data exist yet anywhere in the tree.

## Sibling tickets that constrain the shape

- **T-001-01 (`design-artifact-schema`).** Defines the artifact schema and
  requires it be "expressed as a machine-validatable definition (**JSON Schema**
  or equivalent) committed to the repo." This establishes JSON Schema as the
  project's chosen validation vocabulary. The palette format should follow suit
  for consistency — a palette format defined as a JSON Schema is the idiom this
  project is already adopting one ticket over.
- **T-001-02 (`placement-primitive-expansion`).** Consumes block types from
  placements; not a direct consumer of the palette, but it fixes the *meaning* of
  a "block type" in a placement — a string block identifier. The palette
  whitelist must speak the same identifier vocabulary as placements, or the
  validator can never match them.
- **T-004-02 (`single-shot-archetype`).** The first true reader. AC: "The palette
  is injected as the binding material constraint." Implies the palette must be
  trivially serializable into a prompt fragment.

These three pin the palette's vocabulary: **the same string block IDs that
appear in artifact placements** must be the strings in the palette whitelist.

## The external vocabulary: Minecraft block IDs

The ticket Context is explicit and important:

> palette block identifiers are standard survival-obtainable Minecraft block IDs
> (an external vocabulary), **not something our schema invents**.

This is why T-001-04 has no `depends_on` on T-001-01: the identifier space is
owned by Minecraft, not by our artifact schema. Findings on that vocabulary:

- Modern Minecraft (Java, the flattening onward) identifies blocks by a
  namespaced string ID: `minecraft:<name>`, e.g. `minecraft:stone`,
  `minecraft:oak_planks`. The `minecraft:` namespace is the default and is often
  written bare (`stone`). The canonical, machine-checkable list lives in the
  **`minecraft-data`** npm package (the PrismarineJS data project) — the same
  ecosystem the render harness (`prismarine-viewer`, S-003) already depends on.
  Reachability confirmed: `minecraft-data@3.110.2`, `prismarine-viewer@1.33.0`,
  `ajv@8.20.0` all resolve from the registry in this environment.
- `minecraft-data` exposes, per game version, a `blocks` array; each entry has a
  string `name` (the unprefixed ID, e.g. `oak_planks`). That array is the
  authoritative "does this block ID exist" oracle and lets AC #3 ("every block
  identifier is a valid Minecraft block ID") be **checked mechanically** rather
  than by eyeball.
- **Validity ≠ survival-obtainability.** `minecraft-data`'s block list includes
  technical/creative-only blocks a survival player cannot obtain or place legally:
  `bedrock`, `barrier`, `command_block`, `structure_block`, `light`, `jigsaw`,
  `end_portal`, `nether_portal`, `moving_piston`, `air`/`cave_air`/`void_air`,
  the `*_wall_*` placement-only variants, etc. minecraft-data does not carry a
  clean "survival obtainable" boolean, so survival-obtainability must be enforced
  by a curated **exclusion set** layered on top of the existence check (spec §6:
  "nothing may require creative-only placement").

## Constraints and assumptions surfaced

- **Version pinning is required.** Block IDs are version-dependent (e.g.
  `copper_grate` exists only from 1.21; `mud_bricks` from 1.19). A palette that
  claims block validity must declare the Minecraft version it was authored
  against, and the validator must check against *that* version's block list. The
  render harness (S-003) and any future Litematica round-trip also need a pinned
  version, so a `minecraftVersion` field on the palette is not gold-plating — it
  is the thing that makes "valid block ID" a decidable question.
- **No committed toolchain.** AC #4 ("validates against its own format
  definition") demands a runnable validator, but the repo has no language. Any
  toolchain introduced here is a *de facto* project decision. The
  ecosystem-aligned choice is Node, because the render harness is already Node
  (`prismarine-viewer`) and `minecraft-data` is a Node package — the one
  dependency that makes AC #3 mechanically checkable is Node-native. Design phase
  must decide whether to introduce this at the repo root (risking a `package.json`
  collision with T-001-01 on the shared branch) or scope it under a `palettes/`
  subdir to keep this independent ticket's file footprint isolated.
- **Concurrency hazard.** Lisa runs up to `max_threads = 2` tickets on the *same
  branch* (`.lisa.toml`). The RDSPI doc warns: "If two tickets modify the same
  files, that is a missing dependency edge in the DAG." T-001-04 is declared
  independent (no deps, nothing depends on it within S-001's foundation wave), so
  it must avoid touching files another wave-0 ticket (T-001-01, T-003-01) might
  also touch — chiefly a root `package.json` / lockfile. Keeping every file under
  `palettes/` removes the hazard entirely.
- **Prompt legibility vs. machine membership.** The same artifact serves a prompt
  (wants short, grouped, commented, human block names) and a validator (wants a
  flat canonical set). The format must serve both without duplicating the source
  of truth. Assumption: the canonical whitelist is the flat ID list; any grouping
  or display labels are derived/optional, never a second source of truth.
- **`industrial` is the first style.** Spec §1 lists `industrial`, `cottagecore`,
  `brutalist`, `art-deco` as example styles. The ticket names `industrial` as the
  first palette. "Industrial" connotes concrete, iron, stone, dark metals, glass,
  exposed structure — a coherent, survival-obtainable material family exists.
- **Palette size is unspecified.** No AC fixes a count. A palette must be large
  enough to build a styled structure (walls, floor, roof, accents, glazing,
  lighting) but small enough to be a real *constraint* — an unbounded whitelist is
  not a constraint at all. Design must pick a defensible scope.

## Open question deferred to this ticket by the spec

Spec §12 asks: "Single style/palette for Phase 1 to isolate archetype effects, or
a small set?" This ticket only *authors the first* palette and defines the
*format*; it does not resolve the Phase-1 count. The format must therefore make
adding more palettes cheap (one file per style), without this ticket committing to
how many ship.

## Summary of what is fixed vs. open going into Design

Fixed by research:
- Format = JSON, defined by a JSON Schema (matches T-001-01's chosen vocabulary).
- Core field = a whitelist of canonical Minecraft block IDs in placement
  vocabulary; everything else is framing.
- Validity is checkable against `minecraft-data`; obtainability needs a curated
  exclusion set on top.
- A pinned `minecraftVersion` is required to make "valid block ID" decidable.
- Toolchain leans Node (ecosystem alignment, `minecraft-data` is the oracle).

Open for Design:
- Bare names (`stone`) vs. namespaced (`minecraft:stone`) in the whitelist.
- Where files live (repo root vs. `palettes/` subdir) given the concurrency hazard.
- How structural validation (JSON Schema) and semantic validation (block-ID
  existence + obtainability) compose into one runnable check for AC #4.
- The `industrial` palette's actual block roster and how richly it is grouped.
