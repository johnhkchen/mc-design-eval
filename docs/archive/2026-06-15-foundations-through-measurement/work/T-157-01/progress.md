# T-157-01 — Progress

## Status: COMPLETE — 3 commits, suite 2161/2161 green (was 2146; +15 new tests)

## Commits
1. **topology conformance suite + STRUCTURE.md authoritative** — `src/form/topology.mjs`,
   `src/form/topology.conformance.test.mjs`, `STRUCTURE.md`. (Steps 1+2 merged — the test markers
   and the doc prose are coupled, so committing them together keeps the suite green.)
2. *(folded into commit 1)*
3. **checkable lisa claim** — `src/form/lisa-claim.mjs`, `…test.mjs`, `scripts/lisa-claim.mjs`,
   `package.json` (`lisa:claim`).

## What landed vs. plan
- **TOPO1–7 + TOPO*-red** as designed. Each guardrail green on the real repo and red on a synthetic
  violation (synthetic STRUCTURE string / synthetic source string), so "fails on the violation" is
  proven without mutating the tree.
- **CLAIM1–3** pure decision tests; CLI smoked by hand (free→claim→other=exit3→mine=exit0→release).

## Deviations from plan (documented)
- **Steps 1 and 2 committed together.** Plan had them as separate commits, but TOPO7 asserts the
  STRUCTURE.md convention markers, so the test is red until the doc lands. Merged to keep every
  commit green (the RDSPI atomic-commit spirit) rather than land a knowingly-red intermediate.
- **TOPO5 imports pin-guard in the test, not in `topology.mjs`.** structure.md sketched
  `topology.mjs` importing `isInstrumentPath`; I kept `topology.mjs` free of that dependency and
  imported the pin-guard predicate directly in the conformance test. Cleaner boundary —
  `topology.mjs` stays a pure STRUCTURE/source scanner; the allowlist property is asserted where it
  is observed.
- **Self-grep bite (then fixed).** The first `topology.mjs` JSDoc literally contained
  `from "…_archive…"`, which `ARCHIVE_IMPORT_RE` matched → TOPO4 red against my own file. Reworded
  the comment to avoid the scanned clause (the documented self-grep lesson). Caught by the test on
  the first run — the guardrail works.
- **Marker case.** TOPO7 markers initially lower-cased ("replace, don't accrete"); the headings are
  sentence-case. Aligned the test markers to the actual prose.

## Verification log
- `node --test src/form/topology.conformance.test.mjs` → 11/11.
- `node --test src/form/lisa-claim.test.mjs` → 4/4.
- CLI: `--check` free=0, `--claim` ok, foreign `--check`=3, own `--check`=0, `--release` removes the
  file (smoke claim cleaned up, not committed).
- `npm test` → **2161 pass, 0 fail**.

## Not done (scope, by design — see design.md)
- Kit relocation to `measurements/kit/` (T-155-01 follow-up; TOPO5 documents it as the deferred
  third allowlist entry).
- Wiring the claim into lisa's thread-spawn (out of repo; the CLI + recorded convention is the
  checkable surface).
