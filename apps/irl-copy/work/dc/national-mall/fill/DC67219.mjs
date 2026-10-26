import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC67219";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, H = 28, D = 10;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const inSet = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => inSet.has(key(x, z));
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Floor datum: highest ground under the footprint; storeys every 3 blocks from it
const B = Math.max(...cells.map(c => c[2]));
const HMAX = H - 5;

// Snap each cell's lidar roof to a storey line so the tiers are flat and clean
const snapRoof = (rf) => {
  let R = Math.max(rf, B + 3);
  const k = Math.round((R - B) / 3);
  R = B + 3 * Math.max(1, k);
  return Math.min(R, HMAX);
};

// Street face: the z = minZ edge, centred
const doorX = Math.round((minX + maxX) / 2);
const doorZ = minZ;

// Materials: 1980s Washington office in pale Potomac-stone-like cladding,
// dark bronze-tinted glass, granite base, stone cornice
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const PIER = "calcite";
const SPAN = "smooth_stone";
const GLASS_GF = "light_blue_stained_glass";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = "smooth_stone";
const CORNICE = "polished_granite";
const PENT = "stone_bricks";

// Pass 1: massing, foundations, floors, facades, roof
for (const [x, z, gr] of cells) {
  const rf = cells.find(c => c[0] === x && c[1] === z)[3];
  const perim = isPerim(x, z);
  const cornerX = (x === minX || x === maxX);
  const cornerZ = (z === minZ || z === maxZ);
  const corner = cornerX && cornerZ;

  const R = snapRoof(rf);
  const T = R - 1;

  // Foundation under the cell
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  for (let y = gr; y <= T; y++) {
    const rel = ((y - B) % 3 + 3) % 3;
    const isFloor = rel === 0;

    if (y === T) {
      // Cornice on the edge, roof deck inside
      put(x, y, z, perim ? CORNICE : ROOF);
      continue;
    }

    if (isFloor) {
      // Floor slab per storey; facade spandrel band in darker stone for shadow line
      put(x, y, z, perim ? SPAN : PIER);
      continue;
    }

    if (!perim) continue; // interior air behind the glass

    // Facade window band: corner piers and alternating mullions, glass between
    const storeyBottom = y - rel;
    const groundStorey = storeyBottom <= B;
    if (corner) {
      put(x, y, z, PIER);
    } else if ((x + z) % 2 === 0) {
      put(x, y, z, PIER);
    } else {
      put(x, y, z, groundStorey && y < B + 3 ? GLASS_GF : GLASS);
    }
  }
}

// Pass 2: entrance on the street face, with a canopy over the door
if (has(doorX, doorZ)) {
  // granite threshold and jambs
  put(doorX - 1, B, doorZ, BASE);
  put(doorX + 1, B, doorZ, BASE);
  put(doorX - 1, B + 1, doorZ, BASE);
  put(doorX + 1, B + 1, doorZ, BASE);
  put(doorX, B, doorZ, BASE);

  // door, lower and upper halves
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(doorX, B + 1, doorZ, "dark_oak_door", doorProps("lower"));
  put(doorX, B + 2, doorZ, "dark_oak_door", doorProps("upper"));

  // canopy across the door bay, on the solid floor line above
  for (let dx = -1; dx <= 1; dx++) {
    if (has(doorX + dx, doorZ)) put(doorX + dx, B + 3, doorZ, CORNICE);
  }
  // hanging lantern under the canopy, flanking the door
  if (has(doorX - 1, doorZ)) {
    put(doorX - 1, B + 2, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
  if (has(doorX + 1, doorZ)) {
    put(doorX + 1, B + 2, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: lit interiors seen through the glass
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!isPerim(x, z)) continue;
  let inX = null, inZ = null;
  if (!has(x + 1, z)) { inX = x - 1; inZ = z; }
  else if (!has(x - 1, z)) { inX = x + 1; inZ = z; }
  else if (!has(x, z + 1)) { inX = x; inZ = z - 1; }
  else if (!has(x, z - 1)) { inX = x; inZ = z + 1; }
  if (inX === null || !has(inX, inZ)) continue;

  const rf = cells.find(c => c[0] === x && c[1] === z)[3];
  const T = snapRoof(rf) - 1;
  for (let y = B + 1; y < T; y++) {
    const rel = ((y - B) % 3 + 3) % 3;
    if (rel === 0) continue;
    if (x === doorX && z === doorZ && y <= B + 2) continue;
    if (((x * 3 + z * 5 + y) % 7) !== 0) continue;
    if ((x + z + y) % 3 === 0) {
      put(inX, y, inZ, "shroomlight");
    } else {
      put(inX, y, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Pass 4: rooftop mechanical penthouse, set back from the parapet
for (const [x, z, , rf] of cells) {
  if (isPerim(x, z)) continue;
  if (x < minX + 2 || x > maxX - 2) continue;
  if (z < minZ + 3 || z > maxZ - 3) continue;
  const R = snapRoof(rf);
  put(x, R, z, PENT);
  put(x, R + 1, z, PENT);
}

g.save(`${DIR}/${ID}.nbt`);
