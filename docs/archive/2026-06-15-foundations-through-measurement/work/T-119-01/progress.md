# T-119-01 pin-protection — Progress

All plan steps complete. Five commits on `main`, `npm test` green at every boundary
(1560 → 1575 → 1580 → 1580 → 1581).

| Step | Commit | Content | Verification |
|---|---|---|---|
| 1 | `ff63d6a` | `src/form/pin-guard.mjs` + tests: decidePinWrite matrix, preflightPins, guardedWriteRecord, `--rotate-pins`, fail-closed git IO | 14 unit tests incl. the swallowed-`--` regression fixture and flag-swallow fail-closed |
| 2 | `cb59dea` | `src/form/component-skin-distill.mjs` (pure: layer, exit contract, repin diff, full record assembly) + synthetic tests + import-graph judge-unreachability; `component-skin.mjs` refactored — `--distill-only` via spawn-free `distillMain`, live preflight before the chain, guarded writes, flag forwarding | 12 tests; live distill runs on cottage/gatehouse refused at the guard, exposing that ALL THREE reskin pins were stale (plan's drift contingency — recorded, not silently fixed) |
| 3 | `7fcfe42` | Guard integration in the other 8 pin-writers (kit-extract preflight-before-callModel, gate preflight-before-judge, zone-map, styled/challenge/generated/reconstructed milestones, durable-skin) + `pin-guard.conformance.test.mjs` (closed runner list, banned raw-write idioms, preflight-before-spend source-order checks, spawn-free distillMain) | zone:map regenerated all 4 maps byte-identically through the guard; gate `--offline` exit 0; kit `--offline` clean; **verbatim incident replay**: `npm run kit:extract --subject=barn` refused naming all 12 kit pins, zero files touched, zero spend |
| 4 | `63751e1` | `docs/knowledge/pin-rotation-policy.md` (binding, citable) + design-learnings link with the residual-4 disposition | — |
| 5 | `0eb35c6` | Rotation act: `--distill-only --rotate-pins` on cottage/gatehouse/church (retired pins named in the commit); F1 byte-match tripwire armed for all committed reskin pins + their repins | tripwire green; re-distill without the flag is a clean no-op (skip-identical); full suite 1581 |

## Deviations from plan

1. **Drift contingency fired (plan §risks):** cottage and gatehouse reskin pins were stale too,
   not church alone — the committed styled milestone records had been re-cut by T-108/109/111/113
   while the T-106 component-skin summaries stayed. All three rotated in step 5, named.
2. **Church gate outcome:** research.md anticipated REFUSAL/exit 2; the current committed
   `styled/church.json` is a decided FAIL 12/2 (the T-114 refusal resolution is already folded
   into the re-cut milestone record). The rotated record mirrors the milestone record exactly.
3. **Conformance rule 2 scoped to pin-writers:** six legacy E-23-era runners statically import
   sdk-binding; the "dynamic-import-only" seam rule applies to the nine pin-writing runners
   (the meaningful property), not all of `benchmarks/sculpture/`.
4. **Byte-match tripwire is self-contained:** it derives each pin's rebuild spec from the pin
   itself (layer input paths incl. the church regularizedShell override, milestone record path,
   runner) instead of importing the SUBJECTS registry — no heavy runner imports in the suite.

## Concurrency note

Sibling T-118-01 work landed interleaved (`ad18214`, `6c4ff9c`) — no file overlap; this ticket's
commits touched only its own paths. Working-tree residue (Lisa state, other tickets' frames) left
untouched.
