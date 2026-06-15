# Research — T-031-01 (pr-script-desk)

Descriptive map of what exists for the script desk. The deliverable is three markdown files
in `pr/script/`; no code changes. This phase inventories the inputs, constraints, and the
exact contract the script must satisfy. No solutions proposed.

## What the ticket asks for

Epic E-12 / story S-031. Gated on the research brief (T-030-01, now complete). Write three
artifacts under `pr/script/`:

- `beats.md` — ordered story beats + the technique each frame unlocks.
- `script.md` — caption / voiceover lines.
- `storyboard.md` — frame → caption → duration, ~30–60s total.

These realize the **8-beat arc** already fixed in `pr/script/README.md`, against the **locked
creative choices**: Taj hero spine · categorical score overlay ON · Golden-Gate vision
end-frame · the pivot as plot twist.

## The two upstream inputs (both present, both authoritative)

1. **`pr/script/README.md`** — the *skeleton*. Names the 8 beats in order:
   hook → measured climb → velocity engine → pivot → explosion → "yep, that's real" →
   breadth → vision. It also states the two-thread weave (quality climb ↔ velocity/realness).
2. **`pr/research/audience-message-brief.md`** (T-030-01 output) — the *content + receipts*.
   The README §10 of the brief explicitly says: "this brief is the filled-in version of the
   8-beat arc already in `pr/script/README.md` — they are consistent." So the brief is the
   single source for *who*, *first words*, *caption spine*, *trust beats*, *what I can claim*,
   *ending + ask*. The script desk's job is to render the brief's spine into frame-level
   captions and timing — not to re-decide strategy.

## The contract the brief hands me (brief §10 / structure.md §"Interface")

The brief answers six questions the script must consume verbatim:

| Question | Source in brief | What it gives the script |
|----------|-----------------|--------------------------|
| Who am I writing for? | §1 | Primary = AI/ML-builder skeptic; secondary is a free pull, **not** a second script. |
| First frame + first words? | §2 | Gray box (333 blocks) → run 014 facade. Caption: *"Same model. Same game. The method changed."* |
| The caption spine? | §4 Thread A | Rung → technique → score → run ID ladder (5 rungs, 0→4). |
| Where do trust flashes go? | §5 | Three credibility beats, ~1–2s each, not a wallow. |
| What can I claim? | §9 | Receipts table — every number traces to a `summary.json` or the journal. |
| Ending + ask? | §6 + §7 | Sculptor vision + Golden-Gate end-frame; follow-for-the-method CTA. |

## Thread A — the measured climb (brief §4, the caption backbone)

The ladder, exactly as the brief fixes it (I must not smooth or invent):

| Rung | Technique added | Score (overall) | Receipt |
|------|-----------------|-----------------|---------|
| 0 | *capped* brief (gray box) | n/a — 333 blocks | journal P1 / attempt log |
| 1 | uncap + invite ambition | 8,018-block temple | `v0-singleshot` (journal) |
| 2 | + design-doc grounding | "best yet," $1.08, 1,372 blocks | `runs/003-v2-designdoc/` |
| 3 | + reference grounding (photo→build) | "visually strongest," 20,311 blocks | `runs/008-vRef-designdoc/` |
| 4 | + craft/color split + one connected plane | **strong (3/3)** | `runs/014-vRefRevise-designdoc/` |

Run 014 is the climb's endpoint to show on screen: proportion **strong**, color **strong**,
fidelity **strong**, `detail` **competent** (the honest holdout). Verified against
`runs/014-vRefRevise-designdoc/summary.json`: `seq 14`, `blocks 10013`, `costUsd ≈ 1.64`,
`seed 11`, `model claude-opus-4-8`, score dimensions match the brief.

## Thread B — velocity & "yep, that's real" (brief §4)

- **Velocity:** 26 runs across two days (2026-06-04 → 06-05). Confirmed: `benchmarks/temple-facade/runs/`
  holds 001–026. Facade scope keeps each run ~$0.76–$2.13 vs 30+ min full builds.
- **Transfer:** the two biggest wins (color-from-brief; "a facade is one connected plane")
  derived on the Taj, then generalized in one night to Hōryū-ji (019), Sainte-Chapelle (020),
  Arc de Triomphe (021), mausoleum (022), all holding `overall = strong (3/3)`.
- **The pivot (plot twist):** text-only JSON hits limits → ground on a reference image → the
  build inherits a proven palette + proportion. The mid-video visual leap.
- **The explosion:** a wall of palette-disciplined "bet-you-can't-do-this" builds.
- **"Yep, that's real":** the actual voxel build rotating in 3-D, rendered through our own rig
  (`prismarine-viewer` + real `minecraft-assets`). The turntable render itself is **S-032**,
  built in parallel — the script only *marks where it appears*, it doesn't produce it.

## Trust beats (brief §5 — the credibility spine, quick flashes)

1. **We replaced our own metric.** First numeric rubric saturated at mean ≈ 4, noise ≈ 0.4 →
   built the categorical judge (weak/competent/strong/exceptional, median-of-3).
2. **We killed our own shortcuts.** Best-of-N: $5.34, ~29 min, re-judged 3.67 — same band as a
   $0.76 one-shot. Detail-stacking *regressed* 4.0 → 3.33 (color 4 → 2.67).
3. **The honest ceiling.** `detail` stays competent; both detail levers failed (016 flat, 017
   regressed proportion); an overnight loop promoted nothing; the "structural ceiling" was our
   own cap, retracted in the journal.

## Frame inventory (what the storyboard can point at)

Verified on disk. `runs/` and `concepts/` are gitignored — referenced by path, copied in by the
assets desk (S-033), not by me.

- **Hero spine candidates (Taj):** `runs/{010,013,014,015}/render.png` +
  `concepts/taj-C-flash.png` (the Nano-Banana / Gemini-Flash concept). All present.
- **Breadth beat:** `concepts/{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png`. All present.
- **The gray box (rung 0):** no single render file named; it's the journal-P1 333-block attempt.
  The storyboard must treat it as a described frame the assets desk sources/regenerates, not a
  guaranteed existing PNG.

## Honesty guards (brief §8 — mandatory, carried downstream)

- **Concept ≠ real build.** `concepts/*.png` are Gemini-Flash *concept art* — caption every
  concept frame *as a concept*. The "yep, that's real" proof applies only to the voxel build.
- **v1-sequencing.** Today the real builds are rotatable-but-blockier; the gorgeous frames are
  concepts. v1 shows concepts as "where it's heading"; the real-AND-gorgeous hero payoff slots in
  **after** the sculptor (E-11) ships. Don't promise a frame that doesn't exist yet.
- **No invented metrics.** Every on-screen number traces to brief §9.

## Boundaries / what this ticket is NOT

- **Not the post copy.** The published LinkedIn copy is S-034's job (brief §10). My `script.md`
  is the in-video caption/voiceover, not the post body.
- **Not asset curation.** S-033 picks/normalizes the actual frames; I reference candidates and
  hand it a frame→caption→score→duration table to fulfill.
- **Not the turntable.** S-032 builds the orbit render; I only mark the beat.
- **Not strategy.** The brief already decided audience, hook, framing, CTA. I render it to frames.

## Constraints summary

- Total runtime ~30–60s (LinkedIn). Square 1:1 or vertical 4:5 (production decides; storyboard
  stays aspect-agnostic but pacing-aware).
- Score overlay ON throughout Thread A; the 3-D rotation proof must be explicitly marked.
- Captions written, not "TBD" (AC). Both threads woven. Pivot is the plot twist. Null/pivot
  trust beat included. No claimed builds we don't have.
