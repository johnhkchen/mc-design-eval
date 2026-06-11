# T-114-01 — judge-reply-robustness — Design

Goal restated: make "malformed reply" a state structurally distinct from "verdict" at the
multi-angle judge seam; bound re-asks to malformed replies only (same prompt, same model, no
mutation); commit every reply as a ledger; prove no-re-roll by construction; re-judge the church
225° unparsed view behind a named `npm run` without touching any parsed verdict.

## 1. Options considered

### A. Transport-level retry inside `requestTextWithImage` (sdk-binding)

Add a `retries` param to the shared shim, mirroring `requestDesignArtifact`. **Rejected.**
(a) The shim is shared by ~8 callers (detector-routing, hollow-cottage, kit-extract,
surface-coherence, temple-facade…) — silently changing call semantics for all of them is a
broad-blast change this ticket doesn't license. (b) The actual incident is a reply that *returned
successfully* but was truncated JSON — parsing happens *outside* the transport, so a transport
retry would never have fired. (c) The artifact-path precedent mutates the prompt on retry, which
the AC explicitly forbids; a half-reused pattern invites the wrong copy.

### B. Bake the re-ask loop into the gate's pure core (`src/form/multi-angle-gate.mjs`)

Keep one module. **Rejected as the home for the policy** (accepted for one helper, §3.4): the AC
demands the prompt and parser be *byte-identical* — easiest to demonstrate when the instrument
module's existing exports don't change at all. The reply policy is also judge-generic (the E-22
resemblance seam has the same single-parse shape and can adopt it later); parameterizing it by a
parse function costs nothing now.

### C. A new pure policy module + runner wiring + a re-judge mode on the existing runner — CHOSEN

- **`src/form/judge-reply.mjs`** (new, pure, unit-tested): reply classification, the bounded
  re-ask state machine, and the policy driver (I/O injected as a thunk — testable with synthetic
  replies, no network).
- **`benchmarks/sculpture/multi-angle-gate.mjs`**: live path swaps its single call+parse for the
  policy driver; new `--rejudge` mode re-judges *only* unparsed views of a committed record.
- **`package.json`**: `"gate:rejudge"` — the named npm run.
- Record schema stays `multi-angle-gate/v1`; `replies[]` is additive (T-100 `kitAware` precedent:
  offline checks guard on field presence so old records stay valid).

### D. Full gate re-run for the church AC (`gate:multi --subject church --label challenge`)

**Rejected**: it would re-call the judge on the three parsed "drifted" views — exactly the verdict
re-roll the ticket makes impossible. The re-judge must operate on the committed record and touch
only the unparsed view.

### E. A standalone re-judge runner script

**Rejected**: the triptych/sheet plumbing (registry, renders, mesh silhouette, panel math, label
drawing, record/md writers) all lives in the gate runner; a second file either duplicates it or
forces a large export surface. A mode flag reuses everything and keeps one CLI owner of the record
format. The runner's E-25 Rule 4 header ("no flag changes the lens") is not violated — `--rejudge`
changes *which committed record gets its I/O completed*, not azimuths/elevation/resolution/
thresholds; the header gains a sentence saying exactly that.

## 2. The policy — semantics

**States.** `classifyReply(text, parse)` → `{parsed:true, verdict}` | `{parsed:false, error}`.
A reply that parses **is final** — whatever it says. A reply that throws from the parser (schema
violation, truncation, prose, empty) is **malformed** — a distinct state that never becomes a
verdict and never enters the aggregate as one.

**Transport throws count as malformed attempts.** If the ask thunk itself throws (CLI failure,
`subtype:"error"`), the attempt is recorded `{parsed:false, error:"transport: …", transport:true}`
and the loop continues. Rationale: the ticket's motivation is "one transport/format hiccup" —
both shapes are I/O failures, neither is a verdict, and both must be bounded and audited. (Today a
transport throw escapes the per-view try/catch and kills the whole run; under the policy it
degrades to an honest per-view REFUSAL after the bound.)

