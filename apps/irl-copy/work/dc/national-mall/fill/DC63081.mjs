import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC63081";
const W = 20, H = 29, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Lowest ground under the footprint = storey datum.
const g0 = Math.min(...cells.map(c => Math.round(c[2])));

// Per-cell geometry, computed once so every pass agrees.
const info = cells.map(([x, z]) => {
  const { gr, rf } = map.get(key(x, z));
  const gnd = clamp(gr, 0, H - 4);
  // Lidar roof quantised to 3-block storey tiers above this cell's ground.
  let top = gnd + Math.max(3, 3 * Math.round((rf - gnd) / 3));
  top = clamp(top, gnd + 3, 24);
  return { x, z, gnd, top, per: isPerim(x, z) };
});

for (const { x, z, gnd, top, per } of info) {
  // Foundation from y 0 to this cell's ground.
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  // Ground course / plinth.
  g.set(x, gnd, z, per ? "stone_bricks" : "smooth_stone");

  for (let y = gnd + 1; y <= top - 1; y++) {
    const off = (((y - g0) % 3) + 3) % 3;

    // Roof slab on every cell (solid under the parapet and penthouse).
    if (y === top - 1) {
      g.set(x, y, z, per ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // Heavy cornice band on the perimeter.
    if (y === top - 2 && per) { g.set(x, y, z, "stone_bricks"); continue; }

    // Interior: air gap plus one floor slab per storey.
    if (!per) {
      if (off === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter spandrel slabs at storey lines.
    if (off === 0) { g.set(x, y, z, "white_concrete"); continue; }

    // Bay rhythm: every third column is a pilaster / frame pier.
    const pier = (x + z) % 3 === 0;
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (off === 1 && (x * 7 + z * 3 + y) % 13 === 0) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Central rooftop plant on lower-roof interior cells: solid block with cap.
  if (!per && top <= 21 && x >= 5 && x <= 14 && z >= 7 && z <= 17) {
    for (let y = top; y <= top + 1; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, top + 2, z, "smooth_stone");
  }
}

// Main entrance on the street (lowest-z) face, nearest the middle.
{
  const minZ = Math.min(...cells.map(c => c[1]));
  const cand = info
    .filter(c => c.z === minZ)
    .sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10));
  if (cand.length) {
    const { x: ex, z: ez, gnd } = cand[0];
    g.set(ex, gnd, ez, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(ex, gnd + 1, ez, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(ex, gnd + 2, ez, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
