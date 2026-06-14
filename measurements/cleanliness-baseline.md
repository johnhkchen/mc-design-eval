# E-19 cleanliness before-baseline (T-062-01)

Committed builds re-scored on the FIXED metrics: fragmentation-true `speckleScore` and `strayVoxelStats`
(6-connectivity). `largestFraction` 1.0 ⇔ a single solid mass; `stray` = cells outside the main mass;
`sub` = stray cells below the main floor. Offline reconstruction from `artifact.json` placements.

| subject | build | speckle | comp | largest-frac | stray | sub-floor | distinct | cells |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| dancing-man | R1 glb-voxel | 0.108 | 1 | 1 | 0 | 0 | 5 | 973 |
| dancing-man | R2 glb-voxel-clean | 0.031 | 1 | 1 | 0 | 0 | 5 | 973 |
| dancing-man | E18 thin+seg | 0.015 | 1 | 1 | 0 | 0 | 5 | 1504 |
| moai | R1 glb-voxel | 0.172 | 6 | 0.52 | 2023 | 0 | 5 | 4215 |
| moai | R2 glb-voxel-clean | 0.058 | 6 | 0.52 | 2023 | 0 | 5 | 4215 |
| moai | E18 thin+seg | 0 | 3 | 0.519 | 2912 | 0 | 5 | 6059 |
| pineapple | R1 glb-voxel | 0.108 | 12 | 0.987 | 45 | 0 | 4 | 3397 |
| pineapple | R2 glb-voxel-clean | 0.038 | 12 | 0.987 | 45 | 0 | 5 | 3397 |
| pineapple | E18 thin+seg | 0.012 | 1 | 1 | 0 | 0 | 4 | 4855 |
| bow-and-arrow | R1 glb-voxel | 0.11 | 21 | 0.277 | 371 | 0 | 6 | 513 |
| bow-and-arrow | R2 glb-voxel-clean | 0.031 | 21 | 0.277 | 371 | 0 | 8 | 513 |
| bow-and-arrow | E18 thin+seg | 0.003 | 1 | 1 | 0 | 0 | 6 | 1210 |
| heart | R1 glb-voxel | 0.153 | 10 | 0.986 | 80 | 0 | 7 | 5840 |
| heart | R2 glb-voxel-clean | 0.052 | 10 | 0.986 | 80 | 0 | 7 | 5840 |
| heart | E18 thin+seg | 0.012 | 1 | 1 | 0 | 0 | 7 | 7982 |
| mushroom | R1 glb-voxel | 0.06 | 4 | 0.998 | 19 | 0 | 6 | 9505 |
| mushroom | R2 glb-voxel-clean | 0.029 | 4 | 0.998 | 19 | 0 | 7 | 9505 |
| mushroom | E18 thin+seg | 0.016 | 1 | 1 | 0 | 0 | 6 | 11958 |
| koi | R1 glb-voxel | 0.13 | 8 | 0.976 | 53 | 0 | 5 | 2164 |
| koi | R2 glb-voxel-clean | 0.061 | 8 | 0.976 | 53 | 0 | 8 | 2164 |
| koi | E18 thin+seg | 0.028 | 1 | 1 | 0 | 0 | 5 | 3155 |
