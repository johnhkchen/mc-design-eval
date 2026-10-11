# Toolkit gaps hit while building the Art Deco cinema

- A sunburst / fan emblem (radiating rays with a hub): no brush; I computed angular sectors in the script and placed gold blocks by hand (closest: `arch`/`disc`, which have no ray pattern).
- `plaque` falls back to 2-row banner letters when the band is narrower than the text plus margins (a 4-letter name needs 19 columns for board+frame in the narrow font); I had to widen the tower and pass `frame: null` to get block letters. A "fit text to width by dropping margin" message in the result notes would have saved two renders (closest: plaque's `style`/`pad` fallback).
- `plaque` stroke ends of raised letters are reported as ORPHAN by `mcd check` (2 blocks); `relief: "raised"` and the checker disagree (closest: `relief: "flush"`).
- `mcd check` treats `sea_lantern` as a hanging lantern ("UNSUPPORTED ... nothing below to hang from", 8 false positives); it is a full block.
- Marquee / canopy: no brush; I filled a black box and added sea lanterns, a banner-letter fascia and hanging lanterns by hand (closest: `roof --preset cafe` cantilever deck, which cannot sit at door height on a wall of another storey).
- Ticket booth / kiosk: hand-placed (closest: none; `surround`/`glazing` work on openings only).
- Chevron / zigzag frieze: no brush; I alternated stair facings along the wall top by hand (closest: `cornice` and `courses`, which are straight).
- Stepped tower: `setbacks` tiers take one block each and give a hollow shell with a solid top; windows/slits in each tier and the clearing of the parapet/rail the roof tool had placed under it had to be done by hand. `roof` should accept a `keep`/skip for a planned tower, or `setbacks` should clear the deck.
- Flat-roof preset `modern` flags ROOF_SINGLE_MATERIAL and its default deck is two tones; I needed a `--spec` with a custom `material.mix` to clear the warning (closest: `--texture slate`, which did not change the tone count for flat-parapet).
- `modern` takes the parapet colour from the top wall course, so a black frieze made a black parapet on a dark deck; I had to make the top course cream (no `parapet` material option in the preset).
- Side-wall recessed panels: no brush; carved the outer layer and backed the inner layer by hand in a loop (closest: `paint ... louvres`, which works on glass only).
- Exit doors with an EXIT sign above: hand-placed `B.door` and `B.sign` (closest: `fixtures at doors`, which only adds lamps).
- Finial on the tower: stack of gold block, `lightning_rod` and `end_rod` placed by hand; the `finial` rule exists only in `mcd paint`, not as a code brush.
- Hanging blade signs (`signboard ... hanging`) render as chunky boxes with chains; no option for a slim vertical neon-style sign.
