# T-142-01 Design — witness-pin-policy

The research established that the three families fail for **three different reasons** and therefore
take **three different resolutions** — the AC's own asymmetry, now grounded in the pin data:

| family | pinned-source state | resolution |
|--------|--------------------|------------|
| proportion-witness | source (ledger/final/concept) **rotated** by T-138 | thread the pack; **named SKIP** on the retired source |
| visibility-witness | `source.sha256` (gate record) **rotated** by T-138 | **named SKIP** on the retired source |
| measured-proportions | pinned inputs intact; unpinned `before` drifted | **refresh** `before` + pin the seed for next time |

The unifying invariant: **a witness reproduces against its PINNED inputs. If a pinned input was
retired by a sanctioned rotation → named SKIP citing the owner. If a pinned input is unchanged but
the re-derivation differs → genuine divergence → FAIL. An unpinned diagnostic baseline that drifts
is refreshed under explicit rotation and then pinned.** This is the gatehouse-current precedent,
promoted from "artifact pin" to "any pinned source," and made testable.

## The decision core (shared, pure, testable) — `src/form/witness-repro.mjs`

One pure function both runners call, plus the retired-pin registry shape. Pure → it runs under the
`src/**/*.test.mjs` glob, satisfying AC3 ("the SKIP-vs-FAIL regression test ... for both witness
families") with a single covered unit.

```js
// classifyWitnessRepro — the SKIP-vs-FAIL decision, no IO.
//   pinnedSourceSha   the sha the committed witness recorded for its source
//   currentSourceSha  the sha of that source on disk now (null = source missing)
//   retired           the registry entry for this slug, or null
//   derivedMatches    did the re-derivation byte-match the committed record? (only meaningful
//                     when the source is unchanged)
// → { verdict: "green" | "skip" | "fail", reason }
export function classifyWitnessRepro({ pinnedSourceSha, currentSourceSha, retired, derivedMatches }) {
  if (currentSourceSha === null)            return retired ? skip(retired) : fail("source missing, no registered retirement");
  if (currentSourceSha === pinnedSourceSha) return derivedMatches ? green() : fail("source unchanged but re-derivation diverges — corrupted witness record");
  // source bytes changed:
  if (retired && retired.retiredSourceSha === pinnedSourceSha) return skip(retired);   // sanctioned rotation
  return fail("source changed but no sanctioned rotation registers this retirement — investigate");
}
```

- `skip(retired)` reason: ``pinned source retired by ${retired.ticket}: ${retired.reason}``.
- The **registry** is data the *runner* owns (the "retired pins named" deliverable) and the *test*
  supplies synthetically. Shape: `{ slug, retiredSourceSha, ticket, reason }`. Keying on the
  retired sha (not just the slug) means an *unregistered* future change still FAILs — the registry
  certifies a *specific* retirement, not "this slug may drift forever."

### Why a registry and not git-blame the owner

Gate records carry **no `ticket` field** (verified — top-level keys are schema/subject/label/
artifact/contract/zones/views/aggregate/kitPresence/overall/visibility/sheet/labeled). The owner
must be *declared*, not discovered. A declared registry is also the T-119 idiom ("retired pins
named") and is deterministic (no `git log` in a witness). This ticket OWNS the four entries
(barn-patternbook→T-138-01, barn-patternbook-saltcrag→T-138-01, cottage-patternbook→T-138-02, and
the two proportion ledgers→T-138-01/02).

## Family 1 — proportion-witness

1. **Thread the pack** (AC1, literal). `derive(def)` gains the `pack` (loaded once via
   `loadStylePack(join(ROOT, packRel))`) and passes it to both `replayLedger` calls. This fixes the
   geometry-bearing throw for any *current* chain and is required for the green path. The committed
   cottage/barn records still won't reproduce (their source rotated) — that is (2).
2. **SKIP the retired records.** `runRepro` computes the current shas of the record's pinned inputs;
   if any differ from the committed record's pins, look up the slug in the runner's retired
   registry and `classifyWitnessRepro`. A registered retirement → log `SKIP — <reason>` and return
   the **OK sentinel** (see "exit-code plumbing"). The records are **not** rotated — they stay
   pinned at their historical values and SKIP (honoring "baselines never re-banked").

Result: `proportion:repro` → cottage SKIP, barn SKIP, gatehouse/church no-record → **exit 0**.

## Family 2 — visibility-witness

1. **SKIP guard for record pins.** In the `--repro` branch, before the byte-compare: load the
   committed witness record, read its `source.sha256`; compute the current gate-record sha;
   `classifyWitnessRepro` against the runner's retired registry. A registered retirement → named
   SKIP. `green` → fall through to the existing derive + byte-compare (the corruption detector). The
   existing artifact-pin SKIP inside `derive()` (gatehouse-current) is untouched.
2. **cottage-challenge stray file.** Make `derive()` read **only TRACKED** component-plans
   (`existsSync && isTracked`); an untracked plan is recorded as an unresolved-provenance
   dependency. The cottage-challenge witness record is **rotated once** under this ticket to stamp
   `source.componentPlan = { path, sha256, tracked: false }`; on `--repro`, a witness record that
   declares `tracked:false` SKIPs with a named provenance reason — deterministic in *both* worktree
   states (present-untracked here, absent in a clean checkout), because the flag lives in the
   committed record, not on the disk state. This isolates cottage-challenge by **property** (the
   self-grep stays clean); church-challenge / cottage-generated (TRACKED plans) keep reproducing.

Result: `visibility:repro` → 3 pattern-book SKIP, cottage-challenge SKIP (provenance named),
gatehouse-current SKIP (unchanged), 13 others green → **exit 0**.

## Family 3 — measured-proportions

1. **Pin the seed.** `derive()` adds `inputs.chainSeed = { path, sha256 }` when a chain seed exists
   (the input that feeds `ratios.before`). This closes the gap that let `before` drift unnoticed.
2. **Refresh `before` under explicit rotation.** Re-run `measured --all --rotate-pins`; `before`
   re-reads the current (rotated) seed; `after`/`target` are unchanged (their inputs are SAME — no
   re-banking of the real baselines). The retired `before` values are **quoted** in this design and
   in the record's md narrative (audit trail).
3. **"Both rulers where T-139 changed a number"**: verified N/A — `before` is the PROGRAM lens
   (`silhouetteRatios`), which T-139 never touched. Recorded as a finding, not a code path.

Result: `measured:repro` / `measured:offline` → cottage/barn green (refreshed, seed now pinned) →
**exit 0**. The seed pin means the *next* rotation is caught as a named SKIP, not a silent drift.

## Exit-code plumbing (the one trap)

`proportion-witness` `runRepro` currently returns `null` for "no record" and `main` throws if
**every** result is null. A SKIP must NOT read as null (else two SKIPs ⇒ "no records" ⇒ exit 2).
Design: `runRepro` returns `true` for both green and SKIP (acceptable outcomes, logged distinctly),
`false` for FAIL, `null` only for genuinely-absent records. `visibility` already `continue`s on SKIP
without `failures++`; the new gate-rotation SKIP follows suit.

## Rotation-proof bar (AC4 — the invariant T-143 must prove)

> **Invariant RP-1.** A subsequent sanctioned rotation of any pinned witness/record source must
> yield a *named SKIP* (never a bare FAIL/DIVERGES). The mechanism is `classifyWitnessRepro` + the
> per-runner retired registry; the rotation's owning ticket adds its registry entry (retired sha +
> ticket + reason) as part of the rotation. An *unregistered* source change deliberately still
> FAILs — silence is never the default.

T-143 proves RP-1 by performing a fresh sanctioned rotation (e.g. re-banking a chain) and showing
the witness SKIPs named rather than going red. This ticket ships the cage + the regression test; it
does not itself perform that future rotation.

## Alternatives rejected

- **Refresh the proportion/visibility records to green** (re-bank to the rotated upstream). Rejected:
  exactly the "baselines re-banked" anti-pattern; erases the historical measurement and hides that a
  sanctioned rotation occurred. SKIP keeps the record honest and auditable.
- **SKIP measured too** (pin the seed, refuse on drift). Rejected: the AC says *refresh*, and it is
  correct — `before` is a live baseline whose move is *meaningful* (the chain genuinely re-ran);
  refresh + quote + pin is the honest record of a moved baseline, not a hidden one.
- **`git add` the cottage component-plan** to make the leg green. Rejected: "resolve the provenance,
  don't adopt blindly" — the file was never tracked by its dir's authority (T-102); committing a
  mystery artifact to satisfy a byte-compare is the blind adoption the ticket forbids. SKIP-with-
  named-provenance is the honest state until a ticket re-generates it from a committed chain.
- **git-blame the retiring ticket at runtime.** Rejected: non-deterministic-flavored IO in a witness
  and no `ticket` field to read; a declared registry is the T-119 idiom.
- **Per-runner bespoke SKIP logic.** Rejected: one pure `classifyWitnessRepro` covers both families
  and is the single thing the regression test must pin (DRY + AC3 "for both witness families").
