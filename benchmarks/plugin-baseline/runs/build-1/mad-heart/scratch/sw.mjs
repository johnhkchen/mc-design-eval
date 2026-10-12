import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const names = ["netherrack","nether_wart_block","red_terracotta","red_concrete","red_wool","pink_terracotta","mangrove_planks","red_nether_bricks","crimson_planks","bricks","brown_terracotta","orange_terracotta","pink_concrete","crimson_hyphae","red_mushroom_block","magma_block","yellow_terracotta","honeycomb_block","yellow_concrete_powder","sponge","hay_block","raw_gold_block","blue_terracotta","light_blue_terracotta","blue_concrete","cyan_terracotta","purple_terracotta","blue_wool","warped_wart_block","light_blue_wool","blue_ice","lapis_block"];
const g = new Grid([32, 18, 3]);
names.forEach((n,i)=>{ const c=i%8, r=Math.floor(i/8); g.fill([c*4,r*4+1,0],[c*4+2,r*4+3,0], n); });
g.save("scratch/sw.nbt");
