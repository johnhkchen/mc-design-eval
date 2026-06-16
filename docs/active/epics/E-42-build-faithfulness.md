---
id: E-42
title: build-faithfulness
type: epic
status: open
priority: high
depends_on: [E-41]
spec: "§9"
stories: [S-171, S-172, S-173]
---

## Background (read this first — self-contained)

**Milestone rung: M1 in service of the M2 measure.** E-40/E-41 showed the *measure* keeps flooring partly
because the *builds are wrong* — the "matched" gatehouse scores ~2 against its **own** concept because it's
materially unfaithful (plank/log siding, no cobblestone) and sits under a roof-prism. You cannot measure
style distance until there is a build that is actually faithful to its concept. This epic supplies one.
Governed by `docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`. Queued **after
E-41** (E-41 confirms the style-distance term is correct on a clean signal; this epic gives it a faithful
build to finally separate the crater).

**Two threads, both known gaps:**
1. **Material faithfulness.** Construction applies the recognized program's material *roles*, so a rustic
   gatehouse is built in cobblestone, not a default plank. The gatehouse is plank precisely because it has
   **no recognition program** (it ran on hardcoded constants); program-less subjects get default materials.
2. **Roof as construction.** `roof-generate.mjs` fills a ~72%-of-the-build **solid material prism** (reads
   as planks, drowns the walls) and lays a **single ridge** (can't express the cottage's two perpendicular
   gables). Replace with a covering over the wall envelope + **multi-ridge per `masses[]`** — the long-
   deferred roof-as-construction work (old S-150 / T-160-03).

**The proof closes the loop with E-41:** a materially-faithful, properly-roofed matched build, fed back
through E-41's crater re-run — which should now **separate** (matched ≫ wrong-style) where it floored.

## Stories

- **S-171 — material faithfulness from the program.** Every subject has a recognition program; construction
  applies its material roles so the build matches the concept's materials. Gatehouse is the witness
  (cobblestone, not plank).
- **S-172 — roof as construction.** Kill the solid roof-prism (covering over the envelope, not a fill);
  multi-ridge per `masses[]` (the cottage's two gables). Barn/cottage are the witnesses.
- **S-173 — the faithfulness proof (closes the E-41 loop).** Produce a faithful matched build and re-run
  the E-41 crater: it separates, or the remaining gate is localized.

## How this epic can fail (state it up front)

- **Faithful materials, still no crater.** If a materially-faithful build still doesn't separate from
  wrong-style under E-41's term, the gate is the *term's distance scale*, not the build — back to E-41.
- **Roof-as-construction regresses geometry.** Replacing the prism may reopen the closure/coverage seams the
  wall track fought (narrow-roof fit) — guard with the existing closure metrics; report regressions.
- **Program coverage is the real wall.** If giving every subject a faithful program is the hard part (not
  the construction), that is the volume/recognition-coverage gap resurfacing — name it.

## Done when

A faithful matched build exists (materials match the concept; roof is constructed, not a prism; multi-mass
subjects get multi-ridge roofs), and E-41's crater re-run on it **separates** matched from wrong-style — or
the residual gate is localized with evidence. Frozen instrument untouched.
