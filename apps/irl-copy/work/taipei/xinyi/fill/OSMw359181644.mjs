import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 中山儷園: 1990s-era Taipei mid-rise residential. Lidar roof ~11 blocks above the
// lowest ground, so it reads as a two-storey block with a stone base, pale tiled
// walls, grey floor bands, glazed bays, a steel roof tank and a street-side entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw359181644";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 40;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

const H0 = Math.max(...cells.map((c) => c[2]));       // body starts above highest ground
const gMin = Math.min(...cells.map((c) => c[2]));
let nS = Math.round((gMin + 11 - H0 - 1) / 5);          // storeys of 5 blocks
nS = Math.max(1, Math.min(3, nS));
const R = H0 + 5 * nS;                                  // roof deck row
const PARAPET = R + 1;

// Materials
const WALL = "smooth_quartz";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const FRAME = "stone_brick_slab";

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exposedFaces = (x, z) =>
  FACES.filter(([dx, dz]) => !inside.has(key(x + dx, z + dz)));
const isPerim = (x, z) => exposedFaces(x, z).length > 0;

// Street side = smallest z; entrance centred on it.
const zStreet = Math.min(...cells.map((c) => c[1]));
const streetXs = cells.filter((c) => c[1] === zStreet).map((c) => c[0]).sort((a, b) => a - b);
const doorX = streetXs[Math.floor(streetXs.length / 2)];

// 1. Foundation: solid from y 0 up to the body base under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < H0; y++) put(x, y, z, BASE);
}

// 2. Floor slabs per storey (interior solid, perimeter band in grey concrete).
for (let k = 0; k < nS; k++) {
  const b = H0 + 5 * k;
  for (const [x, z] of cells) {
    if (isPerim(x, z)) put(x, b, z, k === 0 ? BASE : BAND);
    else put(x, b, z, "smooth_stone");
  }
}

// 3. Perimeter walls: band / glazed bays with piers / sill course.
for (const [x, z] of cells) {
  const exposed = exposedFaces(x, z);
  if (exposed.length === 0) continue;
  const face = exposed[0];
  const along = face[0] !== 0 ? z : x;
  const corner = exposed.length >= 2;
  const pier = corner || along % 3 === 0;

  for (let y = H0; y < R; y++) {
    const k = Math.floor((y - H0) / 5);
    const b = H0 + 5 * k;
    const r = y - b;
    let id;
    if (r === 0) id = k === 0 ? BASE : BAND;
    else if (r === 4) id = BAND;
    else id = pier ? WALL : "glass_pane";
    put(x, y, z, id);

    // Sparse warm light just inside some windows.
    if (r >= 1 && r <= 3 && !pier) {
      const ix = x - face[0], iz = z - face[1];
      const hash = (x * 7 + z * 3 + k * 11) % 9;
      if (hash === 0 && r === 2 && inside.has(key(ix, iz)) && !isPerim(ix, iz)) {
        put(ix, b + 2, iz, "glowstone");
      }
    }
  }

  // Parapet: a single course above the roof deck.
  put(x, PARAPET, z, BAND);
}

// 4. Roof deck and cornice across the whole footprint.
for (const [x, z] of cells) put(x, R, z, "smooth_stone");

// 5. Entrance on the street face: stone surround, lintel, double-height door, lobby light.
const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
// Surround: stone pilasters flanking the door on the street wall
put(doorX - 1, H0 + 1, zStreet, FRAME);
put(doorX - 1, H0 + 2, zStreet, FRAME);
put(doorX + 1, H0 + 1, zStreet, FRAME);
put(doorX + 1, H0 + 2, zStreet, FRAME);
// Door
put(doorX, H0 + 1, zStreet, "dark_oak_door", doorLower);
put(doorX, H0 + 2, zStreet, "dark_oak_door", doorUpper);
// Lintel and transom glass above
put(doorX - 1, H0 + 3, zStreet, FRAME);
put(doorX, H0 + 3, zStreet, FRAME);
put(doorX + 1, H0 + 3, zStreet, FRAME);
// Threshold steps, stone, inside the footprint
put(doorX - 1, H0, zStreet + 1, "smooth_stone");
put(doorX, H0, zStreet + 1, "smooth_stone");
put(doorX + 1, H0, zStreet + 1, "smooth_stone");
// Lobby light behind the entrance glass
if (inside.has(key(doorX, zStreet + 1))) {
  put(doorX, H0 + 2, zStreet + 1, "lantern", { hanging: "false" });
}

// 6. Roof plant: a steel water tank set well inside the roof.
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx = Math.round(cx / cells.length);
cz = Math.round(cz / cells.length);
let tank = null;
let bestD = Infinity;
for (const [x, z] of cells) {
  const ok = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) =>
    inside.has(key(x + dx, z + dz)) && !isPerim(x + dx, z + dz)));
  if (!ok) continue;
  const d = Math.abs(x - cx) + Math.abs(z - cz);
  if (d < bestD) { bestD = d; tank = [x, z]; }
}
if (tank && R + 3 < H) {
  const [tx, tz] = tank;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      put(tx + dx, R + 1, tz + dz, "iron_block");
      put(tx + dx, R + 2, tz + dz, "iron_block");
    }
  }
  put(tx, R + 3, tz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
