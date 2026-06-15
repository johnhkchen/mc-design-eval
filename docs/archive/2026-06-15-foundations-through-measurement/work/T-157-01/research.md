# T-157-01 — Research: topology guardrails

Epic E-37 / Story S-157. The E-37 consolidation (T-154 unify-chain, T-155 one-home, T-156
archive) cleaned the state **once**. Without enforcement it re-sprawls: autonomous runs start with
**thin context** and docs *inform* but don't *bind*. This ticket points the project's existing
lens — **structure over discipline** (4-can palette, registry-as-only-door,
workshop-can't-call-judge) — at the *topology*: make the wrong organizational move structurally
impossible, via tests that go **red on violation** (the conformance-sweep pattern,
[[vocabulary-authority-one-composition-point]]).

This is descriptive: what exists, where, and the boundaries the guardrails must sit on.

## The state E-37 just established (the thing to keep)

- **One chain, one entry point** — `benchmarks/sculpture/build.mjs` (T-154-01). `runLive` spawns
  Stage 4 (`generated-milestone.mjs --skip-gate`) → Stage 5 (`workshop.mjs --seed-artifact`) →
  reads back the final → renders **beside the concept** (E-36). It declares the only
  `BUILD_CHAIN_SCHEMA = "build-chain/v1"` in the tree (verified: one file).
- **Location encodes status** (T-155-01) — `builds/<runKey>/` is the DRAFT home (free, no
  pin-guard); `measurements/` holds FROZEN records and **is** the pin-guard allowlist alongside
  ratified `packs/`; `_archive/` is dead code. `src/workshop/seed.mjs#buildRels` is the single
  authority that maps `(key, packRel)` → `builds/<runKey>/{seed-artifact,ledger,final-artifact,
  build}.json`.
- **Dead code archived** (T-156-01) — 48 retired runners + trees under
  `benchmarks/sculpture/_archive/` (`git mv`, byte-identical, reference-checked). 41 live runners
  remain. No live (non-test) file *imports* from `_archive/` today (verified: zero import/`from`
  hits); 17 live files carry bare `_archive` **mentions in comments/strings** (provenance notes) —
  the import-scan must target import statements, not bare mentions.

## The map: STRUCTURE.md (the artifact this ticket makes authoritative)

`STRUCTURE.md` (T-154-01) already holds the canonical spine as a markdown table:
`| # | Stage | Owning module | Artifact (committed) | Entry point |`. Module cells carry
backtick-wrapped paths, sometimes several joined by `·`, with brace-globs
(`src/workshop/{loop,actions,replay,articulate}.mjs`), dir-globs (`src/recognition/*`), and
`<key>` placeholders. Rows are keyed `1..5` plus `—` (final beside) and `⊘` (gate). It already
says *"This file is the map; S-157 adds the test that fails when the map and the code drift apart."*
and *"Invariants (enforced; S-157 formalizes)"* — this ticket fulfills those promises.

There is **no test today** that reads STRUCTURE.md. It can silently rot.

## The enforcement idiom to reuse (red-on-violation, source-scan)

The project already trusts structural tripwires that read source from disk and fail the build:

- `src/workshop/isolation.test.mjs` — ISO1 scans workshop sources for **precise judge-seam
  tokens** (not a loose `/judge/` regex — comments would trip it); ISO2 asserts the lens import is
  present and the judge import absent; reads files ROOT-relative via `fileURLToPath`.
- `src/form/pin-guard.conformance.test.mjs` — a closed `PIN_WRITERS` list; asserts each **exists**
  (rename → update the list) and **imports** the guard; bans raw `writeFile` idioms; asserts
  `preflightPins(` precedes the spend. Its header says: *"If this test caught you, route through
  the guard — don't widen the ban list."*
- `src/pack/conformance.mjs` — pure check functions returning `{name, passed, findings}`; a runner
  composes them. **Declared, never inferred**; unknown name THROWS.

The shared shape: **pure decision core + thin IO leaf**, source read ROOT-relative, precise tokens
over loose regex, a closed list that a rename must update. My guardrails follow this exactly.

## The pin-guard allowlist (already a path prefix — AC just needs a test)

`src/form/pin-guard.mjs` — `INSTRUMENT_ALLOWLIST` is **already** prefix matchers, not a hand-list
(T-155-01 collapsed the five-entry list):
- `measurements/` (frozen-measurement home);
- `packs/` minus `packs/drafts/`, `.json` only;
- `benchmarks/sculpture/kit/` — the one **deferred** entry (HERE-relative loaders;
  relocation to `measurements/kit/` is T-155-01's open follow-up).

`isInstrumentPath(rel)` is the pure membership predicate; `decidePinWrite`/`preflightPins`/
`guardedWriteRecord` gate writes (frozen = allowlist ∧ git-tracked). A draft under `builds/` is
**not** an instrument path → writes freely. AC #2's third bullet ("a draft written outside
`builds/` … the allowlist *is* `measurements/` + ratified `packs/`") is satisfied by code; what's
missing is a **test pinning the prefix property** so a future hand-list regression goes red.

## The lisa-claim seam (AC #4 — the only genuinely new mechanism)

Lisa spawns threads per the ticket DAG (`.lisa.toml`, `max_threads = 2`). Two memories record the
failure mode: [[lisa-same-ticket-concurrency]] (a sibling can be mid-flight on the SAME ticket —
check work-dir mtimes + observations before emitting an artifact) and [[ticket-double-dispatch]]
(one ticket handed to two live threads; monitor for `review.md` instead of racing). The remedy
both describe is *checking before producing*. Today the only liveness signal is
`.lisa/signals/pane-<id>.heartbeat` (written by the untracked `on-heartbeat.sh` hook) — **per
pane, not per ticket**. There is no per-ticket claim a sibling can check. This is the seam to add:
a small, checkable claim keyed by ticket, mirroring the pin-guard's pure/IO split.

## Test discovery constraint

`test:unit = node --test "src/**/*.test.mjs"` — the glob is **`src/` only**. New conformance tests
must live under `src/` (the existing conformance tests already do). `benchmarks/**/*.test.mjs`
(e.g. `facade-milestone.test.mjs`) is **not** run by the suite. Baseline: **2146 pass, 0 fail**.

## Constraints & assumptions

- **No GL, no spend, no Date/random** in the new tests (the `src/**/*.test.mjs` purity bar).
- Source-scan over import statements, **not** bare string mentions (17 live files mention
  `_archive` in prose).
- "Build a subject entry point" has a clean structural marker: `build-chain/v1` /
  `BUILD_CHAIN_SCHEMA` (one declaration today).
- The map's reverse-drift check needs a code-derived truth source: the stage modules **build.mjs
  actually spawns/imports** are the authoritative "live stage" set to demand presence in the map.
- "Done = delivered" is already coded in `build.mjs` (`assertGlAvailable` + `renderBesideConcept`
  before the success return); the gap is a tripwire that keeps that contract from being deleted.
- E-36 spirit: **no new ceremony beyond the enforcement**.
