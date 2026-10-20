import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343639";
const W = 20, H = 23, D = 17;

// Two storeys (5 blocks each) on a white-tile podium-style block, roof at y 11.
const ROOF_Y = 11;
const FLOOR_Y = 5;
const PARAPET_Y = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF_Y - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward face of a footprint cell (null when interior).
function outZ(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}
function outX(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const isPerim = (x, z) => has(x, z) && (outZ(x, z) !== null || outX(x, z) !== null);

// Pass 1: foundations, walls, interior floors and roof.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gnd(x, z);
  const nz = outZ(x, z);
  const nx = outX(x, z);
  const perim = nz !== null || nx !== null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air between (no interiors).
    for (const y of [gr, FLOOR_Y, ROOF_Y]) {
      if (y >= gr) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Bay index along the face: x for north/south faces, z for east/west faces.
  const bay = nz !== null ? x : z;
  const win = bay % 3 === 1;

  for (let y = gr; y <= ROOF_Y; y++) {
    let b;
    if (y === gr) b = "stone_bricks";                       // base course
    else if (y === ROOF_Y) b = "smooth_stone";              // cornice
    else if (y === FLOOR_Y) b = "smooth_stone";             // storey line
    else if (y < FLOOR_Y) {                                  // ground storey (shopfront)
      if (y === FLOOR_Y - 1) b = "light_gray_concrete";      // transom
      else b = win ? "light_blue_stained_glass" : "white_concrete";
    } else {                                                 // upper storey
      if (y === 6 || y === 10) b = win ? "light_gray_concrete" : "white_concrete";
      else b = win ? "light_blue_stained_glass" : "white_concrete";
    }
    put(x, y, z, b);
  }

  // Parapet above the cornice.
  put(x, PARAPET_Y, z, "white_concrete");
}

// Pass 2: warm lights behind some upper-storey windows (inside the footprint).
for (const [x, z, gr] of cells.map(c => [c[0], c[1], c[2]])) {
  const nz = outZ(x, z);
  const nx = outX(x, z);
  if (nz === null && nx === null) continue;
  const bay = nz !== null ? x : z;
  if (bay % 3 !== 1) continue;
  if ((x + z) % 4 !== 0) continue;
  let ix = x, iz = z;
  if (nz === "north") iz = z + 1;
  else if (nz === "south") iz = z - 1;
  else if (nx === "west") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  put(ix, 8, iz, "shroomlight");
}

// Pass 3: entrance on the lowest-z (north) front, near the middle of the width.
{
  const front = cells
    .filter(([x, z]) => outZ(x, z) === "north")
    .map(([x, z]) => [x, z, gnd(x, z)]);
  if (front.length) {
    const minZ = Math.min(...front.map(c => c[1]));
    const row = front.filter(c => c[1] === minZ);
    row.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
    const [dx, dz, dg] = row[0];
    const hinge = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(dx, dg, dz, "oak_door", { ...hinge, half: "lower" });
    put(dx, dg + 1, dz, "oak_door", { ...hinge, half: "upper" });
    // Hanging lantern over the door, under the lintel.
    put(dx, dg + 2, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: roof equipment on the roof slab (interior cells only).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if ((x + 2 * z) % 11 === 0) put(x, PARAPET_Y, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
