# Structure — T-031-01 (pr-script-desk)

The shape of the three deliverables: which file, its sections, what each must contain, and the
interface each exposes to the asset desk (S-033). No prose-the-content here — that's Implement.

## Files

| File | Action | Purpose |
|------|--------|---------|
| `pr/script/beats.md` | **create** | Ordered beats → frames; each frame's technique + score step + `[receipt]`. |
| `pr/script/script.md` | **create** | Per-frame on-screen caption + optional VO line, in the locked voice. |
| `pr/script/storyboard.md` | **create** | Frame table: #·beat·source·overlay·caption·duration; durations sum ~48s. |
| `docs/active/work/T-031-01/progress.md` | create | Implement-phase tracking. |
| `docs/active/work/T-031-01/review.md` | create | Review handoff. |

No code, no schema, no tests — comms artifacts. Nothing else in the repo is modified; the script
only *references* existing artifacts by path. `runs/`/`concepts/` are gitignored; S-033 copies
chosen frames in.

## The canonical 15-frame plan (shared spine across all three files)

All three files index the **same 15 frames** so the asset desk gets one consistent map. Frame IDs
`F01…F15`. This is the single source of frame identity; beats.md groups them by beat, storyboard
times them, script.md voices them.

| ID | Beat (README #) | Thread | Frame source (candidate) | ~dur |
|----|-----------------|--------|--------------------------|------|
| F01 | 1 Hook | A | gray box `[asset: describe]` → `runs/014/render.png` (morph) | 3.0 |
| F02 | 2 Climb r2 | A | `runs/003/render.png` (design-doc grounding) | 2.5 |
| F03 | 2 Climb r3 | A | `runs/008` or `runs/010/render.png` (reference grounding) | 2.5 |
| F04 | 2 Climb r4 | A | `runs/014/render.png` (one-plane, strong 3/3) | 3.0 |
| F05 | 5b Trust: metric | A-overlay | reuse F04 + overlay flash | 1.5 |
| F06 | 3 Velocity engine | B | runs-grid montage (001→026 thumbnails) | 3.0 |
| F07 | 5b Trust: shortcuts | B | best-of-N / detail-stack regression flash | 1.5 |
| F08 | 4 Pivot (twist) | B | text-JSON `runs/002` → `concepts/taj-C-flash.png` `[concept]` | 3.0 |
| F09 | 5 Explosion | B | wall of `concepts/*-C-flash.png` `[concept]` | 3.0 |
| F10 | 6 "Yep, that's real" | B | **turntable rotation** of real voxel build (S-032) | 4.0 |
| F11 | 5b Trust: ceiling | A | reuse F04, `detail competent` highlighted | 1.5 |
| F12 | 7 Breadth | B | `concepts/{horyuji,chapelle,arc,mausoleum}-C-flash.png` `[concept]` | 3.0 |
| F13 | 8 Vision | A+B | Golden-Gate end-frame concept (S-034 generates) `[concept]` | 3.0 |
| F14 | 8 Vision thesis | — | thesis card: "we're the sculptor, not the 2-D-to-3-D tool" | 2.5 |
| F15 | CTA | — | CTA card: follow-for-the-method + comment bait | 3.0 |

Sum ≈ **44.5s** (verified arithmetically in Plan; leaves slack inside 30–60s). Trust beats F05/
F07/F11 are overlay flashes welded to frames that already exist (Decision 3), so they add only
~1.5s each rather than a full shot.

## `pr/script/beats.md` — section blueprint

Target ~120–160 lines. Ordered so the asset desk reads top-to-bottom.

1. **Header + the one-line thesis** (pulled from the brief's one-sentence message).
2. **How to read this file** — 2 lines: beats map to frames `F01–F15`; every claim carries a
   `[receipt: …]`; the same IDs appear in storyboard.md/script.md.
3. **The 8 beats**, each a subsection:
   - Beat name + README number + which Thread.
   - The frames it owns (F-IDs).
   - **The technique it unlocks** (for climb beats: design-doc grounding / reference grounding /
     one-plane fix / image→3D pivot) — named explicitly per AC.
   - **The score step** (competent → strong), with the per-dimension words for the hero.
   - `[receipt: path/journal-ref]` on every factual claim.
4. **The trust spine** — the 3 flashes (F05/F07/F11), each: claim → receipt → why it builds trust.
5. **Honesty ledger** — restates the 3 guards (concept≠real, v1-sequencing, no invented numbers)
   as a checklist the downstream desks inherit.

## `pr/script/script.md` — section blueprint

Target ~90–130 lines. The interface: every frame ID gets a caption + optional VO.

1. **Header + voice note** — the locked register (declarative, receipts-forward, no hype
   adjectives; captions ≤8 words, muted-safe; VO optional/fuller).
2. **Per-frame entries `F01…F15`**, each three lines:
   - `caption:` the on-screen text (muted-autoplay-safe, terse).
   - `VO:` the optional voiceover sentence (fuller; production may drop it).
   - `overlay:` any score chip / `[concept]` tag / number the frame shows (so caption and overlay
     don't duplicate or contradict).
3. **CTA block** — the two CTA lines verbatim-ready (follow / comment bait), soft-pedal try-it.

## `pr/script/storyboard.md` — section blueprint

Target ~70–100 lines. The timing + asset contract for S-033.

1. **Header + totals line** — total runtime, aspect-agnostic note, pacing philosophy (1 line).
2. **The frame table** — columns: `# · beat · frame source (path or [asset]/[concept]) · overlay
   · caption (short) · duration(s)`. One row per F-ID.
3. **Sum-check line** — durations summed explicitly = ~44.5s, asserted inside 30–60s.
4. **Marked beats** — an explicit callout list: *where the score overlay steps* (F01→F04 + the
   trust-flash frames) and *where the 3-D rotation proof appears* (F10) — both required by AC.
5. **Asset handoff notes** — for each `[asset: describe]` / `[concept]` frame, a one-line
   instruction to S-033 (source it, regenerate it, or caption-as-concept).

## Interface to the asset desk (S-033) — the contract these files satisfy

S-033's `sequence.md` needs, from the script, unambiguous answers to:
1. *Which frames, in what order?* → the F01–F15 table (identical across all three files).
2. *What does each frame say?* → script.md captions + beats.md technique/score.
3. *What's the overlay/score on each?* → storyboard `overlay` column + beats.md score steps.
4. *How long is each?* → storyboard `duration` column (sums to ~44.5s).
5. *Which frames are real vs concept vs to-be-sourced?* → `[concept]`/`[asset]` tags + honesty
   ledger.

## Internal ordering rules

- **One frame map, three views.** F-IDs are the join key; never let the three files disagree on
  a frame's identity or order.
- **Receipts inline.** Every number in beats.md is immediately followed by `[receipt: …]`; the
  brief §9 table is the backstop. No number that isn't in a `summary.json` or the journal.
- **Honesty tags travel.** `[concept]` and `[asset: describe]` tags appear in *both* beats.md and
  storyboard.md so a downstream desk can't drop them.
- **Captions terse, VO fuller, overlay factual** — the three never duplicate the same words.
