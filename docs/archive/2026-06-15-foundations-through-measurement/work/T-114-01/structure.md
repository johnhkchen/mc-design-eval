# T-114-01 — judge-reply-robustness — Structure

File-level blueprint. Two pure additions, one runner extension, one npm script, one re-judged
committed record. No file deletions; no existing pure export changes.

## 1. NEW `src/form/judge-reply.mjs` — the reply policy (pure)

Judge-generic (parser-parameterized); no I/O, no network, no gate-record knowledge. Exports:

```js
export const MAX_REPLY_ATTEMPTS = 3;   // 1 initial ask + 2 bounded re-asks (the declared limit)
export const RAW_REPLY_CLIP = 400;     // ledger keeps the first 400 chars of every reply

/** {parsed:true, verdict} | {parsed:false, error} — a verdict is FINAL; malformed is a state. */
export function classifyReply(text, parse)

/** "final" | "refuse" | "ask" — pure state machine over the ledger.
 *  "final"  ⇔ ANY entry parsed (no re-roll by construction — never "ask" past a verdict)
 *  "refuse" ⇔ length ≥ maxAttempts (exhausted, all malformed)
 *  throws on a malformed ledger (caller bug). */
export function nextAction(replies, { maxAttempts = MAX_REPLY_ATTEMPTS } = {})

/** The driver. `ask: async () => ({text, usage})` — the SAME thunk every attempt (prompt/model
 *  are closed over once ⇒ byte-identical by construction). `seed`: pre-existing attempts
 *  (the re-judge mode enters the committed malformed reply as attempt 1). A thrown ask is a
 *  malformed attempt {transport:true}, not a crash.
 *  → { verdict: object|null, replies: Entry[], askCount: number } */
export async function runReplyPolicy(ask, { parse, maxAttempts, seed = [] } = {})
```

