```
FACE north  (y = row label, c = column index, as in the maps)

# 1 central arch: step the voussoirs out over the door
y19..21 c26..32 where I,G -> stairs out top

# 2 spandrel inlay: checker smooth quartz with diorite
y24..25 c10..21 where D -> checker D,J
y24..25 c37..48 where D -> checker D,J

# 3 wing windows: stepped heads, drip sills
y13 c12..14,17..19,39..41,44..46 where C -> stairs out bottom
y21 c12..14,17..19,39..41,44..46 where C -> stairs out top
y9  c12..14,17..19,39..41,44..46 where C -> slab top
y17 c12..14,17..19,39..41,44..46 where C -> slab top

# 4 dome drum: texture the white courses around the black band
y34 c20..38 where B -> mix B 3, D 1 seed 34

# 5 plinth arcade: break up the calcite panels
y2..5 c0..58 where C -> mix C 3, D 1 seed 3

# 6 pier faces: speckle the flat quartz between the course lines
y24..30 c2..6,52..56 where B -> mix B 4, J 1 seed 6

# untouched: black frame posts (F at c8, c23, c35, c50), lattice (H), slabs/stairs already in place
```

Notation:
1. A selector is `y<a>..<b> c<list> [where <letters>]`. Rows use the map's y labels, columns use the map's index, and a list like `c12..14,17..19` takes several ranges at once.
2. `where` filters by letter. Add `where depth <a>..<b>` to target protruding edges (depth 0–2) or recesses.
3. Verbs: `stairs out top|bottom` faces the stair toward the face normal (outward); `top` is upside-down for overhangs. `slab top|bottom`. `checker A,B` alternates by (c+y) parity. `mix A w, B w seed n` is a weighted deterministic hash per cell. `keep` changes nothing.
4. Each line applies in order, and later lines see earlier results. A cell changes only if it passes its line's `where` filter.
5. Symmetric pairs are written out explicitly; the executor does no implicit mirroring.
6. This pass covers only the north face. The roof and sides are not detailed; the executor should count changed cells per line to confirm each rule hit.
