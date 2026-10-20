import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365465";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const L = Math.min(...cells.map((c) => c[2])); // lowest ground: base of the building

// Put a block only on footprint cells, above that cell's ground, inside the volume.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  const gr = ground.get(key(x, z));
  if (gr === undefined || y < gr) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which exterior face a perimeter cell belongs to (null = interior cell)
function faceInfo(x, z) {
  const isN = !inside(x, z - 1);
  const isS = !inside(x, z + 1);
  const isW = !inside(x - 1, z);
  const isE = !inside(x + 1, z);
  if (!isN && !isS && !isW && !isE) return null;
  if (isN) return { axis: "x", u: x, front: true, inX: 0, inZ: 1 };
  if (isS) return { axis: "x", u: x, front: false, inX: 0, inZ: -1 };
  if (isW) return { axis: "z", u: z, front: false, inX: 1, inZ: 0 };
  return { axis: "z", u: z, front: false, inX: -1, inZ: 0 };
}

const glassProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade material for a perimeter cell at storey row r (y = L + r)
function facadeSpec(fi, r) {
  const { axis, u, front } = fi;
  const pillar = [0, 4, 5, 6, 10].includes(u);
  if (r === 0) return { id: "stone_bricks" };                 // base course
  if (r === 5) return { id: "smooth_quartz" };                // storey band
  if (r === 9) return { id: "quartz_block" };                 // upper lintel band
  if (r === 10) return { id: "smooth_stone" };                // cornice course
  if (r <= 4 && front && u === 5) {                           // entrance bay
    if (r === 1) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (r === 2) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (r === 3) return { id: "quartz_block" };
    return { id: "lantern", props: { hanging: "true", waterlogged: "false" } }; // warm entrance lamp
  }
  if (pillar) return { id: "quartz_block" };
  return { id: "glass_pane", props: glassProps(axis) };
}

// 1. Foundations, interior floor slabs, facades, roof and parapet
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fi = faceInfo(x, z);

  if (!fi) {
    // Interior cell: floor slabs at ground, upper floor and roof; air elsewhere
    put(x, L + 0, z, "smooth_stone");
    put(x, L + 5, z, "smooth_stone");
    put(x, L + 11, z, "light_gray_concrete");
    continue;
  }

  // Storey walls, rows 0..10
  for (let r = 0; r <= 10; r++) {
    const spec = facadeSpec(fi, r);
    put(x, L + r, z, spec.id, spec.props);
  }

  // Roof slab over the perimeter, parapet on top
  put(x, L + 11, z, "light_gray_concrete");
  put(x, L + 12, z, "stone_brick_wall");
}

// 2. Warm lights behind upper-floor windows (sit on the interior floor slab at L+5)
for (const [x, z] of cells) {
  const fi = faceInfo(x, z);
  if (!fi) continue;
  if (fi.u !== 2 && fi.u !== 8) continue;
  const ix = x + fi.inX, iz = z + fi.inZ;
  if (!inside(ix, iz)) continue;
  // Only where the cell behind is interior (not another perimeter face)
  if (faceInfo(ix, iz)) continue;
  const id = fi.u === 2 ? "glowstone" : "shroomlight";
  put(ix, L + 6, iz, id);
}

// 3. Roof equipment: water tank and two AC units
if (L + 14 <= H - 1) {
  let tankOk = true;
  for (let x = 4; x <= 6; x++)
    for (let z = 4; z <= 6; z++) if (!inside(x, z)) tankOk = false;
  if (tankOk) {
    for (let x = 4; x <= 6; x++)
      for (let z = 4; z <= 6; z++) {
        put(x, L + 12, z, "light_gray_concrete");
        put(x, L + 13, z, "light_gray_concrete");
        put(x, L + 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
  }
}
if (inside(1, 8)) put(1, L + 12, 8, "iron_block");
if (inside(9, 2)) put(9, L + 12, 2, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
