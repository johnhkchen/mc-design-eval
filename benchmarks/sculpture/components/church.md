# component record — church

- shell: `regularize/church/artifact.json` (regularized: true)
- shell sha256: `02e78adb5cd445ac97d125bb0c6d55fdf42c7a3382d25ad036b9f15a52b2e83e`
- alignment: registry-scale (voxelSize 0.021)
- determinism: double-run record bodies byte-identical (sha256 `61f88e4807ba755fcaca99b6a9a1a7179aa2e7d7ee7739994002225996cab713`)

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
| openingGroups | 22 |  |
| archCandidates | 0 |  |
| glbFits | 16 |  |
| findings | 4 |  |

## masses

| id | role | protected | plan area | yRange | volume | junctions |
| --- | --- | --- | --- | --- | --- | --- |
| mass-0 | primary | false | 1139 | 0..23 | 12491 | base→mass-4, side→mass-1, side→mass-2 |
| mass-1 | attached | false | 207 | 0..32 | 3957 | base→mass-3, side→mass-0 |
| mass-2 | attached | false | 13 | 7..7 | 13 | side→mass-0 |
| mass-3 | protrusion | true | 5 | 31..32 | 5 | base→mass-1 |
| mass-4 | protrusion | true | 12 | 18..22 | 18 | base→mass-0 |

## roof planes

| id | mass | kind | gradient | rmse (raw) | eave | ridge | glbFit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| roof-0 | mass-0 | pitched | [-0.003,-0.752] | 0.763 (1.56) | +z | x@21.946 | Δ1.333° / 826 tris / rmse 4.357 |
| roof-1 | mass-0 | pitched | [-0.008,0.366] | 0.785 (0.92) | -z | x@17.588 | Δ20.018° / 8101 tris / rmse 9.871 |
| roof-2 | mass-0 | pitched | [0.005,1.557] | 0.448 (0.546) | -z | — | Δ18.931° / 313 tris / rmse 3.004 |
| roof-3 | mass-0 | pitched | [0.018,1.153] | 0.817 (0.965) | -z | — | Δ11.917° / 315 tris / rmse 1.273 |
| roof-4 | mass-0 | pitched | [-1.27,-0.051] | 0.476 (0.361) | +x | — | Δ6.791° / 30 tris / rmse 3.901 |
| roof-5 | mass-0 | pitched | [0.058,0.215] | 0.763 (1.02) | -z | x@17.125 | Δ9.365° / 13 tris / rmse 6.017 |
| roof-6 | mass-0 | pitched | [-0.432,-1.173] | 0.362 (0.797) | +z | x@17.588 | Δ16.492° / 6 tris / rmse 1.523 |
| roof-7 | mass-0 | pitched | [0.495,-0.603] | 0.503 (3.041) | +z | x@17.125 | MISS |
| roof-8 | mass-0 | pitched | [0.302,-5.248] | 3.791 (3.791) | +z | — | Δ10.661° / 45 tris / rmse 46.289 |
| roof-9 | mass-0 | pitched | [-12.752,-0.635] | 3.463 (3.661) | +x | — | Δ4.452° / 434 tris / rmse 42.839 |
| roof-10 | mass-0 | pitched | [-9.868,0.346] | 3.433 (4.969) | +x | — | Δ6.086° / 1202 tris / rmse 122.419 |
| roof-11 | mass-0 | pitched | [-14.591,0.061] | 0.283 (0.503) | +x | — | Δ3.059° / 432 tris / rmse 42.9 |
| roof-12 | mass-1 | flat | [-0.131,0.041] | 0.689 (1.294) | perimeter | — | Δ7.674° / 7256 tris / rmse 12.756 |
| roof-13 | mass-1 | flat | [0.083,-0.016] | 0.379 (0.519) | perimeter | — | Δ5.121° / 2860 tris / rmse 13.407 |
| roof-14 | mass-1 | pitched | [0.084,-1.355] | 1.302 (2.887) | +z | x@32 | Δ16.431° / 6 tris / rmse 7.546 |
| roof-15 | mass-1 | pitched | [3.6,19] | 6.148 (5.848) | -z | x@32 | Δ10.914° / 14 tris / rmse 26.698 |
| roof-16 | mass-2 | flat | [0,0] | 0 (0) | perimeter | — | Δ0.742° / 54 tris / rmse 6.891 |

## wall slabs

| id | axis=value | coverage |
| --- | --- | --- |
| mass-0-wall-+x | x=22 | 0.668 |
| mass-0-wall--x | x=-24 | 0.593 |
| mass-0-wall-+z | z=17 | 0.494 |
| mass-0-wall--z | z=-1 | 0.428 |
| mass-1-wall-+x | x=-8 | 0.953 |
| mass-1-wall--x | x=-19 | 0.659 |
| mass-1-wall-+z | z=-9 | 0.812 |
| mass-1-wall--z | z=-18 | 0.812 |
| mass-2-wall-+x | x=3 | 1 |
| mass-2-wall--x | x=1 | 0.8 |
| mass-2-wall-+z | z=-3 | 1 |
| mass-2-wall--z | z=-7 | 1 |

## opening groups

| id | mass | dir | kind | n | arches |
| --- | --- | --- | --- | --- | --- |
| og-0 | mass-0 | +x | window | 1 | 0 |
| og-1 | mass-0 | +x | window | 2 | 0 |
| og-2 | mass-0 | +x | window | 1 | 0 |
| og-3 | mass-0 | -x | window | 1 | 0 |
| og-4 | mass-0 | -x | window | 2 | 0 |
| og-5 | mass-0 | -x | window | 1 | 0 |
| og-6 | mass-0 | +z | window | 1 | 0 |
| og-7 | mass-0 | +z | window | 1 | 0 |
| og-8 | mass-0 | +z | window | 2 | 0 |
| og-9 | mass-0 | +z | window | 2 | 0 |
| og-10 | mass-0 | +z | window | 1 | 0 |
| og-11 | mass-0 | +z | window | 2 | 0 |
| og-12 | mass-0 | +z | window | 2 | 0 |
| og-13 | mass-0 | +z | window | 1 | 0 |
| og-14 | mass-0 | -z | window | 1 | 0 |
| og-15 | mass-0 | -z | window | 1 | 0 |
| og-16 | mass-0 | -z | window | 2 | 0 |
| og-17 | mass-0 | -z | window | 2 | 0 |
| og-18 | mass-0 | -z | window | 1 | 0 |
| og-19 | mass-0 | -z | window | 2 | 0 |
| og-20 | mass-0 | -z | window | 2 | 0 |
| og-21 | mass-0 | -z | window | 1 | 0 |

## findings

- **glb-fit-missing** @ roof-7 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **slab-low-coverage** @ mass-0-wall--x — coverage 0.593
- **slab-low-coverage** @ mass-0-wall-+z — coverage 0.494
- **slab-low-coverage** @ mass-0-wall--z — coverage 0.428

## renders

- +x-z: benchmarks/sculpture/components/church/view-components-church-pxmz.png
- -x-z: benchmarks/sculpture/components/church/view-components-church-mxmz.png
