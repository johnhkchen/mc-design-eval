// Roofs: each building's roof laid with the roof tool (roof()) over its body rect, keep boxes for the stacks, then the
// porch roofs, the lean-to and the hall-free shed roofs by hand. The oven vault and the tank lid are left to shell B
// (its vocabulary helpers water_tank / bread_oven write them). Only air is written; refused cells are the shell's.
import { roof, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the stacks rise through the roofs: their cells stay out of every roof
const STACK0 = [{ from: [3, 1, 17], to: [8, 24, 18] }];
const STACK2 = [{ from: [25, 1, 11], to: [26, 24, 13] }];
const STACK3 = [{ from: [40, 1, 17], to: [42, 24, 18] }];
const STACK4 = [{ from: [50, 1, 17], to: [52, 24, 18] }];
const STACK7 = [{ from: [86, 1, 17], to: [88, 24, 18] }, { from: [91, 1, 17], to: [93, 24, 18] }];

// the walls the shell already built where a roof's eave or gable would land: gable triangles, party walls, the wall
// lines' own air (openings, the eave course under a wall). The roof leaves them; the shell owns them.
const SHELL0 = [
  { from: [1, 5, 9], to: [1, 6, 16] },          // west wall line (windows, the course under the eave)
  { from: [1, 6, 9], to: [10, 11, 9] },         // front gable triangle (the wall's, clapboard + vent)
  { from: [1, 6, 16], to: [10, 11, 16] },       // back gable triangle
  { from: [5, 10, 10], to: [6, 11, 15] },       // party wall to the ridge
];
const SHELL1 = [
  { from: [15, 6, 7], to: [15, 12, 17] },       // west gable end: cherry boards to the ridge
  { from: [22, 6, 7], to: [22, 12, 17] },       // east gable end
  { from: [16, 6, 17], to: [21, 6, 17] },       // back wall plate under the eave
];
const SHELL3 = [
  { from: [39, 12, 9], to: [42, 13, 9] },       // front cross gable triangle: fishscale wall
  { from: [43, 10, 7], to: [46, 12, 10] },      // the tower stage the hip's and the gable's eaves meet
];
const SHELL4 = [
  { from: [53, 9, 9], to: [58, 11, 9] },        // front gable triangle: the wall's (windows, attic pair, vent)
  { from: [53, 9, 16], to: [58, 11, 16] },      // back gable triangle
  { from: [49, 7, 12], to: [49, 9, 16] },       // wing west gable end: the wall, its window and vent
  { from: [53, 7, 12], to: [53, 8, 16] },       // wing east end: the gable block's west wall
];
const SHELL5 = [
  { from: [61, 7, 9], to: [68, 11, 9] },        // front gambrel gable: the wall, the loft door (64..65, 8..9) stays air
  { from: [61, 7, 15], to: [68, 11, 15] },      // back gambrel gable
  { from: [61, 7, 9], to: [61, 7, 15] },        // west wall course at the loft eave
  { from: [68, 7, 9], to: [68, 7, 15] },        // east wall course at the loft eave
  { from: [62, 7, 10], to: [63, 8, 13] },       // loft hay, west stack
  { from: [66, 7, 10], to: [67, 8, 14] },       // loft hay, east stack
  { from: [62, 8, 14], to: [62, 8, 14] },       // the ladder's head room: the climb out of the hatch needs it clear
  { from: [64, 7, 10], to: [65, 11, 14] },      // the loft's centre aisle, open under the ridge (the roof's top stays)
];

// the Queen Anne slate: one mix, the same on the hip, the cross gable and the tower's copper is its own
const SLATE = { mix: [["deepslate_tiles", 3], ["stone_bricks", 2]] };
const COPPER = { mix: [["weathered_cut_copper", 3], ["oxidized_cut_copper", 2]] };

const put = (g, x, y, z, [block, state]) => g.set(x, y, z, block, state);

// the eave trim as palette blocks: birch fascia and soffit, not the tool's oak and stripped-birch stairs
const EDGES = { fascia: "birch_trapdoor", soffit: "birch", barge: true };

// the barn preset's cupola rails are iron_bars, which the palette lacks: the view hands the roof spruce fence instead,
// the same thin connected bars (its states north/south/east/west are the same keys)
const barnPalette = (g) => new Proxy(g, {
  get: (t, p) => {
    if (p === "set") return (x, y, z, b, s, n) => t.set(x, y, z, b === "iron_bars" ? "spruce_fence" : b, s, n);
    const v = Reflect.get(t, p);
    return typeof v === "function" ? v.bind(t) : v;
  },
});

export function build(g) {
  // plot 0 double shotgun: one front gable over both units, eave y7, ridge y12
  // no fascia: the eaves are the long sides (ridge along z), so its fascia would sit at x -1 and x 12, off the site and
  // over the next plot; the roof tool then grows and shifts the whole grid by one column
  roof(g, [[1, 9, 10, 16]], "gable", {
    ridgeAxis: "z", front: "north", pitch: 45, y: 7, edges: { fascia: false, barge: true }, trim: "birch_planks", overhang: 1, material: { mix: [["red_nether_bricks", 4], ["nether_bricks", 1]] },
    verge: "birch_planks", keep: [...STACK0, ...SHELL0],
  });
  // plot 0 shared porch: shed under the gable, stairs rising to the body wall, slabs at the front edge
  for (let x = 1; x <= 10; x++) {
    put(g, x, 7, 8, B.stairs("red_nether_brick", "south", "bottom"));
    put(g, x, 7, 7, B.slab("red_nether_brick", "bottom"));
  }

  // plot 1 Creole cottage: side gable, one plane from the ridge over the galerie (z 7..17), E/W flush
  roof(g, [[15, 7, 22, 17]], "gable", {
    ridgeAxis: "x", front: "north", pitch: 45, y: 6,
    edges: EDGES, trim: "birch_planks", overhang: { north: 1, south: 1, east: 0, west: 0 }, material: { mix: [["dark_oak_planks", 3], ["spruce_planks", 1]] },
    verge: "stripped_dark_oak_log", soffit: "dark_oak", keep: SHELL1,
  });

  // plot 2 American Foursquare: hipped, eave y12, ridge y15; the west stack passes through
  roof(g, [[27, 9, 34, 16]], "hip", { pitch: 0.75, y: 12, edges: EDGES, trim: "birch_planks", overhang: 1, material: { mix: [["nether_bricks", 3], ["red_nether_bricks", 1]] }, keep: STACK2 });
  // plot 2 front dormer: its own small hip on the front slope, eave y15
  // (contrast: false keeps the nether brick the plan names; the tone check would swap in slate, whose tuff and polished deepslate are off the palette)
  roof(g, [[29, 10, 32, 12]], "hip", { pitch: 45, y: 15, edges: EDGES, trim: "birch_planks", overhang: 1, contrast: false, material: { mix: [["nether_bricks", 3], ["red_nether_bricks", 1]] } });
  // the dormer's hip stairs at y15 stand on the eave course at x 29 and 32 (z 11..12): a top slab, so the stairs rest on it
  for (const [x, z] of [[29, 11], [29, 12], [32, 11], [32, 12]]) {
    const c = g.get(x, 14, z);
    g.set(x, 14, z, c.block, { ...c.state, type: "top" });
  }
  // plot 2 porch: low hip-cornered shed, stairs rising to the body wall at z 8, slabs at the front edge z 7
  for (let x = 26; x <= 35; x++) {
    put(g, x, 7, 8, B.stairs("nether_brick", "south", "bottom"));
    put(g, x, 7, 7, B.slab("nether_brick", "bottom"));
  }

  // plot 3 Queen Anne: steep hip over the body (the tower's corner notched out), with a front cross gable
  roof(g, [[39, 9, 42, 16], [43, 11, 45, 16]], "hip", {
    pitch: 45, y: 12, edges: EDGES, trim: "birch_planks", overhang: 1, material: SLATE, keep: [...STACK3, ...SHELL3],
  });
  roof(g, [[39, 9, 42, 12]], "gable", {
    ridgeAxis: "z", front: "north", pitch: 45, y: 12, edges: EDGES, trim: "birch_planks", overhang: 1, material: SLATE, keep: SHELL3,
  });
  // plot 3 tower: pyramid cap of copper over the stage top y15, eave y16, apex ~y22
  roof(g, [[43, 7, 46, 10]], "pyramid", { pitch: 45, y: 16, edges: EDGES, trim: "birch_planks", overhang: 1, material: COPPER });
  // plot 3 wraparound porch: front leg stairs at z 8 and the west leg at x 38, slabs at the outer edge
  for (let x = 37; x <= 42; x++) {
    put(g, x, 7, 8, B.stairs("cobbled_deepslate", "south", "bottom"));
    put(g, x, 7, 7, B.slab("cobbled_deepslate", "bottom"));
  }
  for (let z = 9; z <= 14; z++) {
    put(g, 38, 7, z, B.stairs("cobbled_deepslate", "east", "bottom"));
    put(g, 37, 7, z, B.slab("cobbled_deepslate", "bottom"));
  }

  // plot 4 gable-front block: front gable to the lane, eave y9, ridge y12; the west side meets the wing
  roof(g, [[53, 9, 58, 16]], "gable", {
    ridgeAxis: "z", front: "north", pitch: 45, y: 9,
    edges: EDGES, trim: "birch_planks", overhang: { north: 1, south: 1, east: 1, west: 0 }, material: "mud_bricks", texture: false, verge: "birch_planks",
    keep: SHELL4,
  });
  // plot 4 side wing: lower side gable, eave y7, ridge y10 along z 14; stack passes through its back
  roof(g, [[49, 12, 53, 16]], "gable", {
    ridgeAxis: "x", front: "north", pitch: 45, y: 7,
    edges: EDGES, trim: "birch_planks", overhang: { north: 1, south: 1, east: 0, west: 0 }, material: "mud_bricks", texture: false,
    verge: "birch_planks", keep: [...STACK4, ...SHELL4],
  });
  // plot 4 porch in the angle: shed, stairs rising to the wing wall at z 11, slabs at the outer edge z 9
  for (let x = 49; x <= 52; x++) {
    put(g, x, 7, 10, B.stairs("mud_brick", "south", "bottom"));
    put(g, x, 7, 9, B.slab("mud_brick", "bottom"));
  }

  // plot 5 mule barn: gambrel barn (barn preset, its barn-red palette), eave y7, ridge y12
  roof(barnPalette(g), [[61, 9, 68, 15]], "barn", { ridgeAxis: "z", front: "north", y: 7, overhang: 1, ridge: "slab", soffit: "spruce", keep: SHELL5 });
  // the cupola's open top: a slab cap over the cupola ring, so the lantern inside it hangs from a block
  g.set(64, 16, 12, "mangrove_slab", { type: "top", waterlogged: "false" });
  // plot 5 wagon lean-to: a dark oak shed off the barn's east wall, high side at the barn (x 69), low at x 70
  for (let z = 8; z <= 16; z++) {
    put(g, 69, 5, z, B.stairs("dark_oak", "west", "bottom"));
    put(g, 70, 4, z, B.slab("dark_oak", "bottom"));
  }

  // plot 6 picnic pavilion: low open gable along x, eave y5, ridge y7 (no fascia: its open trapdoors hang in the air at the eave)
  roof(g, [[74, 7, 81, 11]], "gable", {
    ridgeAxis: "x", front: "north", pitch: 0.5, y: 5, edges: { ...EDGES, fascia: false }, trim: "birch_planks", overhang: 1, material: "dark_prismarine", texture: false,
    verge: "dark_prismarine",
  });

  // plot 7 company duplex: low hip over the body and the two-storey porch, stacks passing through the back
  roof(g, [[85, 7, 94, 16]], "hip", {
    pitch: 0.5, y: 12, edges: EDGES, trim: "birch_planks", overhang: 1, material: "stone_bricks", texture: false, keep: STACK7,
  });
}
