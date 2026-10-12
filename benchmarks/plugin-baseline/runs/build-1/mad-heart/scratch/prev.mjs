import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { buildHull } from "../hull.mjs";
import { NU,NY,NZ } from "../anat.mjs";
const F = buildHull();
const g = new Grid([NU,NY,NZ]);
const M = {1:"red_terracotta",2:"netherrack",3:"mangrove_planks",4:"nether_wart_block",5:"red_wool",6:"blue_concrete",7:"light_blue_concrete",8:"red_concrete"};
for (let u=0;u<NU;u++)for(let y=0;y<NY;y++)for(let z=0;z<NZ;z++){const v=F.get(u,y,z); if(v) g.set(29-u,y,z,M[v]);}
g.save("scratch/prev.nbt");
