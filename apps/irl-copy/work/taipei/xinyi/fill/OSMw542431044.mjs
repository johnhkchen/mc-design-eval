import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542431044";
const W = 26, D = 8, H = 23;

// Record: 2-storey mid-century cream-tile commercial block, flat roof with parapet,
// shopfronts on the street (north, z=0) face, storey lines every 5 blocks.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let m = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  m = Math.min(m, gr);
}
if (!isFinite(m)) m = 0;

const L1 = m + 5;   // first floor line
const L2 = m + 10;  // cornice / second floor line
const R = m + 11;   // roof cap (parapet top)

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const at = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PILLAR = { id: "quartz_pillar", p: { axis: "y" } };

// Facade description for an exterior face at (x,y,z) given the cell's ground gr.
function facadeDesc(face, x, y, z, gr) {
  if (!face) return null;
  // Storey 2 windows: glass panes between quartz pillars.
  if (y >= L1 + 1 && y <= L2 - 1) {
    if (face === "front" || face === "back") {
      if (x % 3 === 0) return PILLAR;
      return { id: "glass_pane", p: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } };
    }
    if (z % 3 === 0) return PILLAR;
    return { id: "glass_pane", p: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };
  }
  // Storey 1 shopfront on the street face only.
  if (face === "front" && y >= gr + 1 && y <= L1 - 2) {
    if (x === 4 && y <= gr + 2) {
      return {
        id: "dark_oak_door",
        p: { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
      };
    }
    if (x % 3 === 0) return PILLAR;
    return { id: "glass", p: null };
  }
  return null;
}

for (const [x, z, gr] of cells) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const face = front ? "front" : back ? "back" : west ? "west" : east ? "east" : null;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) at(x, y, z, "stone_bricks");

  const top = Math.max(R, gr);
  for (let y = gr; y <= top; y++) {
    // Air gap behind street-face glazing and door (interior row z=1).
    if (z === 1 && has(x, 0)) {
      const f0 = facadeDesc("front", x, y, 0, gAt(x, 0));
      if (f0 && f0.id !== "quartz_pillar") {
        // Warm light behind some upper-storey windows.
        if (y === L1 + 2 && x % 6 === 1 && y >= L1 + 1 && y <= L2 - 1) {
          at(x, y, z, "glowstone");
        }
        continue; // leave air
      }
    }

    let id = "smooth_quartz";
    let p = null;

    if (y === gr) {
      id = "stone_bricks"; // base course
    } else if (y === top) {
      id = "smooth_quartz"; // roof cap / parapet top
    } else if (y === L2 && face) {
      id = "smooth_quartz_slab";
      p = { type: "bottom", waterlogged: "false" }; // cornice line
    } else if (y > L2 && y < top) {
      id = "smooth_quartz"; // parapet
    } else if (y === L1) {
      id = "smooth_quartz"; // floor slab / sill band
    } else {
      const d = facadeDesc(face, x, y, z, gr);
      if (d) {
        id = d.id;
        p = d.p;
      }
    }
    at(x, y, z, id, p);
  }
}

// Rooftop: AC units, a small penthouse and corner lanterns (all stand on the cap at R).
const roofBox = (x0, x1, z0, z1, h, id) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      for (let y = R + 1; y <= R + h; y++) at(x, y, z, id);
    }
};
roofBox(4, 5, 2, 3, 2, "light_gray_concrete");
roofBox(11, 12, 4, 5, 2, "light_gray_concrete");
roofBox(18, 20, 2, 5, 3, "smooth_quartz");

for (const [x, z] of [[1, 1], [24, 1], [1, 6], [24, 6]]) {
  if (has(x, z)) at(x, R + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
