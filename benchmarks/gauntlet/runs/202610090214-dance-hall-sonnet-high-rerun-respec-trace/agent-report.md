I built a 52×60×40 symmetric Art Deco dance hall, with `round-1.nbt` and `round-2.nbt` both kept and no unknown block ids in either. `build.mjs` generates both (`node build.mjs 1` or `node build.mjs 2`).

- **Built:** a stepped roof from the `setbacks` brush with the front flush, a tower with a spire that has an open pointed-arch frame and a stepped tip, and blue and cream fins proud of the tower. The 22-wide marquee projects 8 forward. The front face follows the trace's silhouette, with the spec's materials in their regions. The wings have recessed banded windows, black niches and sunburst hoods. The sides have pilaster groups and a cream plinth.
- **Round-1 mismatches:**
  - Every stained pane rendered as a bare post, so the wing, tower and spire-slot glass was invisible.
  - The marquee crown was a flat gold slab across the full width.
  - The roof risers were too thin.
  - The cap course and blue band stopped at the front.
- **Fixed in round 2:**
  - Panes now have explicit connections, so the glass reads.
  - The crown is now a stepped triangle in the front view, with a gold staircase rising toward the tower in the 3/4 view.
  - Roof tiers are re-cut to the trace diagonal, with a cream and black front parapet.
  - The black cap and blue band now wrap the side risers.
- **Still off:**
  - The roof terraces are shallower and flatter than the concept's.
  - The wing hoods over the sunbursts look a bit busy.
  - Wing walls render a greyer white than the concept.
  - The marquee's side face is flat, because the trace silhouette wins over the 3/4 staircase.
- **Better round:** round 2. The glass bands, stepped crown and spire slot now match the trace, and the side lines echo the 3/4 view. Round 1 has the same massing but blank openings and a flat crown.

I only compared the renders to the concept and trace by eye, with no scripted diff. I didn't run `mcd check`, since there's no function contract to protect.
