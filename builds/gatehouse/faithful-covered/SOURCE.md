# builds/gatehouse/faithful-covered — one fully-faithful gatehouse (E-44 / S-177 / T-177-01)

Faithful in BOTH materials AND roof: the T-172-01 roof-as-construction COVERING run on the S-171
materially-faithful WALLS. This is the build T-173-01 found missing (its crater self-capped on a
residual dark_oak_planks PRISM roof).

- walls + materials  ← builds/gatehouse/faithful/artifact.json (stone_bricks; polished_basalt gone)
- roof               ← generateRoof({covering:true}) in the build's OWN detected roof material
- program (derive)   ← benchmarks/sculpture/recognition/gatehouse.program.json

## The seam (composed cleanly?)
NOT in-path. The faithful walls are recognition compile→realize (roof = compile.mjs::roofBlocks solid
prism); the covering is generateRoof. Covering the roofBlocks prism INSIDE compile trips the
gableWallKeys conformance gate + needs a judge-pin rotation (T-172-01 review). The clean composition is
a POST-REALIZE artifact swap: carve y>eaveY (block-agnostic — removes the prism) and re-cover. A
geometry swap on the finished artifact, not a pipeline merge.

## Derived (no hardcoding) / detected (faithful materials)
- eaveY=19  ridgeAxis=x  pitch=1  ridgeY=26  (from the recognition program)
- roof field=minecraft:dark_oak_planks → stairs=minecraft:dark_oak_stairs slab=minecraft:dark_oak_slab (detected modal carved block)
- gable-end wall=minecraft:stone_bricks (detected modal eave-layer block)

## Numbers
- roof-field census: faithful prism 53.1% → covering 16.8%
- closureOf(eave ring) = 1.000 (unchanged from the faithful input — roof never touches walls)

## Crater-ready
artifact.json + view-{az}.png present. T-178-01 points CRATER_BUILD straight at this dir.

NOT a re-recognition or re-realize — a post-realize roof swap. Reproduce: `node
experiments/eval-alignment/faithful-roof.mjs`.
