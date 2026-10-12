import { Grid, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const style = process.argv[2] ?? "cafe";
const g = new Grid([30, 14, 12], { dataVersion: 4189 });
for (const [x, z] of [[23,2],[26,2],[23,6],[26,6]]) for (let y=1;y<=5;y++) g.set(x,y,z,"dark_oak_fence");
g.fill([0,0,0],[29,0,11],"stone_bricks");
g.fill([20,1,8],[29,8,9],"blue_terracotta");
const r = roof(g, [[23,2,26,6]], style, { y: 6 });
console.log(JSON.stringify({cells:r.cells, shift:r.shift, warnings:r.warnings, notes:r.notes, facts:{style:r.facts.style, overhang:r.facts.overhang, roofH:r.facts.roofH}}));
g.save("scratch/porch.nbt");
