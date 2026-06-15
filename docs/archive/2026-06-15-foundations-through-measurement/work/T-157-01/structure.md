# T-157-01 — Structure: file-level blueprint

The shape of the code. Two new pure modules + their tests, one CLI shim, and prose edits to
STRUCTURE.md + package.json. No existing behavior changes.

## New files

### `src/form/topology.mjs` (pure; no IO except thin ROOT-relative readers)
The topology decision core. Exports:

```
export const STRUCTURE_REL = "STRUCTURE.md";
export const BUILD_ENTRY_MARKER = "build-chain/v1";

// --- STRUCTURE.md parsing ---
// Extract the spine table body (between the "| # | Stage | Owning module |…" header and the next
// blank line), then scrape backtick tokens that look like module paths.
export function parseSpineModules(structureMd) -> string[]   // unique tokens, in order
//   token kinds handled by resolveModuleToken:
//     "a/b.mjs"                         plain file
//     "a/b/{x,y}.mjs"                   brace-glob -> a/b/x.mjs, a/b/y.mjs
//     "a/b/*"                           dir-glob   -> dir a/b exists & non-empty
//   (cells with no backtick path — "(image gen)", "committed reference" — yield nothing)
export function resolveModuleToken(root, token) -> { token, files:string[], ok:boolean, reason }

// --- live-spine scans (thin IO leaves) ---
export const LIVE_ROOTS = ["src", "benchmarks/sculpture"];
export function liveSpineFiles(root) -> string[]   // *.mjs under LIVE_ROOTS, excl _archive/ & *.test.mjs
export const ARCHIVE_IMPORT_RE;                    // matches: from "…_archive…" | import("…_archive…")
export function findArchiveImports(root) -> [{ rel, line }]   // live files with a real archive import
export function findBuildEntryPoints(root) -> string[]        // live runners declaring BUILD_ENTRY_MARKER

// --- map reverse-drift (pure over source strings) ---
export function chainStageModules(buildMjsSrc) -> string[]    // *.mjs spawned + render module imported
export function missingFromMap(structureMd, stageBasenames) -> string[]  // stages not named in the map
```

Design notes:
- `parseSpineModules` is **pure over a string** so the test can pass a synthetic map (bogus module
  → caught) without touching disk; `resolveModuleToken` takes `root` and stats disk (thin leaf).
- `findArchiveImports` / `findBuildEntryPoints` / `liveSpineFiles` are thin IO leaves (read dir +
  files ROOT-relative, like `isolation.test.mjs`). Their *predicates* (`ARCHIVE_IMPORT_RE`,
  marker match) are exported so the test proves red on a synthetic source string too.
- `chainStageModules` is pure over `build.mjs` source: collect `join(HERE, "<name>.mjs")` spawn
  targets + the `render-beside.mjs` import basename.

### `src/form/topology.conformance.test.mjs` (the red-on-violation suite)
Mirrors `pin-guard.conformance.test.mjs`. Test groups (each: green on real repo + red on synthetic
violation):

```
TOPO1  map forward: every spine module token resolves on disk (real)
       + synthetic STRUCTURE naming "src/nope/ghost.mjs" -> resolveModuleToken ok:false
TOPO2  map reverse: every chainStageModules(build.mjs) basename is named in STRUCTURE.md (real)
       + synthetic map missing "workshop.mjs" -> missingFromMap non-empty
TOPO3  one build entry point: findBuildEntryPoints(root) has length 1 (real)
       + synthetic 2-file scan with two markers -> length 2 (assert the rule catches it)
TOPO4  no live import from _archive: findArchiveImports(root) is empty (real)
       + ARCHIVE_IMPORT_RE matches `import x from "../_archive/a.mjs"`, not a bare "_archive" comment
TOPO5  pin-guard allowlist is a path PREFIX, not a hand-list:
       isInstrumentPath("builds/cottage/build.json") === false   (drafts free)
       isInstrumentPath("measurements/multi-angle/x.json") === true
       isInstrumentPath("packs/rustic.json") === true; ("packs/drafts/x.json") === false
       every INSTRUMENT_ALLOWLIST entry is prefix/extension shaped (no equality to a literal file)
TOPO6  done = delivered: build.mjs source imports renderBesideConcept + assertGlAvailable,
       calls assertGlAvailable() and renderBesideConcept( BEFORE the success `return record.…`,
       and writes rels.final-derived final beside the chain record
TOPO7  convention recorded: STRUCTURE.md contains the kept-current + replace-don't-accrete +
       lisa-claim convention markers (doc-presence tripwire so the prose can't be silently dropped)
```

