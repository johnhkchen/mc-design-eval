import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 67, H = 19, D = 6;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339824888.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

// Bounds-guarded setter; omits the props argument when none is given.
function S(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Footprint lookup: key "x,z" -> ground y
const gmap = new Map();
for (const [x, z, gy] of cells) gmap.set(`${x},${z}`, gy);
const has = (x, z) => gmap.has(`${x},${z}`);

// Pass 1: foundation, plinth/floor, walls, roof deck, parapet, rooftop units.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) S(x, y, z, "stone_bricks");

  const front = !has(x, z - 1); // north long side (street frontage)
  const back = !has(x, z + 1);  // south long side
  const endW = !has(x - 1, z);
  const endE = !has(x + 1, z);
  const perim = front || back || endW || endE;

  // Ground floor slab / base course.
  S(x, gy, z, perim ? "stone_bricks" : "smooth_stone");

  if (perim) {
    for (let y = gy + 1; y <= gy + 3; y++) {
      if (front || back) {
        const pier = x % 4 === 0;
        S(x, y, z, pier ? "smooth_quartz" : "cyan_stained_glass_pane");
      } else {
        S(x, y, z, "white_concrete");
      }
    }
    // Storey-line fascia / lintel band at the top of the 5-block storey.
    S(x, gy + 4, z, (front || back) ? "smooth_quartz" : "white_concrete");

    // Parapet and cap.
    S(x, gy + 6, z, "white_concrete");
    S(x, gy + 7, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: air gap behind glass, with warm lights in some bays.
    if (z === 1 && x % 8 === 3) S(x, gy + 2, z, "glowstone");
    if (z === 2 && x % 12 === 6) {
      S(x, gy + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Roof deck over every footprint cell.
  S(x, gy + 5, z, "smooth_stone");

  // Rooftop condenser units on the interior deck.
  if (!perim && (z === 2 || z === 3) && ((x >= 10 && x <= 13) || (x >= 50 && x <= 53))) {
    S(x, gy + 6, z, "light_gray_concrete");
  }
}

// Pass 2: entrances on the street frontage (z = 0), at pier columns.
for (const dx of [8, 56]) {
  const gy = gmap.get(`${dx},0`);
  if (gy === undefined) continue;
  S(dx, gy + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  S(dx, gy + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Dark frame lintel above the door.
  S(dx, gy + 3, 0, "dark_oak_planks");
  // Warm lanterns flanking the door, set just inside the glass line.
  S(dx - 1, gy + 3, 1, "lantern", { hanging: "false", waterlogged: "false" });
  S(dx + 1, gy + 3, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339824888.nbt");
