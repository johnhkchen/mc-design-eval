// Part: Roofs (4 of 35). The dogtrot roof is roof.json (laid by runParts right after the shell, with its trusses).
// The other buildings' roofs are laid here with roof() from the build library, and the hand porch roofs
// (stairs and slab rows) are set by hand, all on plan.md's ROOFS table. Writes go into air only.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROOFS = [
  // plot 1 camelback front block: front gable to the lane, dies into the hump's north wall at z 13
  { name: "camelback front", footprint: [15, 9, 20, 12], style: "gable", o: { y: 7, pitch: 1, ridgeAxis: "z", front: "north", material: "stone", eave: "stone", ridge: "stone_slab", verge: "stone", overhang: { north: 1, south: 0, east: 1, west: 1 }, keep: [{ from: [15, 7, 12], to: [20, 9, 12] }] } },
  // plot 1 camel hump: 2 storeys, gable over the rear rooms; north gable triangle stays wall (keep)
  { name: "camel hump", footprint: [15, 13, 20, 17], style: "gable", o: { y: 12, pitch: 1, ridgeAxis: "z", material: "stone", eave: "stone", ridge: "stone_slab", verge: "stone", overhang: { north: 0, south: 1, east: 1, west: 1 }, keep: [{ from: [15, 12, 13], to: [20, 14, 13] }, { from: [13, 7, 14], to: [14, 20, 15] }] } },
  // plot 2 I-house: side gable, dark slate, quartz verge; end chimneys kept
  { name: "I-house", footprint: [25, 9, 34, 16], style: "gable", o: { y: 12, pitch: 1, ridgeAxis: "x", material: "deepslate_tile", eave: "deepslate_tile", ridge: "slab", verge: "smooth_quartz", overhang: { north: 1, south: 1, east: 0, west: 0 }, keep: [{ from: [25, 6, 12], to: [25, 20, 12] }, { from: [34, 6, 12], to: [34, 20, 12] }] } },
  // plot 3 pyramid cottage: true pyramid, polished granite, stack kept through the apex
  { name: "pyramid", footprint: [37, 9, 46, 17], style: "pyramid", o: { y: 7, pitch: 1, material: "polished_granite", eave: "polished_granite", ridge: "slab", overhang: 1, keep: [{ from: [41, 6, 12], to: [42, 15, 13] }] } },
  // plot 4 boarding house: side gable, tuff brick, polished tuff eave; kitchen chimney kept
  // gable ends are polished_tuff (tuff_bricks is not in the palette; stairs and slabs stay tuff_brick_*)
  { name: "boarding house", footprint: [49, 9, 58, 16], style: "gable", o: { y: 12, pitch: 1, ridgeAxis: "x", material: "tuff_brick", eave: "tuff_brick", ridge: "slab", verge: "stripped_oak_log", gable: "polished_tuff", overhang: { north: 1, south: 1, east: 0, west: 0 }, keep: [{ from: [49, 6, 12], to: [50, 20, 13] }] } },
  // plot 5 smokehouse: small steep front gable, blackstone; vent shaft kept at z 17
  { name: "smokehouse", footprint: [61, 12, 65, 16], style: "gable", o: { y: 5, pitch: 1.5, ridgeAxis: "z", material: "blackstone", eave: "blackstone", ridge: "slab", verge: "spruce", overhang: { north: 1, south: 1, east: 1, west: 0 }, keep: [{ from: [63, 5, 17], to: [63, 15, 17] }, { from: [63, 9, 16], to: [63, 9, 16] }] } },
  // plot 7 bungalow: low front gable over porch and body, green copper mix; brick chimney kept
  { name: "bungalow", footprint: [85, 7, 94, 17], style: "gable", o: { y: 7, pitch: 0.5, ridgeAxis: "z", front: "north", material: { mix: [["oxidized_cut_copper", 70], ["weathered_cut_copper", 30]] }, eave: "oxidized_cut_copper", ridge: "slab", verge: "smooth_quartz", overhang: { north: 1, south: 1, east: 0, west: 0 }, keep: [{ from: [85, 6, 13], to: [86, 20, 14] }] } },
];

// hand porch roofs: a shed of stairs on the front line (high side toward the house) and a slab row behind
const PORCHES = [
  // [x0, x1, z, roofY, stairs material, slab material, slab type]
  { name: "dogtrot porch", x0: 1, x1: 10, z: 7, y: 6, stairs: "exposed_cut_copper", slab: "exposed_cut_copper" },
  { name: "camelback porch", x0: 15, x1: 20, z: 7, y: 6, stairs: "stone", slab: "stone", slabType: "top" },
  { name: "I-house gallery", x0: 25, x1: 34, z: 7, y: 11, stairs: "deepslate_tile", slab: "deepslate_tile", slabType: "top" },
  { name: "pyramid porch", x0: 37, x1: 46, z: 7, y: 6, stairs: "polished_granite", slab: "polished_granite" },
  { name: "boarding porch", x0: 49, x1: 58, z: 7, y: 6, stairs: "tuff_brick", slab: "tuff_brick" },
];

// roof() takes one material name for its stairs, slabs and blocks, so a verge that is in the palette as slabs can be off
// it as stairs: smooth_quartz has smooth_quartz_slab in the palette but not smooth_quartz_stairs; quartz_stairs is the
// palette's stair of the same shape. The swap is made at the write, so the roof is laid with palette ids throughout.
const SWAP = { "smooth_quartz_stairs": "quartz_stairs" };
const swapped = (g) => new Proxy(g, {
  get(t, p) {
    if (p === "set") return (x, y, z, block, state, nbt) => t.set(x, y, z, SWAP[block.replace("minecraft:", "")] ?? block, state, nbt);
    const v = Reflect.get(t, p);
    return typeof v === "function" ? v.bind(t) : v;
  },
});

export function build(grid) {
  const g = swapped(grid);
  for (const r of ROOFS) {
    const res = roof(g, r.footprint, r.style, { texture: false, ...r.o });
    if (res.refused) console.log(`roofs: ${r.name} kept ${res.refused} cells`);
  }
  for (const p of PORCHES) {
    for (let x = p.x0; x <= p.x1; x++) {
      if (g.isAir(x, p.y, p.z)) g.set(x, p.y, p.z, ...B.stairs(p.stairs, "south", "bottom"));
      if (g.isAir(x, p.y + 1, p.z + 1)) g.set(x, p.y + 1, p.z + 1, ...B.slab(p.slab, p.slabType ?? "bottom"));
    }
  }
  // the smokehouse lean-to: a flat spruce slab roof on its posts, x 67..70 z 14..17, y 4
  for (let x = 67; x <= 70; x++) for (let z = 14; z <= 17; z++) if (g.isAir(x, 4, z)) g.set(x, 4, z, ...B.slab("spruce", "bottom"));
}
