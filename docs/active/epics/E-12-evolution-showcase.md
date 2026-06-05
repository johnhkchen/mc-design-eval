---
id: E-12
title: evolution-showcase
type: epic
status: open
priority: medium
depends_on: []
spec: "(comms artifact — communicates §1; no spec section)"
stories: []
---

## Goal

Produce a **LinkedIn video artifact** — a "March of Progress" (ape→walking-man) **evolution of the
technique**: the same Minecraft temple facade improving stage by stage, each frame captioned with what
that iteration *added*, ending on the polished concept and the forward vision. Back it with a lightweight
in-repo **"PR room"** (`pr/`) — a few "desks" (research, script, assets, production) so the content is
crafted and reproducible, not ad hoc. Runs **concurrently** with the engineering epics; it draws on
artifacts we already have (the `runs/` renders, the `concepts/` images, the `design-learnings.md`
journey, the categorical scores).

## Why it matters

The project's actual thesis — *systematically find where output quality tops out and which techniques
achieve each jump* — is **already a visual story we can show**: a crude gray box becomes a stunning,
palette-disciplined facade through a measured sequence of techniques (reference grounding → one-plane →
the image-to-3D pivot → the staged sculptor). That "transformation, and it was engineered not lucky"
narrative is exactly what travels on LinkedIn, and we have the receipts (renders + climbing rubric
scores). One good artifact communicates the whole project.

## The "PR room" (`pr/`) — desks = workstreams

A folder of desks, each a staffer/role producing one part of the package:

- **`pr/research/` — audience & message (marketing / consumer-psych).** Who it's for (AI/ML builders,
  founders, the Minecraft-adjacent crowd), the hook, the framing ("engineered quality climb", autonomous
  self-judging loops, multimodal pivot), the call-to-action, the trust beats (honest null results, the
  pivot). Output: an audience+message brief.
- **`pr/script/` — narrative & script.** The evolution beats: which iterations to feature, what each
  *added*, the arc (crude → measured climb → the ceiling/pivot plot-twist → the leap → the sculptor
  vision), plus the on-screen captions / voiceover script and a storyboard with timing.
- **`pr/assets/` — primary assets.** The curated, ordered **evolution frame sequence** (one hero subject
  carried across stages + a breadth beat) with per-frame captions and the score progression — the
  canonical sequence the video is built from. Pulls from `runs/` + `concepts/`.
- **`pr/production/` — assembly & distribution.** The output spec (format/aspect/length for LinkedIn),
  the assembly plan/tooling, a rough cut if feasible (e.g. ffmpeg slideshow from the asset sequence), and
  the LinkedIn post copy.

## The content concept (to be tightened in discussion)

- **Hero spine = one subject's climb.** The **Taj facade** is ideal — we have it at many stages
  (text-JSON white box → colorful → integrated/strong → the Nano Banana concept), so the same building
  visibly improves: the instantly-legible "ape→man" effect.
- **Captions = the technique that unlocked each jump** ("+ design-doc grounding", "+ reference grounding",
  "+ one-plane fix", "+ image→3D pivot"), with the **categorical score climbing** overlaid (competent →
  strong) for "measured, not vibes" credibility.
- **A breadth beat** — the five references (Taj / Hōryū-ji / Sainte-Chapelle / Arc / mausoleum) concepts
  — to show the method generalizes.
- **Arc with a plot twist** — the text-JSON ceiling → the decision to change tools (the pivot) → the leap
  → the sculptor vision (Golden Gate ambition). The honest-failure beats build trust.

## Scope

**In:**
- The `pr/` room scaffold + the four desks' deliverables (research brief, script+storyboard, curated asset
  sequence with captions, production spec + post copy).
- The **canonical evolution sequence** (ordered frames + captions + scores) assembled from existing
  artifacts.
- A **rough-cut** the project can produce locally if tooling allows (ffmpeg image-sequence slideshow with
  captions); final polish is a human/video-tool step.

**Out:**
- Final high-production video editing (music licensing, motion graphics) — done in a real video tool by a
  human; we deliver the script, sequence, captions, spec, and rough cut.
- Any change to the engineering pipeline — this epic only *consumes* its outputs.
- Paid distribution / analytics.

## Candidate stories (to tighten with E-11's set)

- **Research desk** — audience + message + psych brief; the positioning and CTA.
- **Script desk** — evolution beats, captions/voiceover, storyboard with timing.
- **Asset desk** — curate + order the canonical evolution sequence (hero spine + breadth beat) with
  captions and scores from `runs/`/`concepts/`/journal.
- **Production desk** — output spec + assembly plan + rough cut + LinkedIn post copy.

## Definition of done

- `pr/` holds a complete content package: an audience/message brief, a script + storyboard, the curated
  ordered evolution sequence (frames + captions + scores), and a production spec + post copy.
- A **rough cut** (or a precise shot-list the human can assemble in minutes) exists, sequencing the hero
  climb + breadth beat to the arc, ending on the sculptor vision.
- The artifact is **honest and on-thesis** — it shows the measured climb (including the pivot/null
  results), not a cherry-picked highlight reel.

## Notes

- **Concurrent, independent** — no engineering dependency; it can start now against current artifacts and
  refresh as E-09/E-10/E-11 produce better frames (the sculptor's output becomes the triumphant final
  frame).
- **One hero subject** keeps the "ape→man" read clean; resist montaging many subjects in the spine (use
  the breadth beat for generalization instead).
