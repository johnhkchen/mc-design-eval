## Pass 1 (front)

Round 1 is built and saved as `round-1.nbt`, with `build.mjs` alongside it. I rendered it, compared the front against the trace, and stopped after one fix pass; no `mcd check` was run.

- **Layout:** the front is its own `frontFace()` function, and `body()` holds the plain volume (hollow shell, flat roof deck, floor). The next pass can change `body()` without touching `frontFace()`. The front mirrors drawing columns to world x (the shaft lands on the right of the elevation, as in the concept). The wall plane is at z=4, with the portico and steps going out to z=0. The body is 18 wide (drawing columns c1–c18), because the trace has nothing above y0 at c0.
- **Relief matches the depth map:**
  - Oak pilasters at c1, 5, 9, 13 on y9–15, proud 1 (the ground storey is masonry quoins, per the trace).
  - Chiseled-deepslate caps at y8 and y16.
  - A polished cornice at y17, proud 1.
  - Windows recessed 2 with a dark head recessed 1 and oak sills proud 1.
  - A quartz portico at +2 with a y6–7 sign band, glass sidelights, and a double dark_oak door at c8–9.
  - A flush pediment with oak rafters, a slit and a lightning-rod spire.
  - A glass shaft recessed 1 behind oak piers, with a cap at y19.
  - An elevator head set back 2 on top.
- **Where I followed the trace over the spec:**
  - Windows are 2 panes tall (y9–10 and y13–14) with a dark recessed head above, where the spec says 3.
  - The door sits at y1–2 with a dark_oak plank at y3, because the trace puts the brown at y1–3 and I gave the entrance no steps up.
  - The shaft glass starts at y1.
- **Mismatches and omissions:**
  - Banners, signs, lanterns, the elevator railing and the stair flights are left for the detail pass. The shaft flights are plain quartz blocks where the trace is cream.
  - The ground-floor arches are squared off.
  - Window glass reads dark because the renderer has no interior light.
  - The pediment rafters are one cell per row, thinner than the concept's.
  - The roof is only 2 courses of full blocks, and the sides, back and roof are plain.

## Pass 2 (sides, back, roof)

Round 2 is saved as `round-2.nbt`, built by `build.mjs`. The front elevation renders pixel-identical to round-1 (0 differing pixels). `round-1.nbt` is untouched.

- **West flank (shaft side):**
  - It follows the side trace: the elevator head sits at depth k2–6 and the roof is flat at y19, stepping down y18 then y17 toward the back.
  - Going back from the front: glass shaft face (k3–4), oak piers at k5 and k7, a recessed gap at k6, and a window bay with sills.
  - Further back: an oak pier at k12, a recessed chute niche with oak landings and stepped brackets (k13–14), and a recessed polished-blackstone channel (k15).
  - Piers, plinth and cornice stand proud; the wall field, frieze and windows are recessed.
- **East flank:** the same layer system, with oak pilasters every 4 and 2-wide windows on all three storeys. Its roofline is the same as the west's, except that the roof stays flush with the east wall's edge instead of stepping in.
- **Back:** pilasters, two window columns, and a double dark-oak door with a glass transom, with the roof, cornice and plinth carried round.
- **Mismatch with the 3/4 view:** the roof reads flatter than the concept's hip. The existing front slab (y18–19 across the full width) fixes the top, so the hip only shows as the back stepping down and the west course beside the shaft cap.
- **Hidden constraints:** I kept the back windows off the front openings and added an interior core wall. Without them sky showed through the hollow building and changed the front elevation. Corner returns stay solid so there is no see-through at the frieze. The east wall can't project past x17, because that would show in the front elevation.
- **Not done:** I didn't verify the full `mcd check` result. The output I saw was only the tail, which lists large plain surfaces (roof top, interior wall faces). Renders are in `r2-tiles/`.