Ledger `Entry`: `{ attempt /*1-based, seed included*/, parsed: boolean,
rawReply: string|null /*clipped*/, parseError?: string, transport?: true,
usage: object|null, source: "committed"|"live" }`. The driver renumbers `attempt` sequentially
across seed+live and stamps `source`; the parsed verdict object is **returned**, not embedded in
the ledger (the view's `verdict` field keeps its existing meaning and shape).

## 2. NEW `src/form/judge-reply.test.mjs` — unit suite (node:test, offline)

Synthetic thunks only; one realism case uses the real `parseMultiAngleVerdict` (pure import).
Cases (≈ the AC list):

- `classifyReply`: valid → `{parsed:true}`; truncated-JSON / prose / empty → `{parsed:false}` with
  the parser's message.
- `nextAction`: `[]`→ask; `[bad]`→ask; `[bad,bad,bad]`→refuse; a parsed entry anywhere →
  **final for every maxAttempts** (the structural no-re-roll proof); malformed ledger throws.
- `runReplyPolicy` recovers on attempt 2: replies `[{parsed:false},{parsed:true}]`, verdict
  returned, `askCount === 2`.
- exhausts: 3 malformed → `verdict === null`, 3 ledger entries, all `parsed:false` (the runner
  maps this to `unparsed` ⇒ existing aggregate REFUSAL test covers the rest).
- parsed short-circuit: first ask valid → `askCount === 1` even with `maxAttempts: 3`.
- **seeded parsed ⇒ zero asks** ("the policy cannot be invoked on a parsed reply").
- seeded malformed counts toward the bound: 1 seed + all-malformed asks → exactly 2 live asks.
- transport throw → entry `{parsed:false, transport:true}`; recovery on the next attempt works.
- `rawReply` clipped to `RAW_REPLY_CLIP`.

## 3. MODIFIED `src/form/multi-angle-gate.mjs` — one added export, nothing changed

```js
/** Instrument-diff between two gate records: returns the paths that differ among the fields the
 *  re-judge may NOT touch — schema/subject/label/artifact/contract/zones/kitPresence, and, per
 *  view: the ENTIRE view object when `before` had a parsed verdict; angle/azimuthDeg/rendered/
 *  coverage when it did not (verdict/replies/judge/unparsed may change only there). */
export function gateInstrumentDiff(before, after)
```

Deep-equality via `JSON.stringify` per path (record values are plain JSON). Prompt, parser,
aggregate, captions, schema tags: byte-untouched.

## 4. MODIFIED `src/form/multi-angle-gate.test.mjs` — `gateInstrumentDiff` cases

Identical records → `[]`; unparsed view gaining `verdict`+`replies` → `[]` (the allowed change);
mutated parsed-view verdict → `["views[+x+z]"]`; mutated coverage on the unparsed view → flagged;
mutated contract / zones / kitPresence / artifact.sha256 → each flagged by name.

## 5. MODIFIED `benchmarks/sculpture/multi-angle-gate.mjs` — wiring + the re-judge mode

**Header**: document the reply policy (bounded re-ask on malformed only, ledger committed) and the
`--rejudge` mode, with the explicit note that Rule 4 stands — the mode completes I/O on a committed
record; it has no lens/threshold/angle parameters.

**Imports**: `runReplyPolicy`, `MAX_REPLY_ATTEMPTS` from `src/form/judge-reply.mjs`;
`gateInstrumentDiff` joins the existing pure-core import.

**Live judging block** (replaces the single call+parse, lines ~383–404):

```js
const ask = async () => {
  const { text, raw } = await requestTextWithImage({ prompt, images, model: PHASE1_MODEL_ID });
  return { text, usage: raw?.usage ? { input_tokens, output_tokens, cost_usd } : null };
};
const { verdict, replies } = await runReplyPolicy(ask, { parse: parseMultiAngleVerdict });
view.replies = replies;
view.judge = { model: PHASE1_MODEL_ID, usage: replies.at(-1).usage };
if (verdict) view.verdict = verdict;
else { view.unparsed = true; view.parseError = …last; view.rawReply = …last; }  // shape unchanged
```

Per-attempt stderr log: `UNPARSED attempt k/3 — <err> — re-asking (same prompt, same model)`.
`view.unparsed` now means "exhausted the bound", so downstream (aggregate REFUSAL, captions,
offline short-circuit check) is untouched.

**`--offline` additions** (guarded, additive — T-100 precedent):

- `replies`: for every view carrying `replies[]` — well-formed entries, `1 ≤ length ≤
  MAX_REPLY_ATTEMPTS`, a `parsed:true` entry only in last position (the committed no-re-roll
  invariant), and `!!view.verdict === replies.at(-1).parsed`.
- `rejudge`: when `record.rejudge` exists — `instrumentDiff` is `[]`, `angles` non-empty.

**`--rejudge` mode** (new branch in `main()` after arg parsing, before the live path; the
`--offline` branch stays first):

1. Load committed `<subj>-<label>.json` → `before`; absent ⇒ throw.
2. sha256 of the artifact at `before.artifact.path` must equal `before.artifact.sha256` ⇒ else
   throw (pre-metered pin check). Assert `before.contract.azimuths` equals config (tripwire).
3. `targets = before.views.filter(v => v.unparsed && !v.verdict)`; empty ⇒ **throw** ("no unparsed
   view — re-judging parsed verdicts is impossible by construction").
4. Render all four views (sheet + triptych need pixels; decision-bearing fields are copied, never
   recomputed — no `deriveZones`, no coverage census, no kitPresence run).
5. Per target: compose triptych (concept | mesh-or-placeholder | view), write `judged-*.png`,
   `seed = [{parsed:false, parseError, rawReply, usage: judge?.usage ?? null}]`, run the policy
   with the same fixed prompt + pinned model.
6. Build `after`: spliced views; `aggregate = aggregateMultiAngle(...)`;
   `overall = composeKitAwareVerdict(aggregate, before.kitPresence)`;
   `rejudge = { angles: targets.map(t => t.angle), seeded: true, instrumentDiff }`.
7. `instrumentDiff = gateInstrumentDiff(before, after)`; non-empty ⇒ throw **without writing**.
8. Regenerate sheet (labels via `viewOutcomeLabel`) + md (`recordMd` gains a short "Re-judge
   (T-114)" section when `record.rejudge` is present); write record; exit code from `overall`
   (0/1/2) exactly as the live path.

## 6. MODIFIED `package.json`

```json
"gate:rejudge": "node benchmarks/sculpture/multi-angle-gate.mjs --rejudge"
```

Invocation for the AC: `npm run gate:rejudge -- --subject church --label challenge`.

## 7. Regenerated committed artifacts (the church AC)

- `benchmarks/sculpture/multi-angle/church-challenge.json` — 225° view gains `replies[]` (seeded
  committed attempt + live attempts) and, on recovery, its verdict; `aggregate`/`overall` become
  decided; `rejudge` lineage block added; everything else byte-equal.
- `benchmarks/sculpture/multi-angle/church-challenge.md` + `…-sheet.png` +
  `pr/assets/frames/multi-angle-church-challenge.png` — regenerated.

## 8. Change ordering (matters)

1. Pure policy module + tests (standalone, committable).
2. `gateInstrumentDiff` + tests (standalone, committable).
3. Runner: live-path wiring + offline additions + header (offline re-assert of existing committed
   records must stay green — they predate `replies[]`).
4. `--rejudge` mode + npm script.
5. The live church re-judge run; commit the record artifacts.

Boundaries: the pure module never imports the runner or sdk-binding; the runner remains the only
metered caller; `gateInstrumentDiff` is the only gate-core addition and reads records, never the
network.
