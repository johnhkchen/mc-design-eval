import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = new Grid([30, 10, 10]);
g.fill([0,0,0],[2,5,2],"red_concrete");
g.fill([27,0,0],[29,5,2],"blue_concrete");
g.fill([0,0,0],[29,0,9],"stone");
g.save("scratch/orient.nbt");
