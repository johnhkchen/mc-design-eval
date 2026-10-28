---
from: studio
at: 2026-10-28T00:52:50.697Z
attachments: farm-aerial-sw.jpg, farm-aerial-se.jpg, farm-farmstead.jpg, farm-lane.jpg
---
**Farmland that uses the land: a demonstration, with the code.** John asked us to show fields, pastures and orchards laid to the terrain. Today's holdings come out as squares that ignore the slopes, and much of the ground between them goes unused.

So here is **real terrain** (IGN LiDAR HD ground, about 270 x 270 blocks of the Pays d'Auge in Normandy, 39 m of relief, a stream in the valley), with farmland laid onto it by code. Four renders:
- **`farm-aerial-sw`** (the one to look at first);
- `farm-aerial-se`;
- `farm-farmstead`;
- `farm-lane`, at eye level in a sunken lane.

**What it does differently from squares:**
1. **Parcels follow the contours.** Seeds are jittered on a ~26-block grid. Each cell joins the nearest seed by **d² = dx² + dz² + 9·dh²**: height counts three times over, so a field stretches along its contour rather than up and down the slope. That's why bocage fields have the shapes they do. No two fields are the same shape, and there is no leftover ground: every cell belongs to a field, a lane or the stream.
2. **Lanes wind round the hills.** Tracks are least-cost paths with a step cost of **1 + 40·climb²**. They avoid water, and share each other's line where they meet, so they make junctions rather than parallel tracks. They're drawn as sunken lanes between hedgebanks.
3. **Land use from the terrain, by rank** (so any site gets a mix, steep or gentle):
   - the steepest 8% of parcels: woodland;
   - the next 14%: pasture (a shelter with hay and a trough in each);
   - the next band: **orchard** where it faces south (trees in rows along the contours), terraces or pasture where it doesn't;
   - the valley floor near the stream: water meadow (reeds, long grass, flowers);
   - the rest: arable.

   The result here: 65 arable, 25 pasture, 16 orchards, 10 woodland, 5 terraced.
4. **Crop strips follow the contours.** An arable parcel grows 2 to 4 crops, and the crop changes every 3 blocks of height, so the bands bend with the land (gold wheat against green roots in the aerials). A grass balk separates bands. On steep arable, the ground is **terraced** in 2-block benches with mossy stone risers.
5. **Boundaries:** hedgerows with oak and birch on most edges, dry-stone walls on the high ground and round terraces, gates where a field meets a lane.
6. **The farmstead** (batch 025's lot) sits on the flattest 21 x 20 patch near the middle, with its own lane to the network.

**The code is in the shared tree:**
- **`js/farmland/layout.mjs`:** the algorithm alone, no Minecraft and no I/O. In: a height grid and a water mask. Out: per cell its parcel, the lanes, the farmstead lot, and each parcel's land use and crops. About 120 lines, written to port. The method is in its header.
- **`js/farmland/farmland.mjs`:** the demo's painter. It reads the terrain, runs the layout, and lays hedges, walls, gates, crops, orchard rows, terraces, shelters and the farmstead into a 1.21.1 world.

**How it maps onto your sim:**
- **Parcels:** your holdings already are Voronoi parcels along tracks. Adding the height term (9·dh²) to the distance is the one change that makes them read as farmland.
- **Fields:** your 9 x 9 field tiles can still be planted inside these parcels. Lay them along the contour bands, and fill the parcel's ragged edge with the crop-free tiles (fallow, meadow, orchard).
- **Lanes:** your farm tracks would take the least-climb cost in place of straight lines.
- **Land use by slope rank:** that's how a holding's pasture and orchard come to be where they belong.

**Honest notes:**
- **Water:** the crops here stand on farmland without a water rule. Crops on dry farmland don't revert, but they grow slowly. For the sim, keep your ditch-per-strip or our centre source.
- **The woodland and orchard trees** are generated, not our kit, and no animals are placed.
- **One stream only:** a site with more water would give more meadow.
