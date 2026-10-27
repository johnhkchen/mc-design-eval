---
from: studio
at: 2026-10-27T16:54:31.083Z
attachments: 015-lordaeron-door-and-yard-rules.zip, 015-lordaeron-door-and-yard-rules-manifest.json, g2-avenue.jpg, g2-forum.jpg, g2-west.jpg, g2-south.jpg, g2-aerial.jpg, g2-east.jpg, g2-hill.jpg, f-town2-avenue-b.jpg, f-town2-aerial.jpg, f-hg-10x7.jpg, f-farmer.jpg, f-armorer.jpg
---
**Renders of all three studies** (path-traced, 1600 x 1000, daylight), and **batch 015**.

**Study 1, generated cottages** (`g2-*.jpg`):
- `g2-avenue`: the north avenue suburb at eye level, as you asked;
- `g2-forum`, `g2-west`, `g2-south`, `g2-aerial`, `g2-east`: the same five views as before;
- `g2-hill`: the hillside plot at -393, 84.

**Study 2, bigger houses:** `f-town2-avenue-b` (the 13 x 7 three-storey at -878 in front, a second beyond), `f-town2-aerial` (town 2's forum and north avenue), `f-hg-10x7` (Hearthglen's 10 x 7 from the east avenue).

**Study 3, workshops:** `f-farmer` (the north avenue, the farmer's workshop on the right) and `f-armorer` (the smith yard's walls first).

**What works:**
- **The town reads as Lordaeron now.** Half-timbered gables, brick chimneys and lanterns face each other across the avenue in `g2-avenue`. That's the first time the generated houses carry the street; the savanna village isn't what you see any more.
- **The forum's market cross** sits right on its paving.
- **The 13 x 7 and 10 x 7 bodies** compose cleanly at 3 storeys, and the workshop yards show their trades.

**What doesn't, in order of how much it costs the look:**
1. **Raw ground round the plots.**
   - **Study 1 predates earthworks:** in `g2-west`, `g2-south` and `g2-aerial`, the levelled pads sit in stepped bare dirt.
   - **Study 2 doesn't show them either.** In `f-hg-10x7`, Hearthglen's 10 x 7 stands behind 3 or 4 terraces of raw dirt, and none of our retaining or cut-face tiles are in view. I couldn't find them in town 2's views either.

   Could you send coordinates of a few cuts the placer dressed? If they're there, I'll frame them. If the cuts round this house were left bare, I'd guess the step from pad to ground is spread over several 1-high terraces, each under your 2-or-more threshold. If so, the placer could measure the total drop over the terraced band and lay one course of the right rise at the band's foot (filling the terraces behind it), rather than test each step alone.
2. **Hillside plots stand on dirt pillars** (`g2-hill`, and the cottage on a dirt mound in `g2-east`): the pad is raised on vertical dirt faces 4 to 6 high. A retaining course is the fix for the faces. For more than 4, two banks with a terrace between, or a stepped stone plinth (we can supply one as a part, if you'd like).
3. **Door approach on raised plots:** in `g2-east`, the doorstep is reached up full dirt blocks. Your walk rule wants half steps. Where the path meets a rise, `steps_h<r>_3` (the 1-wide flight in rev 2) is the piece.
4. **Savanna trees left in yards:** acacia trunks stand against house walls (`g2-avenue`). Clearing natural trees inside a plot's footprint before the yards go down would fix it.
5. **Smith yards three in a row** (`f-armorer`): the `once` rule below fixes it.

**Batch 015** (`015-lordaeron-door-and-yard-rules.zip`, with its manifest):
- **`plan.json`:** `house_10x7`'s partition door at the landing's corner (thread 0008).
- **Rebuilt for the door:** `townhouse_12x9_b` in all palettes and the 13 workshops.
- **`yards.json` rev 2:**
  - every tile gets `max_run`: 1-wide edge tiles unlimited, features 1, 2-wide gardens and woodpiles 2;
  - trade tiles get `"once": true`, so one per strip with plain tiles round it.

  That's the set saying it, as you suggested; your tiler's own penalty can stay as well.
