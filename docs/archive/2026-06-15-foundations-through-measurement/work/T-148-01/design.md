# T-148-01 Design — relief-aware-gate

Options, tradeoffs, decisions — grounded in the research. The engine (S-146 `surfaceRelief`/
`reliefProfile`/`reliefNoRegress`) and the demand schema (S-145 `facade`) already exist; this ticket
is the LENS that joins build-surface to recognised-grammar plus the CALIBRATION that proves it bites.

## D0 — The predicate: fixpoint, not threshold (the central choice)

The AC names "rhythm period, proud-cell fraction, field/frame contrast" as the MEASURED quantities and
demands "thresholds derived from data, no per-building constants." Three candidate predicates:

- **(a) proud-fraction threshold.** `reliefProfile` gives `proud/(proud+flush+recessed)`; pass iff it
  exceeds some τ. *Rejected*: τ is a per-instrument constant with no principled value; it ignores
  WHERE the relief falls (a build proud in the wrong places passes); it conflates the barn's existing
  roof-overhang relief with demanded wall articulation.
- **(b) rhythm-period match.** FFT/autocorrelation of the proud columns vs the grammar period.
  *Rejected*: heavy, fragile on 12-strip walls, and still needs a tolerance constant.
- **(c) the relief FIXPOINT (CHOSEN).** Exactly the kit-presence idea ("the demand is the supply"):
  the grammar's declared articulation is REALIZED iff RE-RUNNING `surfaceRelief` with that grammar on
  the build is a NO-OP on the demanded strips. Run `surfaceRelief(occ, grammarRhythm)`; the proud
  cells it WOULD still emit (`placements.length`) are the cells the build LACKS → the relief residual.
  `missing===0` ⇒ present. **No threshold, no per-building constant** (the period is the grammar's;
  the predicate is no-op-ness). Idempotence (SR4) guarantees an already-relieved face yields 0.

Feasibility (research §3) confirms (c) is bimodal on real data: flat barn `+z` → 300 missing;
relieved → 0. The "proud-cell fraction / field-frame contrast" the AC names are RECORDED as the
human-readable evidence (`reliefProfile` proud/flush/recessed), while the GATING predicate is the
fixpoint. Best of both: measurements reported, decision constant-free. **Decision: (c).**

## D1 — Where the lens lives: a companion precondition, mirroring kit-presence

The instrument already has the precise shape for "a check that runs beside the judge, both reported,
never a re-judge": `kitPresence` + `composeKitAwareVerdict`. The relief lens is the same animal.

- **Chosen:** a new pure module `src/form/relief-presence.mjs` with `reliefPresence(occ, {demand,...})`
  (the fixpoint check) and `composeReliefAwareVerdict(kitAware, presence)` (ANDs relief with the
  kit-aware verdict; both reported; passthrough when `ran:false`). New policy tag
  `relief-aware-gate/v1`; the kit-aware `overall` is byte-unmoved and reported as a component.
- *Rejected:* folding relief into `kitPresence`/`composeKitAwareVerdict`. That would change the
  `kit-aware-gate/v1` arithmetic and every committed `overall`. Identity-class discipline forbids it
  (version the tag; legacy valid forever). Separate compose keeps kit-aware byte-identical.
- *Rejected:* a `src/pack/conformance.mjs` check. Conformance is build-only (occupancy + declarations
  on the pack); it has no access to the recognised CONCEPT grammar, and it runs at construction, not
  at the gate. The lens is a gate-time companion, like kit-presence — `src/form/` is its home.

## D2 — The demand side: grammar → surfaceRelief opts

`reliefDemand(program, pack)` extracts, per mass with a `facade` block, one demand per face:
- `material = roleToBlock(pack, face.memberRole)` (the one resolution point, compile.mjs:26).
- `faces = [face.wall]`; `rhythm.axis = "column"` (pilasters/studs = vertical strips along the wall);
  `every = face.rhythm.period` (or, for `{count}`, derived from the wall run / count — recorded);
  `phase = face.rhythm.phase ?? 0`; `span = RELIEF_DEFAULTS.span`.
- `courseLines[]` → a `"row"` demand at each declared `y` (belt courses) using `roleToBlock(role)`.
- `depth = RELIEF_DEFAULTS.depth` (1) unless the grammar declares jetty depth on that face.

No `facade` ⇒ `[]` ⇒ the lens is vacuously satisfied (`ran:false`) — the legacy state every committed
build is in. **Every number traces to the grammar or `RELIEF_DEFAULTS`; none is subject-keyed.**

## D3 — The check: fixpoint + recorded evidence

`reliefPresence(occ, {demand})`:
1. `ran = demand.length > 0`. If not, return `{schema, ran:false, passed:true}` (passthrough).
2. For each demand `d`: `{placements, report} = surfaceRelief(occ, d)`; `missing = placements.length`.
   Record a check row `{face, axis, every, material, demandedStrips:report.strips,
   missingCells:missing, fieldCells:report.fieldCells, passed: missing===0}`. Tolerated residue (cells
   already carrying the relief material on a demanded strip) is inherited from `surfaceRelief`'s
   idempotence — never re-encoded (the kit-presence posture).
