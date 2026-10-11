// after mcd paint: stray dripstone from weathering -> base block; stage5.nbt -> build.nbt
import { load } from "../../../../../../minecraft-design/tools/src/build.mjs";
const HERE = new URL(".", import.meta.url).pathname;
const g = load(HERE + "stage5.nbt");
for (const c of [...g]) if (c.block === "minecraft:dripstone_block") g.set(...c.pos, "polished_blackstone");
g.save(HERE + "build.nbt");
