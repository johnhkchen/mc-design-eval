// Department of Education, Lyndon Baines Johnson Building (400 Maryland Ave SW): a 1950s-60s federal office block in
// stripped-modern style, pale precast skin with quartz piers and storey lines and a band of glass per storey. Massing
// follows the lidar roof per cell (median-smoothed, so the wings, the 14 m core and the 15 tower bays read as flat tiers).
// Rhythm: a plinth at y 0, then each storey is two blocks: a spandrel/slab row (odd y) and a window row (even y) with
// an air gap behind the glass. Every slab and the roof cap span the whole footprint, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78556.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 69, Z = 17;

// Footprint, lidar roof per cell, and the median of each 3x3 neighbourhood inside the footprint (lidar noise out).
const raw = Array.from({ length: X }, () => new Array(Z).fill(null));
for (const [x, z, , roof] of cells) raw[x][z] = roof;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && raw[x][z] !== null;
const top = new Array(X).fill(null).map(() => new Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(raw[x + dx][z + dz]);
  v.sort((a, b) => a - b);
  top[x][z] = v[v.length >> 1];
}
const topAt = (x, z) => (inside(x, z) ? top[x][z] : 0);

// Which horizontal faces of a cell are open to air at row y: outside the footprint, or the neighbour's roof is below y.
function exposure(x, z, y) {
  const e = { x: false, z: false };
  for (const [dx, dz, axis] of [[1, 0, "x"], [-1, 0, "x"], [0, 1, "z"], [0, -1, "z"]]) {
    if (!inside(x + dx, z + dz) || y >= topAt(x + dx, z + dz)) e[axis] = true;
  }
  return e;
}

// What stands in cell (x, y, z): null is air (interior, or above the roof).
function kindAt(x, y, z) {
  if (!inside(x, z)) return null;
  const r = top[x][z];
  if (y >= r) return null;
  const e = exposure(x, z, y);
  const facade = e.x || e.z;
  if (y === 0) return "plinth";
  if (y === r - 1) return facade ? "parapet" : "roof";
  if (facade && y === r - 2) return "cornice";
  if (y % 2 === 1) return facade ? "spandrel" : "slab";
  return facade ? "wall" : null;
}

const g = new Voxels([X, 27, Z]);
const PIER = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z)) continue;
  const r = top[x][z];
  for (let y = 0; y < r; y++) {
    const k = kindAt(x, y, z);
    if (!k) continue;
    const e = exposure(x, z, y);
    switch (k) {
      case "plinth": g.set(x, y, z, "gray_concrete"); break;
      case "roof": g.set(x, y, z, "light_gray_concrete"); break;
      case "slab": g.set(x, y, z, "light_gray_concrete"); break;
      case "spandrel": g.set(x, y, z, "white_concrete"); break;
      case "parapet": case "cornice": g.set(x, y, z, PIER); break;
      case "wall": {
        // Corners and piers every third bay; glass between, its pane running along the face it sits in.
        const pier = (e.x && e.z) || (e.z ? x % 3 === 0 : z % 3 === 0);
        if (pier) g.set(x, y, z, PIER);
        else if (e.z) g.set(x, y, z, GLASS, { east: true, west: true, north: false, south: false, waterlogged: false });
        else g.set(x, y, z, GLASS, { east: false, west: false, north: true, south: true, waterlogged: false });
        break;
      }
    }
  }
}

// Main entrance, centre of the north face: a quartz surround, double iron doors, a soffit lantern under the storey-2 slab.
for (let x = 31; x <= 36; x++) g.set(x, 2, 0, PIER);
for (const x of [33, 34]) {
  const hinge = x === 33 ? "left" : "right";
  g.set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
g.set(34, 2, 1, "lantern", { hanging: true, waterlogged: false });

// Warm light behind the glass: glowstone on the ground and fourth-storey floors, a few shroomlights up the tower.
for (let x = 1; x < X - 1; x++) {
  if (inside(x, 1) && x % 9 === 4 && kindAt(x, 2, 1) === null && top[x][1] > 4) g.set(x, 2, 1, "glowstone");
  if (inside(x, 1) && x % 13 === 6 && kindAt(x, 8, 1) === null && top[x][1] > 8) g.set(x, 8, 1, "shroomlight");
}

// Roof plant: small units on the tallest tier, set on the roof cap.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inside(x, z) || top[x][z] !== 15 || x % 4 !== 1 || z % 4 !== 1) continue;
  if (kindAt(x, 14, z) !== "roof") continue;
  g.set(x, 15, z, "light_gray_concrete");
  g.set(x, 16, z, "gray_concrete");
}

const out = g.save(`${DIR}/DC78556.nbt`);
console.log(`DC78556: ${out.blocks} blocks, ${out.palette} palette entries`);
