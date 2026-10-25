import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499694";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : raw.cells).map(([x, z, gc, rc]) =>
  [x, z, Math.round(gc), Math.round(rc)]);

const W = 11, D = 12, H = 27;
const g = new Voxels([W, H, D]);

const has = (() => {
  const s = new Set(list.map(([x, z]) => `${x},${z}`));
  return (x, z) => s.has(`${x},${z}`);
})();

// One datum for the whole building so roof planes and storey lines stay clean.
const G = Math.min(...list.map(c => c[2]));                  // floor datum (lowest ground)
const RC = Math.max(...list.map(c => c[3]));                  // lidar roof height
const E = Math.max(G + 10, RC - 5);                           // eave: two 5-block storeys
const STOREY2 = G + 5;                                        // second floor line

const stair = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

for (const [x, z, gc] of list) {
  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const onFront = z === 0, onBack = z === D - 1, onLeft = x === 0, onRight = x === W - 1;
  const onZFace = onFront || onBack;
  const t = onZFace ? x : z;                                  // position along the face
  const corner = (onFront || onBack) && (onLeft || onRight);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  if (perimeter) {
    for (let y = gc; y < E; y++) {
      const yr = y - G;
      const topYr = E - 1 - G;
      const isWinCol = t >= 1 && t <= 9 && t % 3 !== 0;

      // Ground-floor front: entrance column t=5
      if (onFront && t === 5 && yr <= 3) {
        if (y === gc) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gc + 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (yr === 3) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
        g.set(x, y, z, "calcite"); continue;
      }

      let block = "calcite";
      if (yr === 0 || corner || yr === topYr) block = "stone_bricks";
      else if (yr === 5) block = "smooth_stone";
      else if (onFront && yr === 4 && t >= 1 && t <= 9) block = t % 2 === 0 ? "red_wool" : "white_wool";
      else if (((yr >= 1 && yr <= 3) || (yr >= 6 && yr <= 8)) && isWinCol) block = "glass_pane";

      g.set(x, y, z, block);
    }
  }

  // Roof: stepped slate on a gable with ridge along x, all cells on the common eave E
  const k = Math.min(z, D - 1 - z); // 0..5
  if (k === 5) {
    for (let y = E; y <= E + 5; y++) g.set(x, y, z, "deepslate_tiles");
  } else {
    for (let y = E; y < E + k; y++) g.set(x, y, z, "deepslate_tiles");
    const facing = z < 5 ? "north" : "south";
    g.set(x, E + k, z, "deepslate_tile_stairs", stair(facing));
  }

  // Chimney on the street-side slope
  if (x === 8 && z === 3) {
    for (let y = E + 4; y <= E + 8; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, E + 8, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  // Interior: air, a floor slab per storey, a few warm lights
  if (!perimeter) {
    g.set(x, STOREY2, z, "smooth_stone");
    if (x === 3 && z === 2) g.set(x, G + 2, z, "glowstone");
    if (x === 7 && z === 2) g.set(x, G + 2, z, "glowstone");
    if (x === 5 && z === 8) g.set(x, G + 7, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
