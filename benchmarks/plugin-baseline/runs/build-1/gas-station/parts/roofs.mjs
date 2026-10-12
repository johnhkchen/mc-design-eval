// Part "Roofs" (parts/roofs.mjs): the shop roof is laid by runParts from roof.json (y6); this part lays the service
// block roof (y8, x24..32 z24..33, flat modern parapet, no overhang on the shared west wall) and the two rooftop HVAC
// units on its deck. Palette-only materials: the modern preset's default stone stairs and slabs are off palette,
// so the material and trim are set to the polished andesite and smooth stone family.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { hvac_unit } from "../vocab.mjs";

const ROOF_MATERIAL = { mix: [["smooth_stone", 5], ["polished_andesite", 3], ["light_gray_concrete", 2]], eave: "polished_andesite_slab", ridge: "smooth_stone_slab" };

export function build(g) {
  // service block roof: deck y8, parapet and coping y9; the x24 wall is the shared step, so no overhang on the west
  roof(g, [24, 24, 32, 33], "modern", {
    y: 8,
    material: ROOF_MATERIAL,
    trim: "polished_andesite",
    overhang: { north: 1, south: 1, east: 1, west: 0 },
  });

  // rooftop HVAC: two 2x2 units on the service deck (y9..10)
  hvac_unit(g, 26, 28);
  hvac_unit(g, 29, 28);
}
