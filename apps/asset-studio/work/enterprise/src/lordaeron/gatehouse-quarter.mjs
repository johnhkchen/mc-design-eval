// The gatehouse quarter (thread 0012): what stands just inside a gate, where the caravans arrive.
//   stable      10 x 7 on the module set: open bays to the street, four stalls with rails, hay, troughs; no animals
//   wagon_yard  13 x 9: a paved yard, a stone loading dock along the back, goods, a parked wagon, lamps, a gate 3 wide
//   toll_house  9 x 5 astride a 3-wide road: two stone booths, a roofed arch over the road, gates across it
// Layers 0-1 ground, 2 the ground's surface (the module-set buildings' ground 2 too). The road runs north-south.
import { Grid } from "../grid.mjs";
import { compose, layoutOf } from "./compose.mjs";

const fence = (n, s, e, w, wood = "spruce") => `${wood}_fence[east=${e},north=${n},south=${s},waterlogged=false,west=${w}]`;
const LAMP = (g, x, z, y = 3) => { g.set(x, y, z, fence(false, false, false, false)); g.set(x, y + 1, z, fence(false, false, false, false)); g.set(x, y + 2, z, "lantern[hanging=false,waterlogged=false]"); };

export function stable() {
  const L = layoutOf({ W: 10, D: 7, storeys: 1, roof: "gable_x", arcade: "front", noCore: true, fitout: ({ put, top }) => {
    for (const x of [1, 3, 5, 7]) { for (const z of [1, 2, 3]) put(0, "stall_rail", [x + 1, z]); put(0, "hay", [x, 1]); put(0, "quench", [x, 2]); }
    put(0, "chest", [8, 1]); put(0, "cask", [8, 2]);
    for (const [x, z] of [[2, 3], [6, 3], [4, 4]]) put(0, "lantern", [x, z], top);
  } });
  return { grid: compose(L), layout: L };
}

