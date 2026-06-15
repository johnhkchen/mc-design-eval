# T-165-02 — Progress

## Step 1 — Author `packs/guildhall.json` ✅
Wrote the `guildhall` pack (polite/classical dressed-ashlar second style). `valueCheck` Lab triples derived
by running the validator's own `loadBlockTable`/`familyOf`/`derivedFormClass` (a throwaway node script), so
no stale snapshot. Validated in isolation: `loadStylePack` → ok (schema + all six semantic checks), no
findings. Printed `styleProfileBlock` confirms the three grammar lines read as designed (pilaster/quoin/
plinth walls; arch openings; roof.hip + deepslate_tiles shallow stone roof).
- **Commit:** `feat(T-165-02): guildhall — a polite/classical second style (Layer-A expected profile)`.

## Step 2 — DG7 wrong-style fixture ✅
Added `GUILDHALL = loadStylePack(...)` + `DG7` to `src/workshop/diagnose.test.mjs`. Asserts both directions
of the wrong-style signal over the existing synthetic barn `PROGRAM`: guildhall carries pilaster/quoin/arch
(rustic-build MISSING) and lacks timber-frame/head.flat (rustic-build PRESENT-but-forbidden); roof.hip +
deepslate_tiles + shallow pitch; suite selection by declared style; not a saltcrag reskin either; no subject
names baked in; deterministic.
- **Verify:** `node --test src/workshop/diagnose.test.mjs` → 7/7 (DG1–DG7).
- **Commit:** `test(T-165-02): DG7 pins guildhall wrong-style grammar vs rustic`.

## Step 3 — Full suite + untouched-pin check ✅
`npm test` → **2216/2216** (2215 + DG7). No pack-enumeration/count assertion broke. FX-DB1 (diagnose
golden, barn+rustic) and FX-R1 (recognition prompt sha) green within the suite — and since this ticket made
**zero production-code changes** (one new pack file + one new test), the byte-identity pins (FX-DB1, FX-R1,
`workshop:replay`, `workshop:offline`) cannot have moved; nothing on their path was touched. No fixup
needed.

## Step 4 — FINDINGS.md (AC3) ✅
Recorded the split result, lead-with-failure: WALL+OPENING grammar genuinely differs (fixture-proven, not a
reskin); ROOF form is capped at "pitched" by the registry → scoped the generator epic (new non-pitched roof
idioms). Listed S-166 deferrals (live crater + matched render) and the existing stand-in concept
(`arc-A-flash.png`).
- **Commit:** with the trailing docs commit.

## Deviations from plan
None of substance. The plan's "throwaway loadStylePack run" (Step 1 verify) used a small inline node script
calling `assertStylePack` + `validateStylePack` + `styleProfileBlock` — exactly as intended. No production
`.mjs` edits were needed (the T-165-01 mechanism already consumes any validated pack), so the ticket is
data + a test + the finding, as Design predicted.

## State at handoff
- `packs/guildhall.json` committed, validates fail-loud.
- `DG7` committed, green; full suite 2216/2216.
- `FINDINGS.md` + RDSPI artifacts written. Frozen instrument untouched.
</content>
