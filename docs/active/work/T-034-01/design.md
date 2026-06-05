# T-034-01 · Design — pr-production-desk

Four decisions, each grounded in Research. The desk delivers the four artifacts + a real
`rough-cut.mp4` + the generated Golden-Gate end-frame, honest and on-thesis.

---

## Decision 1 — Golden-Gate end-frame: invoke `baml-concept.mts` directly with a GG design doc

**Options considered**

- **(A) Extend `conceptart.mjs`** with a `goldengate` ref entry + reference photo. *Rejected:* the
  orchestrator's 5 refs are all temples backed by real `runs/<id>` design docs + prior renders for
  the locked **variant C (render-only)**; GG has neither a `references/*.png` (the dir is empty/
  gitignored) nor a prior prismarine render. Adding a ref forces variant A/base anyway, so the
  orchestrator buys nothing over calling the cell directly, and it pollutes the temple matrix.
- **(B) Bespoke `generateImage()` call** with a from-scratch GG prompt. *Rejected:* the ticket says
  "via the existing concept tooling (`baml-concept.mts` / `conceptart.mjs`)". Bypassing BAML drops
  the versioned prompt and the hard-limits (bold-block-only, black background, bright silhouette)
  that make a concept read as *Minecraft* and segment cleanly. We'd re-derive all of it.
- **(C, chosen) Drive `baml-concept.mts` directly**, exactly as `conceptart.mjs`'s `runCell()` does:
  pipe a JSON job on stdin with `model:"flash"`, `images:[]` (base/no-image variant — we have no GG
  render to refine), a hand-authored **`pr/production/goldengate-designdoc.md`**, and an `attached`
  instruction tuned for the bridge. The BAML `FacadeConceptPrompt` renders the prompt text; Nano
  Banana generates the image.

**Reconciling the "TEMPLE FACADE" wording.** The template hardcodes "temple," but the
`{{design_doc}}` carries the actual subject, massing, and palette, and `{{attached}}` carries fresh
framing. The hard-limits the template imposes are all *desirable* for this end-frame: a single
isolated structure on solid black, bold block-scale detail only, bright outer silhouette. I write
the GG design doc to **own the subject explicitly** ("Golden Gate Bridge — head-on front elevation
of the twin Art-Deco towers and main cables," International-Orange palette, stepped-block massing)
so the doc overrides the generic "temple" noun. Acceptable residual: the rendered prompt literally
says "temple facade" once — but the doc + attached dominate, and the output is captioned `[concept]
· where it's heading`, never claimed as a build. This is the **maximum reuse** path the ticket asks
for. *(See `[[reference-grounds-craft-not-color]]`: here the subject's own International Orange IS
the intended palette — there is no separate brief palette to protect, so I state the color in the
doc and let it win.)*

**Model:** `flash` (`gemini-3.1-flash-image-preview`) — matches the committed `*-C-flash.png`
series the cut already uses (visual consistency with F08/F09/F12), and it's the cheaper/faster cell.
**Output:** `benchmarks/temple-facade/concepts/goldengate-base-flash.png` (the tool's natural home,
gitignored) **then normalized** into `pr/assets/frames/concept-goldengate-vision.png` at 1080×1080
(committed, self-contained bundle — same pattern the asset desk used).

**Live-call risk & honesty floor.** `GEMINI_API_KEY` is in `.env`, so the call should succeed; the
client retries 5xx/429. If the API is unreachable this session, I will **not** fabricate an image —
the AC ("is generated") demands a real generation. The fallback is to capture the rendered prompt +
job and document the one-command repro in `assembly.md`, and place a clearly-labelled gray
"end-frame pending" card so the cut still runs — but I attempt the real generation first and expect
it to land.

---

## Decision 2 — Rough cut: build a real 15-frame `rough-cut.mp4` with burned captions (ffmpeg present)

`ffmpeg 8.1.1` is installed, so the README's MP4 branch is the target — a shot-list alone would
under-deliver. **Chosen:** a Node assembler (`pr/production/assemble.mjs`) that resolves every
F01–F15 to a 1080×1080 image, burns caption + overlay + `[concept]` tag, holds each for its
storyboard duration, and concats to `rough-cut.mp4`.

- **On-disk frames** (F02/F03/F04, F05+F11 reuse 014, F08/F09/F12, F10 placeholder) come straight
  from `pr/assets/frames/`.
- **F13** = the generated Golden-Gate frame (Decision 1).
- **To-generate cards** (F01 gray box, F06 velocity grid, F14 thesis, F15 CTA) are synthesized **at
  build time** by the assembler (solid-color canvas + `drawtext`), so the rough cut is complete and
  reproducible without hunting gitignored sources. F09's "wall" is rendered as a 5-up montage of the
  committed concept frames. F06's velocity grid is a card stating the real receipts (we can't reach
  the gitignored `runs/*/render.png` thumbs; the grid is a *quantity texture*, so a receipts card is
  an honest stand-in and is labelled as a production placeholder).
