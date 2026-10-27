// Lordaeron stone docks (hall:stone_docks): a pier segment 3 wide x 4 long, repeated out over the water, and a dock head
// 5 x 5 at its end. Ground 0 is the deck. Under the deck the placer runs the declared pilings down to the bed.
import { Grid } from "../grid.mjs";
const KERB = "stone_brick_slab[type=bottom,waterlogged=false]", DECK = "stone_bricks", BOLLARD = "cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]";
const LAMP = (g, x, z) => { g.set(x, 1, z, BOLLARD); g.set(x, 2, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 3, z, "lantern[hanging=false,waterlogged=false]"); };

export function pierSegment() {
  const g = new Grid([3, 4, 4]);
  for (let x = 0; x < 3; x++) for (let z = 0; z < 4; z++) g.set(x, 0, z, (x + z) % 3 === 0 ? "cracked_stone_bricks" : DECK);
  for (const z of [0, 1, 2, 3]) { g.set(0, 1, z, z === 1 ? BOLLARD : KERB); g.set(2, 1, z, z === 3 ? KERB : KERB); }
  LAMP(g, 2, 1);
  return { grid: g, pilings: [[0, 0], [2, 0], [0, 3], [2, 3]].map(([x, z]) => ({ at: [x, z], block: "minecraft:stone_bricks" })) };
}

export function dockHead() {
  const g = new Grid([5, 7, 5]);
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) g.set(x, 0, z, (x * 2 + z) % 4 === 0 ? "chiseled_stone_bricks" : DECK);
  // mooring steps down to the water on the far edge
  g.set(1, 0, 4, "stone_brick_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]"); g.set(2, 0, 4, "stone_brick_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]");
  // bollards at the corners, kerbs between
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) g.set(x, 1, z, BOLLARD);
  for (const [x, z] of [[0, 2], [4, 2]]) g.set(x, 1, z, KERB);
  // the crane: a mast, a jib out over the water, a chain and a load (a bale)
  for (let y = 1; y <= 5; y++) g.set(3, y, 3, "dark_oak_log[axis=y]");
  g.set(3, 6, 3, "dark_oak_slab[type=bottom,waterlogged=false]");
  g.set(3, 5, 4, "dark_oak_fence[east=false,north=true,south=false,waterlogged=false,west=false]");
  g.set(3, 4, 4, "chain[axis=y,waterlogged=false]"); g.set(3, 3, 4, "hay_block[axis=y]");
  g.set(2, 4, 3, "dark_oak_stairs[facing=east,half=top,shape=straight,waterlogged=false]");
  LAMP(g, 0, 1); LAMP(g, 4, 1);
  g.set(1, 1, 1, "enterprise:decor_barrel[facing=up,open=false]"); g.set(1, 1, 2, "enterprise:decor_barrel[facing=up,open=false]");
  return { grid: g, pilings: [[0, 0], [4, 0], [0, 4], [4, 4], [2, 2]].map(([x, z]) => ({ at: [x, z], block: "minecraft:stone_bricks" })) };
}
