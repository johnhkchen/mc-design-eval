# T-071-01 — llm-material-map · Design

Decisions, grounded in research. The shape: a new **multimodal BAML function** `MaterialMap`, a
**tsx bridge**, a **pure parse/validate core** (`src/form/material-map.mjs`, unit-tested), and an
**impure runner** that writes the saved maps for gatehouse + cottage.

## Decision 1 — BAML function signature & output type

**Chosen:** `MaterialMap(design_doc: string, concept: image) -> MaterialMapResult`, where

```
enum PlacementRule { Walls CornersEdges Roof Base Trim Openings }
class MaterialRole {
  role string            // free-text material intent, e.g. "structural walls", "corner buttresses"
  block string           // namespaced real survival block, e.g. minecraft:cobblestone
  placementRule PlacementRule
  rationale string       // one line: what in the CONCEPT shows this material here (why preserved)
}
class MaterialMapResult { materials MaterialRole[] }
```

- **Image second, doc first** — mirrors `JudgeFacade(brief, render)` (text then image) so the bridge's
  message-extraction (text block + image block) is identical to `baml-review.mts`.
- **`placementRule` is an enum**, not free string — the AC names a closed vocabulary (walls /
  corners-edges / roof / base / trim / openings). Enum = `ctx.output_format` lists the allowed values,
  the model can't invent a region, and the pure parser maps PascalCase→kebab like the defect map.
- **`role` and `rationale` are free text.** `role` is the human-readable intent; `rationale` ties the
  choice to something *visible in the concept* — this is what forces the model to *look* and is the
  honest record of why two near-tone greys are kept separate. Keeping it makes the metered call's
  output auditable.
- **`block` is a bare-or-namespaced string**, validated in the pure layer (BAML can't check table
  membership). The prompt instructs *namespaced, real survival blocks*; the parser normalizes +
  validates against `loadBlockTable()`.

**Rejected:** a `map<role,block>` — loses `placementRule` and forbids two roles sharing a region
(walls vs banding both touch the wall plane). A list of records is the right shape (AC: `[{role,
block, placementRule}]`). **Rejected:** reusing `DiagnoseFacade`'s defect enum — different domain.

## Decision 2 — The prompt (what makes it preserve near-tone materials)

The prompt is the load-bearing part. Grounded in the failure (research §1), it must:
- State the **job**: name the material for each visible feature/region by *intent*, as a real survival
  Minecraft block — you are choosing the *right material*, not the *closest color*.
- Carry the **anti-collapse directive explicitly**: "Two regions may look tonally similar (e.g. smooth
  stone-brick walls vs rough cobblestone corners; dark timber vs dark roof planks). If the concept
  shows them as **different materials**, you MUST return them as **separate roles with different
  blocks** — never merge near-tone materials into one grey block. Distinguish by *texture, grain,
  coursing, and architectural role*, not by average color."
- Carry the **palette-prior-not-cap directive**: "The design doc's named blocks are a strong prior.
  But you may **add a block the doc omits** if the concept clearly shows that material — prefer the
  doc's choice when it matches; add concept-justified near-tone architectural materials freely."
- Name the **placementRule vocabulary** and define each (walls = main field planes; corners-edges =
  quoins/buttresses/pilasters/edge trim; roof; base = plinth/foundation course; trim = bands,
  voussoirs, frames, sills, accents; openings = door/window/arch reveals & fills).
- Require each `block` be a **real survival block id** (namespaced `minecraft:…`).

This is a *new* function, kept separate from the frozen build/judge/concept fns (research §8).

## Decision 3 — Cottage's missing design doc

**Chosen:** make `design_doc` **optional in practice** (the runner passes a short fallback string when
no `design-doc.md` exists) **and author a concise `design-doc.md` for the cottage** from the concept,
committed beside its `concept.png`. Rationale:
- The AC says "concept image + design doc" — both subjects should have both. Authoring a short doc
  (palette + form, ~15 lines) from the concept is a legitimate, in-scope artifact and gives a fair
  comparison to the gatehouse.
