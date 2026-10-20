import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540891053";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 19, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (already relative to y 0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const exposed = (x, z) => {
  const f = [];
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x + 1, z)) f.push("E");
  if (!inside(x - 1, z)) f.push("W");
  return f;
};

// Entrance: south-facing perimeter cell nearest the middle of the facade
let entranceX = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (exposed(x, z).includes("S")) {
      const d = Math.abs(x - Math.floor(W / 2));
      if (d < best) { best = d; entranceX = x; }
    }
  }
}
const entranceZ = (() => {
  if (entranceX === null) return null;
  let z = null;
  for (let zz = 0; zz < D; zz++) if (inside(entranceX, zz) && exposed(entranceX, zz).includes("S")) z = zz;
  return z;
})();

// Storey plan (offsets from ground b):
// 0 plinth, 1-3 ground storey glazing, 4 lintel, 5 storey line,
// 6-8 upper glazing, 9 band, 10 cornice, 11 parapet
for (const [x, z, b] of cells.map(([x, z, gr]) => [x, z, Math.round(gr)])) {
  // Foundation up to ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const perim = ex.length > 0;

  if (!perim) {
    // Interior: floor slabs only, air gaps between, roof deck, sparse glow and roof plant
    put(x, b, z, "smooth_quartz");
    put(x, b + 5, z, "smooth_quartz");
    put(x, b + 10, z, "smooth_quartz");
    if ((x + 2 * z) % 4 === 0) {
      put(x, b + 2, z, "glowstone");
      put(x, b + 7, z, "glowstone");
    }
    if ((3 * x + z) % 7 === 0) put(x, b + 11, z, "iron_block");
    continue;
  }

  const onNS = ex.includes("S") || ex.includes("N");
  const u = onNS ? x : z;
  const corner = ex.length >= 2;
  const windowCol = !corner && u % 3 !== 0;

  put(x, b, z, "stone_bricks");
  for (let k = 1; k <= 3; k++) {
    if (windowCol) put(x, b + k, z, "light_blue_stained_glass_pane");
    else put(x, b + k, z, "white_concrete");
  }
  put(x, b + 4, z, "quartz_block");
  put(x, b + 5, z, "smooth_quartz");
  for (let k = 6; k <= 8; k++) {
    if (windowCol) put(x, b + k, z, "light_blue_stained_glass_pane");
    else put(x, b + k, z, "white_concrete");
  }
  put(x, b + 9, z, "quartz_block");
  put(x, b + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(x, b + 11, z, "smooth_quartz");
}

// Entrance: double-height door in the south wall, hanging lantern above
if (entranceX !== null && entranceZ !== null) {
  const b = Math.round(ground.get(`${entranceX},${entranceZ}`));
  put(entranceX, b + 1, entranceZ, "dark_oak_door",
    { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(entranceX, b + 2, entranceZ, "dark_oak_door",
    { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(entranceX, b + 3, entranceZ, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
