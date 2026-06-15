# T-157-01 — Design: topology guardrails

Decision: ship **one pure topology module + one conformance test** that reads STRUCTURE.md and the
live tree, plus **one small lisa-claim mechanism** (pure decision + IO leaf + CLI), plus a
documented convention block in STRUCTURE.md. Every guardrail proves it fails on the violation and
passes on the canonical state, in the source-scan idiom the project already trusts. No GL, no
spend, no new runtime ceremony.

## The five acceptance criteria → five guardrails

| AC | Guardrail | Mechanism | Red when |
| --- | --- | --- | --- |
| #1 map authoritative + kept-current | STRUCTURE↔code drift | parse spine table; forward+reverse | map names a missing module / chain runs a stage absent from map |
| #2a one chain | single build entry point | scan live runners for `build-chain/v1` | a 2nd live runner declares the marker |
| #2b no archive in spine | live import-from-`_archive` | scan live non-test imports | a live module `import`s from `_archive/` |
| #2c draft-write boundary | allowlist-is-prefix | assert `isInstrumentPath` prefix property | `builds/` becomes frozen / a per-file hand-list returns |
| #3 done = delivered | delivery contract present | scan `build.mjs` source | the beside-concept render leaves the success path |
| #4 replace + claim | convention doc + lisa-claim | STRUCTURE prose + pure claim core | convention text dropped; claim logic regresses |

## Options considered

### A. AST / import-graph analysis (rejected)
Build a real module graph (resolve every import, walk it) to find archive edges and orphan stages.
**Rejected:** heavy, needs a resolver, and the project's own precedent (isolation, pin-guard,
lens-guard, vocabulary-sweep) is deliberately **source-string scanning with precise tokens**. An
AST pass is more ceremony than the enforcement warrants (E-36) and is a new dependency surface.
Regex-over-import-lines matches the existing bar and is debuggable by eye.

### B. A single mega-test vs. a pure module + thin test (chosen: module + test)
`src/pack/conformance.mjs` (pure checks) / `…conformance.test.mjs` (composition) is the house
style. I split the same way: **`src/form/topology.mjs`** holds pure functions
(`parseSpineModules`, `resolveModuleToken`, `findArchiveImports`, `findBuildEntryPoints`,
`chainStageModules`) that take **strings / file lists** and return data; the test feeds synthetic
strings for the red case and the real repo for the green case. This is what makes "fails on the
violation" demonstrable **without** mutating the tree — a synthetic STRUCTURE string with a bogus
module proves red; the on-disk STRUCTURE proves green.

### C. STRUCTURE parsing: strict schema vs. tolerant token scrape (chosen: tolerant)
The spine cell is human-authored markdown (`·`-joins, brace-globs, `(image gen)` with no path,
`<key>` placeholders). A strict column parser is brittle. **Chosen:** scrape backtick-wrapped
tokens that look like module paths (`*.mjs`, `*/` dir-globs, `{a,b}.mjs` brace-globs) from inside
the spine table only (between the header row and the trailing blank line), ignore non-path cells.
`resolveModuleToken` expands braces and dir-globs to concrete existence checks. Tolerant of prose,
strict on the thing that matters (does the named code exist).

### D. Map reverse-drift: enumerate all live modules vs. derive from build.mjs (chosen: derive)
"A live stage module absent from the map → fail." Enumerating *every* live `.mjs` and demanding map
presence is wrong (helpers aren't stages) and noisy. **Chosen:** the authoritative "live stage" set
is what the **canonical chain actually runs** — the `*.mjs` build.mjs spawns (`generated-milestone`,
`workshop`) plus the render module it imports (`render-beside`). Extract those from build.mjs source
and assert each is named in STRUCTURE.md. If a future ticket adds a stage to the chain, the map test
goes red until the map is updated — exactly the "kept-current" contract, tied to code not opinion.

### E. "Build entry point" marker: schema constant vs. spawn-signature (chosen: schema constant)
A "build a subject" runner could be detected by its spawn signature (spawns both
generated-milestone AND workshop). But `build.mjs` already carries a unique, intention-revealing
marker: `BUILD_CHAIN_SCHEMA = "build-chain/v1"`. **Chosen:** count live runners declaring
`build-chain/v1`. Exactly one is the canonical chain; a second runner re-implementing the chain
would (by the record contract) declare its own schema → red. Simple, precise, no false positives on
composing helpers (geometry-levers spawns the workshop but declares no chain schema).

### F. lisa-claim: heavyweight lock vs. checkable claim file (chosen: claim file, pure decision)
A true OS lock is wrong for multi-process lisa threads on one branch (the commit lock already
serializes writes; the *race* is two threads each producing phase artifacts). **Chosen:** a
per-ticket **claim file** `docs/active/work/<ticket>/.lisa-claim.json` carrying
`{ticket, phase, session, at}`. A pure `decideClaim({existing, now, mySession, ttlMs})` returns
`free | mine | held-by-other | stale`; a thread calls `checkClaim` before emitting an artifact and
**defers** on `held-by-other`. Staleness (default 30 min, > a phase) auto-frees a dead claim so a
crashed thread never wedges the ticket. This is "checkable" (a CLI a hook or human can run) and
mirrors pin-guard's pure/IO split. It is advisory-by-design: the enforcement is *visibility*, the
thing the two memories said was missing — not mutual exclusion the DAG already owns.

## Why this is grounded in the research

- The import-scan must skip 17 prose mentions → regex targets `from "…_archive…"` / dynamic
  `import("…_archive…")`, not bare `_archive`.
- New tests live under `src/` (the glob), beside the other conformance tests in `src/form/`.
- The allowlist is *already* a prefix (T-155-01) — AC #2c is a **property test**, not a code
  change; it locks the prefix shape so a regression to a hand-list goes red, and it documents the
  deferred `kit/` entry as the known exception.
- `build.mjs` already renders beside concept before returning success — AC #3 is a **tripwire** on
  that existing contract, not new delivery code.

## What is explicitly NOT done (scope discipline, E-36)

- No archive-relocation of the deferred `kit/` (owned by T-155-01's follow-up).
- No lisa-orchestrator wiring of the claim into thread spawn (out of repo; the CLI + convention is
  the checkable surface). The claim is opt-in visibility, not a scheduler change.
- No AST/module-graph tooling; no new prod dependency.
- No change to pin-guard behavior — only a property test over its public predicate.

## Rejected guardrail forms

- A test that *enumerates the 41 live runners* and demands map presence — noise, churn on every new
  helper. (Derive from the chain instead — option D.)
- A loose `/_archive/` regex over whole files — trips on the 17 provenance comments (the self-grep
  lesson, [[generalization-grep-and-no-evidence-rerolls]]). (Import-line targeting instead.)
