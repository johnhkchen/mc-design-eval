import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408127";
const W = 20, H = 23, D = 22;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (absolute box y)
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const cells = [...ground].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

// Record: roof ~11 blocks above the lowest ground -> two storeys of ~5 blocks
// with a cornice and parapet. Mid-century / 1980s commercial block in Xinyi:
// white concrete walls, stone string courses, glass shopfront and window bays.
const B = Math.min(...cells.map(c => c.gr));   // lowest ground
const ROOF = B + 11;                            // parapet top

const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// 1. Foundations, base course, walls, storey lines, cornice, parapet
for (const { x, z, gr } of cells) {
  // solid foundation from y 0 up to this cell's ground
  for (let y = 0; y <= gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  const wX = !has(x - 1, z) || !has(x + 1, z); // exterior on east/west face
  const wZ = !has(x, z - 1) || !has(x, z + 1); // exterior on north/south face

  if (!wX && !wZ) {
    // interior cell: no interior, only floor slabs; air gap elsewhere
    for (const y of [B + 5, B + 10]) {
      if (y > gr && y <= ROOF && y < H) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = wX && wZ;
  const along = wZ ? x : z;   // index along the exterior wall
  const paneProps = wZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr + 1; y <= ROOF && y < H; y++) {
    let b;
    let p = null;
    if (y === gr + 1) {
      b = "polished_andesite";                       // base course
    } else if (y <= B + 4) {
      // ground storey: shopfront glazing between piers
      if (corner || along % 4 === 0) b = "white_concrete";
      else { b = "glass_pane"; p = paneProps; }
    } else if (y === B + 5) {
      b = "smooth_stone";                            // first-floor string course
    } else if (y <= B + 9) {
      // upper storey: window bays with sills and heads
      if (y === B + 6 || y === B + 9 || corner || along % 3 === 0) {
        b = "white_concrete";
      } else if ((along * 3 + y * 5 + x + z) % 11 === 0) {
        b = "glowstone";                             // warm lit window
      } else {
        b = "glass_pane"; p = paneProps;
      }
    } else if (y === B + 10) {
      b = "smooth_stone";                            // cornice
    } else {
      b = "white_concrete";                          // parapet
    }
    if (p) g.set(x, y, z, b, p);
    else g.set(x, y, z, b);
  }
}

// 2. Main entrance on the north (minimum z) face, nearest the centre of that face
const northFace = cells.filter(c => !has(c.x, c.z - 1));
if (northFace.length) {
  const zMin = Math.min(...northFace.map(c => c.z));
  const row = northFace.filter(c => c.z === zMin);
  const meanX = row.reduce((s, c) => s + c.x, 0) / row.length;
  const door = row.reduce((best, c) =>
    Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best);

  const dx = door.x, dz = door.z, dgr = door.gr;
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { ...lower, half: "upper" };
  if (dgr + 2 < H) g.set(dx, dgr + 2, dz, "dark_oak_door", lower);
  if (dgr + 3 < H) g.set(dx, dgr + 3, dz, "dark_oak_door", upper);

  // canopy / transom over the entrance, spanning the door and its neighbours
  const cy = dgr + 4;
  if (cy <= B + 4 && cy < H) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = dx + ox;
      if (has(cx, dz) && !has(cx, dz - 1)) {
        g.set(cx, cy, dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// 3. Roof plant: a small 3x3 unit of plant on the interior roof near the centre
if (cells.length) {
  const cxm = Math.round(cells.reduce((s, c) => s + c.x, 0) / cells.length);
  const czm = Math.round(cells.reduce((s, c) => s + c.z, 0) / cells.length);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cxm + dx, z = czm + dz;
      if (!has(x, z) || isPerim(x, z)) continue;
      const gr = ground.get(`${x},${z}`);
      for (let y = ROOF + 1; y <= ROOF + 2 && y < H; y++) {
        if (y > gr) g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