export function wagonYard() {
  const W = 13, D = 9, g = new Grid([W, 8, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, (x * 7 + z * 3) % 5 ? "cobblestone" : "gravel"); }
  // the loading dock: a stone platform along the back, a block high, stair-edged, goods stacked on it
  for (let x = 0; x < W; x++) { for (const z of [0, 1]) g.set(x, 3, z, "stone_bricks"); g.set(x, 3, 2, x % 4 === 1 ? "stone_brick_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]" : "stone_brick_slab[type=top,waterlogged=false]"); }
  const goods = ["enterprise:decor_barrel[facing=up,open=false]", "hay_block[axis=y]", "enterprise:decor_barrel[facing=up,open=false]", "white_wool", "chest[facing=south,type=single,waterlogged=false]", "hay_block[axis=x]", "enterprise:decor_barrel[facing=up,open=false]"];
  for (let x = 1; x < W - 1; x += 2) { g.set(x, 4, 0, goods[(x >> 1) % goods.length]); if (x % 4 === 1) g.set(x, 5, 0, "enterprise:decor_barrel[facing=up,open=false]"); }
  // a parked wagon: an oak bed on four wheels (dark oak trapdoors), its shafts down, a load of hay and barrels
  const wx = 4, wz = 5;
  for (let x = wx; x < wx + 4; x++) for (let z = wz; z < wz + 2; z++) g.set(x, 3, z, "oak_slab[type=top,waterlogged=false]");
  for (const [x, z, f] of [[wx, wz - 1, "north"], [wx + 3, wz - 1, "north"], [wx, wz + 2, "south"], [wx + 3, wz + 2, "south"]]) g.set(x, 3, z, `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(wx + 1, 4, wz, "hay_block[axis=x]"); g.set(wx + 2, 4, wz, "hay_block[axis=x]"); g.set(wx + 1, 4, wz + 1, "enterprise:decor_barrel[facing=up,open=false]");
  g.set(wx - 1, 3, wz, fence(false, false, true, false, "oak")); g.set(wx - 1, 3, wz + 1, fence(false, false, true, false, "oak"));
  // the yard's wall on the sides, the gate 3 wide at the front's middle, lamps
  for (let z = 0; z < D; z++) for (const x of [0, W - 1]) if (z > 2) g.set(x, 3, z, `cobblestone_wall[east=none,north=${z > 3 ? "low" : "none"},south=${z < D - 1 ? "low" : "none"},up=${z === 3 || z === D - 1},waterlogged=false,west=none]`);
  for (let x = 1; x < W - 1; x++) if (x < 5 || x > 7) g.set(x, 3, D - 1, `cobblestone_wall[east=${x !== 4 && x !== W - 2 ? "low" : "none"},north=none,south=none,up=${x === 4 || x === 8},waterlogged=false,west=${x !== 8 && x !== 1 ? "low" : "none"}]`);
  LAMP(g, 4, D - 2); LAMP(g, 8, D - 2); LAMP(g, 1, 4); LAMP(g, W - 2, 4); LAMP(g, 6, 3, 4);
  return { grid: g };
}

export function tollHouse() {
  const W = 9, D = 5, g = new Grid([W, 10, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, x >= 3 && x <= 5 ? "dirt_path" : "cobblestone"); }
  // two booths, 3 x 5 each, stone walls with a window to the road and a door on its far side
  for (const [x0, toRoad] of [[0, 2], [6, 6]]) {
    for (let x = x0; x < x0 + 3; x++) for (let z = 0; z < D; z++) {
      const wall = x === x0 || x === x0 + 2 || z === 0 || z === D - 1; if (!wall) continue;
      for (let y = 3; y <= 6; y++) g.set(x, y, z, (x === x0 || x === x0 + 2) && (z === 0 || z === D - 1) ? "stone_bricks" : y === 6 ? "stripped_dark_oak_log[axis=z]" : "calcite");
    }
    g.set(toRoad, 4, 2, "glass_pane[east=false,north=true,south=true,waterlogged=false,west=false]");             // the window on the road
    g.set(x0 + 1, 3, D - 1, "spruce_door[facing=south,half=lower,hinge=left,open=false,powered=false]"); g.set(x0 + 1, 4, D - 1, "spruce_door[facing=south,half=upper,hinge=left,open=false,powered=false]");
    for (let z = 1; z < D - 1; z++) g.set(x0 + 1, 2, z, "spruce_planks");
    g.set(x0 + 1, 3, 1, "enterprise:decor_lectern[facing=south]"); g.set(x0 + 1, 6, 2, "lantern[hanging=true,waterlogged=false]");
    // a pyramid cap
    for (let x = x0; x < x0 + 3; x++) for (let z = 0; z < D; z++) g.set(x, 7, z, x === x0 + 1 && z > 0 && z < D - 1 ? "granite_slab[type=bottom,waterlogged=false]" : `granite_stairs[facing=${x === x0 ? "east" : x === x0 + 2 ? "west" : z === 0 ? "south" : "north"},half=bottom,shape=straight,waterlogged=false]`);
  }
  // the arch over the road: a beam with braces, a slab roof, the toll's lamp
  for (let x = 3; x <= 5; x++) for (const z of [0, D - 1]) g.set(x, 6, z, "dark_oak_log[axis=x]");
  for (let x = 3; x <= 5; x++) for (let z = 0; z < D; z++) g.set(x, 7, z, "granite_slab[type=bottom,waterlogged=false]");
  for (const z of [0, D - 1]) { g.set(3, 5, z, "dark_oak_stairs[facing=east,half=top,shape=straight,waterlogged=false]"); g.set(5, 5, z, "dark_oak_stairs[facing=west,half=top,shape=straight,waterlogged=false]"); }
  g.set(4, 6, 2, "lantern[hanging=true,waterlogged=false]");
  // the gates across the road (open by day; the sim may close them), on both faces
  for (let x = 3; x <= 5; x++) { g.set(x, 3, 0, "spruce_fence_gate[facing=north,in_wall=false,open=true,powered=false]"); g.set(x, 3, D - 1, "spruce_fence_gate[facing=south,in_wall=false,open=true,powered=false]"); }
  return { grid: g };
}
