`detail-2.nbt` beats `input.nbt`. It's busier, in the way the concept is, and the paint reported "function intact". The final run read 85 of 85 rules and wrote 1,443 cells.

- **Treatments:** I used `cornice` (eave, string course, porch roof), `quoins`, `plinth`, `lintels hood`, `sills`, and `louvres`. I also used `finial`, `railing`, `weather`, `vary` and `gradient`. Raw rules cover the lettering and the lanterns, banners and handrails.
- **Jobs:** `rules.txt` has 35 `## JOB` headers, one per inventory item plus coverage (texture, plinth, roof edge, sides). Pier capitals and bases were already in the build, so Job 8 only projects them 1 block. Several glass-cell jobs (window bars, hanging lanterns, bookshelves, shaft bars) needed `force`, because the interpreter treats glass beside leaves or bars as already detailed.
- **Dropped:** I removed the light-gray glass panes on the shaft, because they turned the glass opaque and grey. I also made the plinth skip the porch so it no longer swallows the steps, and moved the chimney to the roof's left edge as seen from the front.
- **Gaps:**
  - The gold sign lettering reads as chunky crenellation, not text.
  - The pediment rake trim (Job 10) and balconies (Job 28) are weak.
  - The 3/4 side (west face) is still plain compared with the concept.
  - Jobs 22, 24 and 25 only partly landed, so flowers, gate posts and interior planters are sparse.
- **Not checked:** I only rendered the front and 3/4-left views, so the east and back faces haven't been looked at.

Files are in `detail-sonnet-high-lang-greedy-inv-reroofed/`:
- `rules.txt`
- `detail-2.nbt`
- `t2/`
