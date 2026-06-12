# T-142-01 Structure — witness-pin-policy

File-level blueprint. Two new source files (the pure cage + its test), two runner edits, one runner
edit for the seed pin, and the data rotations. No judge code, no gate-namespace writes.

## NEW — `src/form/witness-repro.mjs` (pure, ~60 lines)

The shared SKIP-vs-FAIL decision core. Pure (no IO/Date/random) → runs under `src/**/*.test.mjs`.

```
export const WITNESS_REPRO_VERDICT = Object.freeze({ GREEN: "green", SKIP: "skip", FAIL: "fail" });

// A registry entry certifies ONE retirement of ONE slug's source.
//   { slug, retiredSourceSha, ticket, reason }
export function retiredEntry(slug, registry)        // → entry | null  (lookup by slug)

export function classifyWitnessRepro({ pinnedSourceSha, currentSourceSha, retired, derivedMatches })
  // currentSourceSha === null            → retired ? SKIP : FAIL("source missing")
  // currentSourceSha === pinnedSourceSha → derivedMatches ? GREEN : FAIL("corrupted — source same, output differs")
  // changed & retired.retiredSourceSha===pinnedSourceSha → SKIP(`retired by ${ticket}: ${reason}`)
  // changed & otherwise                  → FAIL("unregistered source change — investigate")
  // → { verdict, reason }
```

Design notes baked in: keying the SKIP on `retired.retiredSourceSha === pinnedSourceSha` means the
registry certifies a *specific* retired version — a *further* unregistered change still FAILs (the
registry is not a blanket "this slug may drift").

## NEW — `src/form/witness-repro.test.mjs` (~70 lines) — AC3, the regression test

Covers both arms for "both witness families" via the one shared core (the families differ only in
which sha they feed it):

- **WR1** registered rotation → `SKIP`, reason names the ticket (the proportion + visibility happy
  SKIP path: `pinned≠current`, entry present, `retiredSourceSha===pinned`).
- **WR2** corrupted record → `FAIL` (`current===pinned` but `derivedMatches=false`) — proves a
  genuine divergence still FAILs, NOT skips. The named coverage gap from the S-138 review.
- **WR3** unregistered source change → `FAIL` (`pinned≠current`, no entry) — a rotation nobody
  declared does not get a free SKIP.
- **WR4** clean reproduction → `GREEN` (`current===pinned`, `derivedMatches=true`).
- **WR5** missing source + registered → `SKIP`; missing + unregistered → `FAIL`.
- **WR6** `retiredEntry` lookup by slug (hit / miss).

## MOD — `benchmarks/sculpture/proportion-witness.mjs`

1. **Imports**: `loadStylePack` from `../../src/pack/style-pack.mjs`; `classifyWitnessRepro`,
   `WITNESS_REPRO_VERDICT`, `retiredEntry` from `../../src/form/witness-repro.mjs`.
2. **Thread the pack** (AC1): load `pack = loadStylePack(join(ROOT, packRel))` once at module scope
   (after `packRel` is parsed) — mirrors measured-proportions' pattern. `derive(def)` passes
   `pack` to both `replayLedger({ ledger, pack })` and `replayLedger({ ledger, pack, throughRound: r })`.
