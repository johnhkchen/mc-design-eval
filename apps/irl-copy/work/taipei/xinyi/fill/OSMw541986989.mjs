import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1970s-80s Taipei commercial block: 2 storeys of 5 blocks, cream-white concrete
// frame with grey string courses, pillared shopfront with glass and a dark-oak
// entrance, flat roof with a cornice, parapet and roof-top plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986989";
const W = 9, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (sides) =>
  (sides.west || sides.east)
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "west", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, base] of cells) {
  const sides = {
    west: !has(x - 1, z),
    east: !has(x + 1, z),
    north: !has(x, z - 1),
    south: !has(x, z + 1),
  };
  const missing = Object.values(sides).filter(Boolean).length;
  const perim = missing > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, base, z, perim ? "polished_andesite" : "smooth_stone");

  if (!perim) {
    // Interior: floor slabs only, air gap between them.
    put(x, base + 5, z, "smooth_quartz");
    put(x, base + 10, z, "gray_concrete");

    // Roof plant boxes on the flat roof.
    if (x % 4 === 2 && z % 7 === 3) put(x, base + 11, z, "iron_block");

    continue;
  }

  // Perimeter wall column.
  const xSide = sides.west || sides.east;
  const along = xSide ? z : x;
  const corner = missing >= 2;
  const pillar = corner || along % 3 === 0;
  const isDoor = sides.west && x === 0 && z === 10;

  // Interior cell directly inside this wall (for warm lights behind glass).
  let inX = x, inZ = z;
  if (sides.west) inX = x + 1;
  else if (sides.east) inX = x - 1;
  else if (sides.north) inZ = z + 1;
  else if (sides.south) inZ = z - 1;
  const interiorBehind = !corner && has(inX, inZ) && !(!has(inX - 1, inZ) || !has(inX + 1, inZ) || !has(inX, inZ - 1) || !has(inX, inZ + 1)) ;

  // Storey line at base+5 and cornice at base+10 run the full perimeter.
  put(x, base + 5, z, "light_gray_concrete");
  put(x, base + 10, z, "light_gray_concrete");
  // Parapet.
  put(x, base + 11, z, "white_concrete");

  if (pillar) {
    // Pillars: polished andesite on the shopfront, concrete above.
    put(x, base + 1, z, "polished_andesite");
    put(x, base + 2, z, "polished_andesite");
    put(x, base + 3, z, "polished_andesite");
    put(x, base + 4, z, "polished_andesite");
    for (const y of [6, 7, 8, 9]) put(x, base + y, z, "white_concrete");
    continue;
  }

  if (isDoor) {
    put(x, base + 1, z, "dark_oak_door", doorProps("lower"));
    put(x, base + 2, z, "dark_oak_door", doorProps("upper"));
    put(x, base + 3, z, "glass_pane", paneProps(sides));
    put(x, base + 4, z, "light_gray_concrete");
  } else {
    // Shopfront glazing with a lintel.
    for (const y of [1, 2, 3]) put(x, base + y, z, "glass_pane", paneProps(sides));
    put(x, base + 4, z, "light_gray_concrete");
  }

  // Upper storey: sill, two panes, head.
  put(x, base + 6, z, "light_gray_concrete");
  put(x, base + 7, z, "glass_pane", paneProps(sides));
  put(x, base + 8, z, "glass_pane", paneProps(sides));
  put(x, base + 9, z, "light_gray_concrete");

  // Warm lights behind some windows and in the shop.
  if (interiorBehind && along % 6 === 4) {
    put(inX, base + 7, inZ, "glowstone");
  }
  if (interiorBehind && !isDoor && along % 6 === 1) {
    put(inX, base + 2, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
