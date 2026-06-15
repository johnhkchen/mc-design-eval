# Review — T-030-01 (pr-research-desk)

Self-assessment and handoff for the audience+message brief. What changed, how it's verified, and
the open concerns a human reviewer should know before the script desk (S-031) consumes it.

## What changed

**Created (committed as `3c92ae8`):**
- `pr/research/audience-message-brief.md` — **the deliverable.** The audience+message brief for the
  E-12 evolution-showcase video. Ten sections: thesis · audience · 3-sec hook · lead framing · two
  woven threads (with the Thread-A climb-ladder table) · trust beats · vision/end-frame · CTA ·
  honesty guards · receipts table · S-031 handoff. ~150 lines.
- `docs/active/work/T-030-01/{research,design,structure,plan,progress}.md` — RDSPI work artifacts.

**Modified / deleted:** none. This is a comms ticket — it *consumes* existing artifacts and writes
one new markdown file. No code, no schema, no `.mjs`, no change to the engineering pipeline.

## How the acceptance criteria are met

- **AC #1 — brief exists with audience / hook / framing+two threads / trust beats / CTA.**
  ✅ All present: §1 audience (primary AI/ML builder-skeptic + secondary creative/Minecraft), §2
  hook (gray box → run-014 morph, *"Same model. The method changed."*), §3 lead framing (engineered
  measured climb) + §4 the two threads (climb + velocity/realness), §5 three trust beats, §7 CTA.
- **AC #2 — claims tied to real receipts, no fabricated numbers.**
  ✅ Every number traces to a source. Hard-audited against the files: runs 003 ($1.08/1,372),
  008 (20,311/$1.64), 005 ($5.34/28.8 min/3.67), 007 (4.0→3.33, color 2.67), 014 (strong 3/3,
  detail competent, 10,013/$1.64/seed 11). The §9 receipts table is the consolidated backstop;
  inline citations point at `runs/NNN/summary.json` and the journal.
- **AC #3 — tight enough to brief S-031 directly.**
  ✅ §10 answers the six interface questions (who / first frame+words / caption spine / trust-beat
  placement / claimable numbers / ending+ask) from the brief alone, and maps onto the 8-beat arc
  already in `pr/script/README.md`.

## Verification / "test" coverage

This ticket has **no automated tests** — there is no code path. The applicable verification was:
- **Receipt audit (the real gate):** all five load-bearing run citations re-checked directly
  against their `summary.json` (Python json read of blocks/cost/duration/score). **All exact.** One
  transparency note: best-of-N is 28.8 min, cited as "~29 min" (the journal's own rounding) — does
  not change meaning.
- **Section-presence + handoff read:** all AC-required sections present and non-empty; the six
  S-031 questions answerable from the brief.
- **Markdown sanity:** tables well-formed; committed cleanly; `git status` shows only intended files.

**Coverage gap (by nature, not omission):** the only true integration test of a *brief* is whether
the downstream desk can write from it. That happens when S-031 runs. If the script desk hits an
ambiguity, that's the integration signal — and it's cheap to amend.

## Open concerns / things a human should weigh

1. **The strongest realness frame doesn't exist yet (sequencing honesty).** The brief is explicit
   (§8 v1-sequencing guard): today's *real* builds are rotatable-but-blockier and the *gorgeous*
   frames are concepts. v1 must caption concepts *as concepts*; the real-AND-gorgeous hero payoff
   slots in after E-11 (the sculptor) ships. **Risk if ignored downstream:** S-033/S-034 could
   present a concept as the real build and break the whole honesty thesis. Flagged hard, twice.
2. **The "explosion of high-quality builds" beat is aspirational at v1.** We have 26 runs and a
   clear *climb*, but "a wall of bet-you-can't-do-this builds" is the strongest framing of the
   current corpus, not a separate proven asset. S-033 (assets) decides whether the existing renders
   carry that beat or whether it's softened. Not a fabricated claim — a framing the assets desk
   must be able to back with actual frames.
3. **Score-scale mixing (cosmetic, worth a glance).** The early climb rungs (runs 003/007/008) were
   judged on the **numeric v1** rubric (3.0–4.0); the endpoint (014) on the **categorical v2**
   (competent/strong). The brief presents the climb honestly but mixes the two scales in the §4
   ladder. That's *true to history* (the metric itself changed mid-project — itself a trust beat,
   §5.1), but S-031 should caption the overlay carefully so it doesn't imply one continuous 1–5
   scale all the way up. Called out here so the script desk handles the transition deliberately.
4. **The turntable proof is a sibling dependency.** The "yep, that's real" rotation asset is S-032,
   built in parallel — not yet produced. The brief correctly scopes it as *the* proof shot but the
   asset must actually exist before S-033/S-034 cut it. No action for this ticket; noted for the
   DAG.
5. **CTA assumes the journal will be public.** §7 pins the primary CTA to "I'm publishing the whole
   journal." `docs/knowledge/design-learnings.md` is in-repo; whether/where it's published is a
   human decision (S-034 / distribution). If it stays private, the CTA needs a different anchor.

## Critical issues needing human attention

**None blocking.** The deliverable is complete, honest, and receipt-backed. The five items above
are *downstream* coordination notes (sequencing honesty, asset existence, scale captioning,
publication), not defects in this brief. The one I'd most want a human to internalize is **#1** —
the concept-vs-real-build line is the honesty hinge of the entire video, and the brief is the first
place it's locked in for the script desk to inherit.

## Handoff

S-030 is done. **S-031 (script desk) is unblocked** — the brief answers all six interface questions
and fences every claim to a receipt. Next desks in the DAG: S-031 (script) consumes this; S-032
(turntable) runs in parallel; both feed S-033 (assets) → S-034 (production). The honesty guards in
§8 are the contract every downstream desk inherits.
