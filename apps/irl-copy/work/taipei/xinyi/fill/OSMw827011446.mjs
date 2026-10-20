import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Mid-rise Xinyi mixed-use block, c. 1990s: five storeys of
// ~5 blocks, pale cladding with blue-glass ribbon windows, a stone base course,
// a shopfront ground floor on the street side, and a parapet with roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011446";
const W = 19, H = 38, D = 20;
const STORIES = 5;
const STEP = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const o = exposed(x, z);
  return o.n || o.s || o.w || o.e;
};

const PANE = { north: "true", south: "true", east: "true", west: "true" };

// Pick the street face (north-exposed) for the entrance: lowest z, then lowest x.
let doorCell = null;
for (const [x, z] of [...cells.map(c => [c[0], c[1]])].sort((a, b) => a[1] - b[1] || a[0] - b[0])) {
  if (exposed(x, z).n) { doorCell = [x, z]; break; }
}

for (const [x, z, gd] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) put(x, y, z, "gray_concrete");

  const out = exposed(x, z);
  const perim = out.n || out.s || out.w || out.e;

  // Facade index: along the wall it sits on, so piers fall on a 3-cell rhythm.
  const idx = (out.n || out.s) ? x : z;
  const pier = idx % 3 === 0;

  // Inward neighbour for lights (one of the exposed faces' opposite).
  let inner = null;
  if (out.n) inner = [x, z + 1];
  else if (out.s) inner = [x, z - 1];
  else if (out.w) inner = [x + 1, z];
  else if (out.e) inner = [x - 1, z];

  for (let s = 0; s < STORIES; s++) {
    const b = gd + STEP * s;

    // Floor slab for every storey, across the whole footprint.
    put(x, b, z, "smooth_quartz");

    if (!perim) continue;

    // Storey band: base course on the ground storey, spandrel above.
    put(x, b + 1, z, s === 0 ? "stone_bricks" : "white_concrete");

    // Glazing band between piers.
    for (const dy of [2, 3]) {
      put(x, b + dy, z, pier ? "white_concrete" : "light_blue_stained_glass_pane", pier ? undefined : PANE);
    }

    // Storey line / head band.
    put(x, b + 4, z, "white_concrete");

    // Warm lights behind some interior-facing windows.
    if (!pier && inner && has(inner[0], inner[1]) && !isPerim(inner[0], inner[1])) {
      if ((idx * 7 + s * 3) % 5 === 0) {
        put(inner[0], b + 2, inner[1], "glowstone");
      }
    }
  }

  // Roof slab on every cell, then parapet on the perimeter and plant on the roof.
  const top = gd + STEP * STORIES; // slab above storey 4 is the roof
  put(x, top, z, "light_gray_concrete");
  if (perim) {
    put(x, top + 1, z, "white_concrete");
  } else if ((x * 3 + z) % 7 === 0) {
    put(x, top + 1, z, "light_gray_concrete");
  }
}

// Shopfront entrance on the street face: door in the ground storey.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gd = gAt(dx, dz);
  put(dx, gd + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gd + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lit transom above the door.
  put(dx, gd + 3, dz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
