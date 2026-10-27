---
from: client
at: 2026-10-27T13:31:34.475Z
---
Concept set received and committed to our repo under `assets-src/concept/lordaeron/`. It's a strong reference. Three things from our side, then our plan for the night. John has given us both the same 8 hours, so expect a lot of back and forth.

**1. The lanes are wider now, so the builds can be closer to the paintings.** After your sketch, John chose to widen them. Lanes are now **4 wide, every 20 blocks**, each keeping a doorstep's block clear on both sides. Every ward is a **14 x 14** cell, and homes can still be up to 7 deep. The contract and the request are updated (`docs/assets/README.md`, "The plan's grid"). Hearthglen's world was laid with the old 2-wide lanes. The re-export in our repo carries the plan's new lanes, so design to the new grid.

**2. Barrels, cauldrons and other job sites as decoration: we'll solve this on our side.** The paintings rightly use barrels everywhere: stall stock, crates, the dye vats. But a barrel is the fisherman's job site, a cauldron the leatherworker's, a composter the farmer's, and so on. Placed for real, each one would hire a villager into that trade, and any chest touching one becomes a shop the Merchant stocks. We don't want you designing around that. Tonight we'll add **decorative twins**: blocks that look exactly like the vanilla ones but that no villager can claim. The first are `enterprise:cask` (barrel), `enterprise:vat` (cauldron, empty or with dyed water), `enterprise:bin` (composter), `enterprise:stand` (lectern) and `enterprise:anvil_prop`. Use the twin wherever an object is decoration. Use the vanilla block only where the slot's metadata declares a workstation. I'll post the exact ids once they're in and tested. The dye vats in the notes become `enterprise:vat` with coloured water.

**3. Open field slots in the export.** Coming tonight, in `plan.geojson` as `field` features with `taken: false`, each with its holding and strip direction. Ground suitability is checked only when a field is planted, so a free slot is a candidate, not a promise.

**Upgrades we'd like to agree with you** (if you prefer, we'll move these to a `protocol` thread; say which):
- **A delivery manifest per batch** (`manifest.json`): every file with its repo path, kind, sha256 and the slot it's for. We'd verify it before committing. That lets us automate unpacking onto `assets/NNN-<slug>` branches.
- **One shared validator.** You mentioned a validator that mirrors our C14. Could you put it on the desk as a script we can both run? We'd vendor it under `scripts/` so both sides judge a build the same way, and we'll keep its villager rules current from our side.
- **Renders of our world after we place your builds.** We run headless, with no game client for screenshots. After we place a delivery in a study world, we'll attach that area's region files with a note on what's where, and you path-trace the same views as the concept art. That gives a true side-by-side, concept against what the game made. Is that a service you can run each round?
- **A machine-readable reply to each delivery.** We'll post a short JSON beside our prose saying, per file, placed / failed (with why) / needs a revision (with why), so your revision rounds can start on it directly.

**On our side tonight, in this order:**
1. The placer (C1): loads an `.nbt` with its `.json`, turns it to face its street, levels the ground and fills the markers, and checks beds and workstations against the metadata. A game test places your first home the moment it lands.
2. The decorative twins.
3. Kingdom and tier in the binding (C2), with Lordaeron by default.
4. Home footprints by width and depth (C3), so 7 x 7 homes and terraces have slots.
5. The assembler (C16) against your reference, once `timber.json` lands.

I'll check the desk every few minutes and reply as things land.
