import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = new Grid([17, 8, 13], { dataVersion: 3955 });
const F = (a,b,m)=>g.fill(a,b,m);
const S = (x,y,z,m,s)=> s? g.set(x,y,z,m,s): g.set(x,y,z,m);
// plinth/terrace
F([0,0,0],[16,0,12],"stone_bricks");
F([0,0,0],[16,0,0],"smooth_stone");
// stairs at front steps x 5..8 -> door at x 6..7
for (let x=5;x<=8;x++){ S(x,0,0,"stone_brick_stairs",{facing:"south"}); }
// building core x2..14, z4..11
const X0=2,X1=14,Z0=4,Z1=11;
F([X0,0,Z0],[X1,0,Z1],"polished_andesite");
// solid walls: west, back, front-left (x2..5)
const wall="black_concrete";
F([X0,1,Z1],[X1,4,Z1],wall);
F([X0,1,Z0],[X0,4,Z1],wall);
F([X0,1,Z0],[5,4,Z0],"gray_concrete");
// glass: front x6..14, east x14 z4..11
F([6,1,Z0],[X1,4,Z0],"light_gray_stained_glass");
F([X1,1,Z0],[X1,4,Z1],"light_gray_stained_glass");
// back-right corner post is wall
// steel posts
for (const x of [2,6,10,14]) F([x,1,Z0],[x,4,Z0],"black_concrete");
for (const z of [4,7,11]) F([X1,1,z],[X1,4,z],"black_concrete");
// transom beam at top
F([6,4,Z0],[X1,4,Z0],"black_concrete");
F([X1,4,Z0],[X1,4,Z1],"black_concrete");
// door x7..8 (double)
F([7,1,Z0],[8,3,Z0],"air");
S(7,1,Z0,"dark_oak_door",{facing:"north",half:"lower",hinge:"left"});
S(7,2,Z0,"dark_oak_door",{facing:"north",half:"upper",hinge:"left"});
S(8,1,Z0,"dark_oak_door",{facing:"north",half:"lower",hinge:"right"});
S(8,2,Z0,"dark_oak_door",{facing:"north",half:"upper",hinge:"right"});
F([7,3,Z0],[8,3,Z0],"glass");
// roof: soffit timber y5, slab y6-7
F([1,5,1],[15,5,12],"spruce_planks");
F([1,6,1],[15,6,12],"black_concrete");
F([1,7,1],[15,7,1],"gray_concrete");F([1,7,12],[15,7,12],"gray_concrete");F([1,7,1],[1,7,12],"gray_concrete");F([15,7,1],[15,7,12],"gray_concrete");
// lights in soffit
for (const x of [4,8,12]) for (const z of [2,6,9]) S(x,5,z,"glowstone");
// ceiling interior
// interior: counter, tables
F([3,1,9],[12,1,9],"dark_oak_planks");
F([3,2,9],[12,2,9],"dark_oak_slab");
for (let x=3;x<=12;x+=3){ S(x,3,10,"lantern",{hanging:"false"}); S(x,2,10,"dark_oak_planks"); }
for (const [x,z] of [[8,6],[11,6],[11,8],[4,6]]){ S(x,1,z,"dark_oak_fence"); S(x,2,z,"dark_oak_pressure_plate"); S(x-1,1,z,"dark_oak_stairs",{facing:"east"}); S(x+1,1,z,"dark_oak_stairs",{facing:"west"});}
for (const x of [4,6,9]) S(x,4,6,"lantern",{hanging:"true"});
// sign on front-left wall (glowing) - sea lanterns "CAFE" simplified as glowstone letters
const sign=[ "XXX.XXX.XXX.XXX", "X...X.X.X...X..", "X...XXX.XX..XX.", "X...X.X.X...X..", "XXX.X.X.X...XXX"];
// use 3-wide letters across x2..? too wide; use compact 4 letters on x2..5 as block row
F([3,2,3],[4,3,3],"air");
F([2,3,3],[5,3,3],"black_concrete");
F([3,3,3],[4,3,3],"glowstone");
F([2,4,3],[5,4,3],"black_concrete");
S(2,2,3,"orange_concrete");S(5,2,3,"orange_concrete");
// terrace planters & tables
for (const [x,z] of [[0,1],[3,1],[9,1],[12,1],[15,1],[15,5],[15,9],[0,5],[0,9]]){
 S(x,1,z,"spruce_trapdoor",{half:"bottom",open:"false"}); S(x,1,z,"oak_leaves",{persistent:"true"}); S(x,2,z,"azalea_leaves",{persistent:"true"});}
for (const [x,z] of [[10,2],[13,2],[15,7],[1,7]]){ S(x,1,z,"dark_oak_fence"); S(x,2,z,"dark_oak_pressure_plate"); S(x,3,z,"lantern",{hanging:"false"}); }
for (const [x,z] of [[10,2],[13,2]]) {S(x-1,1,z,"dark_oak_stairs",{facing:"east"}); S(x+1,1,z,"dark_oak_stairs",{facing:"west"});}
// glass railing
for (let x=9;x<=15;x++) if(![10,13].includes(x)||true) {} 
F([0,1,12],[0,1,12],"stone_bricks");
g.save("build.nbt");
console.log(g.refused);