3. **Retired registry** constant (module scope, the "retired pins named" deliverable):
   ```
   const RETIRED_SOURCES = [
     { slug: "cottage", retiredSourceSha: "<committed cottage ledger sha>", ticket: "T-138-02",
       reason: "cottage through the proportion loop — ledger re-banked (487fe2e)" },
     { slug: "barn",    retiredSourceSha: "<committed barn ledger sha>",    ticket: "T-138-01",
       reason: "barn through the proportion loop — ledger re-banked (5db9a86)" },
   ];
   ```
   (The retired shas are the committed records' own `inputs.ledger.sha256` — read once at fill-in.)
4. **`runRepro(def)`**: before `buildRecord`, read the committed record's `inputs.ledger.sha256`
   (pinned) and compute the current `chainRels(key).ledger` sha; `classifyWitnessRepro({pinned,
   current, retired: retiredEntry(key, RETIRED_SOURCES), derivedMatches: undefined})`. On `SKIP`:
   log `[proportion --repro] <runKey>: SKIP — <reason>` and **return `true`** (OK sentinel — NOT
   null; see exit-code plumbing). On `GREEN`: fall through to the existing buildRecord + byte-compare
   (the corruption detector — if a non-retired record diverges, that path still returns false). On
   `FAIL`: log and return false.
5. **Exit-code plumbing**: `runRepro` returns `true` for green AND skip, `false` for fail, `null`
   only for "no record". `main`'s `ran = results.filter(r => r !== null)` and
   `ran.some(ok => !ok)` are already correct with this contract.

## MOD — `benchmarks/sculpture/visibility-witness.mjs`

1. **Imports**: add `isTracked`, `loadTrackedSet` (already imports `guardedWriteRecord` etc. from
   pin-guard — extend the import); `classifyWitnessRepro`, `retiredEntry` from witness-repro.
2. **Tracked-only component-plan** in `derive()`: replace
   `const componentPlan = existsSync(planPath) ? reviveComponentPlan(...) : null`
   with a tracked gate — load the plan only when `existsSync(planPath) && isTracked(trackedSet,
   planRel)`. Record `source.componentPlan = existsSync(planPath) ? { path: planRel,
   sha256: sha256(planText), tracked } : null` so the record states whether it consumed a plan and
   whether that plan is committed. (`trackedSet` loaded once per `derive`.) Effect: cottage-challenge
   stops depending on its untracked plan → its census is now plan-less and reproducible from tracked
   inputs alone. church-challenge / cottage-generated (TRACKED plans) are unchanged.
3. **Retired registry** constant (the 3 pattern-book gate-record retirements):
   ```
   const RETIRED_GATE_RECORDS = [
     { slug: "barn-patternbook",          retiredSourceSha: "3dc04c97…", ticket: "T-138-01", reason: "barn through the proportion loop — gate re-judged (5db9a86)" },
     { slug: "barn-patternbook-saltcrag", retiredSourceSha: "88055c5f…", ticket: "T-138-01", reason: "saltcrag ratified — gate re-banked" },
     { slug: "cottage-patternbook",       retiredSourceSha: "f5567754…", ticket: "T-138-02", reason: "cottage through the proportion loop — gate re-judged (487fe2e); retired record at src/view/fixtures/cottage-patternbook.t127-retired.json" },
   ];
   ```
4. **SKIP guard in the `--repro` branch** (in `main`, per target, before the byte-compare): read the
   committed witness record's `source.sha256`; compute the current gate-record sha;
   `classifyWitnessRepro` against `RETIRED_GATE_RECORDS`. `SKIP` → log `[slug] SKIP — <reason>`, no
   `failures++`, continue. `GREEN`/`FAIL` from the classifier still defer to the existing
   derive+byte-compare (the classifier's `green` means "source unchanged"; the byte-compare is the
   corruption detector that fills `derivedMatches`). Practically: if `source.sha256` unchanged →
   derive + byte-compare as today; if changed & registered → SKIP; if changed & unregistered → a
   named FAIL.

## MOD — `benchmarks/sculpture/measured-proportions.mjs` — pin the seed

1. **`derive()`**: when the chain seed exists, add it to the record's `inputs` as
   `chainSeed: { path: chainSeedRel, sha256: sha256(seedText) }` (read the seed text once; it is
   already read for `before`). This is the missing pin that let `before` drift silently.
2. No SKIP logic here — measured's pinned inputs are intact; the seed pin makes a *future* seed
   rotation a named SKIP via the same classifier if/when wired (T-143's bar). For THIS ticket the
   resolution is the data rotation below.

## DATA ROTATIONS (re-run the owning runner with `--rotate-pins`)

- **`benchmarks/sculpture/measured/{cottage,barn}.{record.json,program.json,artifact.json,md}`**:
  `node measured-proportions.mjs --all --rotate-pins`. `ratios.before` refreshes to the rotated
  seed; `inputs.chainSeed` pin appears; `after`/`target` unchanged. Retired `before` values quoted
  in `progress.md` + the design. (program/artifact are byte-identical re-emits → `skip-identical`,
  no actual rotation; only the record/md change.)
- **`benchmarks/sculpture/visibility/cottage-challenge.{json,md}`**:
  `node visibility-witness.mjs --subject cottage --label challenge --rotate-pins`. Re-emits the
  plan-less census + the `source.componentPlan {tracked:false}` stamp. (FALLBACK if the plan-less
  census is degenerate/invalid: keep the plan-ful numbers and instead SKIP on
  `componentPlan.tracked===false` at repro — decided empirically in Implement.)
- The proportion records and the 3 pattern-book visibility records are **NOT** rotated — they stay
  pinned and SKIP (baselines never re-banked).

## UNCHANGED / OUT OF SCOPE
- `src/form/silhouette-proportion.mjs`, `measured-program.mjs`, `replay.mjs` — read only.
- `benchmarks/sculpture/multi-angle/**` (gate namespace) — read only, never written.
- The unrelated strays (`HEIF Image.heic`, `.lisa/hooks`, `levers/`, `reconstructed-artifact.json`)
  — not touched; `reconstructed-artifact.json` is not a witness input.
- No `packs/README` change required (the invariant lives in design.md per AC4).
