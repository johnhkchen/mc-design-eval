import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block (no record): white-tiled concrete frame,
// stone plinth, storey bands, glazed bays, shopfront with entrance, flat roof with parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980402";
const W = 30, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.floor(gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals per face, and the matching door facing.
const DIRS = {
  east:  { dx: 1,  dz: 0,  facing: "east" },
  west:  { dx: -1, dz: 0,  facing: "west" },
  south: { dx: 0,  dz: 1,  facing: "south" },
  north: { dx: 0,  dz: -1, facing: "north" },
};

// Classify perimeter once so interior tests are order-independent.
const perimeter = new Set();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1)) perimeter.add(key);
}
const isInterior = (x, z) => has(x, z) && !perimeter.has(`${x},${z}`);

for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (!perimeter.has(key)) {
    // Interior: air with floor slab at storey line, roof deck at top. Nothing else.
    put(x, G + 5, z, "light_gray_concrete");
    put(x, G + 10, z, "gray_concrete");
    // Rooftop plant room block in the middle of the roof.
    if (x >= 9 && x <= 12 && z >= 4 && z <= 7) {
      put(x, G + 11, z, "light_gray_concrete");
      put(x, G + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter column: find outward faces.
  const missing = Object.keys(DIRS).filter(f => !has(x + DIRS[f].dx, z + DIRS[f].dz));
  const corner = missing.length >= 2;
  const face = missing[0];
  const fd = face ? DIRS[face] : null;
  const idx = face === "east" || face === "west" ? z : x;
  const bay = !corner && face && idx % 3 === 1;
  const isEntrance = !corner && face === "south" && x === 15 && z === D - 1;

  // Walls, from the plinth up to the parapet.
  for (let r = 0; r <= 11; r++) {
    const y = G + r;
    let id = "white_concrete";
    let props = null;

    if (r === 0) id = "stone_bricks";                       // plinth
    else if (r <= 4) {                                      // ground floor shopfront
      if (r === 4) id = "light_gray_concrete";              // lintel band
      else if (isEntrance) {
        if (r <= 2) { id = "dark_oak_door"; props = { facing: fd ? fd.facing : "south", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
        else id = "glass_pane";
      } else if (bay && !corner) id = "glass_pane";
    } else if (r === 5) id = "light_gray_concrete";         // storey line
    else if (r <= 9) {                                      // upper floor
      if (r === 6 || r === 9) { if (bay && !corner) id = "light_gray_concrete"; }
      else if (bay && !corner) id = "light_blue_stained_glass_pane";
    } else if (r === 10) id = "smooth_stone";               // cornice
    else id = "white_concrete";                             // parapet

    // Pier/bay body for glazed bays on the shopfront (pier stays white).
    if (r >= 1 && r <= 3 && !bay && !isEntrance) id = "white_concrete";

    if (props) put(x, y, z, id, props);
    else put(x, y, z, id);
  }

  // Warm light: glowstone just inside some upper-floor bays.
  if (bay && idx % 6 === 1 && fd) {
    const ix = x - fd.dx, iz = z - fd.dz;
    if (isInterior(ix, iz)) put(ix, G + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