- **Captions/overlays** are burned with `drawtext` (white caption bottom-third; overlay chip
  top-left; `[concept]` tag top-right in amber on concept frames) — legible for muted autoplay.
- **Transitions:** simple hard cuts + per-frame holds for the rough cut (xfade is a nice-to-have the
  human editor adds). Total ≈ **40s** by construction (durations summed from `sequence.md`).

**Rejected:** (a) shot-list only — under-delivers given ffmpeg; (b) a single giant `filter_complex`
xfade chain — brittle to author/debug for 15 inputs; per-frame clip render + `concat` demuxer is
robust and re-runnable. We still **also** write the precise shot-list into `assembly.md` (belt-and-
suspenders + the AC's "OR" branch, useful when the human re-cuts in a real editor).

---

## Decision 3 — Master at 1:1 1080×1080, document the 4:5 letterbox

The curated frames are all 1:1 1080×1080. **Chosen:** master the rough cut at **1:1** (zero
resampling of the frames, matches `sequence.md`'s declared master) and **document** the 4:5 vertical
crop/letterbox as a one-line ffmpeg recipe in `spec.md`/`assembly.md` for the human's LinkedIn
upload. Rejected: producing 4:5 now — it would letterbox/crop the square frames and pick a format
decision that's cheap for the human to make later. 1:1 autoplays well in the LinkedIn feed and is
the safe default.

---

## Decision 4 — Caption style & post voice inherit the locked script voice

No new voice invented. `spec.md` codifies what `script.md` already locked: declarative, receipts-
forward, **no hype adjectives**, ≤~8-word captions for muted autoplay, score chip / `[concept]` tag
as overlays that never contradict the caption. `post.md` lifts the CTA block verbatim from
`script.md` (follow-for-method primary; "which technique would you have bet on?" comment bait;
**no "try it"** — no product exists). Hashtags chosen for the builder/LLM-eval audience, modest
count (LinkedIn rewards 3–5). Music notes: no licensed track shipped (out of scope) — `spec.md`
gives a tempo/mood brief + a sync map to the beats so the human picks a track.

---

## On-thesis & honesty (AC #4) — design-level guarantees

- The cut **leads with the climb and the receipts**, names the **null results** (F05 metric we
  replaced, F07 best-of-N that cost 7× for nothing, F11 the detail ceiling we retracted), and makes
  the **rotation (F10) the only real-build claim** — concepts are `[concept]`, the GG end-frame is
  `[concept] · where it's heading`. `post.md` mirrors this: the pivot and null results are in the
  body, not buried.
- The thesis — *a perfect 2-D→3-D scan still needs a sculptor; we're the sculptor* — is carried by
  F13→F14 and stated plainly in the post, **earned** by the measured climb, never over-promised
  into a product pitch.

## Artifact inventory this design implies

`pr/production/`: `spec.md`, `assembly.md`, `post.md`, `goldengate-designdoc.md`, `assemble.mjs`,
`rough-cut.mp4`. `pr/assets/frames/concept-goldengate-vision.png` (+ gitignored
`concepts/goldengate-base-flash.png`). Work: this `design.md`, then `structure.md`/`plan.md`/
`progress.md`/`review.md`.
