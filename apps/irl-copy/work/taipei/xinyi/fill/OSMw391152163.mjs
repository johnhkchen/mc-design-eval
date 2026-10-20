import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise shophouse, c. 1985-1995: two storeys over a shopfront,
// white-painted concrete with quartz bands, tinted glazing, flat roof
// with parapet and rooftop AC plant. Roof top sits 12 blocks above the
// lowest ground (top block index = g0 + 11).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152163";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 24, D = 23;

const foot = new Map(); // "x,z" -> ground
for (const [x, z, g] of cells) foot.set(`${x},${z}`, Math.round(g));
const has = (x, z) => foot.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Placed blocks, keyed by "x,y,z". Written to the Voxels grid at the end so
// glass pane connections can be computed from the final layout.
const B = new Map();
const put = (x, y, z, id, props = {}) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  B.set(`${x},${y},${z}`, { x, y, z, id, props });
};

for (const [key, gRaw] of foot) {
  const [x, z] = key.split(",").map(Number);
  const g0 = Math.max(0, Math.min(gRaw, 12));

  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const perim = isPerim(x, z);
  const corner = (mN || mS) && (mW || mE);

  // Foundation fill up to this cell's ground, then the floor slab.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");
  put(x, g0, z, perim ? "polished_andesite" : "light_gray_concrete");

  if (!perim) {
    // Interior: floor slabs only (air gap behind glass).
    put(x, g0 + 5, z, "light_gray_concrete");
    put(x, g0 + 10, z, "light_gray_concrete");
    // Rooftop AC plant on the roof surface.
    if (x % 3 === 1 && z % 4 === 2) put(x, g0 + 11, z, "iron_block");
    continue;
  }

  // Perimeter: storey bands, parapet/cornice.
  put(x, g0 + 5, z, "smooth_quartz");
  put(x, g0 + 10, z, "smooth_quartz");
  put(x, g0 + 11, z, "smooth_quartz");

  const wallId = corner ? "smooth_quartz" : "white_concrete";
  for (let y = g0 + 1; y <= g0 + 4; y++) put(x, y, z, wallId);
  for (let y = g0 + 6; y <= g0 + 9; y++) put(x, y, z, wallId);

  // Bay index along the face: north/south faces run along x, east/west along z.
  const i = (mN || mS) ? x : z;
  const bay = !corner && i % 3 === 2;

  // Storey 1, street (north) face: shopfront with entrance.
  if (mN && !corner) {
    if (x === 4) {
      put(x, g0 + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, g0 + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, g0 + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
    } else {
      for (let y = g0 + 1; y <= g0 + 3; y++) {
        if (x === 3 || x === 6) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass");
      }
    }
    put(x, g0 + 4, z, "black_concrete"); // shopfront fascia
  } else if (bay) {
    // Storey 1 windows on side and rear faces: sill, then panes.
    put(x, g0 + 1, z, "smooth_quartz");
    for (let y = g0 + 2; y <= g0 + 4; y++) put(x, y, z, "light_blue_stained_glass_pane");
  }

  // Storey 2 windows on every non-corner bay (front included).
  if (bay) {
    put(x, g0 + 6, z, "smooth_quartz");
    for (let y = g0 + 7; y <= g0 + 9; y++) put(x, y, z, "light_blue_stained_glass_pane");
  }

  // Warm light behind selected windows: glowstone on the interior cell.
  const ix = mW ? x + 1 : mE ? x - 1 : x;
  const iz = mN ? z + 1 : mS ? z - 1 : z;
  if (bay && (i === 5 || i === 8) && has(ix, iz) && !isPerim(ix, iz)) {
    const ly = i === 5 ? g0 + 3 : g0 + 8;
    put(ix, ly, iz, "glowstone");
  }
}

// Glass panes connect to their neighbours in the wall plane.
const connects = (id) => id !== "lantern" && !id.endsWith("_door") && !id.endsWith("_slab");
for (const b of B.values()) {
  if (!b.id.endsWith("_glass_pane")) continue;
  const props = {};
  for (const [dir, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]]) {
    const nb = B.get(`${b.x + dx},${b.y},${b.z + dz}`);
    props[dir] = nb && connects(nb.id) ? "true" : "false";
  }
  props.waterlogged = "false";
  b.props = props;
}

const g = new Voxels([W, H, D]);
for (const b of B.values()) {
  if (Object.keys(b.props).length) g.set(b.x, b.y, b.z, b.id, b.props);
  else g.set(b.x, b.y, b.z, b.id);
}
g.save(`${DIR}/${ID}.nbt`);
