# T-200-01 — Review: de-noise the form decision + port the parse hardening

Story **S-200** / Epic **E-49**. Two runner-side items landed; `npm test` 2397/2397; frozen instrument
untouched. This is the handoff — what changed, what's tested, what a reviewer should scrutinise.

## What changed

### New
- **`src/workshop/agent-reply.mjs`** — `parseFirstJsonObject(string) → object`. A string/escape-aware
  first-balanced-brace extractor; the single source both climb runners now decode replies through.
  Lifted verbatim from the T-198 picture-climb copy; throws on no-object / unbalanced.
- **`src/workshop/agent-reply.test.mjs`** — AR1–AR8.

### Modified
- **`src/workshop/climb-gate.mjs`**
  - `closureDecidedMove(tool)` (new export) — `TOOL_STAGE==="form" && TOOL_DEPARTMENTS includes "WALL"`.
    `close_shell`/`construct_walls` → true; roof-form/detail/unknown → false. Derived from the existing
    registries; no new hardcoded list.
  - `acceptsRound` — new inert-by-default `isFormMove` opt. When set **and** a form gap remains
    (`closureBefore < FORM_READY_CLOSURE`), the decision is **closure-only** (`formCredit` fires → KEEP;
    else ROLL BACK), the picture delta recorded but not consulted. The `formCredit` computation is
    hoisted above the picture path and reused; the non-`isFormMove` path is byte-identical to T-199.
- **`src/workshop/climb-gate.test.mjs`** — CG-FS1–FS6 + the `closureDecidedMove` import.
- **`experiments/eval-alignment/picture-climb.mjs`** (runner, not in `npm test`) — imports
  `closureDecidedMove` + `parseFirstJsonObject`; inline `parse` re-pointed to the shared module;
  `isFormMove: closureDecidedMove(pick.tool)` threaded into the gate call.
- **`experiments/eval-alignment/autonomy-loop.mjs`** (runner, not in `npm test`) — imports the shared
  parser (the port — kills the latent two-object crash in `evalBuild` + `agentPick`); `agentPick`
  hardened with the re-ask-once-then-`done` fallback.

## Falsifiable claim — how it was attacked

> Deciding form moves on closureOf makes the form decision stable across re-runs (the close_shell keep
> no longer flips with vote noise), and the ported parse survives a two-object reply.

- **Stability, KEEP side** — CG-FS1 holds closure `0.615→1.0` and sweeps the picture draw across the
  documented swing `[[16,16],[0,76],[76,0],[0,0],[76,76]]`; **every** draw → KEEP `form-credit`. A
  noisy picture crater can no longer roll back a real shell closure.
- **Stability, ROLLBACK side** — CG-FS2 holds closure flat (`0.615→0.615`) and sweeps the same draws;
  **every** draw → ROLLBACK `no closure gain`. A noisy picture **spike** can no longer accept a form
  move that did not close. Both directions of the noise are neutralised — this is the de-noising.
- **Parse port** — AR1 is the exact crash case (`{…}{…}`); AR2/AR3 the trailing-prose / nested-brace
  cases the AC names; AR4/AR5 guard the string/escape branch; AR7/AR8 the throw paths.

### The named failure modes (anti-hedge — led with how it fails)

- **"closureOf too coarse for some real form gain → name it."** It is — for the **roof**. `closureOf`
  measures the wall band only; `apply_gable_roof`/`recolor_roof` change roof form, not wall closure.
  Routing them onto closure would reject every roof move. So `closureDecidedMove` **excludes** ROOF
  tools (CG-FS3) and roof-form keeps the picture gradient (CG-FS4). The richer roof-form signal (a
  roof-profile / ridge-line metric, cf. [[trellis-facet-normals-lie]]'s smoothed top profiles) is
  **named, not built** — the gatehouse stall was the wall shell, not the roof, so no demonstrated roof
  blind-spot justifies the spend now. Recorded here per AC #3.
- **"Separating the signals changes a detail-stage decision (scope leak)."** It does not. `isFormMove`
  defaults false; CG-FS6 asserts `deepEqual` between passing `isFormMove:false` and omitting it, and
  all 30 pre-existing CG/CG-FR/CG-FC cases pass untouched. The detail gradient is byte-stable.
- **"The parse port regresses an autonomy-loop fixture."** The parser is verbatim and strictly more
  permissive (it accepts everything the naive one did, plus two-object/prose); `node --check` passes
  and `agentPick` now degrades to a recorded `done` instead of crashing the subject.

## Test coverage

| Concern | Test | In `npm test` |
|---|---|---|
| Parser: two-object / prose / nested / string / escape / throws | AR1–AR8 | ✅ |
| Form KEEP invariant to the vote draw | CG-FS1 (5 draws) | ✅ |
| Form ROLLBACK invariant to the vote draw | CG-FS2 (5 draws) | ✅ |
| Only wall-shell form moves are closure-decided | CG-FS3 | ✅ |
| Roof-form keeps the picture gradient | CG-FS4 | ✅ |
| Form-ready wall move falls through to picture | CG-FS5 | ✅ |
| Detail gradient byte-stable (no scope leak) | CG-FS6 + all prior CG | ✅ |
| Runners load with the new wiring | `node --check` + `GUARD_ONLY` smoke | ⛔ (runner) |
| Two-object crash case end-to-end | `node -e` spot-check | ⛔ (manual) |

### Gaps (honest)

- The **re-ask / fall-to-`done`** branch of both `agentPick`s is LLM-coupled and is **not** unit-tested
  (it would need a `requestText` mock). The *parser* it falls back through is fully tested; the
  fallback control flow is verified only by `node --check` + reading the diff. This matches how
  picture-climb's identical T-198 fallback was verified. Acceptable, recorded.
- `autonomy-loop`'s `evalBuild` got the hardened parser but **no** re-ask loop — the AC scoped the
  re-ask/fallback to `agentPick`. The parser swap alone removes `evalBuild`'s two-object crash; a
  malformed eval still throws (and is caught by `main`'s per-subject `try`, as before).

## Open concerns for the human reviewer

1. **`closureDecidedMove` is the policy crux.** It encodes "closure decides only the wall shell." If a
   future form hand changes wall closure but is *not* WALL-departmented (none today), it would be
   mis-routed onto the picture gradient. The predicate is derived from the registries, so adding such a
   hand is a registry edit away — but worth a glance when the next form hand lands.
2. **Form-ready fall-through (CG-FS5).** A wall-form move on an already-closed shell is judged on the
   picture (not rejected for "no gain"). This is deliberate (the form job is done), but it means the
   picture noise *can* still touch a wall-form move once `closureBefore ≥ 0.9`. By then the shell is
   closed, so the noise-sensitive regime is the detail regime — consistent with E-49's thesis — but
   it's the one place a wall-form pick still rides the vote.
3. **The real test is the metered re-climb (S-201/T-201-01).** These unit fixtures prove the *decision
   logic* is now deterministic and noise-invariant; whether the gatehouse actually finishes (shell
   closes → detail hands unlock → score climbs) is the live run T-201 owns. This ticket removes the
   noise; it does not by itself prove M1.

## Frozen instrument

`git status measurements/` clean; 0 `measurements/` files across the three commits. The change is
confined to `src/workshop/*` (the pure gate + the shared parser) and the two metered runners.
