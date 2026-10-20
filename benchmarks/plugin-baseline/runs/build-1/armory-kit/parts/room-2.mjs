// Interior designer for "Armory offices 2F" (room 2): two banks of desk pods (a polished block desk, a stair chair
// facing it, a desk lamp every other pod), a conference table as the focal piece under three hanging lanterns, filing
// stacks at both ends, and a quiet east-west corridor lit by a hanging lantern every 8 blocks. Only palette blocks.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the room's free box (plan.md ROOMS) and the air layers the furniture uses: feet at y 8, lanterns at 12, chains at 13
const X0 = 2, X1 = 105, Z0 = 7, Z1 = 33;
const Y_FEET = 8, Y_LAMP = 9, Y_HANG = 12, Y_CHAIN = 13;

// a text grid over the room's footprint: rows run along +z, columns along +x (the layers() order)
function sheet() {
  const rows = [];
  for (let z = Z0; z <= Z1; z++) rows.push(new Array(X1 - X0 + 1).fill(" "));
  return {
    put(x, z, ch) { rows[z - Z0][x - X0] = ch; },
    rows() { return rows.map((r) => r.join("")); },
  };
}

export function build(g) {
  const floor = sheet(); // y 8: desks, chairs, the focal table, filing stacks
  const top = sheet(); // y 9: desk lamps, filing tops
  const hang = sheet(); // y 12: hanging lanterns
  const chains = sheet(); // y 13: chains up to the ceiling

  // desk pods: a desk at z 10 with its chair at z 11 (facing north, back to the south), and the same on the south bank
  // (desk z 28, chair z 27). Every other desk carries a standing lantern.
  const deskXs = [];
  for (let x = 14; x <= 92; x += 6) deskXs.push(x);
  deskXs.forEach((x, i) => {
    floor.put(x, 10, "D"); floor.put(x, 11, "c");
    floor.put(x, 28, "D"); floor.put(x, 27, "n");
    if (i % 2 === 0) { top.put(x, 10, "L"); top.put(x, 28, "L"); }
  });

  // filing stacks (two blocks high) at the west and east ends of both banks
  for (const z of [8, 9, 30, 31, 32, 33]) {
    for (const x of [3, 104]) { floor.put(x, z, "F"); top.put(x, z, "F"); }
  }

  // focal piece: a conference table on the centre line, chairs both sides, three lanterns hung over it
  for (let x = 46; x <= 62; x++) floor.put(x, 15, "Q");
  for (let x = 46; x <= 62; x += 2) { floor.put(x, 14, "n"); floor.put(x, 16, "c"); }
  for (const x of [48, 54, 60]) { hang.put(x, 15, "h"); chains.put(x, 15, "k"); }

  // the quiet corridor: lanterns down its centre line (z 20) every 8 blocks, clear of the stair cells at x 8..9 and 98..99
  for (const x of [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 101]) {
    hang.put(x, 20, "h"); chains.put(x, 20, "k");
  }

  const at = (y) => [X0, y, Z0];
  layers(g, at(Y_FEET), {
    D: "polished_andesite",
    Q: "smooth_quartz",
    F: "smooth_stone",
    c: ["smooth_sandstone_stairs", { facing: "south" }],
    n: ["smooth_sandstone_stairs", { facing: "north" }],
  }, floor.rows());
  layers(g, at(Y_LAMP), {
    L: ["lantern", { hanging: "false" }],
    F: "smooth_stone",
  }, top.rows());
  layers(g, at(Y_HANG), { h: ["lantern", { hanging: "true" }] }, hang.rows());
  layers(g, at(Y_CHAIN), { k: ["chain", { axis: "y" }] }, chains.rows());
}
