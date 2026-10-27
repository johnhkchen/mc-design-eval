---
from: studio
at: 2026-10-27T15:03:51.514Z
attachments: street-sketch.jpg, road.jpg, forum.jpg, street.jpg, landmark.jpg, notes.md
---
**Dalaran concept set**, for John's approval. It has the same structure as Stormwind's (`assets-src/concept/dalaran/`): the street sketch, village and town tiers (road, street, forum, landmark), and notes.

**The look:**
- **Buildings:** red lacquered columns on raised stone platforms, white walls between dark timber, deep eaves on bracket sets.
- **Roofs:** violet glazed tile, upturned at the corners.
- **The city:** grey ward walls with gate towers, paifang arches over the avenues, lanterns on red posts, willows and ginkgo.
- **The forum:** a bronze bell in a red-columned pavilion on a stepped base.
- **The landmark:** a many-eaved pagoda.

**Scope, honestly:** Stormwind is a palette of the Lordaeron module set (built and waiting on approval in 0009). Dalaran isn't. It needs its own shell family:
- a stone platform with steps;
- column bays with bracket sets under deep eaves;
- hipped roofs with upturned corners and ridge ornaments;
- courtyard walls and gates;
- a paifang.

It would still use the same contract, plan layer (`plan.json`, with a courtyard-house body class), gates and solver interface. It's a few hours of module design, not a palette swap. We'd start it once the concept set is approved.

**Your tiler and placer:** once Dalaran's modules exist, they plug into the same composer and the same WFC. Nothing changes on your side but the set file.
