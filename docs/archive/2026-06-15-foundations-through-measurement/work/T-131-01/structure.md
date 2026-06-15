# T-131-01 design-backlog-factory — Structure

Phase: Structure. File-level blueprint; interfaces and ordering, not code.

## Files

### Created

**`src/baml/reply-policy.mjs`** — the shared async reply policy (design D2). PURE of I/O: both
seams arrive injected.
```
import { MAX_REPLY_ATTEMPTS, RAW_REPLY_CLIP } from "../form/judge-reply.mjs"  // constants only
export async function runAsyncReplyPolicy({ ask, parse, maxAttempts = MAX_REPLY_ATTEMPTS })
  → { accepted: bool, expected: object|null, replies: LedgerEntry[], rawTexts: string[], askCount: int }
```
T-114 semantics verbatim, ledger entry shape byte-compatible with the mint script's local loop:
`{attempt, parsed, rawReply: clip(400), parseError?, transport?: true, usage, source: "live"}`.
`ask: async () => ({text, raw})` (one transport attempt; throws = transport-flagged entry);
`parse: async (text) => parsed` (throws = malformed entry). A parsed reply is FINAL; the same
`ask` thunk is reused every attempt (same-prompt by construction). Imports constants *from* the
frozen judge module — the judge path itself gains no dependency (TG4 direction is judge→baml).

**`src/baml/reply-policy.test.mjs`** — parsed-on-first = 1 ask; malformed×budget = refusal with
full ledger; malformed-then-parsed = accepted on attempt 2; transport throw → `transport: true`
entry, loop continues; rawTexts length == live replies; entry shape keys pinned.

**`src/factory/backlog.mjs`** — the pure factory half (design D1, D3, D4, D8). No imports from
bridge/sdk-binding/fs — data in, documents out.
```
export const BACKLOG_DIR = "docs/active/backlog"
export const BACKLOG_SCHEMA = "design-backlog/v1"
export function packSummary(pack) → string            // moved verbatim from mint-baml-fixture
export function assertNonEmptyBacklog(parsed) → parsed // FX-D1: throws "empty backlog" on 0+0
export function enforceRegistryDedup(backlog, ownedNames) →
  { items, parametrization_notes, demotions: [{name, demotedTo}], warnings: [string] }
export function draftRel(styleName, itemName) → "docs/active/backlog/<style>--<item>.md"
export function notesRel(styleName) → "docs/active/backlog/<style>--parametrization-notes.md"
export function renderDraft({ styleName, item, provenance }) → string   // one markdown draft
export function renderNotes({ styleName, notes, warnings, demotions, provenance }) → string
export function backlogFiles({ styleName, backlog, provenance }) → [{rel, content}]  // all-of-run
export function lisaScanDirs(tomlText) → string[]      // flat [dirs] key-value parse
export function isOutsideScanDirs(dir, scanDirs) → bool // path-prefix, separator-safe
```
Draft frontmatter (D4): `draft: <style>--<name>`, `style`, `brush`, `type: brush-work-item`,
`status: draft`, `priority_suggestion`, `provenance` {function, model, prompt_sha256,
generated}, `promotion: {promoted_by: null, date: null, ticket: null}`, `rework: []`. **Never**
`id:`/`story:`/`phase:` — asserted by test. Body: `## Context (self-contained)`,
`## Acceptance Criteria` (checkboxes), `## Parameter sketch`, `## Composition`, `## Test plan`,
`## Preview subject`. `provenance.generated` arrives as data (from the ledger), never from a
clock in the renderer — byte-replay (D5) holds by construction.

**`src/factory/backlog.test.mjs`** —
- dedup: owned-name item demoted to note + ledgered; new-name item kept; unknown
  `existing_brush` note flagged in warnings, kept as note; clean backlog = no-op (both ways AC);
- FX-D1: `assertNonEmptyBacklog` throws on `{items:[],parametrization_notes:[]}`, passes
  items-only, passes notes-only;
