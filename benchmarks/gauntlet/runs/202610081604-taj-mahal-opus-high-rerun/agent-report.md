I built a Taj Mahal from `build.mjs` (`node build.mjs <out> <round>`; round 1 stays reproducible). It follows the spec's coordinates and material map: brick apron, panelled calcite plinth, a chamfered 25×25 mausoleum with the pishtaq and iwan repeated on all four faces, two tiers of niches, a black-ringed drum, an onion dome topped with gold and an end rod at y40, four chhatris and four minarets. The dome and minarets use the shape brushes. Both files are saved (`round-1.nbt`, `round-2.nbt`), rendered to `r1-tiles/` and `r2-tiles/`, with no unknown block ids.

**Round-1 mismatches:**
1. The dome was squat, with a stepped crown and no pinched point.
2. The facade was too dark: I'd made the iwan's side walls and vault grey and put a large black frame around the door, when the spec makes only the back walls grey.
3. The terrace parapet looked like battlements.
4. The minaret tops were 3×3 brush caps instead of 5×5 lanterns, and the top gallery wasn't cream.
5. The dome had no panels.

**Round-2 fixes:** a custom onion profile (bulging through y28–33, narrowing to 5 wide at y37), white iwan vault with only the back wall grey, a black frame around the door only plus an arched lattice window, a continuous parapet, hand-built 5×5 minaret lanterns with a stepped stair dome and gold tip at y34, and cream pointed-oval panels on all four faces of the dome. My first custom dome came out cone-shaped, so I reshaped it before keeping it.

**Round 2 is better:** the dome reads as an onion like the concept's, the facade is white with dark accents, and the minarets match the spec. Still off:
- The niches are 3 wide, not the spec's 2, because a 2-wide niche can't be centred in a 3-wide bay.
- The outer front bays (x8–10) became the angled corners, each with its own niche.
- The parapet posts still look a bit like battlements from above.
- The dome is smaller relative to the building than in the concept, because I kept to the spec's dimensions.
