import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280209";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 21 x 18 footprint, roof ~21 blocks above lowest ground.
// Read as a mid-century (1970s-80s) Taipei commercial block: four storeys of
// 5 blocks, cream quartz facade, stone-brick base and cornice, tinted glass
// bays with white mullions, a shopfront at street level, and a steel water tank
// on the roof.
const W = 21, H = 33, D = 18;
const ROOF = 21;          // parapet top, blocks above lowest ground
const CORNICE = 20;       // cornice / roof slab level
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const minG = Math.min(...gmap.values());
for (const [k, v] of gmap) gmap.set(k, v - minG);

const has = (x, z) => gmap.has(`${x},${z}`);
const ground = (x, z) => gmap.get(`${x},${z}`);

const missing = (x, z) => ({
  north: !has(x, z - 1),
  south: !has(x, z + 1),
  west: !has(x - 1, z),
  east: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const m = missing(x, z);
  return m.north || m.south || m.west || m.east;
};

let minX = Infinity, maxX = -Infinity;
for (const [k] of gmap) {
  const x = Number(k.split(",")[0]);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const centreX = (minX + maxX) / 2;

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations and interior floor slabs.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  if (!isPerim(x, z)) {
    for (const fl of [gr, 5, 10, 15, CORNICE]) {
      if (fl >= gr && fl < H) put(x, fl, z, "smooth_stone");
    }
  }
}

// Pass 2: perimeter walls, windows, pillars and cornice.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const m = missing(x, z);
  const cornerX = m.west || m.east;
  const cornerZ = m.north || m.south;
  const corner = cornerX && cornerZ;
  const onNS = m.north || m.south;
  const idx = onNS ? x - minX : z;
  const pillar = corner || idx % 3 === 0;

  for (let y = gr; y <= ROOF; y++) {
    const bi = Math.floor(y / 5);
    const r = y % 5;
    if (y === ROOF || y === CORNICE) {
      put(x, y, z, "stone_bricks");
    } else if (r === 0 && bi === 0) {
      put(x, y, z, "stone_bricks");            // base course
    } else if (r === 0) {
      put(x, y, z, "smooth_quartz");           // spandrel / floor line
    } else if (r === 4) {
      put(x, y, z, "smooth_quartz");           // lintel
    } else {
      // window zone r = 1..3
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (onNS) {
        put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true" });
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false" });
      }
    }
  }
}

// Pass 3: warm light behind some glass (glowstone in the interior cell).
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const m = missing(x, z);
  let ix = x, iz = z;
  if (m.north) iz = z + 1;
  else if (m.south) iz = z - 1;
  else if (m.west) ix = x + 1;
  else if (m.east) ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (let bi = 0; bi < 4; bi++) {
    const y = bi * 5 + 2;
    if (y < ROOF && y >= ground(ix, iz) && (x * 7 + z * 3 + bi) % 3 === 0) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 4: entrance on the north face, nearest the middle of the frontage.
let door = null;
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z) || !missing(x, z).north) continue;
  const d = Math.abs(x - centreX);
  if (!door || d < door.d) door = { x, z, gr, d };
}
if (door) {
  const { x, z, gr } = door;
  put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 5: roof water tank, a 3x3 block (corners cut) on interior roof cells.
let tank = null;
for (const [key] of gmap) {
  const [cx, cz] = key.split(",").map(Number);
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) {
    for (let dz = -1; dz <= 1 && ok; dz++) {
      if (!has(cx + dx, cz + dz) || isPerim(cx + dx, cz + dz)) ok = false;
    }
  }
  if (!ok) continue;
  const d = Math.abs(cx - centreX) + Math.abs(cz - 8.5);
  if (!tank || d < tank.d) tank = { cx, cz, d };
}
if (tank) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx !== 0 && dz !== 0) continue; // cylinder-ish: cut corners
      for (let y = ROOF; y <= ROOF + 2; y++) put(tank.cx + dx, y, tank.cz + dz, "iron_block");
    }
  }
  put(tank.cx, ROOF + 3, tank.cz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
