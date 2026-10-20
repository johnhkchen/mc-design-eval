import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3326013.cells.json", "utf8"));

const W = 7, H = 16, D = 4;
const g = new Voxels([W, H, D]);

const clampY = (y) => Math.min(H - 1, Math.max(0, y));
const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => cellMap.has(`${x},${z}`);

// One clean roof tier for the whole house (median of lidar roofs), so it reads as a single block
const roofs = cells.map((c) => Math.round(c[3])).sort((a, b) => a - b);
const commonRoof = roofs[Math.floor(roofs.length / 2)];

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const c of cells) {
  const [x, z, grRaw] = c;
  const gy = clampY(Math.round(grRaw));
  let top = clampY(commonRoof);
  if (top < gy + 4) top = clampY(gy + 4);

  // Foundation: stone from y0 up to the ground course
  for (let y = 0; y <= gy; y++) g.set(x, y, z, "stone_bricks");

  const exterior = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const frontBack = (z === 0 || z === D - 1) && [1, 2, 4, 5].includes(x);
  const sides = (x === 0 || x === W - 1) && (z === 1 || z === 2);
  const isWindowCell = frontBack || sides;
  const isDoorCell = z === 0 && x === 3;
  const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const glassProps = frontBack ? GLASS_EW : GLASS_NS;

  if (exterior) {
    // Brick walls, with stone quoins at the corners
    for (let y = gy + 1; y <= top - 2; y++) {
      g.set(x, y, z, isCorner ? "stone_bricks" : "bricks");
    }

    // Windows: glass panes with a stone sill and lintel
    if (isWindowCell) {
      const lastGlass = Math.min(gy + 2, top - 2);
      for (let y = gy + 1; y <= lastGlass; y++) g.set(x, y, z, "glass_pane", glassProps);
      if (gy + 3 <= top - 2) g.set(x, gy + 3, z, "stone_bricks");
    }

    // Entrance: door, with a stone hood over it
    if (isDoorCell) {
      const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
      g.set(x, gy + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
      g.set(x, gy + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
      if (gy + 3 <= top - 2) {
        g.set(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  } else {
    // Interior: air gap behind the glass, one floor slab between storeys
    g.set(x, gy + 2, z, "oak_planks");
    if ((x + z) % 3 === 0) g.set(x, gy + 1, z, "glowstone");
    if ((x + z) % 2 === 1) g.set(x, gy + 3, z, "shroomlight");
  }

  // Cornice course, then a flat stone cap as the parapet
  if (top - 1 > gy) g.set(x, top - 1, z, "stone_bricks");
  g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3326013.nbt");
