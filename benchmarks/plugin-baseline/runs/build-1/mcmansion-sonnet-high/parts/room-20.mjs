// room: Walk-in closet: the interior designer's part. Inner air x34..37, y6..8, z23..26 (door (36,6..7,22) on the N wall,
// windows W (33,7..8,24..25) and S (35..36,7..8,27)). Layout, all inside the box:
//   N wall: a mirror (white_stained_glass_pane, 2 wide x 2 high) at x34..35, y7..8, z23 (the focal piece, facing the door)
//   E wall (x37): iron-bar rods at y8 (clothes rods) over a 2x2 bookshelf stack (shelves) and a chest + potted fern
//   S side: an oak-stair bench (seat) at x34..35, z26, under the south window
//   centre: a light-gray carpet; hanging lanterns at the ceiling keep every floor cell lit
// The 2-high clear path runs from the door (36,6..7,23) across the carpet to the bench and the mirror.
const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const block = (name) => [name, {}];

export function build(g) {
  // clothes rods: iron bars under the ceiling, joined along z and to the east wall
  for (let z = 23; z <= 26; z++) {
    put(g, 37, 8, z, ["iron_bars", { north: String(z > 23), south: String(z < 26), east: "true", west: "false", waterlogged: "false" }]);
  }

  // shelves: a 2x2 bookshelf stack on the east wall, south half
  for (const [y, z] of [[6, 25], [7, 25], [6, 26], [7, 26]]) put(g, 37, y, z, block("bookshelf"));

  // storage chest with a potted fern on top, north end of the east wall
  put(g, 37, 6, 23, ["chest", { facing: "west", type: "single", waterlogged: "false" }]);
  put(g, 37, 7, 23, block("potted_fern"));

  // focal mirror: a 2x2 pane panel on the north wall, beside the door
  for (const x of [34, 35]) for (const y of [7, 8]) {
    put(g, x, y, 23, ["white_stained_glass_pane", {
      north: "true", south: "false",
      east: String(x === 34), west: String(x === 35), waterlogged: "false",
    }]);
  }

  // bench: two oak stairs as seats, facing north, under the south window (the back is on the south wall)
  for (const x of [34, 35]) put(g, x, 6, 26, ["oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }]);

  // centre rug
  for (const x of [35, 36]) for (const z of [24, 25]) put(g, x, 6, z, block("light_gray_carpet"));

  // hanging lanterns from the ceiling (y9), clear of the path and the windows
  put(g, 35, 8, 24, ["lantern", { hanging: "true", waterlogged: "false" }]);
  put(g, 36, 8, 26, ["lantern", { hanging: "true", waterlogged: "false" }]);
}
