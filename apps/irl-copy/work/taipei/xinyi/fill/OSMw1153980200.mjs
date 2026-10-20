import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980200";
const W = 17, D = 23, H = 43;
const ROOF = 31;      // parapet top, about 31 blocks above lowest ground
const STOREY = 5;     // about 5 blocks per storey, six storeys

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const occ = new Map();
for (const [x, z, gr] of list) occ.set(`${x},${z}`, gr);
const has = (x, z) => occ.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Front = northern-most row (lowest z). Entrance at the median x of that row.
let minZ = Infinity;
for (const [, z] of list) minZ = Math.min(minZ, z);
const frontXs = list.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const DOOR_LO = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Main massing: foundation, floor slabs, window grid, spandrels, shopfront, parapet
for (const [x, z, gr] of list) {
  const per = perim(x, z);
  const isDoor = per && z === minZ && x === doorX;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const r = y % STOREY;
    const st = Math.floor(y / STOREY);

    if (y === ROOF) {
      if (per) put(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (!per) {
      // Interior: only the floor slabs; the rest is air behind the glass
      if (r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade
    if (st === 0 && y === gr) { put(x, y, z, "polished_granite"); continue; } // base course
    if (isDoor && y === gr + 1) { put(x, y, z, "dark_oak_door", DOOR_LO); continue; }
    if (isDoor && y === gr + 2) { put(x, y, z, "dark_oak_door", DOOR_UP); continue; }
    if (isDoor && y === gr + 3) { put(x, y, z, "white_concrete"); continue; }     // lintel

    if (r === 0) { put(x, y, z, "quartz_block"); continue; }                      // floor line
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }                    // spandrel

    // r = 1..3: window band
    if (st === 0) {
      // Shopfront: glass with heavier mullions every 4 blocks
      if ((x + z) % 4 === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "light_blue_stained_glass");
    } else {
      // Office windows: glass panes with white frames every other block
      if ((x + z) % 2 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Warm lamps set just inside some windows so the facade glows at dusk
for (const [x, z, gr] of list) {
  if (!perim(x, z)) continue;
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || perim(ix, iz)) continue;
  const innerGr = occ.get(`${ix},${iz}`);
  for (let y = 5; y <= ROOF - 1; y += STOREY) {
    const ly = y + 2; // middle of the window band
    if (ly <= innerGr || ly >= ROOF) continue;
    if ((x * 3 + z * 5 + ly) % 7 === 0) put(ix, ly, iz, "glowstone");
  }
}

// Rooftop mechanical box, lightning rod on top
for (let x = 5; x <= 11; x++) {
  for (let z = 8; z <= 14; z++) {
    if (!has(x, z) || perim(x, z)) continue;
    for (let y = ROOF; y < ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "stone_bricks");
  }
}
if (has(8, 11) && !perim(8, 11)) {
  put(8, ROOF + 4, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
