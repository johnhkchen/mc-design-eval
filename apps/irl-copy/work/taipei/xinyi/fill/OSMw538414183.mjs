import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Taipei commercial/residential block, c. 1980s-90s:
// quartz-tile walls, stone-brick base, cornice and parapet, light-blue glass
// bays on 3-block rhythm with quartz pillars, dark-wood entrance on the south
// (street) face, and a few rooftop AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414183";
const W = 18, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which exterior face(s) a cell sits on.
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Pass 1: foundations, floors, storey bands, roof, parapet, walls.
for (const [x, z, gr] of cells) {
  const b = gr;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  const f = faces(x, z);
  const exterior = f.length > 0;

  // Floor slabs at ground, first floor and roof (every cell, interior included).
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_stone");

  if (!exterior) continue;

  // Exterior: base course, belt course, cornice, parapet.
  put(x, b, z, "stone_bricks");
  put(x, b + 5, z, "stone_bricks");
  put(x, b + 10, z, "stone_bricks");
  put(x, b + 11, z, "stone_bricks");

  // Face used for bay rhythm: south/north run along x, east/west along z.
  const onNS = f.includes("south") || f.includes("north");
  const c = onNS ? x : z;
  const pillar = c % 3 === 0;

  for (let s = 0; s < 2; s++) {
    const F = b + 5 * s;
    for (let y = F + 1; y <= F + 4; y++) {
      if (y === F + 1) {
        put(x, y, z, "smooth_quartz"); // sill
      } else if (pillar) {
        put(x, y, z, "smooth_quartz");
      } else if (y === F + 3 && ((c + 2 * s) % 5 === 1)) {
        put(x, y, z, "glowstone"); // warm lit window
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Pass 2: entrance on the south (street) face at x = 8..9.
if (has(8, 13) && !has(8, 14)) {
  const b = G.get(key(8, 13));
  // Door frame and lintel
  for (const x of [7, 10]) {
    for (let y = b + 1; y <= b + 3; y++) put(x, y, 13, "stone_bricks");
  }
  for (let x = 7; x <= 10; x++) put(x, b + 4, 13, "stone_bricks");
  // Door (two blocks tall) at x = 8
  put(8, b + 1, 13, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(8, b + 2, 13, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(8, b + 3, 13, "smooth_quartz"); // transom above door
  // Shopfront glass beside the door
  if (has(9, 13)) {
    put(9, b + 1, 13, "light_blue_stained_glass");
    put(9, b + 2, 13, "light_blue_stained_glass");
    put(9, b + 3, 13, "glowstone"); // lit transom
  }
}

// Pass 3: rooftop AC plant on interior roof cells (sits on roof slab at b+10).
for (const [x, z, gr] of cells) {
  if (x >= 4 && x <= 6 && z >= 3 && z <= 4 && faces(x, z).length === 0) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
