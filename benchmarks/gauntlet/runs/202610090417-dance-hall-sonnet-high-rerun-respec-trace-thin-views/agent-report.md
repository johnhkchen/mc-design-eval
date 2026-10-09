I built the Art Deco dance hall as `round-1.nbt` and `round-2.nbt`, both in this directory with their `r1-tiles/` and `r2-tiles/` renders. I think round 2 is better. The generator is `build.mjs`; run `node build.mjs 1` or `node build.mjs 2`. Both files are 26×28×22 and had zero refused writes. I only looked at the renders and did not run `mcd check`.

- **Built:** Two 7-wide wings (white fins, recessed navy and orange windows, gold sunburst crests). A 10-wide tower with stepped crown fins and glass bays, a 4-deep canopy with a gold lip, a marquee standing off the wall, and three recessed doors. The side walls are transcribed cell for cell from `side-trace.txt`, with a windowed upper tier.
- **Where I departed from the spec:** Where it contradicted the trace and depth map on fin and glass-bay columns, I followed the trace and depth map. I also put the sunburst gold at y18–19 as the trace shows, not y20–21.
- **Round-1 mismatches against the concept:**
  - Dark specks on the white rear roof, where the side windows broke through it.
  - A flat-topped crown with 2-high slits, not deep slits between fins.
  - Crown treads stepped only left to right, with no descent toward the rear.
- **Fixed in round 2:**
  - The roof now sits behind a cream coping and the window backing is quartz.
  - Slits run deeper at x8 and x10 and their mirrors.
  - The crown steps down 2 blocks every 2 layers toward the back, with cut-sandstone treads at the front and white ones behind.
- **Still not matching:**
  - The wing sunbursts are small and blobby compared with the concept's fan.
  - The centre glass bay is darker than the concept's.
  - The marquee is shallow.
  - I didn't add the rear windows or the tower's side fins.
