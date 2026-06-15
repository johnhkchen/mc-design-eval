# T-157-01 — Review: topology guardrails

Epic E-37 / Story S-157. Point the project's "structure over discipline" lens at its own
*topology*: make the wrong organizational move structurally impossible, with tests that go **red on
violation**. Shipped in 2 commits; suite **2161/2161** (was 2146; +15 tests). No GL, no spend, no
new runtime ceremony — guardrails observe the canonical spine, they never alter it.

## Files

**New**
- `src/form/topology.mjs` — pure topology decision core: STRUCTURE.md spine parser
  (`parseSpineModules`/`resolveModuleToken`), map reverse-drift (`chainStageModules`/
  `missingFromMap`), live-source scans (`liveSpineFiles`/`findArchiveImports`/
  `findBuildEntryPoints`) with exported predicates (`ARCHIVE_IMPORT_RE`, `isBuildEntrySource`).
- `src/form/topology.conformance.test.mjs` — TOPO1–7 + four `-red` proofs.
- `src/form/lisa-claim.mjs` — per-ticket claim: pure `decideClaim`/`claimRecord`/`claimRel` + thin
  `readClaim`/`writeClaim`/`checkClaim` IO leaves.
- `src/form/lisa-claim.test.mjs` — CLAIM1–3 (truth table, path, record round-trip).
- `scripts/lisa-claim.mjs` — the checkable CLI (`--check`/`--claim`/`--release`).

**Modified**
- `STRUCTURE.md` — invariants header now names the enforcing test; four new invariants
  (map-kept-current, one-entry-point, no-archive-import, allowlist-is-prefix) + a **Conventions
  (recorded — S-157)** section (replace-don't-accrete; claim-before-you-produce).
- `package.json` — one script: `lisa:claim`.

No edits to `build.mjs`, `pin-guard.mjs`, `seed.mjs`, or any spine runner.

## Acceptance criteria → evidence

| AC | Where | Status |
| --- | --- | --- |
| #1 STRUCTURE authoritative + kept-current test | TOPO1 (forward: spine module exists) + TOPO2 (reverse: chain stage named in map); convention recorded in STRUCTURE.md ("updates this map in the same commit") | ✅ |
| #2 second build entry point → fail | TOPO3 — exactly one live runner declares `build-chain/v1`; `-red` shows a 2nd is caught and a composing helper is not | ✅ |
| #2 live-spine imports `_archive/` → fail | TOPO4 — zero live archive imports; `ARCHIVE_IMPORT_RE` matches an import clause, not a provenance comment | ✅ |
| #2 draft outside `builds/`; allowlist *is* prefix | TOPO5 — `builds/` not frozen, `measurements/`+`packs/` are, `packs/drafts/` not; allowlist ≤3 prefix matchers | ✅ |
| #3 done = delivered, not compiled | TOPO6 — `build.mjs`'s success path runs `assertGlAvailable()` + `renderBesideConcept(` before `return record.…`; STRUCTURE invariant restated | ✅ |
| #4 replace-don't-accrete + checkable lisa claim | STRUCTURE Conventions section; `lisa-claim.mjs` + CLI (`--check` exits 3 on held-by-other) + CLAIM1–3 | ✅ |
| #5 each guardrail red-on-violation; npm test green; no new ceremony | every TOPO has a `-red` companion; suite 2161/2161; only addition is the enforcement + one npm script | ✅ |

## Test coverage & gaps

**Strong.** Every guardrail proves both directions (green on repo, red on synthetic). The red proofs
use synthetic strings (`parseSpineModules`/`missingFromMap`/`ARCHIVE_IMPORT_RE`/`isBuildEntrySource`
are pure over strings) so they demonstrate failure without dirtying the tree — the same trick that
lets `pin-guard.conformance` prove refusal. The self-grep bite during implementation (my own JSDoc
tripped TOPO4) is evidence the scan actually fires.

**Gaps / known limits (none blocking):**
- **TOPO2 reverse-drift is chain-derived, not exhaustive.** It demands the modules `build.mjs`
  *spawns/imports* (`generated-milestone`, `workshop`, `render-beside`) appear in the map — not
  every conceivable "stage". This is deliberate (design.md option D): the authoritative live-stage
  set is what the chain runs, so a stage added to the chain trips it, but a stage added *elsewhere*
  and never wired into `build.mjs` would not. Acceptable — an unwired module isn't a live stage.
- **TOPO6 is a source-ordering scan**, not an execution test (no GL in the unit glob). It asserts
  the beside-render seams precede the success return in source; it can't prove the PNG was produced
  at runtime. The runtime delivery is `build.mjs`'s own contract (it throws if GL is absent). Same
  class as the isolation source-scans — structural, not behavioral.
- **The lisa claim is advisory.** It provides *visibility* (the missing piece per the two memories),
  not mutual exclusion — the DAG's commit lock owns serialization. A thread that ignores the claim
  is not blocked; the enforcement is "look before you produce", surfaced via the CLI's exit code.
  Not wired into lisa's spawn (out of repo).
- **STRUCTURE parse tolerance.** `parseSpineModules` scrapes backtick path-tokens from the "Owning
  module" column; an unusual future cell form (e.g. a module named without backticks) would be
  silently skipped rather than demanded. The forward check can only catch modules it parses. If a
  stage is added with an exotic cell, fix the parser (header documents this).

## Open concerns for the human reviewer

1. **Is the lisa-claim scope right?** It's the only genuinely new mechanism. I kept it minimal
   (checkable CLI + convention + pure core) rather than wiring it into lisa, per "no new ceremony"
   (E-36). If the intent was scheduler-level enforcement, that's a follow-up in lisa itself, not
   this repo.
2. **TOPO5 allowlist `≤ 3`** encodes the current state (measurements, packs, deferred kit). When the
   kit relocates to `measurements/kit/` (T-155-01 follow-up), that entry drops and the bound can
   tighten to `≤ 2`; the test comment flags this.
3. **TOPO7 couples a test to doc prose** (exact marker phrases). If an editor rewords the
   conventions, TOPO7 goes red — intentional (the convention can't be silently deleted) but it means
   prose edits must keep the marker phrases. Documented in the test.

## Risk assessment
Low. Additive only; no spine module touched; deterministic, fast (suite +~30ms). The guardrails can
only *fail the build* on a real drift — they place no constraint on correct work. The one behavioral
surface (the CLI) is smoke-tested and its scratch claim file is cleaned up, not committed.
