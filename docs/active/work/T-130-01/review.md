# T-130-01 style-formation — Review

Phase: Review. The handoff: what changed, how it is proven, what a human should look at.

## What shipped (commits `9b53656`, `6feaebc`, `9ab25ef`, `8dfacde`, `69e230c`, `d679644`, `74ea65e`)

**Created**
- `baml_src/formation.baml` — `DerivePalette`, `DeriveProportions` (ClaudeStub render-only;
  every post-parse gate taught in the prompt; leniency notes per class shape).
- `src/baml/ask.mjs` + `ask.test.mjs` — `askParsed`: the bounded same-prompt re-ask with a
  `classify` gate hook (gate failure = MALFORMED, T-114 semantics; transport/parse injectable).
- `src/pack/formation.mjs` + `formation.test.mjs` — the pure half: vocabulary/story/source/
  palette digests; `classifyPalette` / `classifyProportions` / `classifyBacklog` (FX-D1 reused
  from the factory); `danglingSeats` absorption; deterministic `stampValueChecks` (the exact
  derivation `validateStylePack` re-checks); `seedIdiomParams` (mechanical subset only);
  `assembleDraftPack` (`style-pack/draft-v1` — parseStylePack REJECTS drafts by construction);
  `deriveDraftFromStages` (the ONE stage→draft derivation, shared by runner and replay test);
  `nearToneReport` (w=2 weighted + true ΔE76); `comparePacks` (name-then-unambiguous-zone
  alignment, divergences named); `draftReadme` (the ratification sheet).
- `scripts/form-style.mjs` — the chain runner: `--brief|--brief-file|--story-replay`,
  `--slug` (required), `--compare`, `--offline`, `--rotate-pins`; preflightPins BEFORE any
  spend; per-stage mint-shape records (inputs/prompt/reply/expected/ledger, full raw texts);
  idempotent stage resume; offline replay byte-asserts prompts, parses, and artifacts.
- `scripts/ratify-pack.mjs` — the gate's second half: draft tag swap → ratification receipt
  → full pack gates fail-loud → pin-guarded `packs/<style>.json`; echoes the README it signs.
- `src/pack/formation-guard.test.mjs` — FG1 no optical imports, FG2 no image input /
  `images:` args, FG3 no concept-evidence imports (import-line matching, never comments).
- `src/pack/formation-replay.test.mjs` — for every committed draft: stage prompts re-render
  to ledgered shas, replies re-parse to expecteds, artifacts re-derive byte-identically.
- Committed runs: `packs/drafts/rustic-rederived/` (+ `comparison.json`, never ratified) and
  `packs/drafts/saltcrag/` → ratified `packs/saltcrag.json`.

**Modified**: `schema/style-pack.schema.json` (optional `ratification`), `style-pack.test.mjs`
(ratification cases), `transport-guard.test.mjs` (TG5 + formation.baml), `bridge.mts` (FNS map
+2), `package.json` (`style:form`, `style:ratify`).

## Acceptance criteria — trace

1. **Formation chain**: `form-style.mjs` composes story → palette (rationales cite source
   keys, enforced by gate + schema referential integrity) → proportions → brush needs
   (resolved against the T-128 registry via `registryDigest` + `enforceRegistryDedup`) →
   E-31 pack with `provenance` populated and valueCheck stamped from the committed table. ✓
2. **Ratification gate**: drafts are structurally not packs (`draft-v1` tag, rejected by
   parseStylePack — tested); ratify swaps tag + stamps `{by, date, note}`; flow documented in
   every draft README. `packs/saltcrag.json` records who/when. ✓
3. **No optics, provable**: grep recorded in progress.md AND pinned executably (FG1–FG3);
   precedence honored by construction — the chain authors pack-assignment + the story only;
   concept evidence is not an input (FG3 pins the absence of every concept-reading seam). ✓
4. **Rustic re-derived**: committed under `packs/drafts/rustic-rederived/` with
   `comparison.json` — 6 aligned (3 same-block, 3 different), 7 missing / 7 extra, pitch
   [2,1,0.5] vs [1]; divergences named, not hidden. Never ratified; rustic stays curated. ✓
5. **One new style formed + ratified**: `saltcrag` (theme brief recorded in the stage-1
   inputs/fixture), raw replies committed (stage ledgers carry FULL raw texts), replays
   deterministic (`--offline` exit 0 byte-identical; formation-replay test pins both drafts),
   `npm test` green (1895/1895, 0 skipped). ✓ — with the caveat below.

## The one judgment call a human should confirm

**Saltcrag's ratification is provisional** — ratified `--by "T-130-01 autonomous run
(ticket-sanctioned; provisional pending human taste pass)"` because "ratified, committed" is
an explicit AC of an autonomous ticket (the Rule-3 planner precedent, design D3). The taste
gate (E-32 Rule 4) belongs to a human: read `packs/drafts/saltcrag/README.md` (story, palette
table with L*, near-tone evidence, taste checklist) and either re-ratify with a human `--by`
(`--rotate-pins`, owned ticket) or amend. Watch items on the pack itself: `roof.field` and
`wall.field.upper` are BOTH dark_oak_planks (tarred boarding everywhere is diegetically right
but reads near-black on two bands); hay_block/moss_block have no semantic family (recorded
warns — value drift unguarded on those roles).

## Test coverage

- Pure: 16 formation tests (digests, gates incl. absorption, stamping, seeding, assembly,
  round-trip through the REAL gates, comparison, README) + 6 askParsed tests + ratification
  schema cases. Guards: FG1–FG3, TG1–TG5. Replay: one batched bridge spawn re-derives both
  committed drafts byte-identically. Live paths covered by committed ledgers + `--offline`,
  never by `npm test` (inherited policy).
- **Gaps**: `scripts/form-style.mjs` / `ratify-pack.mjs` CLI plumbing has no unit tests
  (usage paths hand-verified; the offline replay + replay test cover their derivation tails);
  the absorbed-seat ledger field is asserted only via the unit on `danglingSeats`.

## Open concerns / follow-ups

1. **askParsed vs runAsyncReplyPolicy** (`src/baml/ask.mjs` vs `src/baml/reply-policy.mjs`):
   T-130 and T-131 each promoted a shared re-ask loop in parallel — same semantics family,
   two homes (askParsed adds the classify hook). Consolidation cleanup ticket suggested.
2. **Strict comparison alignment under-counts closeness**: rustic-rederived's
   `wall.dressing.quoin` (stone_bricks) and curated `wall.dressing` (stone_bricks) did not
   align (different names, half-seat dropped the zone) and so count as missing+extra despite
   being the same choice. Honest by design (D5 rejected fuzzy matching), but a reviewer
   reading "3/13 same-block" should also read the missing/extra lists before judging the
   chain.
3. **The refused first palette run's raw texts are LOST**: the stage was never git-committed
   before the resumed run overwrote it (untracked → pin-guard writes freely). What survives:
   this record (3 asks, every reply parsed but gate-failed `role wall.dressing.quoin: band
   and tier must arrive together`; all 14 chosen blocks were vocabulary-legal — absorption
   would have accepted attempt 1) and the fix it bought. If refusal ledgers must persist,
   a follow-up should write refused stages to a side path (e.g. `stages/<s>.refused-<n>/`)
   instead of leaving them to the next run's overwrite.
4. **Live spend totaled 9 strong asks vs ~7 planned** (the 2 refused palette attempts);
   ledgered honestly.
