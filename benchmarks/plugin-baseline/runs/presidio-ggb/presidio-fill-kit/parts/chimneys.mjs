// Chimneys: the five stacks of plots 0, 4 and 6 with a lit campfire each, after the roofs (plan.md ROOFS "Chimneys").
// Each is an exterior chimney: the wall cell is the hearth's mouth, the fire sits one cell outside it, and the flue rises
// beside the house. chimney() takes `into` as the side the ROOM is on (the mouth opens that way), so the fire lies on
// the opposite side of the wall. chimney() lays no band or cap, so this part adds a deepslate_bricks band one course under
// the top and a brick_slab cap on the top corners.
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// [plan key, wall cell (mouth), room side, top course of the flue, stack footprint [x0, x1, z0, z1] (plan.md table)]
const STACKS = [
  ["0", [5, 1, 3], "west", 8, [6, 7, 2, 4]],   // plot 0 east wall: fire [6,1,3]
  ["4w", [30, 1, 7], "east", 9, [28, 29, 6, 8]], // plot 4 west end: fire [29,1,7]
  ["4e", [41, 1, 7], "west", 9, [42, 43, 6, 8]], // plot 4 east end: fire [42,1,7]
  ["6w", [66, 1, 4], "east", 8, [64, 65, 3, 5]], // plot 6 west side: fire [65,1,4]
  ["6e", [73, 1, 4], "west", 8, [74, 75, 3, 5]], // plot 6 east side: fire [74,1,4]
];

// the band and cap round one stack: the ring of its footprint, the flue column (the fire's x and z) left open. The band is
// one course under the top. The cap is a brick_slab on the top course's corner cells only: a slab beside the flue reads as
// roof tiles walling it, so the four cells that touch the flue stay full masonry.
function bandAndCap(g, [fx, , fz], top, [x0, x1, z0, z1]) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (x === fx && z === fz) continue;
      g.set(x, top - 1, z, "minecraft:deepslate_bricks");
      if (Math.abs(x - fx) + Math.abs(z - fz) === 2) g.set(x, top, z, "minecraft:brick_slab", { type: "bottom", waterlogged: "false" });
    }
}

// chimney() also writes its lintel over the mouth and the flue's walls beside the house, and those cells are the shell's
// wall and the roof's slab, built by earlier parts (locked). Those writes are dropped here and listed, so the house wall
// (already closing the mouth from above) and the roof stand as they are. Only solid cells above the ground course (y0,
// laid before the parts, so still writable) are yielded; the mouth and the flue are air and stay open.
function yieldToEarlier(g, dropped) {
  return {
    get: (x, y, z) => g.get(x, y, z),
    inBounds: (x, y, z) => g.inBounds(x, y, z),
    set(x, y, z, block, state) {
      const cur = g.get(x, y, z);
      if (y > 0 && cur && !/(^|:|_)air$/.test(cur.block)) return dropped.push([x, y, z, block, cur.block]);
      g.set(x, y, z, block, state);
    },
  };
}

export function build(g) {
  const dropped = [];
  for (const [, wall, into, top, foot] of STACKS) {
    const fire = [wall[0] + (into === "west" ? 1 : -1), wall[1], wall[2]];
    chimney(yieldToEarlier(g, dropped), { wall, into, top, material: "bricks", thin: null });
    bandAndCap(g, fire, top, foot);
  }
  if (dropped.length) console.log(`Chimneys: ${dropped.length} writes left to earlier parts' walls: ${dropped.map((d) => d.slice(0, 3).join(",") + " " + d[4]).join("; ")}`);
}