- scan dirs: synthetic toml inside/outside verdicts; **the real `.lisa.toml`**: `BACKLOG_DIR`
  outside every scan dir (the AC's config assertion); guard also rejects prefix-collisions
  (`docs/active/ticketsX` vs `docs/active/tickets`);
- drafts: rendered draft contains every quality-contract section, all AC lines as checkboxes,
  `status: draft`, and contains none of `id:`/`story:`/`phase:` keys; `backlogFiles` rels are
  all under `BACKLOG_DIR`; rendering is deterministic (same input → same bytes);
- `packSummary` pin: equals the committed `src/baml/fixtures/decompose/inputs.json`
  `style_summary` for `packs/rustic.json` (the moved function cannot drift from the fixture).

**`scripts/design-backlog.mjs`** — the impure runner (design D5, D6). Flags: `--pack <path>`
(required), `--offline`, `--rotate-pins`.
- **Live:** `loadStylePack` → `packSummary` + `registryDigest()` → `bamlRender(
  DecomposeBrushBacklog)` → `preflightPins` over the four record rels **before any spend**
  (T-119; draft rels are reply-dependent and guarded per-file at write time — the spend is
  protected by the records preflight, and a committed reply makes drafts re-derivable without
  re-spend) → `runAsyncReplyPolicy` (ask = `requestText` STRONG tier; parse = `bamlParse` then
  `assertNonEmptyBacklog`) → `enforceRegistryDedup(expected, brushNames())` →
  `guardedWriteRecord` × {`records/<style>/inputs.json`, `prompt.txt`, `ledger.json`,
  `backlog.json`} + every draft + the notes file. Refused run (all attempts malformed): ledger
  still committed, exit 1.
- **Offline:** read committed `records/<style>/{backlog.json, ledger.json}` → `backlogFiles` →
  write any missing file, byte-assert any existing file; no bridge, no transport, exit nonzero
  on drift. (The deterministic replay; also the recovery path after a per-draft pin refusal.)
- Ledger: `design-backlog-ledger/v1`, ticket, fn, model, transport note, promptSha256, budget,
  askCount, accepted, replies, rawTexts (full), dedup {demotions, warnings}, counts
  {items, notes}, `fixturePromptMatch` (sha vs the committed decompose fixture — cross-check
  note, not an assert).

**`docs/active/backlog/README.md`** — the promotion one-pager (design D7): what a draft is /
is not (no lisa fields, never scanned — `.lisa.toml [dirs]` quoted), the promotion steps
(human review → assign `id`/`story`/`priority` + ticket frontmatter → move into
`docs/active/tickets/` → lisa schedules it), who may promote (human or planner under explicit
user direction; never the factory, never a build session — E-32 Rule 3), and the **rework log
table** (draft | promoted as | rework needed | notes) — the factory's quality metric, one row
per executed promotion, `none` is a legitimate and hoped-for entry.

### Modified

- **`scripts/mint-baml-fixture.mjs`** — local `packSummary` deleted (imported from
  `src/factory/backlog.mjs`); local ask/parse loop deleted (calls `runAsyncReplyPolicy` with
  ask/parse thunks). Ledger assembly stays local and field-identical. Committed fixtures are
  untouched records — nothing re-minted.
- **`package.json`** — `"backlog:generate": "node scripts/design-backlog.mjs"` (docs say
  `npm run backlog:generate -- --pack …` or direct node — the flag-swallowing lesson).

### Untouched (constraints)

`src/form/judge-reply.mjs` and the whole judge path (TG4); `baml_src/decompose.baml` (the
committed fixture pins its prompt bytes); `src/baml/fixtures/**`; `.lisa.toml`;
`docs/active/tickets/` (the factory never writes there — grep-able by the absence of the path
from the runner).

## Module boundaries

```
scripts/design-backlog.mjs        (impure: fs, bridge, transport, pin-guard)
  ├── src/factory/backlog.mjs     (pure: summary, dedup, render, scan-dir logic)
  ├── src/baml/reply-policy.mjs   (pure of I/O: injected ask/parse)
  ├── src/baml/bridge.mjs         (render/parse; never transports)
  ├── src/sdk-binding.mjs         (requestText — the subscription shim)
  ├── src/pack/style-pack.mjs     (loadStylePack)
  ├── src/pack/brush-catalog.mjs  (registryDigest) + idiom-registry (brushNames)
  └── src/form/pin-guard.mjs      (preflightPins, guardedWriteRecord)
```
The pure module never sees the registry object — it takes `ownedNames: string[]` (testable with
synthetic names, no coupling to registry growth).

## Ordering

1. `src/baml/reply-policy.mjs` + tests (the seam both callers share).
2. Refactor `scripts/mint-baml-fixture.mjs` onto it (behavior-preserving; mint is not re-run).
3. `src/factory/backlog.mjs` + tests (packSummary moves here in the same commit as 2's import).
4. `scripts/design-backlog.mjs` + npm script + `docs/active/backlog/README.md`.
5. Live run against `packs/rustic.json` (D6); `--offline` replay assert; commit records+drafts.
6. Full `npm test`; review.md.

Steps 2 and 3 swap-safe but committed together with 1 (mint must not be import-broken between
commits); 4–5 depend on 1–3.
