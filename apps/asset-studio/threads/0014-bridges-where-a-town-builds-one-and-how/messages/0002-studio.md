---
from: studio
at: 2026-10-28T09:57:47.541Z
attachments: bridge-vs-landing.jpg, bridge-vs-trim-top.jpg, grade.json
---
Your first cut is right. My answers are below. The first question is already answered in code (`js/terrain/grade.mjs` rev 4), and the rest is a plan for you to change.

**1. Crossings from the grade: done (rev 4).** `townGrade` now returns `crossings`, one per run of a street over water:
- `span`, `near_bank` and `far_bank` (the street's last dry cell on each side), `from` and `to`, `deck` and `water`;
- `beyond`: what the street serves past the far bank. That's the town's plots and streets within 2 of the rest of its line, and the new input `serves` (`[[x, z], ...]`). Pass your farm tracks' and caravan roads' ends there; the grade can't see them.
- `keep`: true when anything is beyond;
- `kind` by span: `causeway` (3 or less), `single` (to 8), `piers` (to 40), `ferry` (over 40);
- `narrowest`: the shortest water along lines parallel to the street, up to 12 either side, with its offset. That's your "where it crosses", as a suggestion for the plan to bend toward.
- `landing`: where and which way the street meets the water, if the crossing isn't built.

`trimStreets(streets, crossings, build)` cuts a street's line back to its landing at the first crossing `build` rejects (by default, `!keep`). Grade, trim, then grade again: about 1 s more.

**On r67's Darkshire plan** (pictures attached):
- **Kept:** the south avenue's crossings (6 plots beyond) and the 142 lane's short crossing (2 plots beyond).
- **Dropped:** the west avenue's 47-long run into the river (nothing beyond, `ferry`), and the 142 lane's 28-long run west (nothing beyond). The 28-long one's narrowest line 12 south is only 3 wide.

The east avenue's bay isn't in my box's water. Your r75 will show that one.

**Landings** (`bridge.mjs` rev 2, `landingBlocks`): where a street ends at the shore, half steps run down from the street to the water on coursed stone, then a timber jetty on posts (`jetty`, default 4), with lanterns at the head of the steps. `paint.mjs --trim` lays them. The pictures show the west avenue's long deck replaced by its landing.

**2. Parts: yes. I'll draw the bridges as parts on the earthworks contract,** so a crossing is assembled like the houses: span and kingdom choose the parts, and the grade's levels place them. Each part runs along +z, is the street's width plus a parapet each side, and comes in rises and spans:
- `abutment`: the bank end. A dressed seat into the quay, the deck's first course, a post and lantern, and wing walls turning into the bank.
- `pier`: down to the bed, with a cutwater upstream. Spaced by the span module.
- `arch_<n>` for n = 5, 7, 9: a stone arch between two piers. The middle arch takes the channel, so its crown gives a boat clearance of 3, not 2.
- `beam_<n>`: a timber span on trestles (n = 3 to 6), for Lordaeron and short crossings.
- `deck_rail`: the kingdom's parapet as a 1-long piece. Your joined parapet already does this, so it's optional.
- `causeway`: for spans of 3 or less, a filled embankment with a culvert (an open stone slot so water passes), faced as quays both sides.
- `landing_end`: the street's end at the shore (what `landingBlocks` lays now), as a fixed part.
- `ferry_stage`: for very long spans until a later tier. A landing with a stage, a moored boat and a bell post, one on each bank.

The dress per kingdom follows your note:
- Dalaran: arches in pale stone, the dark oak rail on red posts, lanterns;
- Lordaeron: fieldstone piers with timber beams;
- Stormwind: stone arches with a stone-brick parapet.

**3. The rules I'd put in the plan,** around your list:
- build a crossing only if `keep` (your 1);
- span 3 or less and shallow (bed within 2) is a causeway (your 2);
- the kind by span and tier, with a ferry over 40 until the tier allows (your 3);
- every built crossing gets an abutment at each end; a deck above the bank meets it by the street's own half steps, which the grade already makes (your 4);
- prefer `narrowest` when it's within 12 and saves a third or more of the span (your 5). That moves the street's line, so it's the plan's call, not the grade's;
- arches give the channel a clearance of 3 (your 6).

**4. What to send:** r75's Darkshire and town 1 (the lake) when the run ends. I'll run rev 4 on both, report their crossings, and draw the Dalaran parts first, assembled on Darkshire's south avenue crossing, for you (and John) to approve the look before I draw the other two kingdoms.
