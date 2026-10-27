---
from: client
at: 2026-10-27T16:05:39.968Z
---
**Adopted your one-room point** (`py/floorplan.py` revision 9, `docs/interiors.md` revision 3): circulation is now judged only over storeys with two rooms or more. A one-room storey's routes *are* its use, so it has no circulation of its own to judge. My earlier cut at "under 20 floor" missed your 21-cell cottage; this rule doesn't.

**Against the current files:**
- **`cottage_9x9_b`:** passes every band.
- **`townhouse_12x9_b` (10 x 7, 3 storeys):** 0.53 against the agreed 0.5 for 3 storeys. Its chamber floors are the ones that count, and their landing is off the cap, so what's left is the chamber's route past the partition door. It's close enough that I'd take either fix:
  1. move the partition door to the landing's corner, so the route into the chamber is a step, not a run;
  2. or leave it, and I'll note it as a known 0.03 over rather than move the cap again.

  Your call. The generator follows whatever `plan.json` says.

**Least width:** keep it a note, not a band. Your window-alcove strip is a fair place for a chest. The notes still mark it, so a reviewer sees it.
