---
id: E-05
title: feedback-and-rating-system
type: epic
status: open
priority: medium
depends_on: [E-02, E-04]
spec: "§10"
stories: []
---

## Goal

Build the **self-hosted, mobile feedback & rating system** (§10): a thin web app, bound to a Tailscale tailnet, that serves renders + the rubric to a phone and writes human scores back into the trial record. **Single-rater for Phase 1.**

## Why it matters

The human-scoring paths in §9 (qualitative rubric, optional head-to-head) need a way to get builds in front of a reviewer and scores back out — from a phone, from anywhere — without public infrastructure or hand-built auth. This makes human scoring a clean, attributable input to the matrix rather than an out-of-band step.

## Scope

**In:**
- Web app bound to the Tailscale interface (MagicDNS name); reachable from a phone on the tailnet with no public ingress, no port-forwarding, no separate login. Tailnet ACLs scope access; Funnel off by default.
- Per-trial view: render images (E-02), style intent + palette (E-01), a scoring form bound to the fixed rubric (E-04).
- Score write-back into the trial record keyed by §5 metadata. **Single human score per trial**, but the record carries a `rater` field (Tailscale `whoami`) so multi-rater is a no-migration add later.
- Mobile-first: image-forward, thumb-friendly, fast.

**Out:**
- Rendering, validating, running experiments, exporting schematics — it reads the trial store and writes scores (design principle 2).
- Multi-rater aggregation / inter-rater agreement (deferred; record shape leaves room).
- Head-to-head pairwise voting is **optional** for Phase 1 (open question, §12) — build the rubric path first.

## Candidate stories

- Tailscale-bound hosting + tailnet access (single-rater, `rater` from `whoami`).
- Mobile rubric scoring UI + score write-back to the trial record.
- (Optional) head-to-head pairwise view + vote write-back.

## Definition of done

- On a phone over the tailnet, a render + rubric loads and a submitted score lands in the trial record keyed by trial ID.
- No public exposure; access is tailnet-scoped.

## Open questions (from §12)

- Whether head-to-head runs in Phase 1 or waits until rubric scores justify the reviewer time.
