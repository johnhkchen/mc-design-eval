# T-089-01 durable-consolidation — Progress

All four plan steps complete; four commits on main. `npm test` 1035/1035 green at every boundary.

## Step 0 — baseline ✅

- Suite green at **1035** (up from the planned-for 1027 — see deviation 1).
- **Deviation 1 (major input change, adapted before writing code): T-090-01 LANDED mid-ticket**
  (`2b694a4` pure core, `3a3a014` spray-paint wiring) — exactly the concurrency hazard research.md §7
  named. Consequences absorbed: the fill + every census/gate in durable-skin run on the **exposure shell**
  (`skin:"exposure"`, the camera's truth) instead of the projection skin the design drafted; the cottage
  policy was copied from the CURRENT spray-paint `ZONE_POLICY` (roof.preserve gains `dark_oak_log` for the
  gable framing the full-shell fill now reaches); the T-090 band instrument (roof-materials ≥ 0.9, upper
  displaced-field residue ≤ 0.05) was adopted as an additional terminal throw, with the residue check made
  registry-conditional (it is meaningless where base and upper share a dominant — the gatehouse).
  T-090's live cottage spray-paint records sat **uncommitted in the worktree** throughout; all commits
  here were path-scoped to avoid touching them.
- Oblique angle names confirmed: `-x-z` = azimuth 225°.

## Step 1 — the runner, cottage (commit `1364580`) ✅

`benchmarks/sculpture/durable-skin.mjs` + `skin:cottage`/`skin:gatehouse` scripts + .gitignore stanza.
Live cottage run, first try after wiring: substitution `{stone_bricks→tuff, white_terracotta→sandstone}`
**agrees with the committed value-select record** (the planned cross-check); fill 2454/2884 on the shell;
splat-only upper **5%** REJECT → final upper **88%** sandstone PASS (base 71% tuff, roof 88% spruce);
bands 1.0 / 0; courses 0.784→0.827; salt 262 stripped; double-run byte-identical (9,707 placements,
sha `722af44b…`); `--offline` green; renders + strip eyeballed (cream band restored, oblique roof clean).
- **Deviation 2 (design refinement, recorded in the runner comment):** the per-face acceptance is
  deterministic — coverage gate (T-088) decides; the front resemblance delta is computed AFTER the build
  from renders and recorded as **evidence**, never a gate input. Rationale: GL output cannot be allowed to
  change the artifact if the double-run hash is to mean anything; this is spray-paint's own `gateBlind`
  rationale (the concept IS the truth for the front) promoted to the rule.

## Step 2 — gatehouse (commit with both records) ✅

First-ever end-to-end gatehouse skin. Zoning needed **no registry override** (base/upper share the wall
dominant, so the divide is low-stakes as designed; roof zone membership clean). Value-true switched the
wall field `stone_bricks → polished_basalt` (true ΔE 9.49 → 4.9 — a genuine value win; texture-identity
trade named); deepslate/oak kept by margin/prior; cobble + door planks thin-sample keeps. Roof coverage
**44% → 100%**; splat-only REJECT → final PASS; courses 0.728→0.784; salt 79 stripped; reproducible
(10,598 placements, sha `8a30c191…`); `--offline` green. Strip + oblique eyeballed (uniform dark tile
roof, basalt walls near the concept's value, timber arch intact).

## Step 3 — triptych refresh (commit) ✅

`resemblance.mjs` SUBJECTS re-pointed (cottage + gatehouse → `durable-skin/<s>/artifact.json`;
`committedRender` → the refreshed `resemblance/<s>-minecraft.png`, retiring the pre-lens-fix pointers).
Live runs (one metered judge call each — the only metered calls this ticket): cottage meshIoU 0.928,
verdict `drifted` (gap material-zoning@roof); gatehouse meshIoU 0.916, `drifted` (gap form@walls/
roofline). `--offline` replays green for both. Frames committed: `durable-{cottage,gatehouse}-{before,
after,strip}.png`.
- **Deviation 3 (honest finding, not a fix):** front-face resemblance evidence went **0.35 → 0.30** on
  the cottage (flat 0.344 on the gatehouse) — the value-true band reads slightly further from the concept
  under the per-face metric, and renamed blocks depress the named-set score (cottage set 0.5). Recorded
  prominently in the record, the learnings section, and the handoff rather than smoothed over: E-24's
  claim is coverage/coherence/value-truth/reproducibility, not a resemblance jump.

## Step 4 — knowledge + handoff (commit) ✅

`design-learnings.md` gains the **E-24 durable high-quality results** section (splat-can't-establish-a-
dominant with both subjects' numbers, value-true hue-vs-identity trade, the gate's both-ways proof, the
durable rule + determinism statement, six named over/under-reaches). `pr/assets/durable-skins.md` is the
E-12 handoff (per-subject table, reproducibility section, what-this-does-NOT-claim). Final sweep: tests
1035/1035, both `--offline` asserts green.

## Acceptance criteria — all met

1. ✅ single named script per subject, end-to-end, zero hand edits (gates are throws — a failing skin
   cannot write a record);
2. ✅ reproducibility: double-execution byte-equality + recorded sha256 + `--offline` re-assert;
   determinism statement: no LLM on the path (upstream LLM artifacts are committed inputs);
3. ✅ cottage + gatehouse: dominants 88–100% on the shell, value-true blocks (cream not pink), coherent
   courses, coverage gate PASS, residuals named in each record's notes + the learnings;
4. ✅ refreshed triptychs + before/after vs the (replayed) E-23 splat-only skin, committed as frames;
5. ✅ design-learnings E-24 section, honest on over/under-reach;
6. ✅ E-12 handoff in `pr/assets/`; `npm test` green (1035).
