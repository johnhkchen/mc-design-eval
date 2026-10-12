import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = new Grid([30, 12, 12], { dataVersion: 4189 });
for (const [x, z] of [[24,3],[26,3],[24,6],[26,6]]) for (let y=1;y<=5;y++) g.set(x,y,z,"dark_oak_log");
for (const x of [24,25,26]) for (const z of [3,6]) g.set(x,5,z,"dark_oak_slab",{type:"top"});
g.fill([22,0,0],[27,0,8],"stone_bricks");
g.save("scratch/porch0.nbt");
