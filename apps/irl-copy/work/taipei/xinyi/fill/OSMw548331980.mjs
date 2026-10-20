import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office/retail block, c. 1990s: four storeys of 5 blocks,
// a shopfront base, white-tile bands with a glass window grid, a quartz cornice and
// parapet, and a rooftop plant penthouse with a short antenna.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw548331980";
const W = 21, H = 33, D = 58;
const ROOF_Y = 20;   // top of the storeys / roof membrane
const PARAPET_Y = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF_Y, Math.round(g))));
}

const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(key(x, z));
const isRing = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Facade logic for a ring (outer shell) cell at height y.
function facade(x, y, z) {
  const westEast = x === 0 || x === W - 1;
  const corner = westEast && (z === 0 || z === D - 1);
  const u = westEast ? z : x;
  const yy = y % 5;
  const storey = Math.floor(y / 5);
  const pier = corner || u % 3 === 0;

  // Entrance on the west face, centred on the long side.
  if (x === 0 && z >= 26 && z <= 31 && y >= 1 && y <= 4) {
    if (y === 4) return "polished_granite";
    if (z >= 27 && z <= 30) return null;          // open doorway, air gap
    return "polished_granite";                    // door reveals
  }

  if (y === 0) return "polished_granite";          // base course
  if (yy === 0) return "light_gray_concrete";      // storey slab band
  if (yy === 4) return "smooth_quartz";            // spandrel
  // window zone rows 1..3
  if (storey === 0) {
    return pier ? "polished_granite" : "light_blue_stained_glass"; // shopfront
  }
  if (pier) return "white_concrete";
  const tint = (u * 7 + y * 3 + storey * 5) % 5 === 0;
  return tint ? "gray_stained_glass" : "light_blue_stained_glass";
}

// Pass 1: foundations, interior floor slabs, roof, and facade shell.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gr = ground.get(key(x, z));
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    if (isRing(x, z)) {
      for (let y = gr; y < ROOF_Y; y++) {
        const id = facade(x, y, z);
        if (id) put(x, y, z, id);
      }
      put(x, ROOF_Y, z, "smooth_quartz");                 // cornice
      const westEast = x === 0 || x === W - 1;
      const u = westEast ? z : x;
      const corner = westEast && (z === 0 || z === D - 1);
      if (corner || u % 2 === 0) put(x, PARAPET_Y, z, "smooth_quartz"); // crenellated parapet
    } else {
      for (let y = gr; y < ROOF_Y; y++) {
        if (y % 5 === 0) put(x, y, z, "smooth_stone");     // floor slab per storey
      }
      put(x, ROOF_Y, z, "gray_concrete");                  // roof membrane
    }
  }
}

// Pass 2: warm light behind some upper-storey windows (in the air gap).
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z) || !isRing(x, z)) continue;
    const westEast = x === 0 || x === W - 1;
    const u = westEast ? z : x;
    const corner = westEast && (z === 0 || z === D - 1);
    if (corner || u % 3 === 0) continue;
    let ix, iz;
    if (x === 0) { ix = 1; iz = z; }
    else if (x === W - 1) { ix = W - 2; iz = z; }
    else if (z === 0) { ix = x; iz = 1; }
    else { ix = x; iz = D - 2; }
    if (!inFp(ix, iz) || isRing(ix, iz)) continue;
    for (let y = 5; y < ROOF_Y; y++) {
      if (y % 5 !== 2) continue;
      if (x === 0 && z >= 26 && z <= 31) continue;
      if ((u + y) % 4 === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// Entrance lanterns inside the lobby air gap.
for (const z of [28, 29]) {
  if (inFp(1, z)) put(1, 3, z, "lantern", { hanging: "false" });
}

// Rooftop plant penthouse (interior cells only, stands on the roof membrane).
const PH = { x0: 6, x1: 14, z0: 20, z1: 36 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inFp(x, z) || isRing(x, z)) continue;
    const perim = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = PARAPET_Y; y <= 23; y++) {
      if (perim) {
        if (y === 22 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, 24, z, "smooth_quartz");
  }
}

// Two small HVAC units on the open roof.
for (let x = 3; x <= 4; x++) for (let z = 8; z <= 10; z++) {
  if (inFp(x, z) && !isRing(x, z)) put(x, PARAPET_Y, z, "gray_concrete");
}
for (let x = 16; x <= 17; x++) for (let z = 44; z <= 46; z++) {
  if (inFp(x, z) && !isRing(x, z)) put(x, PARAPET_Y, z, "gray_concrete");
}

// Antenna on the penthouse roof.
if (inFp(10, 28)) {
  for (let y = 25; y <= 28; y++) put(10, y, 28, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
