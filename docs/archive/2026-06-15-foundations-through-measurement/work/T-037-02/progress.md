# T-037-02 — Progress (run log)

Implement phase. Live, metered scale-48 moai build executed per `plan.md`. No source code changed —
this ticket *invokes* the fixed pipeline (T-035-01) and records evidence.

## Step 0 — Pre-flight ✅

- `npm run test:unit` → **312 pass / 0 fail** (~1.1 s). Pure surface (incl. `sculptureScaleCaps`) intact.
- Env confirmed: `GEMINI_API_KEY` present in `.env`; claude `-p` shim at `~/.local/bin/claude`;
  `baml_client/` present. No `baml:gen` needed.
- Args sanity: subject `"a moai statue"` (== anchors 003/010), scale `48` (≤ SCALE_MAX 64). Valid.

## Step 1 — Live run ✅

```
npm run bench:sculpture -- --subject "a moai statue" --scale 48 --note "T-037-02 scale-48 study"
```

Ran in background (exit 0, ~135 s wall). Stage log:
- stage 1 (design doc): 2208 chars
- stage 2 (concept image): `gemini-3-pro-image-preview`, ~1143 tok prompt, 21,008 ms
- stage 3 (3-D build): **33 ops**
- 3/4 still: **6283 blocks (unmapped 0)** → `render-3q.png`
- rock turntable: 24 frames → `turntable/`
- done: 6283 blocks, 21156/7272 tok, **$0.4002**

Run dir: `benchmarks/sculpture/runs/011-vConcept-a-moai-statue/` — **seq 11** (no race; 010 was the
in-flight scale-16 sibling at launch, this claimed 11). All outputs present: `design-doc.md`,
`design-doc.prompt.txt`, `build.prompt.txt`, `concept.png`, `artifact.json`, `render-3q.png`,
`summary.json`, `transcript.jsonl`, `turntable/` (24 frames).

Verification: `summary.json` parses, **`scale == 48`**, `blocks 6283`, `unmapped 0`, bounds
`[-7,0,-8]..[7,47,4]` (15×48×13, within ≲48³). Clean exit ⇒ AJV schema passed. No retry needed.

## Step 2 — Render inspection ✅

Read (as images): `concept.png`, `render-3q.png`, turntable frames 000/012/023, plus the scale-32
anchor (run 003) and scale-16 sibling (run 010) renders for cross-scale comparison.

Observation: the concept is a richly carved moai; the **build renders as a near-black, near-featureless
monolith**. Face is geometrically on −z (nose wedge + deepslate brow band; **no eye sockets built**),
but (a) value drift renders gray_concrete near-black so the deepslate carving is invisible, and (b) the
fixed 45° hero + front-right rock turntable (az 5°→85°) keep the face turned away in every saved frame.
Frame 023 (most side-on) shows the faintest profile step — cited as the "best" frame, still poor.

**Headline cross-scale finding:** fidelity is **non-monotonic** — ordering by readability is
**32 (best) > 16 > 48 (worst)**. The largest budget produced the *least* recognizable moai. Output
tokens *decreased* with scale (16:16,752 → 32:14,273 → 48:**7,272**) and the scale-48 build used only
33 coarse fill ops: the model spent the bigger canvas on *bulk*, not *carving*, and dropped the pukao
topknot + eye sockets that carried the read at 16/32. Full evidence + table in `fidelity-read.md`.

## Step 3 — `fidelity-read.md` ✅

Written: side-by-side links (concept ↔ render ↔ best frame ↔ both anchors), one-line faithfulness
(Poor), shortfall analysis, the **scale-48-vs-32-vs-16 table + non-monotonic finding**, categorical
judgment **`loose`→`failed` / `Weak`** (vs anchor `Competent/Strong`), and self-contained run facts.

## Step 4 — this file ✅

## Deviations from plan

- None material. Timeout was budgeted generous (~15 min) on the assumption that ~3.4× volume ⇒ longer
  wall time; in fact the run was **faster** than scale-32 (135 s vs 392 s) because the model emitted
  *fewer* output tokens / ops (the very behavior that drove the fidelity regression). Noted, not a problem.
- The scale-16 sibling (run 010, T-037-01) completed during this ticket, so its `summary.json` was
  available — the cross-scale note covers all three points (16/32/48), exceeding the AC's minimum.

## Next

Step 5 — commit run + evidence (feat) and the review handoff (docs). Step 6 — `review.md`.
