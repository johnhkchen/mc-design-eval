// The Masons' Square (hall:square): open paving, which must stay open ground. 9 x 9 (a body of 7 plus a 1-wide
// border), ground 0. Detail in the floor and the edges, not walls: a border course of chiseled stone, patterned
// paving with a compass rose at the centre, raised flower beds in the corners (the master Farmer's beds), benches
// between them facing in, lamp posts at the corners and the edge midpoints.
import { Grid } from "../grid.mjs";

export function masonsSquare() {
  const N = 9, g = new Grid([N, 4, N]), c = 4;
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    const edge = x === 0 || z === 0 || x === N - 1 || z === N - 1, d = Math.max(Math.abs(x - c), Math.abs(z - c));
    g.set(x, 0, z, edge ? "chiseled_stone_bricks" : d === 0 ? "polished_granite" : (x === c || z === c) && d <= 2 ? "polished_andesite"
      : d === 1 ? "polished_diorite" : (x + z) % 2 ? "stone_bricks" : "cobblestone");
    g.set(x, 1, z, "air"); g.set(x, 2, z, "air");
  }
  // corner flower beds: a raised planter of stone brick stairs round grass with flowers (no farmland: it trampled)
  for (const [x0, z0] of [[1, 1], [6, 1], [1, 6], [6, 6]]) {
    for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) { g.set(x, 0, z, "grass_block[snowy=false]"); g.set(x, 1, z, ["poppy", "cornflower", "oxeye_daisy", "allium"][(x + z) % 4]); }
  }
  // benches facing in, between the beds
  for (const [x, z, f] of [[3, 1, "north"], [5, 1, "north"], [3, 7, "south"], [5, 7, "south"], [1, 3, "west"], [1, 5, "west"], [7, 3, "east"], [7, 5, "east"]])
    g.set(x, 1, z, `spruce_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`);
  // lamp posts: the corners and the edge midpoints
  for (const [x, z] of [[0, 0], [8, 0], [0, 8], [8, 8], [c, 0], [c, 8], [0, c], [8, c]]) {
    g.set(x, 1, z, "stone_brick_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
    g.set(x, 2, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 3, z, "lantern[hanging=false,waterlogged=false]");
  }
  return { grid: g, meta: { footprint: [N, N], height: 4, ground: 0, mirror: true, entrances: [], beds: [], workstations: [], lockers: [],
    markers: [{ at: [1, 1, 1], what: "flower", note: "the four corner beds (1..2, 6..7) are where the master Farmer's flowers go" }], pilings: [], entities: [] } };
}
