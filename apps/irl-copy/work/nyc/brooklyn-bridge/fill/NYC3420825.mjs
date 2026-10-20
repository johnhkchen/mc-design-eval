import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Jay Street utility building, DUMBO. Two-storey brick service building with a
// stone base, stone spandrel courses, brick piers between the windows, a cornice,
// an iron-grille vehicle bay, an iron entrance door under a stone hood, glass-paned
// windows with warm lights behind, and a small roof vent.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3420825";
const OUT = `${DIR}/${ID}.nbt`;

const W = 9, H = 16, D = 3;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));

const GLASS = { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" };
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Street-facade plan per storey row k (0 = ground), indexed by x.
function frontBlock(x, k) {
  if (k === 0) {
    if (x === 0 || x === 8) return ["stone_bricks"];
    if (x === 7) return ["iron_door", { ...DOOR, half: "lower" }];
    if (x >= 3 && x <= 5) return x === 3 || x === 5 ? ["bricks"] : ["iron_bars", GLASS];
    return ["glass_pane", GLASS]; // x = 1, 2, 6
  }
  if (k === 1) {
    if (x === 7) return ["iron_door", { ...DOOR, half: "upper" }];
    return ["stone_bricks"]; // spandrel / storey line
  }
  // k >= 2: upper window row; stone pilasters at x=0,4,8, brick piers at x=3,5
  if (x === 0 || x === 4 || x === 8) return ["stone_bricks"];
  if (x === 3 || x === 5) return ["bricks"];
  if (x === 7) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // hood over door
  return ["glass_pane", GLASS];
}

for (const [x, z, gr, rr] of cells) {
  const G = Math.max(0, Math.round(gr));
  // Clean roof height: at least three rows above ground, kept inside the grid.
  const R = Math.min(Math.max(Math.round(rr), G + 3), H - 4);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= G; y++) g.set(x, y, z, "stone_bricks");

  const exFront = !has(x, z - 1);
  const exBack = !has(x, z + 1);
  const exSide = !has(x - 1, z) || !has(x + 1, z);

  // Walls, storey by storey.
  for (let y = G + 1; y <= R - 1; y++) {
    const k = y - G - 1;
    if (exFront) {
      const [id, props] = frontBlock(x, k);
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    } else if (exBack) {
      if (k === 1 || x === 0 || x === 8) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "bricks");
    } else if (exSide) {
      if (k === 1) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "bricks");
    } else {
      // Interior cell behind the facade: floor slab at storey line, air gap
      // elsewhere, with warm lights behind selected windows.
      if (k === 1) g.set(x, y, z, "stone_bricks");
      else if (k === 2 && (x === 2 || x === 6)) g.set(x, y, z, "shroomlight");
      else if (k === 0 && x === 1) g.set(x, y, z, "glowstone");
    }
  }

  // Roof deck / cornice at R.
  const roofId = (exFront || exBack || exSide) ? "smooth_stone" : "stone";
  g.set(x, R, z, roofId);

  // Roof equipment: a small louvred ventilation housing.
  if (x === 6 && z === 1) {
    g.set(x, R + 1, z, "iron_block");
    g.set(x, R + 2, z, "iron_bars", GLASS);
  }
}

g.save(OUT);
