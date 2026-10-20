import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Four-storey mid-century commercial block (c. 1975-1990), Taipei style:
// white tiled concrete frame, quartz pillars, light-blue glazing, shopfront
// on the ground floor, a recessed entrance on the north side, a parapet,
// roof water tank and AC plant, and warm light in some upper windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1148413597";
const W = 31, H = 33, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const cellMap = new Map();
let maxG = 0, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  cellMap.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// Which outer faces a cell touches: N = min-z side, S = max-z side, W = min-x side, E = max-x side
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isPerimeter = (x, z) => faces(x, z).length > 0;

// Floor level: above the highest ground under the footprint, so the plinth
// fills every low cell and nothing floats on the slope.
const F = maxG + 1;
const TOP = F + 23; // highest block: tank lid
if (TOP >= H) throw new Error(`Building top ${TOP} exceeds grid height ${H}`);

const cx = Math.round((minX + maxX) / 2);
const inwardOf = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Helpers
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation / plinth: solid from y 0 up to the floor level under every cell
for (const [x, z] of [...cellMap.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 0; y <= F - 2; y++) put(x, y, z, "stone_bricks");
  put(x, F - 1, z, "smooth_stone"); // base course line
}

// 2. Floor slabs at each storey base (storeys 0..3), roof slab at F+20
for (let k = 0; k < 4; k++) {
  const b = F + 5 * k;
  for (const key of cellMap.keys()) {
    const [x, z] = key.split(",").map(Number);
    put(x, b, z, "light_gray_concrete");
  }
}

// 3. Facade: pillars, glazing, spandrels, entrance, glow
for (const key of cellMap.keys()) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  if (f.length === 0) continue;

  const corner = f.length > 1;
  const face = f[0];
  const along = (face === "N" || face === "S") ? x - minX : z - minZ;
  const inward = inwardOf[face];
  const bay = Math.floor(along / 4);
  const m = along % 4;
  const entrance = face === "N" && Math.abs(x - cx) <= 1;

  for (let k = 0; k < 4; k++) {
    const b = F + 5 * k;

    // spandrel band at top of each storey
    put(x, b + 4, z, "light_gray_concrete");

    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;

      if (corner || m === 0) {
        put(x, y, z, "smooth_quartz");
      } else if (m === 3) {
        put(x, y, z, "white_concrete");
      } else if (k === 0 && entrance) {
        // open recessed entrance; lantern hangs from the band above
        if (dy === 3) put(x, y, z, "lantern", { hanging: "true" });
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    }

    // warm light behind some upper-storey windows (inside the cell next to the glass)
    if (k >= 1 && !corner && m === 1 && !(entrance) && (bay + k) % 2 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz) && !isPerimeter(ix, iz)) {
        put(ix, b + 2, iz, "glowstone");
      }
    }
  }
}

// 4. Roof: cornice on the edge, roof membrane inside, parapet above
const roofY = F + 20;
for (const key of cellMap.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isPerimeter(x, z)) {
    put(x, roofY, z, "white_concrete");
    put(x, roofY + 1, z, "smooth_quartz");
  } else {
    put(x, roofY, z, "light_gray_concrete");
  }
}

// Lanterns on the parapet corners
for (const key of cellMap.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (faces(x, z).length > 1) {
    put(x, roofY + 2, z, "lantern", { hanging: "false" });
  }
}

// 5. Roof equipment: find interior spots where the footprint fits
const fits = (x0, z0, w, d) => {
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++)
      if (!has(x, z) || isPerimeter(x, z)) return false;
  return true;
};

// Water tank: 3x3 footprint, 2 blocks tall, lid slab on top, corners rounded off
let tank = null;
for (let x0 = minX + 2; x0 <= maxX - 4 && !tank; x0++)
  for (let z0 = minZ + 2; z0 <= maxZ - 4 && !tank; z0++)
    if (fits(x0, z0, 3, 3)) tank = [x0, z0];
if (tank) {
  const [x0, z0] = tank;
  for (let x = x0; x < x0 + 3; x++)
    for (let z = z0; z < z0 + 3; z++) {
      const corner = (x === x0 || x === x0 + 2) && (z === z0 || z === z0 + 2);
      if (corner) continue;
      put(x, roofY + 1, z, "white_concrete");
      put(x, roofY + 2, z, "white_concrete");
      put(x, roofY + 3, z, "smooth_stone_slab", { type: "bottom" });
    }
}

// AC plant: small iron units, placed away from the tank
let plant = null;
for (let x0 = minX + 2; x0 <= maxX - 3 && !plant; x0++)
  for (let z0 = minZ + 2; z0 <= maxZ - 2 && !plant; z0++) {
    if (tank && x0 < tank[0] + 4 && x0 + 2 > tank[0] - 1 &&
        z0 < tank[1] + 4 && z0 + 1 > tank[1] - 1) continue;
    if (fits(x0, z0, 2, 1)) plant = [x0, z0];
  }
if (plant) {
  put(plant[0], roofY + 1, plant[1], "iron_block");
  put(plant[0] + 1, roofY + 1, plant[1], "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
