# Structure — T-030-01 (pr-research-desk)

The blueprint for the deliverable. Not prose-the-content — the *shape*: which file, its sections,
what each section must contain, and the interface it exposes to the script desk (S-031).

## Files

| File | Action | Purpose |
|------|--------|---------|
| `pr/research/audience-message-brief.md` | **create** | The sole deliverable (the AC artifact). |
| `docs/active/work/T-030-01/progress.md` | create | Implement-phase tracking. |
| `docs/active/work/T-030-01/review.md` | create | Review-phase handoff. |

No code, no schema, no test files — this is a comms artifact. Nothing else in the repo is
modified; the brief only *references* existing artifacts by path.

## `pr/research/audience-message-brief.md` — section blueprint

Ordered so the script desk can read top-to-bottom and start writing beats. Target ~180–210 lines.

### 0. Front matter / one-line thesis
- Title; a single bold sentence stating the message ("an engineered, *measured* quality climb…").
- A "how to use this brief" line pointing S-031 at the receipts table + the beat-mapping section.

### 1. Audience
- **Primary** (AI/ML builders & founders): who exactly + **what they already believe** (demos are
  cherry-picked; eval is hard; agent loops over-promise). 1 short paragraph + a "they reward / they
  punish" couplet.
- **Secondary** (creative-tools / Minecraft-adjacent): one line; served by the visual + realness
  proof, not by a separate message.
- **Interface contract:** S-031 writes for the primary; the secondary is a free pull, never a
  second script.

### 2. The 3-second hook
- The exact cold-open: gray box → strong facade morph, with the one-line tension caption ("Same
  model. Same game. The method changed.").
- The two receipts behind it (333-block capped box; run 014 strong 3/3) so the caption is true.
- A "do NOT open on…" guard list (score numbers / rotation / concept art) with the one-line reason.

### 3. The lead framing
- The single leading idea: **engineered quality climb measured by an instrument we built**.
- One paragraph stating why it leads and what hangs off it.
- An explicit "demoted, not dropped" list: self-judging loops, the pivot, velocity — where each
  re-enters as a thread/beat (so the script desk doesn't lose them).

### 4. The two threads (woven)
- **Thread A — the measured climb**: the ordered technique ladder with the *score* at each rung,
  each rung tagged with its run ID. Presented as a small table (rung → technique added → score →
  receipt). This is the backbone the captions hang on.
- **Thread B — velocity & "yep, that's real"**: dozens/day; techniques compound + **transfer**
  across five subjects (cite 019→022); the **pivot** (text-JSON → reference grounding); the
  **explosion**; the **3-D rotation** realness proof (voxel build through our own rig).
- A one-line "how they weave" note (A gives the intellectual payoff, B the spectacle; they meet at
  the sculptor vision).

### 5. Trust beats (the credibility spine)
- Three beats, each: the claim → the receipt → the one-line "why this builds trust."
  1. the judge exists because the numeric metric failed,
  2. we killed our own shortcuts (best-of-N; detail-stacking regression),
  3. the honest ceiling (`detail` competent; the promote-nothing night; the retracted "ceiling").
- A framing note: these are **quick credibility flashes, not a wallow** (per the epic).

### 6. The vision / end-frame
- The staged sculptor (E-11) + the Golden-Gate end-frame concept; "we're the sculptor, not the 2D
  tool." One short paragraph; flags it as the closing emotional beat.

### 7. The CTA
- Primary: **follow for the method/journal**; secondary: **discuss** ("which technique would you
  have bet on? we were wrong about best-of-N"); try-it soft-pedaled (+ the one-line why).

### 8. Honesty guards (carried downstream)
- **Concept ≠ real build** rule; **v1-sequencing** caveat (concepts captioned as concepts; the
  real-AND-gorgeous hero payoff slots in post-sculptor); **no invented metrics**.

### 9. Receipts table (the anti-fabrication appendix)
- A compact table of *every* citable claim → its source artifact/path, so S-031 can pull numbers
  without inventing any. Columns: claim · value · source. This is the interface guarantee that the
  AC "claims tied to real artifacts" survives into the script.

### 10. Handoff to S-031
- A 3–5 line "what the script desk does next" block: write for the primary, map captions onto the
  Thread-A ladder, weave the three trust beats as flashes, land on the vision, end on the CTA.
- An explicit pointer that the 8-beat arc in `pr/script/README.md` is *consistent* with this brief
  (so S-031 sees the brief as the filled-in version of the arc it already has).

## Interface to the script desk (the contract this brief satisfies)

S-031's `beats.md`/`script.md`/`storyboard.md` need, from this brief, unambiguous answers to:
1. *Who am I writing for?* → §1.
2. *What's the first frame + first words?* → §2.
3. *What's the spine the captions sit on?* → §4 Thread A table (rung → technique → score → run).
4. *Where do the credibility flashes go?* → §5.
5. *What can I claim without lying?* → §9 receipts table.
6. *Where does it end + what's the ask?* → §6 + §7.

If all six are answerable from the brief alone, AC #3 ("tight enough to brief S-031 directly") is met.

## Internal organization / ordering rules

- **Receipts before rhetoric.** Each persuasive claim is immediately followed by its run/journal
  citation inline; the §9 table is the consolidated backstop.
- **Tables for the load-bearing data** (Thread-A ladder, receipts) — scannable, hard to misquote.
- **No new numbers introduced anywhere** that don't appear in a run `summary.json` or the journal.
- **Honesty guards are a named section**, not scattered footnotes, so they can't be skipped.
- Keep prose tight (the brief is an internal working doc, not the published post — the *post copy*
  is S-034's job, downstream).
