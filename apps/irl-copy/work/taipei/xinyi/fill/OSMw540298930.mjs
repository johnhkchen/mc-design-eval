import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298930";
const W = 26, H = 23, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Low-rise commercial block, two storeys over a stone base, cornice and parapet.
// rel = height above this cell's own ground. Storeys: 0..5 (ground), 5..10 (upper), parapet 11.
function put(x, base, rel, z, id, props) {
  const y = base + rel;
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  const base = Math.max(0, Math.min(gr, H - 13));

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerimeter(x, z);
  const front = !has(x, z - 1);   // north edge: street facade with shopfronts
  const back = !has(x, z + 1);

  if (!perim) {
    // Interior: floor slabs per storey, air between; roof deck at rel 10
    put(x, base, 0, z, "smooth_stone");
    put(x, base, 5, z, "smooth_stone");
    put(x, base, 10, z, "gray_concrete");

    // Warm light behind the glass on the front row
    if (z === 1 && x % 6 === 1) put(x, base, 7, z, "shroomlight");
    if (z === 1 && x % 6 === 4) put(x, base, 2, z, "glowstone");

    // Roof plant on the roof deck
    if (x >= 5 && x <= 8 && z >= 2 && z <= 3) put(x, base, 11, z, "iron_block");
    continue;
  }

  // Perimeter: base course, walls, cornice, parapet
  const idx = front || back ? x : z;
  put(x, base, 0, z, "stone_bricks");

  // Ground storey (rel 1..4)
  for (let rel = 1; rel <= 4; rel++) {
    if (front) {
      if (x === 12) {
        if (rel === 1) put(x, base, rel, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) put(x, base, rel, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (rel === 3) put(x, base, rel, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, base, rel, z, "white_concrete");
      } else if (rel === 1) {
        put(x, base, rel, z, "stone_bricks");
      } else if (rel === 2 || rel === 3) {
        if (idx % 3 === 0) put(x, base, rel, z, "stone_bricks");
        else put(x, base, rel, z, "glass_pane");
      } else {
        put(x, base, rel, z, "light_gray_concrete");
      }
    } else {
      if ((rel === 2 || rel === 3) && idx % 3 !== 0) put(x, base, rel, z, "glass_pane");
      else put(x, base, rel, z, "white_concrete");
    }
  }

  // Storey line
  put(x, base, 5, z, "light_gray_concrete");

  // Upper storey (rel 6..9): window grid with pillars, header band
  for (let rel = 6; rel <= 8; rel++) {
    if (idx % 3 !== 0) put(x, base, rel, z, "glass_pane");
    else put(x, base, rel, z, "white_concrete");
  }
  put(x, base, 9, z, "light_gray_concrete");

  // Cornice, roof parapet
  put(x, base, 10, z, "stone_bricks");
  put(x, base, 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
