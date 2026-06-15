# Design — T-031-01 (pr-script-desk)

Decisions for the three script artifacts. Each decision is grounded in the research map (the
brief is authoritative; the README arc is the skeleton) and states what was rejected and why.

## The core tension this design resolves

The brief gives an 8-beat arc and two woven threads. A 30–60s LinkedIn video is *short* — at
typical pacing that's ~14–22 frames. The design problem is **packing a 5-rung climb + a velocity
engine + a 3-beat trust spine + pivot + explosion + breadth + vision into ≤60s without the
captions becoming a wall of text or the threads tangling.** Every decision below trades against
that budget.

---

## Decision 1 — Number of beats vs. number of frames

**Options:**
- (a) One frame per beat → 8 frames, ~40s. Clean, but loses the *ladder* (the climb's 5 rungs
  collapse into one "climb" beat and the "measured" credibility evaporates).
- (b) One frame per *rung* + one per remaining beat → ~14–16 frames. The score visibly steps.
- (c) Maximal — separate frame for every receipt → 22+ frames, ~70s+. Over budget, frantic.

**Decision: (b).** The whole thesis is *measured* climb; the rungs must each get their own frame
so the score overlay can step competent→strong on screen. I map the 8 README beats onto **15
storyboard frames**: 4 climb rungs get dedicated frames (rung 0 hook + rungs 2/3/4; rung 1 folds
into the velocity engine as "uncap → 8,018 blocks"), the trust beats are 3 fast flashes, and
pivot/explosion/realness/breadth/vision get one frame each. ~48s total — inside the 30–60s box
with breathing room.

**Rejected (a)** loses the science. **Rejected (c)** breaks the LinkedIn attention budget and
makes every caption a sub-second flash no one reads.

---

## Decision 2 — How the two threads weave (structure, not just content)

**Options:**
- (a) Thread A fully, then Thread B fully (two acts). Simple but reads as two videos stapled.
- (b) Strict alternation A/B/A/B. Mechanical; fights the natural arc (the pivot *is* a Thread-B
  beat that must land mid-climb).
- (c) **Spine + interrupt:** Thread A is the visible spine (the climbing score overlay runs
  continuously); Thread B beats *interrupt* at the two moments they earn — velocity right after
  the first grounded win (explains *how* the climb was fast), and the pivot at the climb's
  ceiling (the plot twist), then realness/breadth/vision pay off B at the end.

**Decision: (c).** It matches the brief's own framing ("Thread A is the intellectual payoff,
Thread B the spectacle; they converge on the sculptor vision") and the README arc ordering
(climb → velocity *engine* → pivot). The score overlay is the connective tissue that keeps A
present even during B interrupts.

**Rejected (a)/(b):** both ignore that the pivot is positionally locked mid-arc as the twist.

---

## Decision 3 — Where the three trust beats sit

**Options:**
- (a) A dedicated "honesty" act near the end. Risks the "self-flagellation montage" the brief
  explicitly warns against; also too late to do its job (it must *pre-empt* skepticism).
- (b) Front-loaded, all three before the climb. Kills momentum; viewer bounces before payoff.
- (c) **Threaded as flashes at their point of relevance:** the "we replaced our metric" flash
  rides *under* the first score overlay (when the viewer first sees a score, explain why we
  trust it); "we killed our shortcuts" flashes at the ceiling (right before the pivot — it
  motivates *why* we changed tools); "the honest ceiling / detail competent" rides the run-014
  hero frame (the `detail: competent` is *already on screen* in the overlay, so caption it).

