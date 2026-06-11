# T-113-01 vocabulary-authority — Research

## The failure being explained

`npm run styled:church` pipeline-fails at **settle**: `settle did not converge after 4
grammar+dressing re-runs (still wants: frame 13, foreign fill 168, gating dressing 0)`
(`benchmarks/sculpture/styled/church.json`, status `pipeline-failed`, stage `settle`). The gate-side
twin: `multi-angle/church-challenge.json` kitPresence gap `missing: polished_basalt frame @ 169/544
frame-line cells`. (Ticket/story quote "frame 14 / foreign fill 170" is the T-110-era count; the
committed record after T-111's roof work says 13/168 — same defect, slightly shifted constraint
counts, per obs 14497.)

## Two name spaces

Everything below hinges on one distinction:

- **Named space** — block names as the material map (E-21) and the kit record (T-096) declare them.
- **Shipped space** — names after the **one renaming point**: `combined = {...substitution,
  ...kit.overrides}`, `subK = (b) => combined[b] ?? b` (`durable-skin.mjs:345-346`), where
  `substitution` is the T-086 value-true selection. `applySubstitution` (durable-skin.mjs:225)
  renames the whole build into shipped space before any styling stage runs.

Church: `substitution = { cobblestone→stone, stone_bricks→polished_basalt }`, kit overrides `{}`
(challenge + church-challenge gate records agree). The kit's trim entry — the **frame** block — is
`stone_bricks` (named). Shipped, the frame is `polished_basalt`.

## The composition sites (each builds vocabulary on its own)

1. **buildSkin** (`benchmarks/sculpture/durable-skin.mjs:305-465`): derives `substitution`
   (selectValueTrueMap over concept swatches, 311-333), composes `combined`/`subK` (345-346), maps
   the named zone policy into shipped space via `mapPolicy(policyNamed, subK)` (216-222, 434), and
   pushes the component-plan roof family (stairs/slab) into `policyS.roof.preserve` (442-450).
   Returns `policyS` + `substitution` to the chain.
2. **grammarStage** (`benchmarks/sculpture/placement-grammar.mjs:95-123`): receives `policy`
   (= policyS, shipped) **plus** raw `substitution` + `kitRec`, and **re-composes**
   `combined = {...substitution, ...kitRec.overrides}` → `sub` itself (108-109). `sub` is handed to
   the pure core.
3. **placementGrammar pure core** (`src/form/placement-grammar.mjs`): ships kit bindings at its own
   point — `ship = (entry) => bareBlock(sub(bareBlock(entry.block)))` (~line 129); the kit-binding
   precondition gates compare shipped frame vs policy preserve.
4. **styled-milestone settle** (`benchmarks/sculpture/styled-milestone.mjs:127-133`): builds its own
   `ownOf = dominant ∪ preserve` per zone from `gOpts.policy` to classify fill placements
   foreign-vs-residue (convergence criterion).
5. **Opening dressing** (`src/view/opening-dressing.mjs:94-142` `treatmentsFromKit`): routes kit
   entries to slots {infill, shutter, door, light, frame} **in named space — no substitution
   anywhere**. `slots.frame` (the trim cube entry, church: `stone_bricks`) is what `dressOpenings`
   paints onto lintel/sill band cells (364-385). Called raw at `styled-milestone.mjs:106` and at the
   gate (`multi-angle-gate.mjs:296`).
6. **kitPresence pure core** (`src/form/kit-presence.mjs:116-117`): builds its own
   `ownOf = dominant ∪ preserve` (the foreign/residue split that decides gating, 118-125), takes
   `sub` from the caller.
7. **multi-angle-gate runner** (`benchmarks/sculpture/multi-angle-gate.mjs:169-181`
   `policyInShippedPalette`): re-derives `substitution` from concept inputs, re-composes `combined`,
   and applies a **manifest-guarded** ship: `(combined[b] && allowed.has(combined[b])) ? … : b` — a
   deliberately different rule (pre-substitution proof baselines census in their own names). Feeds
   `zonesShipped` + `ship` (as `sub`) to kitPresence (291-296), but `treatments` raw (296).
8. **Coverage gates**: `ownCoverage`/`coverageGate` (`src/view/zone-fill.mjs:238-251`,
   `src/view/face-resemblance.mjs:78-96`, metric "own" since T-110) — consume whatever policy the
   caller composed; `grammarStage` re-asserts them (148-161); `zoneFill` itself
   (`src/view/zone-fill.mjs:136-175`) normalizes `dominant ∪ preserve` per zone from its `zones`
   param.