- Defensive: the runner still tolerates a missing doc (passes a one-line "no doc; work from the
  concept image" note) so the function never hard-depends on a doc file — the *image* is the real
  signal. This also keeps the function honest about its multimodal nature.

**Rejected:** image-only with no doc at all — fails the AC's literal "+ design doc". **Rejected:**
fabricating a long doc — over-reach; the concept image carries the materials, the doc is the prior.

## Decision 4 — Pure core: what `material-map.mjs` owns

The pure, unit-tested core (AC#5) parses the model's *raw reply* and validates it — **no BAML, no
GL, no I/O, no network, no Date/random** (runs under `src/**/*.test.mjs`). Public surface:

- `PLACEMENT_RULES` — frozen kebab vocabulary `["walls","corners-edges","roof","base","trim",
  "openings"]` + `PLACEMENT_RULE_MAP` (BAML PascalCase → kebab), mirroring `review.mjs`'s pattern.
- `normalizeBlock(raw)` → namespaced id via `material.mjs`'s `tableKey`/`blockId`; rejects non-strings.
- `isKnownBlock(raw, table?)` → `tableKey(raw)` ∈ `loadBlockTable().blocks`. (Table loaded once,
  injectable for tests — same idiom as `material.mjs`'s `TABLE`.)
- `parseMaterialMap(raw, opts)` → takes the **already-JSON-parsed** model object `{materials:[…]}`
  (string parsing/fence-strip lives in the bridge, matching `baml-review.mts`) and returns
  `{ map: [{role, block, placementRule, rationale}], dropped: [{reason, entry}], stats }`.
  Validation rules:
  - each entry needs a non-empty `role` and a `placementRule` in the vocabulary (PascalCase tolerated
    via the map) — else dropped with a reason;
  - `block` normalized + **must be a known survival block** — unknown → dropped (loud, recorded in
    `dropped`, never silently kept; mirrors `DefectVocabularyError` philosophy but *collecting* not
    throwing, because a metered reply with one bad row shouldn't waste the whole call);
  - **dedup** on `(block, placementRule)` — keep first;
  - **near-tone preservation is a property, not a filter**: the parser never merges by color. It only
    drops invalid rows. Two roles with different blocks in the same region are both kept.
- `assertMaterialMap(map)` — throws on an empty/invalid normalized map (consumer-side guard, the
  `assertArtifact` idiom).
- `paletteFromMap(map)` → the manifest `string[]` of distinct blocks — "the map defines E-21's allowed
  palette" (AC). This is the bridge to E-21's downstream.
- `preservesDistinctGreys(map)` → small predicate used by the gatehouse acceptance check: returns true
  iff the map contains **≥2 distinct blocks** that are *near-tone* (ΔL ≤ threshold via the table Lab)
  in *different* roles — i.e. it kept materials a color metric would have collapsed. Pure, table-Lab
  driven. This is the AC#2 guard expressed as testable code (gatehouse → stone_bricks + cobblestone).

**Why collect-don't-throw on bad rows:** the live call is metered (research §8). One hallucinated
block id shouldn't void an otherwise-good map; record it in `dropped` and let the runner surface it.

## Decision 5 — Live bridge & runner

- **`src/form/material-map.mts`** — copy of `baml-review.mts` shape: stdin `{conceptPath, docPath?}` →
  base64 image, `b.request.MaterialMap(doc, Image.fromBase64(...))`, extract text+image blocks,
  `requestTextWithImage(...)`, fence/`{…}` strip, `b.parse.MaterialMap(cleaned)`, map the enum to
  kebab, stdout `{materials:[…]}`. NOT unit-tested (metered).
- **`benchmarks/sculpture/material-map.mjs`** — for each of `{gatehouse, cottage}`: resolve
  `concept.png` + optional `design-doc.md`, spawn the bridge, run the raw reply through
  `parseMaterialMap`, write `benchmarks/sculpture/material-map/<subj>.json`
  (`{schema, subject, generatedFrom, map, dropped, palette, stats}`). `--offline` re-validates committed
  raw replies without a live call (so the report is reproducible). A `material:map` npm script.
- **`baml_client/` regenerated** via `npm run baml:gen` and committed (research §8).

## Decision 6 — Validation strategy summary (AC trace)

- AC#1 (multimodal fn → structured map) → Decision 1 + 2 + the bridge.
- AC#2 (preserves near-tone materials; gatehouse stone_bricks AND cobblestone) → prompt directive +
  `preservesDistinctGreys` test on the gatehouse map.
- AC#3 (validated vs vocabulary; palette is prior not cap; may add blocks back) → `isKnownBlock` +
  collect-don't-cap (no manifest cap applied) + `paletteFromMap`.
- AC#4 (run on gatehouse + cottage; maps saved) → runner + committed `material-map/<subj>.json`.
- AC#5 (pure parse/validate unit-tested; `npm test` green) → `material-map.test.mjs`, no live import.
