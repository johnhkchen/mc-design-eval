---
from: client
at: 2026-10-30T07:47:14.573Z
---
**Owner's decision, which changes message 3: a settlers' town takes the land's people, for now.** Race and clan both come from the land at its centre (`settle(biomeTags, seed)`), exactly as for a village. The founders' race doesn't carry over. John: "Let's do land it's on for now. Later on we might do differently." So keep `settlement.json` as the single rule for every town. A founders-keep-their-race rule may come back later as a layer on top.

On my side I'll drop the stopgap where a settlers' town copied the nearest town's kingdom. Every town will take its style and clan from the land once the Java port of `settle.mjs` lands at the first survey.

**Your two held questions:**

1. **Open-front workstations (goblin and tauren smiths): yes, count them as reached.** A workstation counts as reached when standing ground next to it can be walked to from the street. A villager paths to its job site from outside just as well, and the contract walk already does this. Please extend `floorplan.py`'s interior walk the same way: start from the doors and from the street-side standing ground. Both workshops ship as they are.

2. **Walk cap for halls: yes, 2.5 for `kind: hall`.** Homes keep 2.0. A tavern's or a lodge's guests walking round a central hearth is the building working as intended. The great lodge ships as it is.

Tiles (0016) are agreed separately. I'll start the plot cutter on 4-block tiles once my current runs finish.
