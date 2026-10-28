---
from: studio
at: 2026-10-28T10:54:27.870Z
---
Your six steps are right. On the three design points:

**1. The first look: one main street, the rest as land, not as plan.**

Yes, cluster. A founded town should read as a frontier main street, not as a plan with three buildings scattered on it.
- **The first builds face each other across the forum's avenue,** on the plots nearest the square. That's `fill_order`'s `forum_front` and then `avenue:core`, on **one** avenue only: the one heading toward the founders' home town, the road the settlers came by. The two workshops sit on one side and the house opposite, so the street has two faces from day one.
- **Unbuilt plots should not carry placeholder tiles yet.** Thirty plots of fallow and garden tiles round three buildings reads as a planned field with a hamlet in it, which is still scattered. Instead:
  - **Plots on the main street** get the placeholder from `town_rules` (garden or fallow, front yard tiles). They read as the street's gardens and are the next to build.
  - **Every other plot is left as the shaped land, unmarked.** The grade has already levelled it, so it reads as cleared ground waiting, not as wilderness.
  - **The plan's other streets aren't paved yet.** Each is laid as a **dirt path** on its line (the grade's levels), and paved when its first plot is built. The plan shows in the paths alone, the way a surveyor's pegs and a worn track would.
- **The grade still runs for the whole plan at founding,** so the land is ready. Only the dressing waits: paving, yard tiles and earthworks tiles beyond the main street. A step's tile can wait until the plot beside it is built; until then the step is a cut face (`cutface_*`) — rock, so nothing walkable is left open.

**2. A founding kit.** I'd draw it as one set per kingdom on the existing contracts:
- **`founding_stone`**: the town's charter stone at the forum's edge, beside the bell. A carved stone or a lectern-topped plinth (decor twin), a lantern, the founders' banner. It replaces nothing the game needs.
- **`well_cross`**: a well under a market cross, 3 x 3, the square's centrepiece until the forum's buildings come. Dalaran's is a well under a small hipped roof; Lordaeron's a stone cross on steps; Stormwind's a fountain basin.
- **`camp`**: two or three tents (wool on fence frames), a covered cart with barrels and a cook fire (a campfire, unlit by day), on a plot at the main street's end. It's the settlers' first nights. It's cleared when the first house has its beds; it's never counted as beds.
- **`stake_line`**: where the inner wall will go, a line of marker posts every 8 (a fence post and a cloth). Where the town faces the road, a **gate post pair** with a lantern on the avenue. It's a promise of the wall, not a stockade. A stockade (`stockade_*`: spruce logs, pointed tops, a gate) comes at the first tier with a wall; it's cheaper than stone and is replaced by the kingdom's wall later.
- **`notice_board`**: a small timber board on posts by the bell. It's where a town's news goes if the game ever shows it.

**3. How it grows** (rules for `town_rules`, per tier):

| Tier | Builds | Streets |
|---|---|---|
| **hamlet** (the founding) | main street: the founding workshops and homes to 4 beds; stake line and gate posts | main street paved; the rest dirt paths |
| **village** | the rest of the main street, then `forum_front` round the square (inn, then hall); the camp cleared | the first cross street paved when its first plot builds |
| **village, full** (main street and forum front built) | `avenue:inner` and `lane:core` in `fill_order`; the stockade replaces the stake line | each street paved as it opens |
| **town** | the kingdom's stone wall replaces the stockade, gatehouse first; the rest of `fill_order` | all |

Two rules keep it reading as a town at every stage:
- **No plot is built on a street with no built neighbour,** except the first on a new street, and that one only next to the square or a built street. The town grows outward from the square in a connected patch, never as islands.
- **A street is opened in full before the next one starts,** both sides, within the inner wall. Main-street-first means the place looks like a main street from day one.

**What to send:** one founded town, as soon as one exists in a run (its region and plan). Even before the founding kit, I'll render it at founding and at village tier to check the clustering reads. Tell me if you want the kit drawn now. It's about one set per kingdom, the same scale as the yards, and I can start with Dalaran's or Lordaeron's.
