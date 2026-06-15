# Review — T-005-03 iterative-multimodal.v1 archetype

Handoff document. What changed, how it's tested, and the open concerns a human (and
the dependent trial-run ticket T-005-04) needs before relying on this archetype.

## What changed

A second named, versioned prompting archetype — `iterative-multimodal.v1` — layered
on the existing seam exactly as `single-shot.v1` is, implementing spec §7 archetypes
2+3: a harness-orchestrated **generate → render → see → revise** loop.

### `src/config.mjs` (modify)
- **`ITERATIVE_MULTIMODAL_METHOD_ID = "iterative-multimodal.v1"`** (new) — single-
  sources the archetype id beside `DEFAULT_PROMPTING_METHOD_ID`, so every logged
  trial carries one spelling and a Phase-2 sweep stays greppable.

### `src/iterative-multimodal.mjs` (create)
PURE surface (all unit-tested, offline):
- **`ITERATIVE_MULTIMODAL`** — `{ id, version: 1, defaultRounds: 3, label }`.
- **`assertSpec`** — single-shot's field checks + `rounds` (positive int when set).
- **`seedMetadataFor`** — the identity pinned to THIS archetype, shared by both
  builders so round 0 and revisions cannot disagree.
- **`buildRound0Prompt`** — the initial-DRAFT prompt (target + style + binding
  whitelist + metadata pins), framed as iterative (not single-shot's "no revision").
- **`buildRevisionPrompt(spec, round)`** — the versioned revision policy: see the
  render, improve realism/proportion/depth + the named neoclassical detail (columns,
  entablature, pediment, steps, window rhythm), stay strictly in palette, emit the
  COMPLETE artifact. Identical across rounds except a counter header.
- **`isNoOpRevision`** — build-determining (`placements` + `style`) deep-equal for the
  early-stop condition.
- **`assertInPalette`** — the AC #3 palette-adherence gate (placements + manifest ⊆
  whitelist; `palette_id` matches; `minecraft:` normalized).
