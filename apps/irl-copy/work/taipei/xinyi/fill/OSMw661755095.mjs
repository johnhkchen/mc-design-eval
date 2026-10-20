import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-80s Taipei concrete shophouse block: two storeys over a
// shopfront ground floor, white-tiled walls, grey base course, tile storey
// band, flat roof with parapet, a water tank and rooftop condenser units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755095";
const W = 18, H = 19, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell: "n" (z-1), "s" (z+1), "w" (x-1), "e" (x+1)
function outwardFace(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

for (const [key, G0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const G = Math.min(G0, 4);       // floor level of the ground storey

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G0; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, G, z, "smooth_stone");

  // Storey lines: band between storeys, roof slab, parapet.
  put(x, G + 3, z, "light_gray_concrete");
  put(x, G + 6, z, "stone_bricks");

  const face = outwardFace(x, z);
  if (!face) {
    // Interior cell: air gap in the storeys, slabs above and below.
    continue;
  }

  // Along-wall index and wall length for the window bay rhythm.
  const onZFace = face === "n" || face === "s";
  const along = onZFace ? x : z;
  const L = onZFace ? W : D;
  const pillar = along % 3 === 0 || along === L - 1;
  const isDoor = face === "n" && x === 8;

  // Wall base course.
  put(x, G, z, "smooth_stone");

  // Ground storey (G+1..G+2): shopfront glass between pillars, door at x=8.
  for (const y of [G + 1, G + 2]) {
    if (pillar) put(x, y, z, "white_concrete");
    else if (isDoor) {
      if (y === G + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else put(x, y, z, "glass_pane");
  }

  // Upper storey (G+4..G+5): window grid with pillars.
  for (const y of [G + 4, G + 5]) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane");
  }

  // Lintel/cornice course under the roof slab and parapet above it.
  put(x, G + 6, z, "smooth_stone");
  put(x, G + 7, z, "white_concrete");

  // Warm light behind selected windows on the street (north) facade.
  if (face === "n" && !pillar && !isDoor) {
    if (along % 6 === 4 && has(x, 1)) put(x, G + 4, 1, "glowstone");
    if (along % 6 === 2 && has(x, 1)) put(x, G + 1, 1, "shroomlight");
  }
}

// Rooftop equipment on the roof slab (roof surface at G+7 for ground G=0).
const roofY = 7;
const roofBox = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z))
        for (let y = y0; y <= y1; y++) put(x, y, z, id);
};
// Water tank with a slab cap, near the west end.
roofBox(3, 4, 2, 3, roofY, roofY + 1, "white_concrete");
roofBox(3, 4, 2, 3, roofY + 2, roofY + 2, "smooth_stone_slab");
// Condenser units on the east side.
roofBox(12, 13, 5, 6, roofY, roofY, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
