# Plan — T-031-01 (pr-script-desk)

Ordered, independently-verifiable steps to produce the three script artifacts. Each step ends
with a check. The work is writing markdown, so "tests" are content assertions against the brief's
receipts and the ACs — there is no code to unit-test.

## Verification criteria (the ACs, made checkable)

| AC | Check |
|----|-------|
| AC1 — all three files exist, 8-beat arc, both threads woven | `ls pr/script/{beats,script,storyboard}.md` succeeds; beats.md has all 8 README beats; Thread A and Thread B both appear. |
| AC2 — each climb beat names its technique + score step; captions written | Each of rungs 2/3/4 names design-doc / reference / one-plane; pivot named; score steps competent→strong present; no caption is "TBD". |
| AC3 — storyboard durations sum to 30–60s; score overlay + 3-D rotation marked | Sum the duration column = ~44.5s ∈ [30,60]; F10 marked as rotation; overlay steps listed. |
| AC4 — honest: null/pivot trust beat present; no claimed builds we lack; v1-sequencing respected | F07 (shortcuts null) present; concept frames tagged `[concept]`; vision framed as "where it's heading". |
| Receipts integrity | Every number in beats.md/script.md/storyboard.md appears in brief §9 / a `summary.json`. |

## Step 1 — Lock the frame map (F01–F15)

Transcribe the 15-frame table from structure.md as the single shared spine. This is the join key
for all three files; do it first so they can't diverge.

- **Do:** write the canonical F01–F15 list (id · beat · thread · source · duration) into a scratch
  ordering I reuse verbatim in each file.
- **Verify:** 15 IDs, contiguous; durations listed; every climb rung (0/2/3/4) + every Thread-B
  beat (velocity/pivot/explosion/realness/breadth) + vision + CTA represented. Cross-check against
  README's 8 beats — each maps to ≥1 frame.

## Step 2 — Write `beats.md`

Render the 8 beats with their frames, techniques, score steps, and inline receipts.

- **Do:** header + thesis; how-to-read; 8 beat subsections (each: name, README#, thread, F-IDs,
  technique unlocked, score step, `[receipt:…]`); the trust spine (3 flashes); the honesty ledger.
- **Verify (content asserts):**
  - Beat 2 names *design-doc grounding*, *reference grounding*, *one-plane fix*; Beat 4 names
    *image→3D pivot*. (AC2)
  - Score ladder shows competent → strong; hero (F04) lists `proportion/color/fidelity strong,
    detail competent`. (AC2, honesty)
  - Every numeric claim (333, 8,018, 1,372, $1.08, 20,311, 10,013, $1.64, 3/3, $5.34, ~29min,
    3.67, 4.0→3.33, mean≈4 noise≈0.4, 26 runs) has a `[receipt:…]` matching brief §9. (Receipts)
  - Trust beat F07 (best-of-N / detail regression) present. (AC4)

## Step 3 — Write `script.md`

Voice every frame: caption (muted-safe) + optional VO + overlay note.

- **Do:** voice note (register rules); per-frame `caption/VO/overlay` for F01–F15; CTA block (the
  two locked CTA lines, try-it soft-pedaled).
- **Verify:**
  - 15 frames each have a non-empty, non-"TBD" caption. (AC2)
  - No hype adjectives ("stunning/revolutionary/amazing"); captions ≤ ~8 words. (Decision 4)
  - F01 caption = the hook line "Same model. Same game. The method changed." (brief §2)
  - Every concept-frame overlay carries `[concept]`; F10 caption asserts the *real* rotating
    build only. (AC4, honesty)
  - CTA = follow-for-the-method + "which technique would you have bet on?"; no product promise.

## Step 4 — Write `storyboard.md`

The timing + asset contract.

- **Do:** header + totals; the frame table (#·beat·source·overlay·caption·duration); explicit
  sum-check; marked-beats callout (overlay steps + F10 rotation); per-`[asset]`/`[concept]`
  handoff notes for S-033.
- **Verify:**
  - Duration column sums to ~44.5s; assert ∈ [30,60]. (AC3)
  - "Score overlay steps" list names F01→F04 (+ flash frames); "3-D rotation proof" names F10. (AC3)
  - Every source is either a real path (`runs/…/render.png`), a `[concept]` tag, an `[asset:
    describe]` tag, or an S-032/S-034-produced asset — none asserts a file we don't have. (AC4)

## Step 5 — Cross-file consistency pass

The three files share F01–F15; verify they agree.

- **Do:** diff the frame identity/order across the three files; reconcile any caption that appears
  in two files so they don't contradict.
- **Verify:** same 15 IDs, same order, same beat assignment in all three; no number in any file
  that's absent from brief §9; honesty tags (`[concept]`, `[asset]`) present in both beats.md and
  storyboard.md.

## Step 6 — Commit

- **Do:** `git add pr/script/beats.md pr/script/script.md pr/script/storyboard.md docs/active/work/T-031-01/`
  and commit with a `docs(E-12/S-031):` message. Single atomic commit — the three files are one
  deliverable.
- **Verify:** `git status` clean for these paths; commit present.

## Testing strategy

- **No unit/integration tests** — comms artifacts, no code path. The "test suite" is the content
  assertions in Steps 2–5, checked by re-reading against brief §9 and the ACs.
- **Receipt audit** is the highest-value check: grep each on-screen number back to the brief's
  receipts table. A number with no receipt is the one failure mode that loses this audience.
- **The skeptic read-through** (Review phase): read the script as the primary audience (an
  LLM-builder who assumes it's cherry-picked) and confirm each likely objection has a trust flash
  positioned to answer it.

## Risks & mitigations

- **R1 — over-length.** 15 frames could creep past 60s if durations inflate. *Mitigation:* trust
  beats are 1.5s overlay flashes on reused frames, not new shots; sum-check in Step 4 is a gate.
- **R2 — concept/real blur.** Easiest honesty failure. *Mitigation:* `[concept]` tag mandatory on
  every concept frame in two files; F10 is the only "real build" claim.
- **R3 — frame F01 gray box has no guaranteed PNG.** *Mitigation:* tag `[asset: describe]`, hand
  S-033 the sourcing instruction; never assert a file.
- **R4 — promising the post-sculptor payoff.** *Mitigation:* vision frame F13 explicitly captioned
  "where it's heading" (v1-sequencing), not "what we built".
- **R5 — the three files drifting.** *Mitigation:* Step 5 consistency pass on the shared F-IDs.
