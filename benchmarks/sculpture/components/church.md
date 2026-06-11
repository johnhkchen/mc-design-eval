# component record — church

- shell: `challenge/church/shell-artifact.json` (regularized: false)
- shell sha256: `50fce80f78ecf37617e773d864fcdecbd4a98b73dfe16f17eaf09a8797f8e4d3`
- alignment: registry-scale (voxelSize 0.021)
- determinism: double-run record bodies byte-identical (sha256 `4ce62185afc956323ea14f6c7be6edd1374a17651803a0630c30506ea6a49ae2`)

## counts vs pinned minimums

| metric | got | min |
| --- | --- | --- |
| masses | 5 | 2 |
| protrusionMasses | 2 |  |
| roofPlanes | 17 | 2 |
| pitchedRoofPlanes | 14 |  |
| flatRoofPlanes | 3 |  |
| ridges | 4 |  |
| wallSlabs | 12 |  |
| openingGroups | 20 |  |
| archCandidates | 0 |  |
| glbFits | 16 |  |
| findings | 4 |  |

## masses

| id | role | protected | plan area | yRange | volume | junctions |
| --- | --- | --- | --- | --- | --- | --- |
| mass-0 | primary | false | 1139 | 0..23 | 12593 | base→mass-4, side→mass-1, side→mass-2 |
| mass-1 | attached | false | 207 | 0..32 | 3964 | base→mass-3, side→mass-0 |
| mass-2 | attached | false | 13 | 7..7 | 13 | side→mass-0 |
| mass-3 | protrusion | true | 5 | 31..32 | 5 | base→mass-1 |
| mass-4 | protrusion | true | 12 | 18..22 | 18 | base→mass-0 |

## roof planes

| id | mass | kind | gradient | rmse (raw) | eave | ridge | glbFit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| roof-0 | mass-0 | pitched | [0.002,-0.744] | 0.536 (0.888) | +z | x@21.413 | Δ1.286° / 803 tris / rmse 4.435 |
| roof-1 | mass-0 | pitched | [-0.022,0.435] | 0.611 (0.708) | -z | x@17.5 | Δ23.397° / 8186 tris / rmse 9.576 |
| roof-2 | mass-0 | pitched | [0.016,0.876] | 0.794 (0.898) | -z | — | Δ6.013° / 419 tris / rmse 1.683 |
| roof-3 | mass-0 | pitched | [-1.258,-0.06] | 0.477 (0.361) | +x | z@18 | Δ7.04° / 30 tris / rmse 3.901 |
| roof-4 | mass-0 | pitched | [0.209,-0.037] | 0.271 (0.441) | -x | — | Δ10.75° / 13 tris / rmse 6.05 |
| roof-5 | mass-0 | pitched | [-0.455,-1.095] | 0.451 (0.731) | +z | x@17.5 | Δ16.003° / 5 tris / rmse 1.302 |
| roof-6 | mass-0 | pitched | [-8.526,-0.123] | 3.05 (6.051) | +x | — | Δ6.592° / 1631 tris / rmse 129.39 |
| roof-7 | mass-0 | pitched | [0.221,-0.004] | 0.205 (0.205) | -x | z@18 | Δ12.58° / 581 tris / rmse 9.923 |
| roof-8 | mass-0 | pitched | [0.495,-0.603] | 0.503 (3.041) | +z | — | MISS |
| roof-9 | mass-0 | pitched | [0.302,-5.248] | 3.791 (3.791) | +z | — | Δ10.661° / 45 tris / rmse 46.289 |
| roof-10 | mass-0 | pitched | [-12.752,-0.635] | 3.463 (3.661) | +x | — | Δ4.452° / 434 tris / rmse 42.839 |
| roof-11 | mass-0 | pitched | [-14.591,0.061] | 0.283 (0.503) | +x | — | Δ3.059° / 432 tris / rmse 42.9 |
| roof-12 | mass-1 | flat | [-0.131,0.041] | 0.689 (1.294) | perimeter | — | Δ7.674° / 7256 tris / rmse 12.756 |
| roof-13 | mass-1 | flat | [0.083,-0.016] | 0.379 (0.519) | perimeter | — | Δ5.121° / 2860 tris / rmse 13.407 |
| roof-14 | mass-1 | pitched | [0.084,-1.355] | 1.302 (2.887) | +z | x@32 | Δ16.431° / 6 tris / rmse 7.546 |
| roof-15 | mass-1 | pitched | [3.6,19] | 6.148 (5.848) | -z | x@32 | Δ10.914° / 14 tris / rmse 26.698 |
| roof-16 | mass-2 | flat | [0,0] | 0 (0) | perimeter | — | Δ0.742° / 54 tris / rmse 6.891 |

## wall slabs

| id | axis=value | coverage |
| --- | --- | --- |
| mass-0-wall-+x | x=22 | 0.663 |
| mass-0-wall--x | x=-24 | 0.589 |
| mass-0-wall-+z | z=17 | 0.494 |
| mass-0-wall--z | z=-1 | 0.428 |
| mass-1-wall-+x | x=-8 | 0.95 |
| mass-1-wall--x | x=-19 | 0.657 |
| mass-1-wall-+z | z=-9 | 0.812 |
| mass-1-wall--z | z=-18 | 0.812 |
| mass-2-wall-+x | x=3 | 1 |
| mass-2-wall--x | x=1 | 0.8 |
| mass-2-wall-+z | z=-3 | 1 |
| mass-2-wall--z | z=-7 | 1 |

## opening groups

| id | mass | dir | kind | n | arches |
| --- | --- | --- | --- | --- | --- |
| og-0 | mass-0 | +x | window | 2 | 0 |
| og-1 | mass-0 | +x | window | 1 | 0 |
| og-2 | mass-0 | -x | window | 2 | 0 |
| og-3 | mass-0 | -x | window | 1 | 0 |
| og-4 | mass-0 | +z | window | 1 | 0 |
| og-5 | mass-0 | +z | window | 1 | 0 |
| og-6 | mass-0 | +z | window | 2 | 0 |
| og-7 | mass-0 | +z | window | 2 | 0 |
| og-8 | mass-0 | +z | window | 1 | 0 |
| og-9 | mass-0 | +z | window | 2 | 0 |
| og-10 | mass-0 | +z | window | 2 | 0 |
| og-11 | mass-0 | +z | window | 1 | 0 |
| og-12 | mass-0 | -z | window | 1 | 0 |
| og-13 | mass-0 | -z | window | 1 | 0 |
| og-14 | mass-0 | -z | window | 2 | 0 |
| og-15 | mass-0 | -z | window | 2 | 0 |
| og-16 | mass-0 | -z | window | 1 | 0 |
| og-17 | mass-0 | -z | window | 2 | 0 |
| og-18 | mass-0 | -z | window | 2 | 0 |
| og-19 | mass-0 | -z | window | 1 | 0 |

## findings

- **glb-fit-missing** @ roof-8 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **slab-low-coverage** @ mass-0-wall--x — coverage 0.589
- **slab-low-coverage** @ mass-0-wall-+z — coverage 0.494
- **slab-low-coverage** @ mass-0-wall--z — coverage 0.428

## renders

- +x-z: benchmarks/sculpture/components/church/view-components-church-pxmz.png
- -x-z: benchmarks/sculpture/components/church/view-components-church-mxmz.png
