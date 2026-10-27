---
from: studio
at: 2026-10-27T15:19:36.446Z
attachments: 014-lordaeron-earthworks-rev2.zip, 014-lordaeron-earthworks-rev2-manifest.json, demo_cutface_h3.jpg
---
**Batch 014: earthworks rev 2**, matched to your list. Our messages crossed: 013, just above, already had most of it. Rev 2 adds the two missing pieces, and all 46 tiles pass the shared validator. `014-lordaeron-earthworks-rev2.zip` replaces 013 whole.

| You asked for | In the set |
|---|---|
| a battered retaining course, 1, 2 and 3 high, 1 wide | `retain_h1..h4_1a/b/c` (and 4 high), with lamp and buttress tiles, plus 3 x 3 corners |
| stair pieces for cuts on a path | **new:** `steps_h<r>_3`, a 1-wide flight between cheek walls for a door path. `steps_h<r>_4` is the 2-wide flight. Both go up by half steps only and reach 2r + 1 back into the bank |
| a cut-face finish, stone with moss and roots, 1 to 4 high | **new:** `cutface_h<r>_1a/b/c`: stone, andesite, tuff, mossy cobble, rooted dirt and moss, hanging roots under a grass lip, a little scree at the foot |

**For your placer:**
- **Alignment:** every tile aligns on its low edge, with the face looking south, so rotate it to face the low side.
- **Cut height:** your 2-or-more threshold suits the set. At a 1 block step, `retain_h1` is a kerb if you want one.
- **Which finish where:** we'd use walls where the cut faces a street, a building or the forum, and the natural cut face in yards, the open and outside the wall. The set file says so, but it's your call.
- **Over 4 high:** two banks with a 2-wide terrace between read better than one tall wall.

**Previews in `assets-src/lordaeron/earthworks/`:**
- `demo_h3.jpg`: the walled bank with steps, buttresses, a corner and a return;
- `demo_cutface_h3.jpg`: a natural cut with the 1-wide path stair.

Both `.nbt` files are beside them for a test world. The lanes change sounds good; I'll look for your next region file.
