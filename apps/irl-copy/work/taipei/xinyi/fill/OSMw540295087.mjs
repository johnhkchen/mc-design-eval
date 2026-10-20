import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century-style commercial block: stone base, white concrete
// shell with a light-grey storey line, glazed upper bays with white pillars,
// a glazed shopfront with a central door on the street front, a quartz cornice,
// a parapet, and rooftop plant. Roof top at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295087";
const W = 20, H = 23, D = 10;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: (x,z) -> ground height
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr ?? 0);
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const ctr = Math.round((minX + maxX) / 2); // entrance column on the street front

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward directions: [dx, dz, name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

for (const [k, b] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const isPerim = perim.length > 0;

  // foundation fill up to the cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "cobblestone");

  // ground floor slab and base course
  put(x, b, z, isPerim ? "stone_bricks" : "smooth_stone");
  // first-floor slab (interior) and roof slab
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, isPerim ? "smooth_quartz" : "light_gray_concrete");

  if (!isPerim) {
    // rooftop plant: a few small units on the roof
    if ((x * 3 + z) % 9 === 4) put(x, b + 11, z, "iron_block");
    continue;
  }

  // shell: white concrete walls, storey line, spandrels, parapet
  for (let y = b + 1; y <= b + 9; y++) put(x, y, z, "white_concrete");
  put(x, b + 5, z, "light_gray_concrete");
  put(x, b + 11, z, "white_concrete");

  // openings only on single-face wall cells (corners stay solid pillars)
  if (perim.length === 1) {
    const [dx, dz, name] = perim[0];
    const t = dx !== 0 ? z : x;
    const tmin = dx !== 0 ? minZ : minX;
    const rel = t - tmin;
    const pillar = rel % 3 === 0;
    const front = name === "south" && z === maxZ;
    const ix = x - dx, iz = z - dz; // interior cell behind this wall

    if (!pillar) {
      const isDoor = front && x === ctr;
      if (!isDoor) {
        // shopfront glass on ground floor
        for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass");
      }
      // upper glazed bay
      for (let y = b + 6; y <= b + 8; y++) put(x, y, z, "glass");

      // warm lights behind some glass
      if (rel % 6 === 1 && has(ix, iz)) put(ix, b + 7, iz, "glowstone");
      if (rel % 6 === 4 && has(ix, iz) && !front) put(ix, b + 2, iz, "glowstone");
      if (front && !isDoor && rel % 3 === 2 && has(ix, iz)) {
        put(ix, b + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
    // lintel above the shopfront
    put(x, b + 4, z, "white_concrete");
  }
}

// street entrance: double-height door opening in the central front bay
if (has(ctr, maxZ)) {
  const b = groundAt(ctr, maxZ);
  put(ctr, b + 1, maxZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ctr, b + 2, maxZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ctr, b + 3, maxZ, "white_concrete");
  // canopy-style lantern just inside the entrance
  if (has(ctr, maxZ - 1)) {
    put(ctr, b + 4, maxZ - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
