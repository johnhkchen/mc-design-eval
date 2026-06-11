# component record — cottage

- shell: `regularize/cottage/artifact.json` (regularized: true)
- shell sha256: `33b1ca02f2589f49dd8c678e2416bf81196be41bf91451c4c9e351baf24c0afd`
- alignment: aabb-affine
- determinism: double-run record bodies byte-identical (sha256 `80360b21c969739c3f5b27a786f55da3b8c93ed38056b131910a61c56f24811a`)

## counts vs pinned minimums

| metric | got | min |
| --- | --- | --- |
| masses | 2 |  |
| protrusionMasses | 1 | 1 |
| roofPlanes | 8 |  |
| pitchedRoofPlanes | 7 | 2 |
| flatRoofPlanes | 1 |  |
| ridges | 2 | 1 |
| wallSlabs | 4 |  |
| openingGroups | 8 |  |
| archCandidates | 0 |  |
| glbFits | 7 |  |
| findings | 5 |  |

## masses

| id | role | protected | plan area | yRange | volume | junctions |
| --- | --- | --- | --- | --- | --- | --- |
| mass-0 | primary | false | 649 | 0..24 | 9820 | base→mass-1 |
| mass-1 | protrusion | true | 8 | 19..26 | 48 | base→mass-0 |

## roof planes

| id | mass | kind | gradient | rmse (raw) | eave | ridge | glbFit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| roof-0 | mass-0 | pitched | [-1.156,0.004] | 0.398 (0.378) | +x | z@24 | Δ11.544° / 218 tris / rmse 8.35 |
| roof-1 | mass-0 | flat | [0.058,-0.001] | 0.579 (0.589) | perimeter | — | Δ3.595° / 9457 tris / rmse 6.823 |
| roof-2 | mass-0 | pitched | [-0.054,0.759] | 0.632 (0.64) | -z | x@21.167 | Δ13.249° / 81 tris / rmse 4.821 |
| roof-3 | mass-0 | pitched | [-0.013,-1.016] | 0.754 (1.204) | +z | x@21.167 | Δ3.221° / 41 tris / rmse 4.435 |
| roof-4 | mass-0 | pitched | [1.884,0.002] | 0.171 (0.187) | -x | z@24 | Δ20.383° / 99 tris / rmse 7.328 |
| roof-5 | mass-0 | pitched | [0.267,-0.361] | 0.798 (1.139) | +z | — | Δ24.118° / 3524 tris / rmse 6.383 |
| roof-6 | mass-0 | pitched | [0.883,0.004] | 0.345 (0.476) | -x | — | Δ1.699° / 19 tris / rmse 1.852 |
| roof-7 | mass-0 | pitched | [0.435,0.726] | 0.477 (0.781) | -z | — | MISS |

## wall slabs

| id | axis=value | coverage |
| --- | --- | --- |
| mass-0-wall-+x | x=3 | 0.364 |
| mass-0-wall--x | x=-11 | 0.449 |
| mass-0-wall-+z | z=12 | 0.391 |
| mass-0-wall--z | z=-12 | 0.418 |

## opening groups

| id | mass | dir | kind | n | arches |
| --- | --- | --- | --- | --- | --- |
| og-0 | mass-0 | +x | window | 1 | 0 |
| og-1 | mass-0 | +x | window | 1 | 0 |
| og-2 | mass-0 | +x | window | 1 | 0 |
| og-3 | mass-0 | +x | window | 1 | 0 |
| og-4 | mass-0 | -x | window | 1 | 0 |
| og-5 | mass-0 | -x | window | 1 | 0 |
| og-6 | mass-0 | -x | window | 1 | 0 |
| og-7 | mass-0 | -x | window | 1 | 0 |

## findings

- **glb-fit-missing** @ roof-7 — no aligned triangles in the normal cone over this extent; voxel fit stands alone
- **slab-low-coverage** @ mass-0-wall-+x — coverage 0.364
- **slab-low-coverage** @ mass-0-wall--x — coverage 0.449
- **slab-low-coverage** @ mass-0-wall-+z — coverage 0.391
- **slab-low-coverage** @ mass-0-wall--z — coverage 0.418

## renders

- +x-z: benchmarks/sculpture/components/cottage/view-components-cottage-pxmz.png
- -x-z: benchmarks/sculpture/components/cottage/view-components-cottage-mxmz.png
