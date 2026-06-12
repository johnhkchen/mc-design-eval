# T-131-01 design-backlog-factory — Review

Self-assessment / handoff. The factory is live: formed style + registry state in, brush
work-item drafts out, written outside lisa's scan dirs; promotion is human-only.

## What changed

| commit | files | what |
| --- | --- | --- |
| ff508f9 | `src/baml/reply-policy.mjs` (+test), `scripts/mint-baml-fixture.mjs` | shared bounded same-prompt re-ask loop (T-114 semantics, third caller); mint script refactored onto it, fixtures untouched |
| af05235 | `src/factory/backlog.mjs` (+test), `scripts/mint-baml-fixture.mjs` | pure half: registry dedup gate, FX-D1 empty-union classifier, draft/notes renderers (no lisa vocabulary), scan-dir assertion vs the REAL `.lisa.toml`, `packSummary` relocated + fixture-pinned |
| 9d2a99f | `scripts/design-backlog.mjs`, `docs/active/backlog/README.md`, `package.json` | impure half: render → preflight pins → ask on the subscription shim → dedup → guarded writes; `--offline` byte-assert replay; promotion one-pager + rework log |
| 71249e5 | `docs/active/backlog/` (4 drafts, 1 notes file, 4 records) | live proof: rustic backlog accepted on attempt 1, full raws committed, offline replay byte-identical |

Plus this work dir (research/design/structure/plan/progress/review), committed with this
review. No files deleted. The judge path, committed fixtures, and frozen gate untouched.

## Acceptance-criteria trace

1. **Factory runner** ✅ — `scripts/design-backlog.mjs`: pack + `registryDigest()` →
   `DecomposeBrushBacklog` via the bridge on the subscription shim → drafts under
   `docs/active/backlog/`. The config assertion is a unit test that parses the real
   `.lisa.toml` and asserts the backlog dir is outside every scan dir (prefix-safe).
2. **Draft quality contract** ✅ structurally / ⏳ behaviorally — every draft carries
   Context (self-contained), checkboxed ACs, parameter sketch, composition notes, test
   plan, preview subject; renderer-enforced and tested (including the absence of
   `id:`/`story:`/`phase:` keys). The *measure* — a promoted draft runs through lisa
   without rework — awaits the human promotion (below).
3. **Duplicate detection** ✅ — `enforceRegistryDedup` unit-tested both ways (owned name
   → demoted to parametrization note + ledgered; new name → kept; unknown
   `existing_brush` → warning). The live run produced 0 demotions (the prompt steers
   dedup upstream; 19 needs arrived already classified as notes) — the code gate's
   behavior is pinned by tests, not by the run.
4. **Promotion flow documented** ✅ — `docs/active/backlog/README.md`: backlog → human
   review → move to `docs/active/tickets/` with story assignment; planner/human only;
   carries the rework log table (the factory's quality metric).
5. **Live proof** ✅ generation half / ⏳ promotion half — drafts generated live
   (accepted 1st ask, `fixturePromptMatch: true`, full 14k-char raw committed,
   `--offline` 5/5 byte-identical), `npm test` green (1875/0). **The promotion half is a
   human act by design and remains open** — see Handoff.

## Test coverage

- `src/factory/backlog.test.mjs` — dedup both directions, FX-D1, scan-dir verdicts
  (real config + synthetic + prefix collision), contract sections, lisa-vocabulary
  absence, byte-determinism, `packSummary` fixture pin.
- `src/baml/reply-policy.test.mjs` — parsed-is-final, bounded re-asks, ledger shape;
  spawn-free.
- Live integration — one run, records committed; replay asserted via `--offline`.
- Guards — TG2 (no metered key in `scripts/`), TG4 (judge core untouched) green.
- **Gaps:** `scripts/design-backlog.mjs` itself has no unit test (thin impure shell over
  tested pure functions; its offline path is exercised by the byte-assert run, the live
  path by the committed ledger). `emitFiles` drift-reporting is exercised only by the
  happy path. Acceptable for a runner, flagged for honesty.

## Open concerns

1. **Human handoff (AC2+AC5, the open half):** promote ≥1 draft — candidate:
   `rustic--window.lattice.md` (smallest scope, clean preview subject) — by moving it
   into `docs/active/tickets/` with a story assignment, let lisa execute it, then record
   rework (or its absence) in the README table and the draft's `rework:` frontmatter.
   The factory may not do this itself (E-32 Rule 3).
2. **T-130 stand-in caveat (design D6):** the live proof ran against `packs/rustic.json`,
   the committed formed style, because T-130's new style was not yet ratified at run
   time. The AC says "the T-130 new style"; rustic is the sanctioned stand-in named in
   plan Step 4. When T-130's pack lands, a second run is one command:
   `node scripts/design-backlog.mjs --pack packs/<style>.json`.
3. **Refused first run not in git history:** the 15:10 attempt was refused 3×/3 by the
   subscription's monthly spend limit (zero-token notice replies, correctly classified
   MALFORMED by FX-D1). The session died before committing that ledger; the sanctioned
   `--rotate-pins` re-run overwrote it on disk. Raw content is reproduced in
   progress.md. If a committed refusal trail is wanted as policy, that is a small
   follow-up (write refused ledgers to a timestamped side path).
4. **19 parametrization notes, 0 demotions:** the model classified aggressively toward
   "covered by an owned brush". Spot-checks look right, but nobody has audited all 19
   mappings against the registry — a wrong note silently buries a genuinely-new brush
   need. Worth a skim during the human promotion pass.
5. **npm flag swallowing:** docs and this review use direct
   `node scripts/design-backlog.mjs …`; `npm run backlog:generate` requires `--`.

## Verdict

Code-complete and live-proven on generation; deterministic replay holds; the remaining
AC work (promotion + rework measurement) is intentionally outside the factory's
authority and waits on a human.
