// Part: Roofs. runParts lays the bunkhouse roof (roof.json) after the shell; this part lays the sawmill's granary roof
// (roof-sawmill.json, its monitor and gable planks), the porch shed roof and the woodshed shed roof by hand, and the
// woodshed's beam. Writes go through the runParts view, so a cell an earlier part owns is refused, not overwritten.
import { readFileSync } from "node:fs";
import { B, reroof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SAWMILL_ROOF = JSON.parse(readFileSync(new URL("../roof-sawmill.json", import.meta.url), "utf8"));

export function build(g) {
  // Sawmill: the granary roof, keep box leaves the boiler stack's cells.
  const r = reroof(g, { ...SAWMILL_ROOF, keep: SAWMILL_ROOF.keep ?? [] });
  if (r.shift?.some(Boolean)) throw new Error(`sawmill roof moved the site by ${r.shift}`);

  // Porch shed roof, under the bunkhouse soffit (y=5 at z=6 and the eave course at z=7 are the roof's own): stairs
  // facing south on y=4 at z=5, resting on the posts and running face to face along the row; top slabs on y=4 at z=6
  // so the slope meets the soffit flush. The lantern chains at x=12 and 14 (y=4, z=6) stay air.
  for (let x = 5; x <= 17; x++) {
    g.set(x, 4, 5, ...B.stairs("spruce", "south", "bottom"));
    if (x !== 12 && x !== 14) g.set(x, 4, 6, ...B.slab("spruce", "top"));
  }

  // Woodshed shed roof, under the bunkhouse back soffit (the roof owns y=5 at z=18..19): top slabs on y=4 at z=19
  // (flush with the soffit), stairs facing north on y=4 at z=20 (the slope falls south), bottom slabs on y=4 at z=21 on
  // the posts. Beam (stripped spruce wood, axis x) at y=3: z=20 across x=5..12, and z=21 where the posts (x=5, 8, 12)
  // are not, so the P6 posts fall into air.
  for (let x = 5; x <= 12; x++) {
    g.set(x, 4, 19, ...B.slab("spruce", "top"));
    g.set(x, 4, 20, ...B.stairs("spruce", "north", "bottom"));
    g.set(x, 4, 21, ...B.slab("spruce", "bottom"));
    g.set(x, 3, 20, ...B.wood("stripped_spruce", "x"));
    if (![5, 8, 12].includes(x)) g.set(x, 3, 21, ...B.wood("stripped_spruce", "x"));
  }
}
