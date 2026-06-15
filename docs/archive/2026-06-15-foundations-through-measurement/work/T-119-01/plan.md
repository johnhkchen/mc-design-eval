# T-119-01 pin-protection — Plan

Five commits, `npm test` green at every boundary. No live model/judge call anywhere in this plan —
the only runner executions are deterministic (zone:map, --offline asserts, --distill-only) or
refuse-before-spend verifications. Commits add T-119-01 paths only (sibling T-118-01 material in
the working tree stays untouched).

## Step 1 — the pin-guard policy core (commit 1)

1.1 Write `src/form/pin-guard.mjs`: `ROTATE_FLAG`, `PinGuardError`, `decidePinWrite`,
    `refusalMessage`, `preflightPins` (pure); `loadTrackedSet` / `isTracked` /
    `guardedWriteRecord` (thin IO, fail-closed on git error).
1.2 Write `src/form/pin-guard.test.mjs`:
    - decision matrix: untracked→write; tracked+identical→skip-identical; tracked+rotate→write;
      tracked+differs+no-rotate→refuse; missing-on-disk-but-tracked (deleted pin) → refuse.
    - refusal message: names the pin rel path, the reason, `--rotate-pins`, and
      `docs/knowledge/pin-rotation-policy.md`.
    - **kit-sweep regression fixture**: preflight with the four kit pin triples tracked, no
      rotate (the verbatim `npm run kit:extract --subject=barn` swallowed-flag shape: no subject
      filter survives) → one PinGuardError naming ALL committed pins.
    - flag-swallow fail-closed: `rotate: undefined` behaves as refuse.
    - `guardedWriteRecord` on a tmpdir synthetic pin with an injected tracked set (write /
      skip-identical / refuse / rotate paths; rotation logs the pin name).
    - `loadTrackedSet` smoke against the real repo (contains `package.json`).

**Verify:** `npm test` green. **Commit 1:** `feat(E-30 T-119-01): pin-guard — refuse-by-default
guarded record writes, preflight-before-spend`.

## Step 2 — the pure distiller + component-skin refactor (commit 2)

2.1 Write `src/form/component-skin-distill.mjs`: `componentLayerFrom` (moved verbatim from
    component-skin.mjs:54–88, contents-fed), `deriveChainExitCode`, `zoneMapRepinFrom` (moved
    from :204–245), `distillComponentSkin` (record assembly :181–201, exitCode parameterized).
    Header notes the derive-not-carry divergence from the `--distill-only` precedent.
2.2 Write `src/form/component-skin-distill.test.mjs` (synthetic parts only this commit):
    exit-code matrix incl. REFUSAL→2; layer findings; repin added/shifted/removed/identical;
    **judge-unreachability import-graph walk** (no sdk-binding / judge-reply / node:child_process
    transitively).
2.3 Refactor `benchmarks/sculpture/component-skin.mjs`:
    - `componentLayer(key, def)` → IO wrapper over `componentLayerFrom` (export intact for
      reconstructed-milestone.mjs:44).
    - live path: assemble via `distillComponentSkin` with the real child exit code; writes
      (record/md/repin) via `guardedWriteRecord`; preflight `component-skin/<k>.{json,md}` +
      milestone + gate record paths before `spawnMilestone`; forward `ROTATE_FLAG`.
    - new `distillMain()` (no spawn token in its body), dispatched before the live section on
      `--distill-only`.
