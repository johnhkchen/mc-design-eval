// Plot 5 smokehouse r2: the stack's own cobblestone walls the flue from y5 (below the eaves) up through the roof (ridge top y9);
// the roof stops against it. Above the ridge an iron-trapdoor pipe (y10-11), open mouth. Fire/hearth unchanged (63,1,16).
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v3.nbt`);
const W = [[62, 16, "east"], [64, 16, "west"], [63, 15, "south"], [63, 17, "north"]];
for (let y = 5; y <= 9; y++) for (const [x, z] of W) g.set(x, y, z, "cobblestone");
for (let y = 5; y <= 12; y++) g.set(63, y, 16, "air");
for (let y = 10; y <= 11; y++) for (const [x, z, f] of W) g.set(x, y, z, "iron_trapdoor", { facing: f === "east" ? "west" : f === "west" ? "east" : f === "south" ? "north" : "south", half: "bottom", open: "true", powered: "false", waterlogged: "false" });
await g.save(`${D}/chimney/plot5-r2.nbt`);
