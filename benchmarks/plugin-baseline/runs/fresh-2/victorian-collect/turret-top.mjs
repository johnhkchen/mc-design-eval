// Stage 2b: the mansard roof swallowed the turret's top; rebuild the tube up through the roof so the cap can sit on it.
import { load, cylinder } from "../../../../../../minecraft-design/tools/src/build.mjs";
const here = (f) => new URL(`./${f}`, import.meta.url).pathname;
const g = load(here("roofed.nbt"));
cylinder(g, { base: [7, 16, 7], radius: 3, height: 7, block: "air", hollow: false });   // clear only the roof cells inside the round tube
cylinder(g, { base: [7, 16, 7], radius: 3, height: 7, block: "light_blue_concrete_powder", hollow: true, thickness: 1 });
for (let k = 6; k <= 8; k++) for (let y = 18; y <= 20; y++) { g.set(k, y, 4, "glass_pane"); g.set(4, y, k, "glass_pane"); }
g.save(here("turret.nbt"));
