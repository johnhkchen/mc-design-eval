// Columbian Consulate, 10 East 46 Street (1920): a seven-storey Midtown office block. A granite plinth and
// lobby, five brick storeys with calcite belt courses and two-high windows, a calcite cornice and parapet.
// The lidar roof is 20 to 23 blocks across the footprint; it is smoothed to one deck at 21 with the parapet at 22.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035398.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 7, D = 20, H = 24;
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const g = new Voxels([W, H, D]);

// Only footprint cells take blocks; y 0 is the lowest ground (every cell is 0 here), so no foundation fill.
const put = (x, y, z, block, state) => {
  if (y < 0 || y >= H || !foot.has(`${x},${z}`)) return;
  g.set(x, y, z, block, state);
};

const GLASS_FRONT = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const edge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const frontWin = (x) => x === 1 || x === 2 || x === 4 || x === 5;   // bays either side of the centre pier
const sideWin = (z) => z % 4 === 1 || z % 4 === 2;                  // pairs of windows, piers between

const storeys = [0, 3, 6, 9, 12, 15, 18];   // seven storeys; each belt course is the floor line
const DECK = 21, PARAPET = 22;

for (const b of storeys) {
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!foot.has(`${x},${z}`)) continue;
    // Floor slab with a calcite belt course round the edge.
    put(x, b, z, edge(x, z) ? (b === 0 ? "polished_granite" : "calcite") : "smooth_stone");
    if (!edge(x, z)) continue;   // interior air: the building is a hollow shell with floor slabs
    for (const r of [b + 1, b + 2]) {
      const front = z === 0, back = z === D - 1, side = x === 0 || x === W - 1;
      const isWindow = (front && frontWin(x)) || (back && frontWin(x)) || (side && sideWin(z));
      if (b === 0 && front && x === 3) {
        // Entrance: a dark oak door, the head is the belt course above it.
        const half = r === 1 ? "lower" : "upper";
        put(x, r, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isWindow) {
        const state = front || back ? GLASS_FRONT : GLASS_SIDE;
        put(x, r, z, "glass_pane", state);
      } else {
        put(x, r, z, b === 0 ? "polished_granite" : "bricks");
      }
    }
  }
}

// Roof: calcite cornice at the deck edge, gray roof covering inside, a calcite parapet, and two HVAC units.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!foot.has(`${x},${z}`)) continue;
  if (edge(x, z)) {
    put(x, DECK, z, "calcite");
    put(x, PARAPET, z, "calcite");
  } else {
    put(x, DECK, z, "gray_concrete");
  }
}
for (const [x0, z0] of [[1, 6], [4, 12]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  put(x0 + dx, PARAPET, z0 + dz, "iron_block");
}

// Warm light sitting on a floor slab, set back behind the glass with air between.
const lamps = [[1, 1, 2], [2, 7, 2], [4, 13, 2], [1, 16, 2], [2, 10, 9]];
for (const [x, y, z] of lamps) put(x, y, z, "glowstone");

const { blocks, palette } = g.save(`${dir}/NYC1035398.nbt`);
console.log(`NYC1035398.nbt: ${blocks} blocks, palette ${palette}`);
