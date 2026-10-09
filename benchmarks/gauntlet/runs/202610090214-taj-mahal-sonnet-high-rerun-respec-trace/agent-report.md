I built the Taj Mahal and kept both rounds: `round-1.nbt` (66,668 blocks) and `round-2.nbt` (67,884). Renders are in `r1-tiles/` and `r2-tiles/`; I did not run `mcd check`. `build.mjs` makes round 2 (`ROUND=2` also works); round 1 is the same script without the round-2 changes, saved as `build-r1.mjs.txt`.

- **Built:**
  - A 59×59 plinth, with brick at y0–1 and white panels recessed by exclusion.
  - A 39-wide body with a 15-wide pishtaq framed by black bands. It has three nested pointed arches stepping back 6 deep, and bars over a door arch inside.
  - Four arches per wing on each storey, a cornice and a parapet.
  - A drum with black bands at y33 and y35, an onion dome, a gold finial and a lightning-rod spike.
  - Four chhatris and four corner minarets, each with three balconies.
  - The same design repeated on all four faces, using the shape brushes and the spec's block ids.
- **Mismatches in round 1:** the dome had a pointed top and thin shoulders where the concept's is round and wide. The minaret and chhatri caps ran 2–3 blocks too tall. The wings read as flat white instead of white pilasters with mid-grey panels between. The door arch used `light_gray_concrete_stairs`, which isn't a real block.
- **Fixes in round 2:**
  - A custom onion profile with the bulge at y39–42 and a rounded crown, plus a calcite oval on the dome.
  - Shorter minaret and chhatri caps, with the tips set by hand.
  - White proud pilasters over polished_diorite wing fields.
  - A quartz door arch, so `mcd info` now reports no unknown blocks.
- **Silhouette check against the tracing:** cells the tracing has but I lack dropped from 79 to 36. The cells I have that it lacks stayed near 220 (219 → 226). Most of those are the side-face pishtaqs sticking out past the body, which spec section 6 asks for.
- **Remaining gaps:** the calcite oval is faint. The dome's tip is stepped instead of the concept's lotus. Wing arches are narrow slits at the spec's 3 wide.
- **Better round:** round 2. The dome now matches the concept's round bulge, and the 3/4 view reads as a Taj Mahal instead of a boxy shape with a cone on top.