**The bound.** `MAX_REPLY_ATTEMPTS = 3` declared in the policy module: one initial ask plus **2**
bounded re-asks (the AC's "declared limit, e.g. 2"). Exhaustion ⇒ the view stays unparsed ⇒
`aggregateMultiAngle` refuses, exactly as today.

**No re-roll by construction.** The decision function is pure:

```
nextAction(replies, {maxAttempts}) →
  "final"  if any reply has parsed:true     // a parsed verdict ends the matter, permanently
  "refuse" if replies.length >= maxAttempts // exhausted: all malformed
  "ask"    otherwise                        // only reachable when every prior reply is malformed
```

The driver `runReplyPolicy(ask, {parse, maxAttempts, seed})` loops *only* while `nextAction`
returns `"ask"`. There is no API that accepts a parsed verdict and produces another ask: the proof
tests are (a) `nextAction` on any ledger containing a parsed reply returns `"final"` for every
`maxAttempts`, (b) the driver with a first-ask-parses thunk performs exactly one ask, (c) the
driver with a `seed` ledger whose entry is parsed performs **zero** asks. That is the AC's "the
policy cannot be invoked on a parsed reply" made structural.

**Same instrument across attempts.** The driver re-invokes the *same* thunk — the thunk closes
over `buildMultiAngleViewPrompt(a, az)` and `PHASE1_MODEL_ID` once, so prompt and model are
byte-identical by construction (no corrective addendum, unlike the sdk-binding artifact retries).

**The ledger.** Every attempt — parsed or malformed — is recorded:
`{attempt, parsed, rawReply (first 400 chars), parseError?, transport?, usage?, source?}`.
`seed` lets the re-judge mode enter the committed 225° malformed reply as attempt 1
(`source:"committed"`), so the bound spans the view's *whole* history and the audit trail is one
list. Live-path entries carry per-attempt `usage` (the current single `judge.usage` keeps its
meaning: the final attempt's usage).

## 3. The re-judge mode — semantics

`npm run gate:rejudge -- --subject church --label challenge` (script:
`node benchmarks/sculpture/multi-angle-gate.mjs --rejudge`). Flow:

1. **Load the committed record** for `<subject>-<label>`; hard error if absent.
2. **Pin check**: recompute the artifact file's sha256; mismatch with `record.artifact.sha256` ⇒
   refuse before any metered call (a changed build would be a different judgement, not a re-ask).
3. **Select views**: exactly those with `unparsed === true` (no verdict). **None ⇒ hard error** —
   invoking the re-judge on a fully-parsed record is the re-roll pressure the ticket exists to
   kill; the runner refuses it the same way the pure policy does.
4. **No re-derivation**: zones, coverage, kitPresence, contract are **copied** from the committed
   record, not recomputed. They are deterministic outputs of the original committed inputs; this is
   what makes "instrument-diff shows only the new `replies[]`" true by construction (recomputing
   zones through post-T-113 code could legitimately differ — and would poison the diff).
5. **Render** all four views (panels for the regenerated sheet + the triptych for the re-judged
   view). Renders are verdict-neutral and gitignored; GL nondeterminism is acceptable here exactly
   because nothing decision-bearing is recomputed from pixels (reproducibility memory: GL is
   excluded from decisions).
6. **Run the policy** on the unparsed view with the ledger seeded from the committed
   `parseError`/`rawReply`/`judge.usage` (attempt 1) — leaving 2 live attempts within the bound.
7. **Splice**: the view gains `replies[]` and (on recovery) `verdict` + refreshed `judge`;
   `unparsed`/`parseError`/`rawReply` removed on recovery, kept on exhaustion. All other views:
   byte-identical copies.
8. **Recompute the pure tail**: `aggregate = aggregateMultiAngle(views)`,
   `overall = composeKitAwareVerdict(aggregate, record.kitPresence)`. Sheet + md regenerated;
   record written; exit code per `overall` as usual.
9. **Instrument tripwire**: `gateInstrumentDiff(before, after)` (pure, §3.4) asserts the
   instrument set — contract, zones, artifact pin, kitPresence, every previously-parsed view's
   verdict — is deep-equal, and the result (`[]`) is recorded under
   `record.rejudge = {angles, seeded:true, instrumentDiff:[]}` as the committed proof.

### 3.4 One pure helper in the gate core

`gateInstrumentDiff(before, after)` lives in `src/form/multi-angle-gate.mjs` (it owns the record
shape/schema tag). It compares only the instrument fields and returns the list of paths that
differ. Existing exports (prompt/parser/aggregate/captions) are untouched — `git diff` on the
module will show pure addition, which is the cheapest demonstration that the judge contract is
byte-identical.

## 4. Expected church outcome (honesty check)

The three parsed views are all "drifted (major)". Recovering 225° therefore yields a **decided
FAIL** (resemblance) ∧ kitPresence FAIL → overall decided FAIL — replacing the REFUSAL with an
honest decision. The deliverable is the decided aggregate + the ledger, not a pass; the milestone's
open seam (`unparsed:-x-z`) closes without bending any rule.

## 5. Offline-mode extension (additive)

`--offline` gains a guarded `replies` check (precedent: `kitAware`): when a view carries
`replies[]` — entries well-formed, `length ≤ MAX_REPLY_ATTEMPTS`, **no entry after a parsed one**
(the no-re-roll invariant, auditable on the committed artifact), `verdict` present ⇔ last entry
parsed; when `record.rejudge` present — `instrumentDiff` empty. Records without these fields
remain valid unchanged.

## 6. What is explicitly not done

- No change to `parseMultiAngleVerdict`, the v2 prompt, `aggregateMultiAngle`, thresholds,
  azimuths, or `PHASE1_MODEL_ID` (AC: I/O handling only).
- No retry semantics added to `sdk-binding` (option A's blast radius).
- The E-22 resemblance seam keeps its single-parse shape (same disease, separate ticket if wanted
  — the policy module is deliberately parser-parameterized so adoption is mechanical).
- No schema version bump: `multi-angle-gate/v1` + additive fields + guarded offline checks.
