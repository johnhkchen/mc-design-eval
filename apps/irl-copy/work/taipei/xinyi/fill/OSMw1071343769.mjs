import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343769";
const W = 12, H = 23, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const L = Math.min(...cells.map(c => c[2]));          // lowest ground = local y 0
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g - L);

const has = (x, z) => ground.has(`${x},${z}`);
const isShell = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, r, z, id, props) => {
  const y = L + r;
  if (y < 0 || y >= H || r < 0) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade material for a shell cell at row r (rows 0..10 relative to lowest ground)
function facadeId(x, z, r) {
  const side = x === 0 || x === W - 1;
  const u = side ? z : x;
  const corner = side && (z === 0 || z === D - 1);
  const front = z === 0;
  if (r === 0) return "stone_bricks";          // base course
  if (r === 10) return "light_gray_concrete";  // cornice / parapet
  if (r === 9 || r === 5 || r === 4) return "light_gray_concrete"; // storey lines and lintel
  if (corner) return "white_concrete";
  if (r <= 3) {                                // ground-floor shopfront
    if (front && u >= 2 && u <= 9) return "glass_pane";
    return "white_concrete";
  }
  // upper storeys, r = 6..8
  if (side) return (z >= 2 && z <= 4) ? "glass_pane" : "white_concrete";
  if (u === 1 || u === 4 || u === 7 || u === 10) return "white_concrete"; // piers
  return "glass_pane";
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let r = 0; r < gr; r++) put(x, r, z, "stone_bricks");

  if (isShell(x, z)) {
    for (let r = gr; r <= 10; r++) {
      put(x, r, z, facadeId(x, z, r));
    }
    // Recessed entrance on the street (north) face
    if (z === 0 && x === 5) {
      put(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  } else {
    // Interior: floor slabs at ground, storey line (row 5) and roof deck (row 10); air elsewhere
    for (const r of [gr, 5, 10]) {
      if (r >= gr) put(x, r, z, "smooth_stone");
    }
  }
}

// Warm lights behind glass (interior air cells)
put(3, 7, 1, "shroomlight");
put(8, 7, 1, "glowstone");
put(3, 2, 1, "glowstone");
put(8, 2, 1, "glowstone");
put(5, 2, 1, "glowstone");

// Roof equipment and rod
put(2, 11, 2, "iron_block");
put(3, 11, 2, "iron_block");
put(8, 11, 4, "iron_block");
put(9, 11, 1, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
