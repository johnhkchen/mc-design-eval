# T-148-01 Plan — relief-aware-gate

Ordered, independently-verifiable steps. Each step ends green (`npm test`) and commits atomically.
Verification criteria are explicit. The engine (S-146) and demand schema (S-145) are reused; the risk
surface is (a) the lens predicate correctness and (b) byte-identity of committed records — both pinned
by tests and the repro gate.

## Step 1 — The pure lens + unit tests  (commit: `feat(T-148-01): relief-presence lens`)

1. Create `src/form/relief-presence.mjs`: `RELIEF_PRESENCE_SCHEMA`, `RELIEF_AWARE_GATE_SCHEMA`,
   `reliefDemand(program, pack)`, `reliefPresence(occ, {demand, zoneOf})`,
   `composeReliefAwareVerdict(kitAware, presence)` (per structure S1).
2. Create `src/form/relief-presence.test.mjs`:
   - **RP1 reliefDemand**: program without facade → `[]`; with a column-rhythm facade → one demand,
     `material` resolved via `roleToBlock`.
   - **RP2 anti-anchor**: build a flat synthetic wall occ (`occupancyFromCells`), demand a column
     rhythm whose member block ≠ the wall block → `missing>0`, `passed:false`, named residual.
   - **RP3 articulated pass**: apply `surfaceRelief` placements for that demand to the occ, re-run
     `reliefPresence` → `missing===0`, `passed:true` (the fixpoint/idempotence).
   - **RP4 no-demand passthrough**: `reliefPresence(occ, {demand:[]})` → `ran:false, passed:true`.
   - **RP5 evidence**: `evidence[]` carries `reliefProfile` proud/flush/recessed for the relieved face.
   - **RP6 compose**: kit-aware PASS + relief FAIL → composite FAIL, both components; relief
     `ran:false` → passthrough; refusal stays refusal.

**Verify:** `npm test` green; the new file runs in the pure glob (no GL/IO). Self-contained — no
committed artifact touched.

## Step 2 — The grammar fixture  (commit: `feat(T-148-01): committed barn facade grammar fixture`)

1. Author `benchmarks/sculpture/relief/barn-grammar.json` by merging a `facade` block into
   `benchmarks/sculpture/recognition/barn.program.json` via `mergeFacade`, then validating with
   `validateProgramAgainstPack(grammar, rustic)` — one face, `memberRole:"frame.timber"`, column
   rhythm `{period:4, phase:0}`, `evidence:{source:"concept", layoutOnly:false}`.
2. Write the merged+validated program to disk verbatim (a one-off authoring node snippet; the file is
   committed data, not generated at runtime). Pick the `wall` face that the barn mass's plan declares
   (verified against the validator; adjust period within `facadeBounds` 2..5 if the validator objects).

**Verify:** a node smoke (`validateProgramAgainstPack` → `{ok:true}`) and `reliefDemand(grammar,
rustic).length===1` with `material==="minecraft:dark_oak_log"`/`"dark_oak_log"` (match `roleToBlock`'s
form). Confirm `reliefPresence(barnOcc, {demand})` `passed:false` (the anti-anchor bites on the real
build) and that applying `surfaceRelief` flips it to `passed:true`.

## Step 3 — The calibration sweep + script  (commit: `feat(T-148-01): relief calibration sweep + record`)

1. Create `benchmarks/sculpture/relief-calibration.mjs` (structure S2): anti-anchor, articulated
   reference (+ `reliefNoRegress` assertion), monotone re-derivation over committed gate records,
   anchors, `guardedWriteRecord` of `relief-calibration.{json,md}`, `--rotate-pins`, exit code.
2. Add `package.json` scripts (`relief:calibrate`, repro idiom matching `gate:calibrate`).
3. Run `npm run relief:calibrate -- --rotate-pins` to mint the committed record; then
   `npm run relief:calibrate` again → must be byte-identical (no rotation needed, exit 0).