- **`assertTrialId`** — join-key stability across rounds (AC #4).
- **`buildRoundRecord` / `buildIterativeRecord`** (+ private `sumTotals`,
  `metadataPinLines`, `materialConstraintLines`) — the per-round + trial record,
  reusing `tallyUsage` / `renderSummary` so the record format never forks.

LIVE driver (thin glue, NOT unit-tested — spec §4):
- **`runIterativeTrial(spec)`** — round-0 text call → for each round render the
  current artifact (lazy-imported GL core) and feed the PNG back through the T-005-02
  multimodal seam → guard each round (trial-id, attribution, palette) → stop on round
  count or no-op → write per-round artifacts, all WIP renders, the concatenated
  transcript, and the iterative record under `trials/<trial_id>/`.

### `src/iterative-multimodal.test.mjs` (create)
- +22 offline unit tests over the real shipped `neoclassical` palette and plain
  objects. Never imports the SDK/GL; never calls `runIterativeTrial`.

No edits to `single-shot.mjs`, `smoke-trial.mjs`, `trial.mjs`, `sdk-binding.mjs`,
`render-tool.mjs`, `palette.mjs`, `briefs.mjs`, `artifact.mjs`, or any schema — the
archetype reuses their exported surfaces only (incl. `assertAttribution`, which was
already archetype-parameterized).

## Test coverage

- **`npm test`: 131/131 pass** (109 → 131). New tests cover: the descriptor id/
  version/defaultRounds; `assertSpec` accept/reject incl. bad `rounds`; round-0
  prompt (whole whitelist injected, target/style/description present, DRAFT framing
  and NOT "no revision", metadata pins, determinism, model override); revision prompt
  (detail vocabulary, whitelist re-injected, identity re-pinned, COMPLETE, rounds
  differ only by the counter, determinism); `isNoOpRevision` (identical/changed/
  metadata-churn/null); `assertInPalette` (pass + off-palette placement + bad
  manifest + palette_id mismatch); `assertTrialId` (match/drift/missing); and both
  record builders (mode, tallied usage, render-summary with no absolute path, summed
  totals, round/stop bookkeeping, identity from the artifact, `finishedAt` echoed).
- **Regression:** the entire prior suite stays green — this ticket adds files and one
  config constant, touching no existing behavior.

### Coverage gaps (by design, spec §4)
- **`runIterativeTrial` is not exercised by `npm test`** — it spawns the metered CLI
  and renders via headless GL, exactly as `runSingleShotTrial` / `runSmokeTrial` are
  untested. Its risk is contained to thin glue; every decision (prompts, stop, gates,
  records) is in the pure, tested surface. Verified statically (`node --check`, grep
  of the wiring) and slated for the manual round-trip below.

## AC status

- **AC #1 — versioned, unit-tested round-0 + revision prompt construction, plus a
  live `runIterativeTrial(spec)`:** ✓ implemented and tested (pure builders) + ✓
  driver written. Final end-to-end confirmation is the live run below.
- **AC #2 — renders current artifact and feeds the WIP image back each round for a
  configurable N (default 3):** ✓ by construction (`renderArtifact` →
  `requestDesignArtifactWithImage` per round; `rounds = spec.rounds ?? 3`).
  ⏳ live confirmation pending a metered run (inherits T-005-02's gating round-trip).
- **AC #3 — every round re-validated schema + palette-adherent; a malformed round
  fails loudly:** ✓ — the seam re-validates the schema and throws; `assertInPalette`
  adds the whitelist gate and throws naming offenders; both run before the round is
  logged, so no bad row is written.
- **AC #4 — each round attributable to `iterative-multimodal.v1`:** ✓ — every
  prompt re-pins `prompting_method_id` + `trial_id`; `assertAttribution` +
  `assertTrialId` guard every round; the record's identity is pulled from the artifact.

## Open concerns / TODOs

1. **Live stream-json image envelope unverified (inherited, the one real risk).**
   T-005-02's `review.md` flags that `claude -p --input-format stream-json` has not
   been round-tripped against the live CLI. This archetype builds on that seam as-is.
   If the CLI rejects the envelope, the documented fallback is the render MCP server
   via `--mcp-config` + `toToolResult` — a seam change in `sdk-binding.mjs`, **not** an
   archetype redesign (this loop would pass images unchanged). Resolve during the AC
   #2 round-trip. **This is the gating item before T-005-04 runs a real trial.**
2. **Palette-adherence gate is archetype-local, not the E-04 scorer.** `assertInPalette`
   is a narrow harness gate (whitelist membership + palette_id). The full E-04
   adherence layer is out of scope this phase; `palette.mjs`'s header anticipates a
   shared checker can later absorb this logic. When E-04 lands, lift `assertInPalette`
   into `palette.mjs` and have both consumers share it.
3. **No-op detection is structural, not perceptual.** `isNoOpRevision` compares
   `{placements, style}`, so two builds that render identically but reorder placements
   read as "changed" (loop continues to the round cap). This is conservative (never
   stops early on a real change) and deterministic; a stricter canonicalization
   (sort placements) was rejected as out of scope. The default 3-round cap bounds cost
   regardless.
4. **Image-token separate accounting (spec §9) not done.** Image tokens are captured
   inside each round's turn usage (`tallyUsage`), so totals are correct, but there is
   no distinctly-labelled image-token field. Out of scope; a later runner concern.
5. **Round 0 reuses the single-shot construction *shape* but not its code.** The two
   builders duplicate ~30 lines of scaffolding by design (D2) so each archetype is
   independently versioned. If a third archetype appears, consider extracting a shared
   prompt-section module — but not before, to avoid coupling versioned wordings.
6. **Committed** as `61a5973` (config + module + test only). Sibling working-tree
   changes were deliberately excluded.

## Critical issues needing human attention

None blocking the artifact set or the unit suite. The **one gating action** before
T-005-04 runs a real iterative trial is the **live AC #2 round-trip** (concern #1) —
the same item T-005-02 left pending — which decides whether the stream-json image
envelope works as-is or needs the `--mcp-config` fallback. It cannot run inside
`npm test`.