### `src/form/lisa-claim.mjs` (pure decision + thin IO leaf)
```
export const CLAIM_BASENAME = ".lisa-claim.json";
export const DEFAULT_TTL_MS = 30 * 60 * 1000;   // > a phase; a dead claim auto-frees
export function claimRel(ticket) -> "docs/active/work/<ticket>/.lisa-claim.json"
export function decideClaim({ existing, now, mySession, ttlMs }) -> "free"|"mine"|"stale"|"held-by-other"
export function claimRecord({ ticket, phase, session, now }) -> object   // pure builder
// thin IO leaves:
export function readClaim(root, ticket) -> object|null
export async function writeClaim(root, { ticket, phase, session, now })
export function checkClaim(root, { ticket, mySession, now, ttlMs }) -> { status, existing }
```
`decideClaim`: no `existing` → `free`; `existing.session === mySession` → `mine`;
`now - existing.at > ttlMs` → `stale`; else `held-by-other`. Pure, fully unit-tested.

### `src/form/lisa-claim.test.mjs`
`CLAIM1` decideClaim truth table (free/mine/stale/held-by-other); `CLAIM2` claimRel path shape;
`CLAIM3` claimRecord carries ticket/phase/session/at and round-trips through JSON.

### `scripts/lisa-claim.mjs` (the checkable CLI — a hook or human can run it)
```
node scripts/lisa-claim.mjs --ticket T-x --check     # exit 0 free|mine, exit 3 held-by-other (prints holder)
node scripts/lisa-claim.mjs --ticket T-x --claim --phase research --session $LISA_PANE_ID
node scripts/lisa-claim.mjs --ticket T-x --release
```
Uses `process.env.LISA_PANE_ID` as the default session; `Date.now()` lives here (CLI, not the test
glob), keeping the pure core deterministic.

## Modified files

### `STRUCTURE.md`
- Flip the closing **"Invariants (enforced; S-157 formalizes)"** → **"(enforced — S-157,
  `src/form/topology.conformance.test.mjs`)"** and add the four new invariants as bullets:
  map-kept-current, one-entry-point, no-archive-import, allowlist-is-prefix.
- Add a **"## Conventions (recorded — S-157)"** section: (a) *any stage-changing ticket updates
  this map in the same commit*; (b) *replace, don't accrete — a superseding ticket archives what it
  replaces in the same ticket; a shared dep gets its own upstream ticket*
  ([[parallel-roots-duplicate-shared-deps]]); (c) *claim before you produce — a thread writes
  `.lisa-claim.json` and a sibling checks it* ([[lisa-same-ticket-concurrency]],
  [[ticket-double-dispatch]]). These marker phrases are what TOPO7 asserts.

### `package.json`
- Add one script: `"lisa:claim": "node scripts/lisa-claim.mjs"`. No other changes.

## Ordering of changes
1. `src/form/topology.mjs` + `…conformance.test.mjs` (the centerpiece; depends on nothing new).
2. `STRUCTURE.md` convention block (so TOPO7 passes).
3. `src/form/lisa-claim.mjs` + test + `scripts/lisa-claim.mjs` + package.json script.
Each step is independently green-able and atomically committable.

## Module boundaries / invariants preserved
- `topology.mjs` imports **only** `node:fs`/`node:path`/`node:url` and `pin-guard.mjs`'s
  `isInstrumentPath`/`INSTRUMENT_ALLOWLIST` (for TOPO5) — no model, no GL, no Date/random.
- `lisa-claim.mjs` pure core takes `now` injected; `Date.now()` is confined to the CLI.
- No edits to `build.mjs`, `pin-guard.mjs`, `seed.mjs`, or any runner — guardrails observe, never
  alter, the canonical spine.
