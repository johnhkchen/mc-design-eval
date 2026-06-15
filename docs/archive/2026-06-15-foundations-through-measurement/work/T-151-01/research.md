# T-151-01 Research — instrument-only-pin-guard

Story S-151 / Epic E-36 ("defreeze the creation loop"). Descriptive map of the pin-guard, its
call sites, and the instrument-vs-draft boundary. No solutions here.

## The defect (live proof, 2026-06-14)

`npm run generated:barn` (even `--skip-gate`, judge-free) was **refused** on
`generated/barn/{base-artifact,component-plan,grammar-artifact,artifact}.json`. The guard refused
the *improved* barn purely because its bytes differ from the committed Jun-11 one. Cause: the guard
equates "is a pin" with "is git-tracked," so a **draft build artifact becomes frozen infrastructure
the moment it is committed** — the exact wound `pipeline-philosophy.md` cross-cutting rule #1 warns
of ("pinned first drafts became infrastructure"). Secondary harm: the refusal got swallowed into a
failure-record write inside a catch block, masking the real (benign) chain behavior.

## The module: `src/form/pin-guard.mjs` (153 lines)

Pure/IO split (project idiom):

- **Pure core (unit-tested in `pin-guard.test.mjs`):**
  - `decidePinWrite({ tracked, exists, currentContent, nextContent, rotate })` → `{ action:
    "write" | "skip-identical" | "refuse", reason }`. The whole decision matrix. `tracked` is the
    sole "is this frozen" signal today.
  - `refusalMessage({ rel, reason, intent })` → one human line (names pin, reason, `--rotate-pins`,
    policy doc).
  - `preflightPins({ pins, rotate, intent, domain })` — BEFORE-SPEND gate. `pins` is
    `[{ rel, tracked }]`. Throws `PinGuardError` if any `tracked` pin is targeted without `rotate`
    (and, separately, if any `domain:"workshop"` write hits a gate-record namespace). Returns
    `{ refused, rotating }` otherwise.
  - `domainRefusal(domain, rel)` + `GATE_RECORD_NAMESPACES` (`["benchmarks/sculpture/multi-angle/"]`)
    — the judge-isolation boundary (T-126-01). **Orthogonal to this ticket; leave untouched.**
- **Thin IO (fail-closed):**
  - `loadTrackedSet(root)` — one cached `git ls-files -z`; null on git failure.
  - `isTracked(trackedSet, rel)` — null set ⇒ everything tracked (fail closed).
  - `guardedWriteRecord({ root, rel, content, rotate, sanction, trackedSet, domain })` — drop-in
    for record `writeFile`s. Computes `tracked = isTracked(set, rel)`, reads current bytes, calls
    `decidePinWrite`, throws on refuse, writes otherwise.

`PinGuardError` carries `.pins = [{ rel, reason }]`. Scope note in the header: only `.json`/`.md`
records route here; PNGs never do (GL bytes are evidence, not pins — E-24/E-28).

## The "tracked = pin" equation (where it lives)

- `decidePinWrite`: `if (!tracked) return { action: "write", reason: "unpinned (not git-tracked)" }`.
- `guardedWriteRecord`: `const tracked = isTracked(set, rel)`.
- `preflightPins`: `const committed = pins.filter((p) => p.tracked).map((p) => p.rel)`.

All three read git-tracked status as the freeze signal. **This is the single equation the ticket
replaces.**

## Call sites (≈22 runners, all under `benchmarks/sculpture/` + `scripts/`)

Every pin-writing runner imports the guard. Two idioms:

1. **`guardedWriteRecord` per record** — kit-extract, zone-map, multi-angle-gate, styled-milestone,
   challenge-milestone, generated-milestone, reconstructed-milestone, component-skin, durable-skin,
   registration-smoke, glb-smoke, plus workshop/measured/proportion/facade/relief/budget/ruler/
   steep-pitch witnesses and `scripts/{ratify-pack,form-style,factory-receipts,design-backlog,
   mint-baml-fixture}.mjs`.
2. **`preflightPins` before spend** — the live runners (kit-extract before `callModel`,
   multi-angle-gate before `judgeThroughPolicy`, etc.) declare every record they will write so the
   refusal lands before metered spend.

Crucially, **callers pass `tracked: isTracked(trackedSet, rel)`** into `preflightPins`, and
`guardedWriteRecord` computes `tracked` internally. So narrowing the freeze entirely *inside*
pin-guard.mjs needs **zero caller edits** (surgical — E-36 Rule 2).

