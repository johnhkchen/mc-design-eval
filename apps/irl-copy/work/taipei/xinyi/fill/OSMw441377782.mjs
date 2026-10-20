import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377782";
const W = 54, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Two-storey (plus parapet) commercial block, white tile and glass over a granite base.
// Storeys: ground r=1..5 (shopfront), slab r=6, upper r=6..10 (windows), roof r=11, parapet r=12.
// Floors are absolute per column: B = that cell's ground.
for (const [x, z, gr] of cells) {
  const B = gr;

  // Foundation from y=0 up to this cell's ground (nothing floats on a slope)
  for (let y = 0; y <= B; y++) put(x, y, z, "stone_bricks");

  // Storey slab at r=6 and roof slab at r=11 across the whole footprint
  put(x, B + 6, z, "smooth_stone");
  put(x, B + 11, z, "smooth_stone");

  const perim = isPerim(x, z);

  if (!perim) {
    // Roof plant on the interior roof: a few AC/equipment blocks
    if (x % 9 === 4 && z % 5 === 2) put(x, B + 12, z, "iron_block");
    continue;
  }

  const p = x + z;
  const entrance = z === 0 && x === 27;

  // Base course
  put(x, B + 1, z, "polished_granite");

  // Ground floor: shopfront glass between white pillars, or the entrance door
  if (entrance) {
    put(x, B + 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 4, z, "glass");
  } else {
    for (let r = 2; r <= 4; r++) {
      put(x, B + r, z, p % 4 === 0 ? "white_concrete" : "glass");
    }
  }
  // Ground-floor lintel
  put(x, B + 5, z, "smooth_stone");

  // Upper storey: spandrels top and bottom, tinted glass windows between mullions
  put(x, B + 6, z, "white_concrete");
  for (let r = 7; r <= 9; r++) {
    put(x, B + r, z, p % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, B + 10, z, "white_concrete");

  // Cornice already at r=11 (smooth_stone); parapet above it
  put(x, B + 12, z, "white_concrete");

  // Warm light behind some upper windows: glowstone one cell inside the facade
  if (p % 6 === 1) {
    let ic = null;
    if (!has(x, z - 1)) ic = [x, z + 1];
    else if (!has(x, z + 1)) ic = [x, z - 1];
    else if (!has(x - 1, z)) ic = [x + 1, z];
    else if (!has(x + 1, z)) ic = [x - 1, z];
    if (ic && has(ic[0], ic[1]) && !isPerim(ic[0], ic[1])) {
      const ig = ground.get(`${ic[0]},${ic[1]}`);
      put(ic[0], ig + 8, ic[1], "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
