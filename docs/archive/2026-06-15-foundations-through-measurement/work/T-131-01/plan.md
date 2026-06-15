# T-131-01 design-backlog-factory — Plan

Phase: Plan. Ordered, independently verifiable steps; each commits atomically.

## Step 1 — shared async reply policy (commit 1)

Create `src/baml/reply-policy.mjs` (`runAsyncReplyPolicy`) + `src/baml/reply-policy.test.mjs`.
In the same commit, refactor `scripts/mint-baml-fixture.mjs` onto it: delete the local
ask/parse loop, build the ledger from the returned `{replies, rawTexts, askCount, accepted,
expected}`. The committed fixtures under `src/baml/fixtures/` are NOT re-minted — the refactor
is loop-code only; ledger field names/order preserved exactly (visual diff of the assembled
object against the current script).

**Verify:** `npm run test:unit` green (new policy tests + the whole suite); transport guards
TG1–TG5 untouched and green; `node --test src/baml/reply-policy.test.mjs` in isolation.
Mint is not executed (no spend); its correctness is type-level — same fields, same semantics —
and reviewed by diff.

## Step 2 — pure factory module (commit 2)

Create `src/factory/backlog.mjs` + `src/factory/backlog.test.mjs` per structure.md: move
`packSummary` here and import it in the mint script (same commit — no orphaned duplicate),
`assertNonEmptyBacklog` (FX-D1), `enforceRegistryDedup`, `lisaScanDirs`/`isOutsideScanDirs`,
`draftRel`/`notesRel`, `renderDraft`/`renderNotes`/`backlogFiles`.

**Verify:** unit tests cover —
- AC3 both ways: owned-name item → demoted note (+ `demotions[]` entry); new-name item → kept
  work item; plus unknown `existing_brush` → `warnings[]`; clean input → no-op.
- AC1 structural half: real `.lisa.toml` parsed, `BACKLOG_DIR` outside every scan dir;
  synthetic inside/outside verdicts; prefix-collision safety.
- AC2 contract half: every draft carries the six quality-contract sections + checkboxed ACs;
  no `id:`/`story:`/`phase:` keys anywhere in a rendered draft; deterministic bytes.
- `packSummary(rustic)` byte-equals the committed fixture's `style_summary`.
`npm run test:unit` green.

## Step 3 — runner + promotion doc (commit 3)

Create `scripts/design-backlog.mjs` (live/offline/rotate flags, records preflight before spend,
guarded writes, ledger per structure.md), `docs/active/backlog/README.md` (promotion flow +
rework log table, the E-32 Rule 3 language), `package.json` script `backlog:generate`.

**Verify (no spend):** `node scripts/design-backlog.mjs` with no `--pack` → usage error;
`--offline --pack packs/rustic.json` before records exist → clear "no committed records"
refusal; TG2 still green (no metered-key token; the walk includes `scripts/`); `npm test` green.

## Step 4 — live proof against rustic, the T-130 stand-in (commit 4)

`node scripts/design-backlog.mjs --pack packs/rustic.json` — one live STRONG-tier run through
the subscription shim (budget 3, same-prompt re-asks). Expected: drafts for the genuinely-new
brushes (fixture precedent: opening-fill, corner-dressing, buttress), one parametrization-notes
file, records with full raws. Then `--offline` → byte-identical, exit 0.

**Verify:** ledger `accepted: true`, dedup section present (demotions likely empty — the prompt
already steers; the *code* path is pinned by Step 2's tests); `fixturePromptMatch` recorded;
every emitted file under `docs/active/backlog/`; `git status` shows no write outside
backlog + work dirs; `npm test` green. Commit drafts + records + ledger (the AC's committed
raws). Caveat recorded in ledger + review: style = rustic stand-in, T-130 not yet formed (D6).

## Step 5 — review (no commit gate)

`progress.md` finalized (deviations journaled as they happen, not reconstructed);
`review.md`: changes, AC trace, coverage, open concerns — explicitly: (a) the human handoff
"promote ≥1 draft, run through lisa, record rework in the README table + draft frontmatter"
(the factory may not promote its own output), (b) the T-130 stand-in caveat, (c) anything found
mid-flight. Commit docs.

## Testing strategy summary

| layer | what | how |
| --- | --- | --- |
| unit (pure) | dedup both ways, FX-D1 empty-union, scan-dir verdicts incl. real config, draft contract + lisa-vocabulary absence, determinism, packSummary fixture pin | `src/factory/backlog.test.mjs` |
| unit (policy) | parsed-final, bounded re-asks, transport flag, ledger shape | `src/baml/reply-policy.test.mjs` |
| integration (live, once) | transport via shim, end-to-end factory run, raws committed | Step 4 run + committed ledger |
| replay | drafts byte-derivable from committed records | `--offline` assert (Step 4, and any time) |
| structural guards | no metered key in runner, judge path untouched, fixtures unmodified | existing TG2/TG4 + git diff |

## Risks / contingencies

- **Live reply refused (3× malformed):** ledger committed anyway, exit 1 — journal it, inspect
  raws; the empty-union classifier is the likely trigger if the model balks. Re-run is a new
  ask (records preflight will refuse without `--rotate-pins` once the refused ledger is
  committed — rotation is sanctioned here while the run is this ticket's own live proof, and
  noted in progress.md).
- **Registry drift since the fixture mint** (another thread landing a brush): `registryDigest()`
  diverges from the fixture's `registry_state`; `fixturePromptMatch: false` is informational —
  the runner must not assert it.
- **Draft name collisions with committed drafts on a re-run:** per-file pin-guard refuses;
  recovery = `--offline` (re-derive from records) or `--rotate-pins` with sanction.
- **npm flag swallowing:** all docs/examples use direct `node scripts/design-backlog.mjs …`.

## Acceptance-criteria trace (planned)

| AC | where it lands |
| --- | --- |
| factory runner: style+registry → drafts in backlog dir, outside scan dirs, config-asserted | Steps 2–4; scan-dir test on real `.lisa.toml` |
| draft quality contract (self-contained house style; rework recorded) | Step 2 renderer + tests; README rework table; human handoff flagged in review |
| duplicate detection unit-tested both ways | Step 2 `enforceRegistryDedup` tests |
| promotion flow documented, human-only | Step 3 README |
| live proof + raws committed + `npm test` green | Step 4 (rustic stand-in, caveat named); promotion/execution half = human handoff (review) |