3. Evidence per relieved face: `reliefProfile(projectSurface(occ, face))` → `{proud, flush, recessed,
   plane}` — the "proud-cell fraction" + "field/frame contrast", reported, not gated.
4. `passed = every check missing===0`; `residual = [missing-cell summaries]` for the named relief
   residual the AC asks for.

Anti-anchor (flat barn + grammar): `missing>0` → `passed:false` → named residual. Articulated
reference (barn + `surfaceRelief` applied): `missing===0` → `passed:true`. Both proven by reusing the
SAME op, so the lens can never demand a richer relief than the construction supplies.

## D4 — The composite verdict and byte-safety

`composeReliefAwareVerdict(kitAware, presence)` (mirrors `composeKitAwareVerdict`):
- `relief-aware-gate/v1`; components `{kitAware, relief:{ran,passed,residual}}`.
- `decided` follows `kitAware.decided` (a resemblance refusal stays a refusal; relief still reported).
- `passed = kitAware.passed && (relief.ran ? relief.passed : true)`.
- When `relief.ran===false` the composer is a pure passthrough of `kitAware.passed` — so attaching it
  to a record with no grammar is information-free and OMITTED in the runner (D5).

**Both arithmetics beside** (AC3): where the relief lens fires, the record carries the kit-aware
verdict (the legacy composite, valid forever) AND the relief-aware verdict; the calibration record
prints both columns. The frozen judge contract is byte-unmoved — the lens calls NO judge.

## D5 — Wiring into the live gate runner: thin and provably inert

`benchmarks/sculpture/multi-angle-gate.mjs` computes `presence = reliefPresence(occ, {demand:
reliefDemand(program, pack)})` ONLY when a facade grammar is available for the subject (a committed
`recognition/facade/<subject>.json`, else `reliefDemand` returns `[]`). If it RAN, attach optional
`record.relief = presence` and `record.reliefAware = composeReliefAwareVerdict(overall, presence)`;
the existing `overall` (`kit-aware-gate/v1`) stays byte-identical. For EVERY committed subject (none
has a grammar) nothing attaches → `patternbook:repro`/gate `--offline` byte-identical. *Rejected:*
replacing `overall` with the relief-aware verdict (breaks byte-identity of every committed record).

## D6 — Calibration: a sweep fixture, not a record mutation

The committed barn gate record's program has no facade, so the lens is a no-op there and the record
re-derives unchanged (the monotone-re-derivation half of AC2/AC3). The anti-anchor FLIP is shown in a
dedicated calibration artifact, mirroring `budget-calibration.mjs`:
`benchmarks/sculpture/relief-calibration.mjs` (`relief-calibration/v1`):
- Loads the committed barn artifact occupancy (`artifactOccupancy`) and a COMMITTED recognised barn
  grammar fixture (`benchmarks/sculpture/relief/barn-grammar.json`, validated diegetic via
  `validateProgramAgainstPack` — the concept's recognised grammar, T-145-01 shape, recorded data).
- **Anti-anchor** = barn occupancy + grammar → `reliefPresence` → FAIL; the committed kit-aware
  PASS reported BESIDE.
- **Articulated reference** = barn occupancy + `surfaceRelief(grammar)` applied → `reliefPresence`
  → PASS; `reliefNoRegress` asserts the E-34 ruler is byte-unmoved (relief is honest construction).
- **Monotone re-derivation** = a read-only pass over committed gate records confirming each has no
  relief demand wired → relief `ran:false` → committed `overall` re-derives unchanged.
- Asserts anchors, writes `{json,md}` via `guardedWriteRecord`, `--rotate-pins`, non-zero exit on
  miss. Deterministic (no model, no GL — occupancy + pure ops) → `--repro`/`--offline` byte-identical.

*Why a fixture grammar:* no LIVE facade run exists (no model in CI; S-145 review §3). The grammar is
RECORDED data (the period recognised from the barn concept's stud spacing), validated through the same
diegetic gate a live recognition would pass — not a runner constant (E-25 self-grep stays clean; the
period lives in committed JSON). This is "the concept's recognised grammar (T-145-01)" verbatim.

## D7 — Offline-checker tolerance (AC4)

Extend the gate `--offline` checks with an optional `relief`/`reliefAware` block, checked for internal
consistency only when present (re-compose `composeReliefAwareVerdict` and confirm it matches), absent
on every committed record → byte-identical. Mirrors the `kitAware`/`visibility` tolerance pattern.

## D8 — Rejected scope

- No re-judge, no judge-reply changes (the lens is judge-free).
- No schema edits (S-145's `facade` + S-145's pack `articulation` suffice; rustic needs no edit —
  the fixture carries the grammar; avoids [[pack-edit-blast-radius]]).
- No mutation of committed gate records (the flip lives in the calibration fixture).
- No mesh-PBR / GLB read (geometry from the build's own occupancy; the GLB is irrelevant here).