**Decision: (c).** Each trust beat is welded to a frame that already needs to exist, so they cost
~0 extra runtime (~1–2s caption overlays per the brief's cadence note) and land exactly where the
skeptic's objection forms. This is the brief's "quick credibility flashes, not a wallow" made
concrete.

**Rejected (a)/(b):** wrong timing — a trust beat works only when it answers a doubt the viewer
is *currently* having.

---

## Decision 4 — Caption voice & register

**Options:**
- (a) Voiceover-led (full narration, captions secondary). Strong, but assumes audio-on; ~40% of
  LinkedIn autoplay is muted, and a VO script commits the production desk to recording.
- (b) **Caption-led, VO-optional:** on-screen captions carry the whole story silently;
  `script.md` provides a parallel VO line per frame as an *optional* track the production desk
  can record or drop. Captions are terse (≤8 words ideal); VO lines are the fuller sentence.
- (c) Caption-only, no VO. Cheapest, but throws away the option and leaves S-034 nothing to
  record if they want audio.

**Decision: (b).** Muted-autoplay-safe by default, with VO as a free upgrade. `script.md` is
structured as `frame → caption (on-screen) → VO (optional)` so both tracks stay in sync and the
production desk picks. Register: declarative, receipts-forward, skeptic-respecting — short
sentences, a real number wherever the brief has one, zero hype adjectives ("stunning,"
"revolutionary" are banned; the score does the bragging).

**Rejected (a):** over-commits production. **Rejected (c):** wastes the VO option for free.

---

## Decision 5 — How the score overlay is specified

The overlay is a locked creative choice (ON). The script can't render it, but it must **tell the
asset/production desks exactly what each frame's overlay shows** or the "measured" claim is
hand-wavy.

**Decision:** every Thread-A storyboard frame carries an explicit `overlay:` field with the
*literal* categorical words from the receipts — e.g. rung 4 = `proportion strong · color strong ·
detail competent · fidelity strong`. The overlay steps are the dramatic beat; the storyboard
makes them a first-class column, not a note. Numbers (333 blocks, $1.08, 3/3) appear as overlay
chips, pulled verbatim from brief §9. **No number appears that isn't in the receipts table** —
enforced by tagging each overlay chip with its `[receipt]` source inline in `beats.md`.

---

## Decision 6 — Handling the gray-box (rung 0) and concept frames honestly

**The trap:** the hook morphs gray box → run 014. The gray box has no guaranteed PNG (it's the
journal-P1 333-block attempt), and run 014's "facade" is real but the *gorgeous* end-vision
frames are Gemini-Flash concepts.

**Decision:**
- The storyboard marks rung-0 as a **`[asset: describe/regenerate]`** frame, not a claimed
  existing render — flagging to S-033 that it must source or rebuild it. I do not assert a file.
- Every concept frame (pivot leap, explosion wall, breadth beat, Golden-Gate end) carries a
  literal on-screen caption tag **"concept"** per honesty guard §8, and the VO never calls a
  concept "a build." The "yep, that's real" frame is the *only* one captioned as the real,
  rotating voxel build.
- The vision end-frame is explicitly the **v1 sequencing**: "where it's heading," not "what we
  shipped." The script does not promise the real-AND-gorgeous payoff frame (post-E-11).

**Rejected:** any framing that lets a concept read as a build — it's the single fastest way to
lose the skeptic audience and violates the AC's honesty clause.

---

## Decision 7 — Total length & pacing target

**Decision:** **~48s**, vertical-or-square-agnostic. Pacing: hook 3s (the morph needs a beat to
register the "same model" claim); climb rungs ~2.5s each (score has to be readable); trust
flashes ~1.5s; pivot gets a held 3s (it's the twist, let it breathe); explosion 3s (fast cuts
within); realness rotation 4s (the rotation must complete enough arc to read as un-fakeable);
breadth 3s; vision 4s (the emotional close + CTA card). Sums inside 30–60s with ~3s of slack the
production desk can spend on transitions. The storyboard carries per-frame durations that sum
explicitly and are checked in Plan.

---

## What this design commits the three files to

- **`beats.md`** — 8 README beats, each expanded into its constituent frames, every climb beat
  naming its technique + score step, every claim tagged with its `[receipt]`.
- **`script.md`** — per-frame `caption` (muted-safe) + optional `VO`, in the locked voice.
- **`storyboard.md`** — a frame table: `# · beat · frame-source · overlay · caption · duration`,
  durations summing to ~48s, with the score-overlay steps and the 3-D rotation explicitly marked.
