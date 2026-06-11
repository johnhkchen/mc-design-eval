# component record — gatehouse

- shell: `regularize/gatehouse/artifact.json` (regularized: true)
- shell sha256: `b6c899187d50efeef411279640837f6b42e960975c76378edb8747073975e20c`
- alignment: aabb-affine
- determinism: double-run record bodies byte-identical (sha256 `44e9a75d6c1708a97cbde61e0e204542d093df46ce3e912f01c8f9597612d4ac`)

## counts vs pinned minimums

| metric | got | min |
| --- | --- | --- |
| masses | 4 |  |
| protrusionMasses | 3 |  |
| roofPlanes | 9 |  |
| pitchedRoofPlanes | 8 |  |
| flatRoofPlanes | 1 |  |
| ridges | 2 |  |
| wallSlabs | 4 |  |
| openingGroups | 4 |  |
| archCandidates | 2 | 1 |
| glbFits | 4 |  |
| findings | 9 |  |

## masses

| id | role | protected | plan area | yRange | volume | junctions |
| --- | --- | --- | --- | --- | --- | --- |
| mass-0 | primary | false | 643 | 0..31 | 9003 | base→mass-2, base→mass-3 |
| mass-1 | protrusion | true | 4 | 26..25 | 0 | base→mass-3 |
| mass-2 | protrusion | true | 16 | 27..30 | 53 | base→mass-0 |
| mass-3 | protrusion | true | 4 | 26..25 | 0 | base→mass-1, base→mass-0 |

## roof planes

| id | mass | kind | gradient | rmse (raw) | eave | ridge | glbFit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| roof-0 | mass-0 | pitched | [0.025,-0.808] | 0.648 (0.78) | +z | x@28 | Δ7.603° / 37 tris / rmse 5.603 |
| roof-1 | mass-0 | pitched | [0,0.962] | 0.418 (0.503) | -z | x@21.636 | Δ5.863° / 43 tris / rmse 3.545 |
| roof-2 | mass-0 | flat | [0.004,0.114] | 0.308 (0.439) | perimeter | — | Δ6.783° / 12145 tris / rmse 8.483 |
| roof-3 | mass-0 | pitched | [1.391,-0.04] | 1.401 (1.698) | -x | — | Δ1.49° / 16 tris / rmse 5.886 |
| roof-4 | mass-0 | pitched | [0,1.558] | 0.707 (0.751) | -z | x@28 | MISS |
| roof-5 | mass-0 | pitched | [1.229,1.26] | 0.532 (0.782) | -z | — | MISS |
| roof-6 | mass-0 | pitched | [0.741,-0.676] | 0.415 (0.637) | -x | x@21.636 | MISS |
| roof-7 | mass-0 | pitched | [1.217,-0.528] | 0.551 (0.744) | -x | — | MISS |
| roof-8 | mass-0 | pitched | [1.648,1.61] | 0.666 (1.137) | -x | — | MISS |

## wall slabs

| id | axis=value | coverage |
| --- | --- | --- |
| mass-0-wall-+x | x=11 | 0.425 |
| mass-0-wall--x | x=-13 | 0.331 |
| mass-0-wall-+z | z=9 | 0.541 |
| mass-0-wall--z | z=-9 | 0.532 |

## opening groups

| id | mass | dir | kind | n | arches |
| --- | --- | --- | --- | --- | --- |
| og-0 | mass-0 | +x | door | 1 | 1 |
| og-1 | mass-0 | +x | window | 2 | 0 |
| og-2 | mass-0 | -x | door | 1 | 1 |
| og-3 | mass-0 | -x | window | 2 | 0 |

## findings

- **glb-fit-missing** @ roof-4 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **glb-fit-missing** @ roof-5 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **glb-fit-missing** @ roof-6 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **glb-fit-missing** @ roof-7 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **glb-fit-missing** @ roof-8 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **slab-low-coverage** @ mass-0-wall-+x — coverage 0.425
- **slab-low-coverage** @ mass-0-wall--x — coverage 0.331
- **slab-low-coverage** @ mass-0-wall-+z — coverage 0.541
- **slab-low-coverage** @ mass-0-wall--z — coverage 0.532

## renders

- +x-z: benchmarks/sculpture/components/gatehouse/view-components-gatehouse-pxmz.png
- -x-z: benchmarks/sculpture/components/gatehouse/view-components-gatehouse-mxmz.png
