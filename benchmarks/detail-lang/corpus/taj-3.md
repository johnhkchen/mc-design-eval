```
# TAJ FINISHING PASS: round-2 build (north = front elevation, roof = plan from above)
# Coordinates: north uses y (row label) and c (column, 0 = left as seen from outside).
#              roof uses z (row label) and c (column, 0 = left).

FACE north

# plinth: calcite panels get quiet marble speckle (texture, not construction)
AT y3-5 where C -> mix 1/9 D

# plinth top ledge: keep the smooth-quartz band and slab cap; slabs stay flush
AT y6-7 where D depth<=1 -> keep
AT y8 where E -> keep

# window sills under the jali windows: polished diorite lip projects toward viewer
AT y16 c12-14,17-19,39-41,44-46 where J -> stairs out
AT y15 c12-14,17-19,39-41,44-46 where J -> keep

# niche arch shoulders: quartz stairs curve in toward the niche keystone
AT y14 c12,14,17,19,39,41,44,46 where I -> stairs in
AT y14 c13,18,40,45 where C -> keep

# bay cornice: slab courses on the side bays stay; quartz shoulder stairs above them stay
AT y23 c1-7,51-57 where E -> keep
AT y21-22 c1-7,51-57 where I -> keep

# minaret rings and finials: accent the ring slabs, keep the rods as finials
AT y33,y40 c1-7,51-57 where E -> keep
AT y41-42 c4,54 where K -> keep

# portal lintel: step the top of the black frame with quartz slab so it reads as a lintel
AT y28 c23-35 where B depth<=1 -> slab top

# dome drum base band: black inlay band stays; quartz stairs above it step out
AT y35 c20-38 where F -> keep
AT y36 c20-38 where D -> keep

FACE roof

# pavilion rails: slab rails stay; corner rods are finials
AT z10,z48 c11-21,37-47 where E -> keep
AT z4,z54 c4,54 where K -> keep
AT z10,z48 c10,48 where K -> keep

# central dome platform: black ring stays; quartz stairs step out at the rim
AT z8,z50 c23-35 where F -> keep
AT z8,z50 c22,36 where I -> stairs out

# texture mix on the broad roof field: 1 in 12 polished diorite
AT z11-47 c9-49 where B depth<=1 -> mix 1/12 J
```

**Notation (for implementers):**
1. `FACE <name>` sets the face for following lines. `AT y<a>-<b> c<list>` (or `z` on roof) selects cells, where `a-b` is an inclusive range and comma lists combine ranges.
2. `where L,...` keeps only cells whose letter is in the list. `depth<=k` keeps only cells whose depth-map value is ≤ k (0 = front plane).
3. `-> keep` changes nothing, but it marks the cells as reviewed and locks them from later rules.
4. `-> slab top|bottom`, `-> stairs out|in`: `out` means the lower step faces the viewer (a projecting ledge); `in` means the stair faces the cell's centre (a curved shoulder). Stairs need a stair-capable material (B→quartz stairs, D→smooth quartz stairs, J→polished diorite stairs, I stays I).
5. `-> mix 1/n X`: replace roughly every n-th cell of the selected letter with X, deterministically (by a hash of y, c). This is texture only, with no change in geometry.
6. Rules apply in order; a later rule may not overwrite a cell locked by `keep`.
