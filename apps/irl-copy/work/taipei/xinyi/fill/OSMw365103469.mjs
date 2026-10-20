import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 37 x 17 footprint, roof ~21 blocks above lowest ground.
// Read as a 1980s-90s Xinyi commercial block: four storeys of 5 blocks,
// white tiled piers, light grey spandrels, quartz cornices, stone ground-floor
// piers and glass shopfronts, a plain parapet and a central plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103469";
const W = 37, D = 17, H = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isBoundary = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const base = Math.min(...cells.map((c) => c[2])); // lowest ground under footprint
const ROOF = base + 21;                            // parapet row: 4 storeys + roof slab

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: nearest boundary cell on the south face to the middle.
let door = null;
for (const [x, z] of cells) {
  if (has(x, z + 1)) continue;
  if (!door || Math.abs(x - 18) < Math.abs(door[0] - 18)) door = [x, z];
}
const isDoorCell = (x, z) => door && x === door[0] && z === door[1];

// 1. Foundations, floor slabs, facades, parapet
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  put(x, gc, z, "smooth_quartz");

  const bnd = isBoundary(x, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1);

  for (let y = gc + 1; y <= ROOF; y++) {
    const rel = y - base;
    const r = rel % 5;
    const s = Math.floor(rel / 5);

    if (rel === 21) {
      if (bnd) put(x, y, z, "smooth_quartz");   // parapet
      continue;
    }
    if (r === 0) {                              // floor / roof slab, whole footprint
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!bnd) continue;                         // interior stays air behind glass

    // Facade bay: piers every 3 cells, windows between. On end walls, bays run along z.
    const bayIdx = zFace ? x : z;
    const pier = bayIdx % 3 === 0;

    if (s === 0) {
      // ground floor: stone piers, glass shopfront, quartz cornice
      if (r === 4) {
        put(x, y, z, "smooth_quartz");
      } else if (pier) {
        put(x, y, z, "stone_bricks");
      } else if (zFace) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "glass_pane", PANE_NS);
      }
    } else {
      if (r === 1) {
        put(x, y, z, "light_gray_concrete");    // spandrel band
      } else if (r === 4) {
        put(x, y, z, "smooth_quartz");          // storey cornice
      } else if (pier) {
        put(x, y, z, "white_concrete");         // tiled pier
      } else if (zFace) {
        put(x, y, z, "glass_pane", PANE_EW);    // window on long faces
      } else {
        put(x, y, z, "glass_pane", PANE_NS);    // window on end walls
      }
    }
  }
}

// Entrance surround and lintel, so the door reads from the street.
if (door) {
  const [dx, dz] = door;
  const gd = gAt(dx, dz);
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) {
      const ge = gAt(dx + ox, dz);
      for (let y = Math.max(gd + 1, ge + 1); y <= base + 3; y++) {
        put(dx + ox, y, dz, "stone_bricks");
      }
    }
  }
  // lintel over the door opening
  put(dx, base + 3, dz, "smooth_quartz");
}

// 2. Plant room on the roof, sitting on the roof slab
const pxMin = 12, pxMax = 24, pzMin = 5, pzMax = 11;
for (let x = pxMin; x <= pxMax; x++) {
  for (let z = pzMin; z <= pzMax; z++) {
    if (!has(x, z)) continue;
    const gc = gAt(x, z);
    const edge = x === pxMin || x === pxMax || z === pzMin || z === pzMax;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      if (y <= gc) continue;
      if (y === ROOF + 2) put(x, y, z, "smooth_quartz");
      else put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
    }
  }
}
if (has(18, 8)) put(18, ROOF + 3, 8, "lightning_rod");

// 3. Warm light behind the street-facing windows (glowstone in the air gap)
for (const [x, z] of cells) {
  if (!isBoundary(x, z)) continue;
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  if (!zFace || x % 6 !== 1) continue;
  const inward = !has(x, z - 1) ? z + 1 : z - 1;
  if (!has(x, inward) || isBoundary(x, inward)) continue;
  const gi = gAt(x, inward);
  for (let s = 0; s <= 3; s++) {
    const y = base + 5 * s + 2;
    if (y > gi) put(x, y, inward, "glowstone");
  }
}

// 4. Entrance door and a lantern inside
if (door) {
  const [dx, dz] = door;
  const gd = gAt(dx, dz);
  const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(dx, gd + 1, dz, "dark_oak_door", { ...dp, half: "lower" });
  put(dx, gd + 2, dz, "dark_oak_door", { ...dp, half: "upper" });
  if (has(dx, dz - 1)) {
    const gi = gAt(dx, dz - 1);
    put(dx, gi + 1, dz - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