So there are **four independent `combined`-composition/own-set sites** (buildSkin, grammarStage,
settle, kitPresence) plus one **divergent rule** (gate's manifest-guarded ship) plus one stage that
**skips substitution entirely** (dressing). T-110 fixed an instance of this class on the gate side
(role-family ownCoverage); this is the construction-side remainder.

## Why the church loops and the others don't (the cross-subject evidence)

| subject | frame (trim) kit block | substitution touches it? | dressing places | settle |
|---|---|---|---|---|
| cottage | `spruce_planks` | no (`stone_bricks→tuff`, `white_terracotta→…`) | spruce_* / lantern — fixed points of subK | converges, 1 iter |
| gatehouse | `cobblestone` | no (`stone_bricks→polished_basalt`) | cobblestone — fixed point | converges, 0 iter |
| church | `stone_bricks` | **yes → `polished_basalt`** | **`stone_bricks` (named)** into a shipped-space build | **never converges** |

Mechanics of the loop: grammar paints frame lines `polished_basalt` (shipped); dressing recolors
lintel/sill/perimeter cells `stone_bricks` (named). Settle re-runs grammar: the fill wants to
repaint those cells, and `stone_bricks` is in **no** zone's shipped `ownOf` (band0 preserve is
`[polished_andesite, polished_basalt, black_stained_glass, dark_oak_planks]`) → 168 **foreign**
fills; 13 frame-line cells hold `stone_bricks` → frame wants 13. The loop then re-applies dressing
(`applyDressing(s.final, dressAgain.placements)` — lintel/sill placements are applied even though
non-gating, styled-milestone.mjs:153), restoring `stone_bricks`. The next iteration is identical:
a true ping-pong, honest non-convergence. Note `polished_basalt` IS in band0/roof preserve — if
dressing shipped its frame block, the same cells would classify as own-vocab residue/kept and both
counters collapse.

Cottage/gatehouse converge **because their kit fixture/trim blocks happen to be fixed points of
subK** — agreement by luck of the palette, not by construction. That is exactly the AC's
"behavior-preserving where stages already agreed": for those subjects a single composition point
must be a byte-identical no-op.

The gate-side gap reads the same split: kit presence ships the frame demand (`sub: ship` →
`polished_basalt`) and finds 169/544 frame-line cells holding something else — a naming split, not
a placement gap.

## Consumers and call graph (migration surface)

- `buildSkin` (durable-skin.mjs) → produces policyS/substitution; consumed by `styled-milestone.mjs`
  (via `runChain` from challenge-milestone.mjs), `zone-map.mjs`, `placement-grammar.mjs` runner
  (`runGrammar`), `durable-skin.mjs` own runner.
- `grammarStage` (placement-grammar.mjs:95) ← styled-milestone (chain + settle re-runs), runGrammar.
- `treatmentsFromKit`/`dressOpenings` ← styled-milestone:106-107, settle loop:137,
  multi-angle-gate:296, kit-presence runner (`benchmarks/sculpture/kit-presence.mjs`),
  dress-openings runner.
- `kitPresence` core ← multi-angle-gate.mjs:291, kit-presence runner.
- Coverage gates ← buildSkin (3 sites: 504, 531, 577), grammarStage:148-150, multi-angle-gate
  (per-view coverage).
- `zoneFill` ← buildSkin:470, placementGrammar core, component-skin.mjs, spray-paint.mjs (legacy/
  side paths — they take a caller-built policy but do not compose substitution+kit).

## Determinism & verification machinery

- styled-milestone runs the deterministic chain **twice in-process** and byte-compares every stage
  artifact (393-408); `--repro` re-runs from a fresh process and compares sha256s vs the committed
  record (363-389, no GL/judge); `--offline` re-asserts committed artifacts + kit sha + gate-record
  consistency (300-337). Cottage and gatehouse have committed `status: "gated"` records — these are
  the AC3 byte-identity instruments.
- The gate is spawned as its own CLI (frozen contract, exit code = verdict); judge calls are
  metered; GL renders are evidence, never decisions (memory: reproducibility excludes GL).
- Records: `styled/<subj>.json` (schema `styled-milestone/v1`) already serializes
  `skin.substitution`, `grammar.shipped`, `dressing.treatments` — the lineage seam where the
  authority's output can be recorded additively.

## Tests

`npm test` = AJV self-test + `node --test "src/**/*.test.mjs"` (1431 tests green at HEAD,
obs 14496). Pure-core test convention: synthetic occupancies, committed-JSON vocab loads, no GL/IO.
Precedent for a structural tripwire test exists (T-107 "lens-guard" pattern — a test that inspects
on-disk source to pin a contract).

## Constraints carried into Design

- E-25 Rule 3: no subject keys/constants in runners; the fix must be generic composition.
- T-095/T-101/T-110 discipline: gate thresholds/azimuths/judge untouched — vocabulary identity only.
- The gate's manifest-guarded ship is intentional (pre-substitution baselines must census in their
  own names) — committed gate records (`--offline`) must keep verifying.
- Pure cores stay pure (no IO); composition inputs (map, kit, substitution rows) are already
  available at every call site.
- Settle convergence semantics are the kit-presence checker's own criteria (T-106) — any own-set
  change feeds directly into convergence and into committed-record byte-identity.
- A sibling Lisa thread may exist — none detected at research time (no work dir, no same-ticket
  commits in the last 30 min).