2.4 **Verify:** `npm test` green; `node benchmarks/sculpture/component-skin.mjs --subject cottage
    --distill-only` and `--subject gatehouse --distill-only` run judge-free and leave
    `git status` clean (byte-identical ⇒ in-sync pins; if NOT clean, inspect the diff — that is
    real drift, record it as a finding for step 5's rotation, restore from HEAD for now);
    `--subject church --distill-only` (no rotate) must REFUSE naming
    `component-skin/church.json` — the stale pin, untouched.

**Commit 2:** `feat(E-30 T-119-01): judge-free reskin distillation — pure distiller,
component-skin --distill-only`.

## Step 3 — guard integration across the runners + conformance sweep (commit 3)

3.1 `kit-extract.mjs`: preflight selected subjects' `kit/<k>.{json,raw.json,md}` before the first
    `callModel`; three writes → guarded. 3.2 `multi-angle-gate.mjs`: live preflight at entry
    (before render/judge); record writes guarded; rejudge writes guarded with the T-114 sanction.
    3.3 `zone-map.mjs`: record writes guarded. 3.4 `styled-milestone.mjs`: record + artifact-JSON
    writes guarded; `spawnGate` forwards the flag. 3.5 `challenge-milestone.mjs`: same; its
    `spawnGate` gains `extraArgs`. 3.6 `generated-milestone.mjs`: writes guarded; flag forwarded.
    3.7 `reconstructed-milestone.mjs`: record writes guarded; flag forwarded. 3.8
    `durable-skin.mjs`: artifact + record writes guarded.
3.9 Write `src/form/pin-guard.conformance.test.mjs`: no top-level sdk-binding import in any
    sculpture runner; the nine runners import pin-guard; `distillMain` spawn-free; pinned
    raw-write expressions absent.
3.10 **Verify:** `npm test` green; `npm run zone:map` → `git status` clean (byte-identical legacy
    regeneration passes through the guard); `npm run gate:multi -- --subject cottage --label
    styled --offline` exit 0 (assert mode untouched); **the verbatim incident:**
    `npm run kit:extract --subject=barn` → refuses loudly BEFORE any model call, naming the kit
    pins (exit ≠ 0, no file modified); `npm run kit:extract -- --subject=barn --offline` →
    `git status` clean.

**Commit 3:** `feat(E-30 T-119-01): guarded pin writes across the record-writing runners — the
kit-sweep invocation now refuses before spend`.

## Step 4 — the policy doc (commit 4)

4.1 Write `docs/knowledge/pin-rotation-policy.md` (structure.md §policy: pin definition, rotation
    rule, standing sanctions, enforcement, residual-4 disposition).
4.2 `docs/knowledge/design-learnings.md`: short E-30 paragraph linking the policy; residual-4
    closure (verdict pins RETAINED as canonical — no verdict-owning run warranted; reskin records
    rotated judge-free).

**Commit 4:** `docs(E-30 T-119-01): pin-rotation policy — binding, citable; residual-4
disposition`.

## Step 5 — the rotation act + the all-legacy byte-match tripwire (commit 5)

5.1 `npm run reskin:church -- --distill-only --rotate-pins` — rotates
    `component-skin/church.{json,md}` (pipeline-failed → gated/REFUSAL, derived exit 2, current
    milestone shas); inspect the diff; if a `zone-map/church.reconstructed.json` repin appears,
    review its band diff before staging. Rotate cottage/gatehouse the same way ONLY if step 2.4
    found drift.
5.2 Enable the **byte-match tripwire** in `component-skin-distill.test.mjs`: for every subject
    with a committed `component-skin/<k>.json`, distillation from committed inputs reproduces the
    pin byte-identically (and the committed `.reconstructed.json` repins where they exist).
5.3 **Verify:** `npm test` green (tripwire now holds on all legacy subjects);
    `--distill-only` re-run on church → `git status` clean.

**Commit 5:** `feat(E-30 T-119-01): rotate the stale reskin pin under the policy — church
component-skin record re-distilled judge-free (retired pin named here), byte-match tripwire armed`.

## Step 6 — close out (no code)

6.1 Full `npm test`; confirm working tree carries only sibling T-118-01 material.
6.2 `progress.md` (running during steps 1–5), then `review.md`.

## Testing strategy summary

- **Unit:** pin-guard decision matrix + regression fixture; distiller synthetic matrix.
- **Structural:** conformance sweep (closed over sculpture runners); import-graph
  judge-unreachability.
- **Against committed data:** byte-match tripwire (AC 1's byte-match clause, standing forever).
- **Live-shaped, spend-free:** the four step-3.10/2.4 runner invocations, incl. the verbatim
  incident replay.

## Risks & contingencies

- **Cottage/gatehouse distill drift** (step 2.4): possible if milestone records moved since T-106
  (T-113 re-ran church only, but verify). Contingency: named rotation in step 5, not a silent fix.
- **Artifact-write guard friction**: a future legit pipeline change re-running a chain will
  refuse on changed artifact bytes without the flag — intended (that IS a rotation); the policy
  doc says so explicitly.
- **Record key-order byte-match**: the assembly moves wholesale into the distiller to keep key
  order; the tripwire catches any slip immediately.
