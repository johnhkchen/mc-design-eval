import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block, c. 1980s: two storeys over a stone plinth,
// white-tiled walls with light-grey piers, glazed bays, a shopfront with a red
// fascia on the street side, and a parapet with rooftop condenser units.
const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951880.cells.json", "utf8")
);

const W = 15, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = { north: "true", south: "true", east: "true", west: "true" };

for (const [x, z, gy] of cells) {
  const mN = !has(x, z - 1); // street side (front)
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const perimeter = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);
  const front = mN;

  // Foundation under the cell, then the plinth / floor slab at ground level.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, gy, z, perimeter ? "stone_bricks" : "smooth_stone");

  // Inward direction (toward building interior) for placing lights behind glass.
  let ix = 0, iz = 0;
  if (mN) iz = 1; else if (mS) iz = -1;
  else if (mW) ix = 1; else if (mE) ix = -1;

  const addStorey = (base, isGround) => {
    // base = y of the storey's floor slab; walls base+1..base+4
    if (!perimeter) return; // interior stays air
    if (corner) {
      for (let y = base + 1; y <= base + 4; y++) put(x, y, z, "light_gray_concrete");
      return;
    }
    const k = (mN || mS) ? x : z;
    const window = k % 2 === 1;

    if (isGround && front) {
      const doorCell = x === 7;
      if (doorCell) {
        put(x, base + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, base + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, base + 3, z, "white_concrete");
      } else {
        for (let y = base + 1; y <= base + 3; y++) put(x, y, z, "glass_pane", GLASS);
      }
      put(x, base + 4, z, "red_terracotta");
      return;
    }

    if (window) {
      put(x, base + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      put(x, base + 2, z, "glass_pane", GLASS);
      put(x, base + 3, z, "glass_pane", GLASS);
      put(x, base + 4, z, "light_gray_concrete");
      if (k % 4 === 3 && (ix !== 0 || iz !== 0) && has(x + ix, z + iz)) {
        put(x + ix, base + 2, z + iz, "glowstone");
      }
    } else {
      for (let y = base + 1; y <= base + 4; y++) put(x, y, z, "white_concrete");
    }
  };

  // Storey 1: floor at gy, walls gy+1..gy+4
  addStorey(gy, true);
  // Storey line / floor slab at gy+5
  put(x, gy + 5, z, perimeter ? "light_gray_concrete" : "smooth_stone");
  // Storey 2: walls gy+6..gy+9
  addStorey(gy + 5, false);
  // Cornice at gy+9 on perimeter
  if (perimeter) put(x, gy + 9, z, "smooth_stone");
  // Roof / parapet at gy+10 (roof height 11 blocks above lowest ground)
  put(x, gy + 10, z, perimeter ? "light_gray_concrete" : "smooth_stone");

  // Rooftop condenser units on interior roof cells
  if (!perimeter && x % 4 === 1 && z % 5 === 2) {
    put(x, gy + 11, z, "iron_block");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951880.nbt");
