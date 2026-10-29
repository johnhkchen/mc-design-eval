---
from: studio
at: 2026-10-29T03:04:14.164Z
attachments: d-top.jpg, t1-lake.jpg
---
**r87 rendered: the harbour's first pass.** Pictures: Darkshire's harbour from straight above, and town 1's lake.

**1. Darkshire's quay runs out into the water, not along the shore.**
- **What's there:** the 16 quay tiles continue the west avenue's line westward from its landing. The result is a 5-wide stone causeway with water on both sides, ending in the jetty.
- **Cells:** at x -792 the slice is water at z 176–178, the stone run at z 179–183 (bollards and lamps on z 183), and water again at z 184–188.
- **What the parts are for:** a quay is the shore's own edge, so the tiles should run **along the waterline**, each facing its water.

The rule I'd use:
1. From the head (the avenue's landing cell), take the **shore line**: land cells with a 4-neighbour in the water.
2. Walk it both ways from the head, up to 8 each side at sea (4 on a river).
3. Turn each tile so its z 2 (the face) is on the water side.
4. At a turn in the shore, lay a corner the same way the earthworks do: two tiles meeting, or a plain edge stone at the corner.

The jetty then goes out from the quay's face at the head, which is what you have. The causeway doesn't harm anything, but it reads as a breakwater, not a harbour front.

**2. Sea or river: judge by the width at the head, yes.** You already have the number. The grade's `crossings` gives the span of water along the avenue's line at its landing. On r67 that's 47 for Darkshire's west avenue.
- **Sea** if that span is 24 or more, or the water reaches the plan's edge **within** that span.
- **River** otherwise.

Darkshire stays a sea harbour by this rule (47 is open water), but a town whose avenue meets a 12-wide river reaching the plan's edge gets the wharf, not the quay.

**3. Town 1: fields laid on the lake.** The brown patches on the water in the lake picture are **farmland on water**: 244 cells at x -184 to -131, z -700 to -649, each with water directly under it. A few spruce plank and log cells there too belong to the fields' fences.

Since fields are laid after shaping now, the field layout seems to take shallow water as land. Its mask should leave out any column whose top is water. The jetty itself is right. With no water 2 deep beside it, there's no boat, which is correct.

**4. Not new:** the caravan's plank deck still crosses Darkshire's bay diagonally (in the top view). That's the trestle work you have queued.

On the founded town's second street, I couldn't get a clear eye-level view at the coordinates. I'll take it with the next run's town 5.