**Verify:**
- anchors: `antiAnchor` FAIL, `articulated` PASS, `committedUnchanged` true; exit 0.
- `reliefNoRegress` `inPlanePreserved && ratiosPreserved` true (relief honest; E-34 ruler unmoved).
- second run byte-identical (deterministic; the `--repro`/`--offline` AC for the new chain).
- the committed `relief-calibration.md` shows both arithmetics beside (relief FAIL | kit-aware PASS).

## Step 4 — Offline-checker tolerance  (commit: `feat(T-148-01): gate offline tolerates relief field`)

1. Modify `benchmarks/sculpture/multi-angle-gate.mjs` `--offline` block: optional `relief`/
   `reliefAware` consistency check mirroring `kitAware`; import from `relief-presence.mjs`; summary
   token.

**Verify:** `npm run gate:offline` (or the project's offline gate script) over every committed record
→ all consistent, `relief n/a` everywhere (no record carries it); no record byte changes (`git
status` clean on `multi-angle/*.json`). `npm test` green.

## Step 5 — Live-gate wiring (provably inert)  (commit: `feat(T-148-01): wire relief lens into the gate (inert until a grammar lands)`)

1. Modify the live `gateMain` record-assembly: `loadReliefDemand(subject, program, pack)` helper
   (returns `[]` on any miss); when non-empty, attach `record.relief` + `record.reliefAware`. Exit
   code stays on `overall` (kit-aware) for committed parity.

**Verify:**
- `npm run patternbook:repro` (cottage+barn) byte-identical — the wiring is inert for committed
  subjects (no facade → `demand:[]` → nothing attaches).
- gate `--offline` still byte-identical; `npm test` green.
- (Optional manual) point `loadReliefDemand` at the barn grammar fixture and confirm a re-run would
  attach `relief`/`reliefAware` — documented, not committed (no committed subject gets the field).

## Step 6 — Suite + repro green, learnings  (commit folded into Step 5 or a docs commit)

1. Full `npm test` green.
2. `--repro`/`--offline` byte-identical on every touched chain/gate (patternbook, gate offline,
   relief calibration).
3. E-25 Rule 3 self-grep: no subject keys in `relief-presence.mjs`/`relief-calibration.mjs` source
   (the barn is named only in the committed fixture path + the calibration's anchor table, which is
   the calibration's job — matching `budget-calibration.mjs`'s ANCHORS table precedent).

## Testing strategy

- **Unit (pure glob):** `relief-presence.test.mjs` — the fixpoint (anti-anchor / articulated /
  passthrough), the compose, the evidence. No GL.
- **Integration (operator-run, committed output):** `relief:calibrate` — the anti-anchor flip + the
  articulated pass + monotone re-derivation, byte-identical on re-run. The committed record IS the
  calibration evidence (AC2), like `budget-calibration.json`.
- **Byte-identity (repro):** `patternbook:repro`, gate `--offline`, `relief:calibrate` re-run.
- **Gaps (intentional):** the live metered gate is not in CI (the `recognize.mjs`/`multi-angle-gate`
  precedent); the inert wiring is proven byte-safe by repro, and the lens itself is fully unit-tested
  + exercised by the calibration over the real barn build.

## Risks & mitigations

- **Byte drift on committed records** (highest risk). Mitigation: the lens fires ONLY when a grammar
  is supplied; no committed subject has one; verified by `patternbook:repro` + gate `--offline` after
  Steps 4–5.
- **Fixture grammar rejected by the validator.** Mitigation: author via `mergeFacade` +
  `validateProgramAgainstPack` (Step 2 smoke) before committing; period within `facadeBounds`.
- **`reliefDemand` material form mismatch** (`minecraft:` prefix vs bare). Mitigation: resolve via
  `roleToBlock` and pass to `surfaceRelief` which namespaces internally; RP2/RP3 pin the round-trip.
- **`surfaceRelief` skipping cells already of the member block** (false "present"). Mitigation: RP2
  uses a member block distinct from the wall; the real barn wall (cobblestone/terracotta) ≠
  dark_oak_log (smoke confirmed 300 placements).
