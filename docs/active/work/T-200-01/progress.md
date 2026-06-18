# T-200-01 — Progress

Status: **Implementation complete.** All three planned commits landed; `npm test` green (2397/2397);
frozen instrument (`measurements/**`) untouched.

## Commits

1. **`feat(T-200-01): shared first-balanced-brace JSON parser + AR1-8 tests`**
   - `src/workshop/agent-reply.mjs` — `parseFirstJsonObject`, lifted verbatim from picture-climb.mjs.
   - `src/workshop/agent-reply.test.mjs` — AR1–AR8 (8/8 green). Includes the RDSPI artifacts.
2. **`feat(T-200-01): decide wall-shell form moves on closureOf (vote-noise-invariant)`**
   - `src/workshop/climb-gate.mjs` — `closureDecidedMove` export; `acceptsRound` `isFormMove` branch
     (closure-only while a form gap remains); `form` hoisted; JSDoc updated.
   - `src/workshop/climb-gate.test.mjs` — CG-FS1–FS6 (36/36 green for the file).
3. **`feat(T-200-01): wire isFormMove + shared parser into both climb runners`**
   - `picture-climb.mjs` — import `closureDecidedMove` + `parseFirstJsonObject`; inline `parse`
     re-pointed; `isFormMove: closureDecidedMove(pick.tool)` at the gate call.
   - `autonomy-loop.mjs` — import the shared parser (kills the latent two-object crash in `evalBuild`
     + `agentPick`); `agentPick` hardened with re-ask-once-then-`done`.

## Verification run

- `node --test src/workshop/agent-reply.test.mjs` → 8/8.
- `node --test src/workshop/climb-gate.test.mjs` → 36/36 (was 30; +6 CG-FS).
- `npm test` → **2397/2397** (was 2383; +8 AR +6 CG-FS).
- `node --check` on both runners → OK.
- `GUARD_ONLY=1 node …/picture-climb.mjs --subject gatehouse` → exit 0 ("exiting clean").
- Crash-case spot-check: `parseFirstJsonObject('{"tool":"close_shell"}{"tool":"done"}')` →
  `{tool:"close_shell"}` (the naive parser threw here).
- `closureDecidedMove('close_shell')===true`, `('apply_gable_roof')===false`.
- `git status measurements/` clean; 0 `measurements/` files in the 3 commits.

## Deviations from plan

None of substance. One detail worth recording: in `acceptsRound` the `formCredit` computation was
**hoisted** above the picture path (computed once, reused by both the new `isFormMove` branch and the
retained T-199 non-form clause) rather than left inline at its T-199 position. `formCredit` is pure, so
the non-form returns are byte-identical — proven by every pre-existing CG/CG-FC case passing untouched
and by CG-FS6's deepEqual(with-flag, without-flag).

## Acceptance criteria status

- [x] Form-stage/form-credit decision routed onto closureOf (deterministic) for wall-shell form moves;
      detail-stage picture gradient unchanged (CG-FS6 deepEqual + all prior CG green). Re-run stability
      shown on the abstracted fixture (CG-FS1/2 loop over the documented 0–76 vote draws → one decision).
- [x] Balanced-brace `agentPick` parse + re-ask-once-then-`done` fallback ported to `autonomy-loop.mjs`;
      unit test on a two-object reply (AR1) + a trailing-prose (AR2) / nested-brace (AR3) case (also
      brace-in-string AR4, escaped-quote AR5, leading-prose AR6, throw cases AR7/8).
- [x] Recorded honestly (see review.md): closureOf is sufficient for the **wall-shell** form decision
      on the gatehouse but **blind to roof form** — the named limitation; richer roof signal proposed,
      not built. Nothing in the detail path changed (asserted).
- [x] `npm test` green; frozen instrument untouched.
