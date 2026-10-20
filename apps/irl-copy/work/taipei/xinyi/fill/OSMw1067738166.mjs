import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-1990s / 2000s Taipei mid-rise commercial-office block: 4 storeys of
// light concrete with quartz spandrels, glazed bays on piers, a shopfront
// ground floor, a cornice and parapet, and a central mechanical penthouse
// with a lightning-rod mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738166";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 33, D = 22;
const TOP = 20;      // cornice / roof deck level
const PARAPET = 21;  // parapet on exterior cells: roof reads at ~21 blocks
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const bay = (x, z) => (((x + z) % 3) + 3) % 3;

// centroid and north edge
let sx = 0, sz = 0, n = 0, zmin = Infinity;
for (const [x, z] of cells) { sx += x; sz += z; n++; if (z < zmin) zmin = z; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);

// entrance: north-edge exterior cell nearest the centre line
let door = null;
for (const [x, z] of cells) {
  if (z !== zmin || !isExt(x, z)) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door.x - cx)) door = { x, z };
}
if (door) door.g = groundAt(door.x, door.z);

// ---- foundations, walls, floors, roof ----
for (const [x, z] of cells) {
  const gr = groundAt(x, z);

  // solid foundation under every cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (isExt(x, z)) {
    // exterior shell from ground to cornice
    for (let y = gr; y <= TOP; y++) {
      let id, props;
      if (y === gr) {
        id = "polished_andesite";                       // base course
      } else if (y === TOP) {
        id = "smooth_quartz";                           // cornice
      } else if (y < 5) {
        // ground-floor commercial frontage
        if (y === 4) id = "light_gray_concrete";        // transom header
        else if (bay(x, z) === 0) id = "polished_andesite"; // pier
        else if (((x + 2 * y + z) % 5) === 0) id = "glowstone"; // warm shop light
        else id = "light_blue_stained_glass";
      } else {
        const r = y % 5;
        if (r === 0) id = "smooth_quartz";              // storey line
        else if (r === 4) id = "light_gray_concrete";   // window head
        else if (bay(x, z) === 0) id = "white_concrete"; // pier
        else if (((x * 7 + y * 3 + z * 5) % 11) === 0) id = "glowstone"; // lit office
        else id = "light_blue_stained_glass";
      }
      put(x, y, z, id, props);
    }
    // parapet with coping on the roofline
    put(x, PARAPET, z, "light_gray_concrete");
  } else {
    // interior: floor slabs per storey, no air-filled rooms beyond that
    if (gr <= TOP) put(x, gr, z, "smooth_stone");
    for (const fy of [5, 10, 15]) if (fy >= gr) put(x, fy, z, "smooth_stone");
    put(x, TOP, z, "smooth_stone");                     // roof deck
  }
}

// ---- entrance ----
if (door) {
  const { x, z } = door;
  const dg = door.g;
  if (dg + 2 <= 3) {
    put(x, dg + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, dg + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, dg + 3, z, "glowstone");                     // light above the door
  }
}

// ---- central mechanical penthouse and mast ----
for (const [x, z] of cells) {
  if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 3) continue;
  for (let y = 21; y <= 24; y++) {
    let id;
    if (y === 21) id = "light_gray_concrete";
    else if (y === 24) id = "smooth_quartz";
    else id = bay(x, z) === 0 ? "white_concrete" : "light_blue_stained_glass";
    put(x, y, z, id);
  }
}
if (has(cx, cz)) {
  for (let y = 25; y <= 28; y++) put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
