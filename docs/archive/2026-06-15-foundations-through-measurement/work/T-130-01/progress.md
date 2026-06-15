# T-130-01 style-formation — Progress

Phase: Implement — COMPLETE. Tracking against plan.md's eight steps. A prior session completed
steps 1–3 (commits `9b53656`, `6feaebc`, `9ab25ef`) and stopped; this session resumed at step 4
after verifying no sibling was mid-flight (work-dir mtimes >2h old, no same-ticket commits since).

## Step status

- [x] **Step 1 — ratification contract** (`9b53656`): `schema/style-pack.schema.json` gains the
  optional top-level `ratification {by, date, note?}`; style-pack.test.mjs covers
  valid/invalid/draft-tag cases. rustic stays valid without it.
- [x] **Step 2 — formation.baml** (`6feaebc`): `DerivePalette` + `DeriveProportions`, every
  post-parse gate taught in the prompt. Bridge FNS map extended; TG5 covers formation.baml.
- [x] **Step 3 — src/baml/ask.mjs** (`9ab25ef`): `askParsed` — bounded same-prompt re-ask with
  the `classify` gate hook (gate failure = MALFORMED, T-114 semantics); 6 spawn-free tests.
- [x] **Step 4 — src/pack/formation.mjs + tests** (`8dfacde`): digests, the three stage gates,
  deterministic valueCheck stamping, idiom param seeding, draft assembly
  (`style-pack/draft-v1`), near-tone report, `comparePacks`, `draftReadme`,
  `deriveDraftFromStages` (the ONE stage→draft derivation runner + replay test share).
  16 unit tests incl. the real-table round-trip (draft → tag swap + stamp → passes
  assertStylePack + validateStylePack).
- [x] **Step 5 — runner + ratify + guards + wiring** (`69e230c`): `scripts/form-style.mjs`
  (live / offline / story-replay; preflightPins before any spend; per-stage mint-shape
  records), `scripts/ratify-pack.mjs`, `formation-guard.test.mjs` (FG1 no optical imports,
  FG2 no image input / `images:` args, FG3 no concept-evidence imports),
  `formation-replay.test.mjs` (skip-clean until drafts exist), npm `style:form`/`style:ratify`.
- [x] **Step 6 — LIVE rustic re-derivation** (`d679644`): brief at `rustic-brief.txt`
  (craft/place only — no block names). **First run REFUSED at the palette stage**: all 3
  re-asks starved on dangling zone half-seats (`tier:"preserve"` with `band:null`) — the
  same-prompt-seam lesson live. Fix: the gate ABSORBS half-seats (the assembler already
  dropped them), `danglingSeats` names them in the run ledger, the prompt now teaches the
  complete-seat rule, and the runner gained **idempotent stage resume** (an accepted on-disk
  stage with identical inputs + prompt sha is reused, never re-bought) — the resumed run
  reused the good stage-1 spend and accepted palette/proportions/decompose first-ask.
  `--offline` replay byte-identical. Comparison committed: 6 aligned (3 same-block:
  cobblestone / white_terracotta / bricks; 3 different incl. the chain reading the brief's
  roofing as thatch — hay_block vs curated spruce_planks), 7 missing / 7 extra (strict
  name-then-unambiguous-zone alignment; divergences NAMED, not fuzzily matched), pitch
  [2,1,0.5] vs curated [1].
- [x] **Step 7 — LIVE saltcrag, ratified** (`74ea65e`): stage 1 replayed from the committed
  T-129 vernacular fixture (spend-free, deterministic); stages 2–4 live, all first-ask,
  ZERO absorbed seats (the taught rule held). 17 roles with diegetic readings (tarred
  clinker boarding → dark_oak_planks; imported-slate ridge → deepslate_tiles; thatch/turf
  alternates → hay_block/moss_block), 11 owned idioms seeded, 4 new brush needs + 13 notes
  recorded. Ratified `--by "T-130-01 autonomous run (ticket-sanctioned; provisional pending
  human taste pass)"` per design D3; `packs/saltcrag.json` validates (2 warns = recorded
  family gaps on hay/moss, E-24 Rule 5). `--offline` byte-identical.
- [x] **Step 8 — evidence + closeout**: grep over the formation surface's IMPORT LINES
  (`formation.mjs`, `ask.mjs`, `form-style.mjs`, `ratify-pack.mjs`) matches no
  glb/trellis/texture/png/view/concept token; no `images:` at any formation bridge call
  site; formation.baml has no image-typed input — all three pinned executably by
  formation-guard.test.mjs (FG1–FG3), so the claim cannot rot. Transport: every live ask
  rode `claude -p` via sdk-binding `requestText` (stage ledgers record it; no metered key —
  TG2 pins). This file + review.md close the ticket.

## Live-spend ledger

9 strong-tier asks total, all pin-guarded, all ledgered with full raw texts:
rustic-rederived = 1 (vernacular) + 3 (palette, refused — committed honestly) + 1 (palette,
resumed run) + 1 (proportions) + 1 (decompose); saltcrag = 0 (replayed) + 1 + 1 + 1.
Budget anticipated ~7; the 2 extra are the refused palette attempts (their ledger is the
honest record, and they bought the absorption fix).

## Deviations from the plan

1. **Dangling-seat absorption** (step 6, the big one): classifyPalette no longer rejects a
   half-seat; `danglingSeats` reports them, the run ledger names them, the assembler drops
   them. Live-proven: refusal → fix → first-ask accepts on both subsequent runs.
2. **Idempotent stage resume in the runner** (not planned): render is free, only the ask is
   money — an accepted on-disk stage record with byte-identical inputs + prompt sha is
   reused. This is the refusal-recovery path; without it, step 6's retry would have re-bought
   stage 1.
3. **`classifyBacklog` reuses the factory's FX-D1 classifier** (`assertNonEmptyBacklog`,
   throw→verdict reshape) — one composition point; adds a `src/pack → src/factory` import the
   structure's boundary list did not name.
4. **`deriveDraftFromStages` added to formation.mjs**: the runner's offline replay AND
   formation-replay.test.mjs need the identical stages→draft derivation for "byte-identical"
   to be meaningful.
5. **`--slug` required in all modes**: preflightPins must declare every path BEFORE any
   spend; in live-brief mode the style name exists only after the first spend.
6. **Vocabulary digest curates the non-cube section** (`ARCH_NONCUBE_RE`): the survival
   vocabulary's 674 non-cubes are mostly flora/redstone; the digest lists architectural
   members only, and the digest's listed set IS the gate's legal set (prompt and gate cannot
   diverge).

## Noted for review

- **askParsed vs runAsyncReplyPolicy**: T-131 promoted `src/baml/reply-policy.mjs`
  (parse-final, no gate hook) in parallel with this ticket's `src/baml/ask.mjs` (adds the
  classify gate) — the parallel-roots failure mode. Formation needs the gate hook;
  consolidation is a cleanup ticket.

## Test state

`npm test` green at every commit; final: 1895 tests, 1895 pass, 0 skipped (the formation
replay pin now exercises both committed drafts — rustic-rederived and saltcrag).
