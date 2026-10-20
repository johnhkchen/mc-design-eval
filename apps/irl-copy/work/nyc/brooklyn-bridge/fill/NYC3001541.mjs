import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001541";
const W = 6, H = 21, D = 10;

// 64 Poplar Street, Brooklyn Heights, 1849: a three-storey Italianate rowhouse
// in brick with smooth brownstone (smooth sandstone) trim, stone_bricks plinth,
// flat roof with cornice and a brick chimney. Street door on the north (z = 0) face.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Smooth the lidar: one flat roof height for the whole house (median of the cells),
// and each cell keeps its own ground so the foundation follows the slope.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const ROOF = cl(roofMed, 8, H - 3);

const cellMap = new Map();
for (const [x, z, gr] of cells) {
  const ground = cl(Math.round(gr), 0, H - 4);
  cellMap.set(`${x},${z}`, { ground, roof: ROOF });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations, walls, floors, cornice.
for (const [key, { ground, roof }] of cellMap) {
  const [x, z] = key.split(",").map(Number);

  const northFree = !has(x, z - 1);
  const southFree = !has(x, z + 1);
  const westFree = !has(x - 1, z);
  const eastFree = !has(x + 1, z);
  const perimeter = northFree || southFree || westFree || eastFree;

  let face = null, u = 0;
  if (northFree) { face = "north"; u = x; }
  else if (southFree) { face = "south"; u = x; }
  else if (westFree) { face = "west"; u = z; }
  else if (eastFree) { face = "east"; u = z; }

  // Plinth from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const cornice = roof - 1;

  for (let y = ground; y < roof; y++) {
    const k = y - ground;
    const row = k % 3; // 0 = string course, 1-2 = window band

    if (y === cornice) {
      put(x, y, z, perimeter ? "smooth_sandstone" : "smooth_stone");
      continue;
    }

    if (!perimeter) {
      // Interior: floor slab at each storey line, air otherwise.
      if (row === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter wall.
    if (row === 0) {
      put(x, y, z, "smooth_sandstone");
      continue;
    }

    const onStreet = face === "north";
    const isWindowCol = face && u % 3 === 1;

    // Street door at x = 2 on the ground storey, framed by a sandstone transom course above.
    if (onStreet && x === 2 && k <= 1) {
      put(x, y, z, "dark_oak_door", {
        half: k === 0 ? "lower" : "upper",
        facing: "north",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (onStreet && k === 2 && x >= 1 && x <= 3) {
      put(x, y, z, "smooth_sandstone");
      continue;
    }
    // Lintel of the door: lantern hung under the transom beside the door.
    if (onStreet && x === 1 && k === 1) {
      put(x, y, z, "bricks");
      continue;
    }

    if (isWindowCol) {
      // Window: sandstone sill at row 1, full glass light above it.
      put(x, y, z, row === 1 ? "smooth_sandstone_slab" : "glass",
        row === 1 ? { type: "top", waterlogged: "false" } : undefined);
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Parapet cap on the perimeter, flat on top of the cornice.
  if (perimeter) put(x, roof, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light behind some street-facing windows.
for (const [key, { ground, roof }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1) && (x % 3 === 1) && has(x, z + 1)) {
    const storeys = Math.floor((roof - ground) / 3);
    for (let s = 0; s < storeys; s++) {
      if ((s + x) % 2 !== 0) continue;
      const y = ground + 3 * s + 1;
      if (y < roof - 1) put(x, y, z + 1, "glowstone");
    }
  }
}

// Pass 3: brick chimney on the roof deck.
for (const [key, { roof }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (x === 1 && z === 1 && has(1, 1)) {
    for (let y = roof; y <= Math.min(roof + 2, H - 1); y++) {
      put(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
