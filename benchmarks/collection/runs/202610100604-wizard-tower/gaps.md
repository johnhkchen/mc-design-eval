# Toolkit gaps (wizard tower)

- Cone roof `grow` ignores `grow:false` margins: eave ring is R+1 beyond the footprint passed, so a 9-wide top floor needed `--footprint` of 7 (2,2,8,8) to stay inside 13; needs a plain "fit the roof into this grid" or documented footprint-vs-eave rule. Closest: `mcd roof --footprint`.
- Roof auto-detect picked the wrong eave (y14, a jetty beam course) and I had to force `--y 18`; closest: `mcd roof --detect`. Needs: detect the topmost storey's wall top.
- Cone dormer: with a lean it cuts a large hole and is unreadable; I turned it off and hand-built a glowing dormer by scanning the cone surface. Needs `dormer` that works on a leaning cone (small, 3-wide, with hood).
- Cone `lean` makes a kinked spike at the tip rather than a smooth bend; needs a smooth-curve lean (bend over the upper half only).
- Chimney on a cone: `chimneys` option not supported on cone roofs; hand-stacked stone bricks + campfire. Needs roof-surface-relative chimney (rise measured from local roof surface).
- Jetty / overhanging storey with brackets: hand loops for deck, edge beams and upside-down stair brackets. Needs `jetty(g,{rect,y,out,bracket})`.
- Timber-frame wall panel (plaster + posts + plate + round window): all hand-looped. Needs `timberFrame` brush.
- Round window: no oval/octagon window brush; 3x3 plus of panes by hand. Closest: pediment oculus. Needs `window shape=round` with a frame ring.
- Balcony with rail, brackets, hanging lanterns: hand-placed deck, connected-fence rail (hand-computed fence connection states). Closest: `railing` treatment (tops only). Needs `balcony` brush.
- Telescope / spyglass prop: no prop library; lightning_rod + logs + fence by hand.
- Ivy: hand loop over wall cells with clustering/continuation; closest `vary`. Needs an `ivy` treatment that places vine blocks with strand continuation.
- Rocky mound with stair flight: hand height-field loop; landscaping brushes did not fit a 13x13 plinth. Needs `moundBase`.
- Hanging lanterns under a roof brim: hand chain+lantern; `fixtures at eaves` could not target the cone brim or jetty corners.
- Glow: render has no light engine, so glowing windows needed shroomlight/orange glass to read; need a lit-window halo in render.
- Ladder through multi-floor shaft needs hand-placed backing blocks (check flagged unsupported ladders); needs a `ladderShaft` helper.
