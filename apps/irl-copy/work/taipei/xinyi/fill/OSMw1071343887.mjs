import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century street-front commercial block (Xinyi, pre-tower era):
// white-tiled walls, light-grey bands at each floor line, glazed shopfront with
// a dark canopy and entrance on the north (street) face, alternating-merlon parapet,
// rooftop AC units. Piers every 4 blocks, glass panes between, mullions in between.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343887";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 7;
const g = new Voxels([W, H, D]);

const FOOT = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => FOOT.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c[2])); // lowest ground = y 0 reference
const TOP = 11; // roof surface sits 11 blocks above base

// Which faces of a cell are exposed to the outside.
function exposed(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}

// Exterior skin for relative height r (0 = base). Returns [id, props] or null.
function facade(x, z, r, ex) {
  // Street face (north) takes precedence at corners; otherwise the first exposed face.
  let face, u;
  if (ex.n) { face = "n"; u = x; }
  else if (ex.s) { face = "s"; u = x; }
  else if (ex.w) { face = "w"; u = z; }
  else { face = "e"; u = z; }
  const m = ((u % 4) + 4) % 4;

  // Base course and cornice / parapet
  if (r === 0) return ["polished_andesite"];
  if (r === 9) return ["stone_bricks"];
  if (r === 10) return u % 2 === 0 ? ["stone_bricks"] : null; // crenellated parapet
  // Storey lines
  if (r === 4 || r === 8) return ["light_gray_concrete"];

  // Ground-floor shopfront with entrance and canopy on the street face
  if (face === "n" && r <= 3) {
    if (u === 2) {
      if (r === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (r === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]; // canopy over entrance
    }
    if (r === 3 && u >= 1 && u <= 3) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];
  }

  // Window bays (storey 1: r1..3, storey 2: r5..7)
  const inBand = (r >= 1 && r <= 3) || (r >= 5 && r <= 7);
  if (!inBand) return null;
  if (m === 0) return ["white_concrete"];          // pier
  if (m === 2) return ["light_gray_concrete"];     // mullion
  return ["light_blue_stained_glass"];             // glazing
}

// Foundations, shell and roof per footprint cell.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const exterior = ex.n || ex.s || ex.w || ex.e;

  for (let r = 0; r <= 10; r++) {
    const y = base + r;
    if (y < gr || y >= H) continue;
    if (exterior) {
      const b = facade(x, z, r, ex);
      if (b) g.set(x, y, z, b[0], b[1]);
    } else {
      // Interior: floor slabs and roof deck only (no interior walls; air gaps behind glass).
      if (r === 0) g.set(x, y, z, "smooth_stone");
      else if (r === 4) g.set(x, y, z, "light_gray_concrete");
      else if (r === 9) g.set(x, y, z, "smooth_stone");
      else if (r === 10 && x % 6 === 3 && (z === 2 || z === 4)) {
        g.set(x, y, z, "light_gray_concrete"); // rooftop AC units
      }
    }
  }
}

// Warm lights standing in the air gap behind some street-face windows.
for (const [x, z, gr] of cells) {
  if (z !== 1 || !has(x, 0)) continue;
  const ex = exposed(x, z);
  if (ex.n || ex.s || ex.w || ex.e) continue; // interior cells only
  const lightAt = (r, cond) => {
    const y = base + r;
    if (cond && y >= gr && y < H) g.set(x, y, z, "lantern", { hanging: "false" });
  };
  lightAt(1, x % 8 === 1); // storey 1 behind shop glazing
  lightAt(5, x % 8 === 5); // storey 2 behind window glazing
}

g.save(`${DIR}/${ID}.nbt`);
