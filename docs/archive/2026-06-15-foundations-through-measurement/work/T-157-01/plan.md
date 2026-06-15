# T-157-01 — Plan: ordered, verifiable steps

Three atomic commits. Each leaves `npm test` green. Testing strategy: pure logic + source-scan, no
GL/spend; every guardrail proves **red on a synthetic violation** and **green on the real repo**.

## Step 1 — topology module + conformance suite (the centerpiece)
**Create** `src/form/topology.mjs`:
- `parseSpineModules(md)`: slice the spine table (from the `| # | Stage | Owning module |` header to
  the next blank line); for each row, take the **module column** (3rd `|`-cell), scrape
  backtick-wrapped tokens, keep those matching a module-path shape (`/\.mjs$/`, `/\/\*$/`,
  brace-glob). Return unique tokens in order.
- `resolveModuleToken(root, token)`: brace-expand `{a,b}`; dir-glob `*/` → `existsSync(dir)` &&
  non-empty; plain → `existsSync(file)`. Return `{token, files, ok, reason}`.
- `liveSpineFiles(root)`: recurse `src/` + `benchmarks/sculpture/`, collect `*.mjs`, drop
  `_archive/` and `*.test.mjs`.
- `ARCHIVE_IMPORT_RE = /(?:from|import\()\s*["'][^"']*_archive[^"']*["']/` ; `findArchiveImports`
  reads each live file, returns `{rel, line}` per match.
- `findBuildEntryPoints(root)`: live files whose source includes `BUILD_ENTRY_MARKER`.
- `chainStageModules(src)`: regex `join\(HERE,\s*["']([\w-]+\.mjs)["']\)` over build.mjs + the
  `render-beside.mjs` basename from its import; unique.
- `missingFromMap(md, basenames)`: basenames not substring-present in `md`.

**Create** `src/form/topology.conformance.test.mjs` (TOPO1–TOPO7 from structure.md). Use
`fileURLToPath(new URL("../../", import.meta.url))` for ROOT (the isolation/pin-guard idiom).

**Verify:**
- `npm run test:unit` green (2146 + new).
- Manual red-proof embedded in tests (synthetic strings). Spot-check by temporarily breaking one
  assertion locally is unnecessary — the synthetic-violation assertions *are* the red proof.

**Commit:** `feat(T-157-01): topology conformance suite — STRUCTURE↔code drift, one entry point, no archive import`

## Step 2 — STRUCTURE.md authoritative + conventions
**Edit** `STRUCTURE.md`:
- Closing invariants header → `(enforced — S-157, src/form/topology.conformance.test.mjs)`; add
  four invariant bullets (map-kept-current, one-entry-point, no-archive-import, allowlist-is-prefix).
- Add `## Conventions (recorded — S-157)` with the three marker phrases TOPO7 asserts:
  *"updates this map in the same commit"*, *"replace, don't accrete"*, *"claim before you produce"*.

**Verify:** `npm run test:unit` green — TOPO7 now passes against the real STRUCTURE.md; TOPO1/2
still green (no module names changed). If TOPO7 marker strings and the prose disagree, fix the prose
(the test is the contract).

**Commit:** `docs(T-157-01): STRUCTURE.md authoritative — invariants enforced + conventions recorded`

## Step 3 — checkable lisa claim
**Create** `src/form/lisa-claim.mjs` (pure `decideClaim`/`claimRecord`/`claimRel` + thin
`readClaim`/`writeClaim`/`checkClaim`). **Create** `src/form/lisa-claim.test.mjs` (CLAIM1–3).
**Create** `scripts/lisa-claim.mjs` (CLI: `--check` exit 3 on held-by-other, `--claim`,
`--release`; `LISA_PANE_ID` default session, `Date.now()` here). **Edit** `package.json`: add
`"lisa:claim"`.

**Verify:**
- `npm run test:unit` green.
- Smoke the CLI by hand: `node scripts/lisa-claim.mjs --ticket T-157-01 --claim --session selftest`
  then `--check --session other` exits 3; `--check --session selftest` exits 0; `--release`. Then
  **delete the smoke claim file** so it isn't committed (`builds/`-style draft, but a work-dir
  scratch — remove it).

**Commit:** `feat(T-157-01): checkable lisa claim — per-ticket .lisa-claim.json + CLI`

## Testing strategy summary
| Guardrail | Unit (pure) | Red-proof | Green-proof |
| --- | --- | --- | --- |
| map forward (TOPO1) | parseSpineModules over string | synthetic ghost module | real STRUCTURE resolves |
| map reverse (TOPO2) | missingFromMap pure | synthetic map missing workshop | real chain ⊆ map |
| one entry (TOPO3) | marker count | synthetic two-marker scan | real repo == 1 |
| no archive import (TOPO4) | ARCHIVE_IMPORT_RE | matches import not comment | real repo == 0 |
| allowlist prefix (TOPO5) | isInstrumentPath cases | builds/ not frozen | measurements/ frozen |
| done=delivered (TOPO6) | build.mjs source scan | (asserts ordering present) | real build.mjs |
| convention (TOPO7) | STRUCTURE markers | (doc-presence) | real STRUCTURE |
| claim (CLAIM1–3) | decideClaim truth table | held-by-other vs mine vs stale | round-trip |

## Risks & mitigations
- **Brittle STRUCTURE parse** (prose drift breaks TOPO1) → tolerant token scrape; only backtick
  `.mjs`/glob tokens are demanded, prose ignored. If a legit future module uses an unusual cell
  form, the fix is the parser, documented in the module header.
- **TOPO2 over-broad** (a refactor renames a stage script) → that *is* the intended red; the
  remedy is updating STRUCTURE.md in the same commit (the recorded convention). Working as designed.
- **Claim file accidentally committed** → it's a work-dir scratch; Step 3 verify deletes the smoke
  file; `.lisa-claim.json` is advisory and harmless if ever tracked, but should not be.
- **Concurrency with a sibling thread on T-157-01** (the very failure this ticket addresses) →
  before each commit, re-Read touched files and `git status`; the new files are additive
  (`src/form/topology*`, `src/form/lisa-claim*`, `scripts/lisa-claim.mjs`) so a sibling's commit
  cannot sweep them ([[shared-file-commit-sweep]]). STRUCTURE.md + package.json are shared — re-Read
  immediately before editing.

## Definition of done
All seven TOPO + three CLAIM tests pass; `npm test` green at 2146 + new; STRUCTURE.md authoritative
with conventions; the lisa-claim CLI works by hand; review.md written. No edits to the canonical
spine modules.
