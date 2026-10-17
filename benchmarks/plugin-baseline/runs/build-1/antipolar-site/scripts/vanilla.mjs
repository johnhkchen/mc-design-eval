// The server's modded blocks as vanilla look-alikes for the renderer (it has no textures for them): the per-server
// lexicon, by name. null = left out of the render (ground cover, water plants).
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
export const LOOKS = [
  [/willow_leaves|hanging_willow/, "jungle_leaves"], [/red_maple_leaves/, "cherry_leaves"], [/orange_maple_leaves|yellow_maple_leaves/, "acacia_leaves"],
  [/leaf_pile|fallen_leaves/, null], [/leaves$/, "oak_leaves"], [/hollow_oak_log/, "oak_log"], [/_log$|_wood$/, "oak_log"],
  [/^ochrum$/, "smooth_sandstone"], [/salt_block/, "calcite"], [/headstone/, "cobblestone_wall"],
  [/deepslate/, "deepslate"], [/limestone/, "calcite"], [/rocky_dirt/, "coarse_dirt"], [/rocks$/, null], [/stone|_ore$/, "stone"],
  [/plants|grass|sprouts|cucumbers|twigs|mushroom|nodule|cobweb|remains|cattail|reeds|duckweed|clover|lupine|wild_rice|bones/, null],
];
export function vanillaOf(g) {
  const v = new Grid(g.size, { dataVersion: g.dataVersion }), swapped = {};
  for (const c of g.cells.values()) {
    const [ns, name] = c.block.split(":");
    if (ns === "minecraft") { v.set(...c.pos, c.block, c.state); continue; }
    const hit = LOOKS.find(([re]) => re.test(name)), to = hit ? hit[1] : "stone";
    swapped[c.block] = to ?? "(left out)";
    if (to) v.set(...c.pos, to, to === "oak_log" && c.state?.axis ? { axis: c.state.axis } : /leaves/.test(to) ? { persistent: "true" } : undefined);
  }
  return { v, swapped };
}
if (import.meta.url === `file://${process.argv[1]}`) { const { v, swapped } = vanillaOf(load(process.argv[2])); v.save(process.argv[3]); console.log(JSON.stringify(swapped, null, 1)); }