## The masked-error catch block — `generated-milestone.mjs:534-545`

```
} catch (e) {
  const record = { ...status:"pipeline-failed", error: e.message... };
  await writeRec(recPath, JSON.stringify(record...));        // recPath = generated/<key>.json
  await writeRec(join(OUT_DIR, `${key}.md`), renderMd(record));
  console.error(`[${key}] PIPELINE FAILED at ${track.stage}: ${e.message}`);
  process.exitCode = 1; return;
}
```
`writeRec` is `guardedWriteRecord(..., rotate: ROTATE)`. If `generated/<key>.json` is a frozen pin,
`writeRec` **throws before** the `PIPELINE FAILED` log — so the real cause `e` is never printed and
a confusing pin error propagates instead. Two bugs compound: (1) the draft is frozen; (2) the catch
masks the original error.

## The instrument boundary (E-36 dividing line)

> Frozen once **MEASURED** — subject of, or input to, a committed verdict / baseline / ratified
> pack. Draft until then.

**Must stay frozen (AC3, regression-tested):**
- `benchmarks/sculpture/multi-angle/*` — judge verdict records (the measurement).
- ratified packs of record — `packs/*.json` (NOT `packs/drafts/**`; `ratify-pack.mjs` writes
  `packs/<style>.json`; drafts are structurally not packs).
- committed baselines/milestones — `pattern-book/{facade,proportion}-baselines.json`,
  `{facade,proportion}-milestone.json`, and the `-baseline(s)/-milestone` naming convention generally.
- `benchmarks/sculpture/retired-pins.json` — the rotation registry.

**Becomes free / draft (AC2):**
- `generated/*` (incl. `generated/<key>/{base,grammar,artifact,component-plan}.json` and the
  `generated/<key>.json` milestone record).
- `workshop/*` ledgers + final-artifacts not yet the subject of a committed verdict.
- `recognition/*` programs; chain intermediates; styled/challenge/reconstructed build records;
  zone-map (deterministic derivation); component-skin/durable-skin build records.

**Honesty-clause case (E-36 line 124):** the ratified **kit** (`benchmarks/sculpture/kit/*`) is the
building-block vocabulary — an **input-of-record** to every committed styled/challenge/generated
verdict, and load-bearing for reproducibility-by-replay (Rule 3). The founding T-119 incident (the
swallowed-`--` kit sweep — `pin-guard.test.mjs` fixture C1) is exactly a kit overwrite. Per the
epic's "add with the reason recorded, case by case" clause, the kit stays frozen. The Design phase
will justify and record this. (Drafts named by subject — `barn.json`, `artifact.json` — never match
the baseline/milestone naming, so suffix-matching is collision-free.)

## Tests that constrain the change

- `pin-guard.test.mjs` — matrix A1-A6 (`decidePinWrite`), B1 (message), C1-C4 (preflight incl. the
  kit-sweep regression fixture, all `tracked:true`), D (guardedWriteRecord on tmpdir pin), E
  (tracked-set IO), F (domain isolation). Group C **stays green only if kit remains an instrument**.
- `pin-guard.conformance.test.mjs` — pin-writers import the guard; raw writes banned; preflight
  before spend. Domain/structure-level; unaffected by the freeze-narrowing.
- `src/workshop/isolation.test.mjs` — ISO3 domain refusal; unaffected.

## Policy doc

`docs/knowledge/pin-rotation-policy.md` §1 currently *defines* a pin as "any git-tracked .json/.md
record under the runner output families (kit/, zone-map/, multi-angle/, styled/, challenge/,
generated/, reconstructed/, component-skin/, durable-skin/, pr/assets)." This is the prose form of
the equation being replaced and must be rewritten to the instrument allowlist — "one named,
documented place" (AC1).

## Constraints / assumptions

- Surgical: narrow the freeze, never remove it (E-36 Rule 1). No new ceremony (Rule 2). Instrument
  contract + judge isolation untouched (Rule 3).
- `npm test` must stay green; the byte-identical / fail-closed / first-derivation behaviors of
  `decidePinWrite` are unchanged — only the *input* to "is frozen" changes (instrument ∩ tracked).
- GL/render concerns belong to S-152, gate-semantics to S-153; out of scope here.
</content>
</invoke>
