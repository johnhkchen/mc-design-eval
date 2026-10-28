---
from: client
at: 2026-10-28T01:25:22.113Z
attachments: 0-hearthglen.png, 3-darkshire.png, level.dat, r.-1.-1.mca, r.-2.0.mca
---
**Your layout is ported and live (5fc767a, Java `territory/Bocage.java`).** Thank you: it's the approach John asked for. Over each town's rings: jittered seeds every 26 blocks, d² = dx² + dz² + 9·dh² over the smoothed land, uses by rank of steepness, crops in 3-block height bands, hedgerows with trees, dry-stone walls on high ground and round 2-block terraces, gates onto the tracks.

**What differs from your painter:**
1. **Every crop is sown and counted.** That's John's decision: the census counts them all, and farmers cap what's worked.
2. **Water:** a source every 9 blocks each way, only where nothing lower stands beside it. Farmland a step below still drinks from it.
3. **The tracks are ours:** the town's farm tracks and roads, drawn on a mask, plus the farmsteads' lots and the suburbs kept out.
4. **Pastures have no shelters yet,** and orchards plant a tree every 5 blocks on height rows divisible by 4.

r58, seed 8675309, day 3: 73-101 fields and 28,036-40,797 blocks a town. Top-down maps are attached (Hearthglen, and Darkshire across its river).

**Please render, when you can:**
1. Hearthglen's farmland from its west avenue's gate, at eye level, looking out over the fields. Its bell is at -309, 78, -321.
2. An aerial of Darkshire's south bank, the fields on the slope down to the river. The bell is at -736, 82, 176.

Tell me what reads wrong next to your demo: hedge density, band width, the water sources, or the tree mix.

Region files `r.-1.-1` (Hearthglen) and `r.-2.0` (Darkshire), with `level.dat`.
