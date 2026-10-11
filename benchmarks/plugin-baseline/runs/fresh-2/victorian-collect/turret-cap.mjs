// Stage 2c: the turret's conical cap (preset tower-cap, validated with `mcd roof turret.nbt --preset tower-cap --dry-run`:
// no warnings). Built through the library so the main mansard around it is not stripped.
import { load, roof, replace } from "../../../../../../minecraft-design/tools/src/build.mjs";
const here = (f) => new URL(`./${f}`, import.meta.url).pathname;
const g = load(here("turret.nbt"));
const r = roof(g, [[4, 4, 10, 10]], "tower-cap", { y: 23, front: "north", material: { mix: [["oxidized_cut_copper", 50], ["weathered_cut_copper", 30], ["dark_prismarine", 20]], eave: "weathered_cut_copper", ridge: "weathered_cut_copper" }, dormer: { face: "north", wall: "cherry_planks" } });
replace(g, [0, 0, 0], [25, 39, 29], "oxidized_cut_copper_slab", "weathered_cut_copper_slab");   // the brim slabs matched nothing around them
console.log(JSON.stringify({ notes: r.notes, shift: r.shift, top: r.top }));
g.save(here("cap.nbt"));
