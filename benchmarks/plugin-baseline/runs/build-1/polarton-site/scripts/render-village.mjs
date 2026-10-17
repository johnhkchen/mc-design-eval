// The village (site + kit) rendered with the server's blocks as vanilla look-alikes: views from the village and the hill.
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { spawnSync } from "node:child_process";
const here = (p) => new URL(p, import.meta.url).pathname, OUT = here("../art"), MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const AFTER = here("../delivery/village.nbt");
const LOOKS = [
  [/willow_leaves|hanging_willow/, "jungle_leaves"], [/red_maple_leaves/, "cherry_leaves"], [/orange_maple_leaves|yellow_maple_leaves/, "acacia_leaves"],
  [/leaves$/, "oak_leaves"], [/leaf_pile|fallen_leaves/, null], [/_log$|_wood$/, "oak_log"],
  [/deepslate/, "deepslate"], [/limestone/, "calcite"], [/rocky_dirt/, "coarse_dirt"], [/stone|_ore$|rocks$/, "stone"],
  [/plants|grass|sprouts|cucumbers|twigs|mushroom|nodule|cobweb|remains/, null],
];
const g = load(AFTER), v = new Grid(g.size, { dataVersion: g.dataVersion }), swapped = {};
for (const c of g.cells.values()) {
  const [ns, name] = c.block.split(":");
  if (ns === "minecraft") { v.set(...c.pos, c.block, c.state); continue; }
  const hit = LOOKS.find(([re]) => re.test(name)), to = hit ? hit[1] : "stone";
  swapped[c.block] = to ?? "(left out)";
  if (to) v.set(...c.pos, to, to === "oak_log" && c.state?.axis ? { axis: c.state.axis } : /leaves/.test(to) ? { persistent: "true" } : undefined);
}
v.save(`${OUT}/village-vanilla.nbt`);
for (const [name, view] of [["village-hill", "hill:96,40,84->44,12,44"], ["village-up", "up:70,22,62->40,14,40"], ["village-down", "down:24,30,30->70,4,62"]]) {
  const r = spawnSync("node", [MCD, "render", `${OUT}/village-vanilla.nbt`, "--out", `${OUT}/${name}-sheet.png`, "--view", view, "--tiles", `${OUT}/${name}`], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
}
console.log("ok");
