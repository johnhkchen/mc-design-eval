# T-114-01 — judge-reply-robustness — Research

Phase: Research (descriptive only). What exists at the judge seam, where the unparsed-reply REFUSAL
came from, and which constraints bound any fix.

## 1. The incident, precisely

`benchmarks/sculpture/multi-angle/church-challenge.json` (schema `multi-angle-gate/v1`, subject
`church`, label `challenge`, artifact `challenge/church/artifact.json` sha-pinned
`0d5db5ac29f2…`) records four views:

| view | azimuth | outcome | judge output_tokens |
|---|---|---|---|
| `+x+z` | 45° | drifted (3 gaps, parsed) | 529 |
| `+x-z` | 135° | drifted (3 gaps, parsed) | 592 |
| `-x-z` | 225° | **unparsed** | **226** |
| `-x+z` | 315° | drifted (2 gaps, parsed) | 717 |

The 225° `rawReply` is a ` ```json `-fenced object that ends mid-string inside `gaps[2].attribute` —
`parseError: response is not JSON (Expected ',' or '}' after property value … position 430)`. The
output-token count (226 vs 529–717 for siblings) confirms a **truncated reply**, i.e. a transport /
generation-length hiccup, not a judgement the parser rejected on contract grounds. (Its visible
prefix reads "different object" with major gaps — it would not have flipped the failing challenge
verdict — but it is malformed, so under the current model it is *nothing*.)

`aggregate` → `{decided:false, refusal:"unparsed:-x-z"}`; `overall` (kit-aware compose) inherits the
refusal. `kitPresence` ran and failed independently (`missing: polished_basalt frame @ 169/544`).

## 2. The seam, file by file

### 2a. The impure runner — `benchmarks/sculpture/multi-angle-gate.mjs`

The only live caller of the multi-angle judge. Per surviving view (coverage-passed), lines 383–404:

1. `requestTextWithImage({ prompt: buildMultiAngleViewPrompt(a, az), images:[triptych], model: PHASE1_MODEL_ID })` — **one call, no retry of any kind**;
2. `view.judge = { model, usage }` from `raw.usage`;
3. `try { view.verdict = parseMultiAngleVerdict(text) } catch { view.unparsed = true; view.parseError; view.rawReply = text.slice(0,400) }`.

So a malformed reply and a parsed verdict are *already distinct states on the view record*
(`verdict` vs `unparsed/parseError/rawReply`) — but the runner makes exactly one attempt, and the
distinction collapses to REFUSAL downstream. There is no ledger: only the first 400 chars of the
single failed reply survive.

Other relevant runner behavior:

- `--offline` (lines 200–229): re-asserts a committed record — schema tag, frozen contract echo,
  view count, T-088 short-circuit invariant, aggregate well-formedness (`decided XOR refusal`),
  sheet presence, kit-aware compose consistency. **Additive precedent**: the T-100 `kitAware` check
  is guarded by `!rec.kitPresence ||` so pre-T-100 records stay valid.
- Header contract (E-25 Rule 4): "this runner has NO flag that drops an angle, changes the
  elevation, or lowers the resolution". Any new flag must not touch the lens/threshold contract.
- Exit codes: 0 PASS · 1 FAIL · 2 REFUSAL. Record + `.md` + contact sheet are committed; per-view
  PNGs are gitignored (renders are *not* reproducible byte-for-byte — GL is excluded from
  decisions; coverage is censused from artifact occupancy, which IS deterministic).
- The record carries `zones` (derivation + shipped-palette policy + T-113 vocabulary lineage),
  `views[]`, `aggregate`, `kitPresence`, `overall`, `sheet`.

### 2b. The pure core — `src/form/multi-angle-gate.mjs`

- `buildMultiAngleViewPrompt(angle, azimuth)` — the FIXED v2 prompt (Rule 5, never tuned per run).
- `parseMultiAngleVerdict(text)` — parse + full contract validation (frozen verdict vocabulary,
  gap attrs/severities, MAX_GAPS_PER_VIEW=3, severity-integrity cross-checks). **Throws precise
  errors**; never guesses. Uses `stripToJson` (from `src/sdk-binding.mjs`) so fences/prose-wrap are
  already tolerated — the 225° reply failed *despite* stripping because the JSON itself is cut off.
- `aggregateMultiAngle(views)` — REFUSE on `missing-view` / `unparsed:<angle>` /
  `missing-verdict`; else DECIDE. The runner feeds it the projection
  `{angle, rendered, coverage, verdict, unparsed}`.
- `viewOutcomeLabel(view)` — sheet captions, has an `"unparsed"` arm.
- Schema tags `multi-angle-verdict/v1`, `multi-angle-gate/v1`.

Unit suite `src/form/multi-angle-gate.test.mjs` (217 lines, `node:test` + `assert/strict`): parser
valid/violation cases, aggregate pass/fail/refusal matrix, caption totality, sheet composer. The
unparsed→REFUSAL behavior is pinned by an existing test ("never a guessed verdict").

### 2c. The transport — `src/sdk-binding.mjs`

`requestTextWithImage({prompt, images, model, effort, system, onMessage})` → spawns
`claude -p --output-format stream-json --input-format stream-json`, returns `{text, raw}`. No
retry. **Contrast**: the *artifact* paths (`requestDesignArtifact`,
`requestDesignArtifactWithImage`) DO loop `retries=2` on validation failure — but they **mutate the
prompt** with a stern corrective ("your previous reply was NOT a valid JSON artifact…"). That
pattern is exactly what the ticket forbids at the judge seam ("same prompt … no prompt mutation"):
a corrective addendum changes the judging instrument. So the existing retry machinery is a
precedent for *bounding*, not a reusable mechanism.

`textOf()` throws on `subtype !== "success"` — a transport-level failure surfaces as a thrown
error from `requestTextWithImage` itself (distinct from a malformed *text*); today that would
escape the per-view try/catch (only `parseMultiAngleVerdict` is inside it) and kill the whole run
via `main().catch` → exit 2.

### 2d. Configuration

`src/config.mjs` — `MULTI_ANGLE_GATE = {azimuths:[+x+z,+x-z,-x-z,-x+z], gapBudget:2}` frozen;
`PHASE1_MODEL_ID` pins the judge model (record shows `claude-opus-4-8`). No retry/attempt constant
exists anywhere in config.

## 3. Consumers of the gate record / seam

- `challenge-milestone.mjs` and `styled-milestone.mjs` **spawn the gate via its own CLI**
  (`spawnGate` → `node multi-angle-gate.mjs --subject … --label … --artifact …`) "so its frozen
  contract" stays out of reach; they read back the committed record and check
  `MULTI_ANGLE_GATE_SCHEMA`. They consume `aggregate`/`overall`, not per-view internals.
- `reconstructed-milestone.mjs` spawns the milestone runners (one more level up).
- `kit-presence.mjs` composes with the aggregate via `composeKitAwareVerdict` (pure; refusal
  passes through).
- The `--offline` self-check (2a) is the only code that re-validates committed record *shape*.
- `npm test` = artifact self-tests + `node --test "src/**/*.mjs"` — benchmarks are not in the test
  glob; only the pure core is unit-covered.

Sibling seam (out of this ticket's scope but same shape): `benchmarks/sculpture/resemblance.mjs`
also calls `requestTextWithImage` once and parses once (E-22 single-view gate). The ticket names
only the multi-angle seam ("the judge seam the closure milestone is using").

## 4. Constraints the ticket pins (and where they bind)

1. **No re-roll of parsed verdicts** — the no-re-roll rule is currently *procedural* (the runner
   just doesn't retry); the ticket wants it *structural*: a parsed verdict must short-circuit any
   re-ask path by construction, unit-proven.
2. **Re-ask only on malformed, bounded, declared limit** — needs a home for the constant (config or
   pure module) and a pure, synthetic-testable policy (recovers on attempt 2; exhausts to REFUSAL).
3. **Every reply committed** — `replies[]` ledger with parse status per attempt; today only a
   single 400-char `rawReply` is kept, and only on failure.
4. **Byte-identical prompt + model across attempts** — rules out the sdk-binding corrective-retry
   pattern; the re-ask is a *transport* retry, not a prompt revision.
5. **The church 225° re-judge** must run behind a named `npm run`, touch only the one unparsed
   view, leave every parsed verdict everywhere byte-untouched, and instrument-diff to "only the new
   `replies[]` ledger" (plus what honestly follows: that view's verdict and the recomputed
   aggregate/overall). Re-rendering is required for the triptych/sheet (PNGs gitignored) and is
   verdict-neutral; coverage is deterministic from the committed artifact (sha-pinned in the
   record, so drift is detectable before judging).
6. **`npm test` green; no threshold/azimuth/contract change** — the offline checks must stay valid
   for existing committed records (no `replies[]`) — the T-100 additive-guard precedent applies.

## 5. Assumptions surfaced

- The committed 225° malformed reply is itself attempt #1 of the audit trail for the re-judge; the
  record retains it (`parseError`/`rawReply`) so a re-judge can seed its ledger honestly.
- Re-judging 225° will almost certainly yield a *decided FAIL* for church-challenge (the three
  parsed views are all "drifted") — the deliverable is an honest decided aggregate, not a pass.
- Transport *throws* (CLI failure, `subtype:"error"`) vs malformed *text* are today different
  failure shapes (process-fatal vs unparsed); the ticket's "malformed" language covers the reply
  states; whether a thrown transport error counts as a malformed attempt is a Design decision.
- `multi-angle-gate/v1` record schema can absorb `replies[]` additively (offline checks are
  guarded, milestone consumers read only aggregate/overall/schema tag).
