// Part: roofs. Three steep shop roofs, one per house (plan.md ROOFS): preset shop, 45 degree pitch, ridge on z, slate
// with a sandstone verge and ridge, the gable triangle filled in brick (the wall's job), chimney boxes kept clear.
// Each house's roof overhangs its outer end (H1 east, H3 west) and the street and rear faces by 1; the party walls
// (x 13, x 25) get no overhang, so the neighbouring eaves meet in a valley.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { HOUSES, ROOF_Y, STREET_Z, REAR_Z, CHIMNEY_FLUE_X } from "../vocab/base.mjs";

// the chimney boxes the roof must not touch: the stack's cells at z 25..26, y 19..28 (plan.md ROOFS)
const stackKeep = (flue) => ({ from: [flue - 1, ROOF_Y, REAR_Z + 1], to: [flue + 1, 28, REAR_Z + 2] });

// per-house overhang: 1 to the street and the rear; 1 at the outer end only (x 38 over H1, x 0 over H3)
const OVERHANG = {
  H1: { north: 1, south: 1, east: 0, west: 0 },
  H2: { north: 1, south: 1, east: 0, west: 0 },
  H3: { north: 1, south: 1, east: 0, west: 0 },
};

export function build(g) {
  for (const [key, h] of Object.entries(HOUSES)) {
    const footprint = [h.x0, STREET_Z, h.x1, REAR_Z];
    const r = roof(g, footprint, "shop", {
      pitch: 45,
      ridgeAxis: "z",
      front: "north",
      y: ROOF_Y,
      // the slate palette of the roof tool with this palette's eave block (its default eave is tuff brick, not ours)
      material: { mix: [["cobbled_deepslate", 45], ["deepslate_tile", 35], ["polished_deepslate", 20]], eave: "polished_blackstone_bricks", ridge: "smooth_sandstone", verge: "smooth_sandstone" },
      verge: "smooth_sandstone",
      ridge: "smooth_sandstone",
      gable: "bricks",
      overhang: OVERHANG[key],
      why: "attached terrace: neighbouring gables meet in a valley on the party wall",
      keep: [stackKeep(CHIMNEY_FLUE_X[key])],
    });
    if (r.notes?.length) console.log(`roofs ${key}: ${r.notes.join("; ")}`);
    if (r.refused) console.log(`roofs ${key}: ${r.refused} refused`);
  }
}
