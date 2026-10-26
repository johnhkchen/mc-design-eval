import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87225.cells.json`, "utf8"));

const W = 16, H = 31, D = 4;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => k(x, z)));

// One clean storey grid and one clean roof line for the whole block,
// so the lidar noise becomes flat tiers instead of a ragged skyline.
const G0 = Math.min(...cells.map(c => Math.round(c[2])));
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
let R = roofs[Math.floor(roofs.length / 2)];
if (R < G0 + 12) R = G0 + 12;
if (R > H - 5) R = H - 5;

for (const [x, z, gr] of cells) {
  const Gi = Math.round(gr);
  const street = z === 0 || z === 3;
  const exterior = street || !occ.has(k(x - 1, z)) || !occ.has(k(x + 1, z));

  for (let y = 0; y < R; y++) {
    // foundation up to this cell's own ground
    if (y < Gi) { g.set(x, y, z, "stone_bricks"); continue; }

    const rel = y - G0;
    const s = Math.floor(rel / 3);
    const o = rel % 3;
    let b = null;

    if (y === R - 1) {
      b = exterior ? "calcite" : "smooth_stone";          // cornice / roof slab
    } else if (street) {
      if (o === 0) {
        b = s === 0 ? "stone_bricks" : "calcite";         // base course / storey line
      } else {
        const pier = x % 3 === 0;
        if (s === 0) b = pier ? "stone_bricks" : "glass"; // shopfront
        else b = pier ? "calcite" : "glass_pane";         // office windows
      }
    } else if (exterior) {
      b = o === 0 ? "calcite" : "bricks";                 // end / party walls
    } else {
      if (o === 0) b = "smooth_stone";                    // floor slab
      else if (o === 1 && x % 3 === 2 && s % 2 === 0) b = "glowstone";
    }

    if (b) g.set(x, y, z, b);
  }

  // flat cap slab on the roof line
  if (R >= Gi) g.set(x, R, z, exterior ? "stone_brick_slab" : "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // rooftop mechanical penthouse, centre bays
  if (x >= 4 && x <= 7 && (z === 1 || z === 2) && R + 3 <= H) {
    g.set(x, R + 1, z, "stone_bricks");
    g.set(x, R + 2, z, "stone_bricks");
    g.set(x, R + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // entrance bay: door, flanking jambs, hanging lantern over the door
  if (street && z === 0 && Gi === G0 && x >= 6 && x <= 8) {
    if (x === 7) {
      g.set(x, G0, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, G0 + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, G0 + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      g.set(x, G0, z, "stone_bricks");
      g.set(x, G0 + 1, z, "stone_bricks");
      g.set(x, G0 + 2, z, "calcite");
    }
  }
}

g.save(`${DIR}/DC87225.nbt`);
