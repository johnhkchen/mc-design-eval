import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block, c. 1970s-80s: reinforced-concrete frame,
// cream wall tiles, light-grey storey bands, a shopfront ground storey,
// and a parapet with roof plant. Roughly 2 storeys of about 5 blocks, roof near +11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455323";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 11, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const DIRS = [
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
];

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const exteriorOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => has(x, z) && exteriorOf(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Along-wall position and wall length for a given outward direction.
const uOf = (x, z, d) => (d.dx !== 0 ? z - minZ : x - minX);
const lenOf = (d) => (d.dx !== 0 ? maxZ - minZ : maxX - minX);

// Choose the entrance: north (street) face, middle of the wall if possible.
let doorCell = null;
{
  const perim = cells.filter(([x, z]) => isPerim(x, z));
  const northMid = perim.filter(([x, z]) => {
    const e = exteriorOf(x, z);
    return e.some((d) => d.dz === -1) && uOf(x, z, { dx: 0, dz: -1 }) === Math.floor((maxX - minX) / 2);
  });
  const anyNorth = perim.filter(([x, z]) => exteriorOf(x, z).some((d) => d.dz === -1));
  const pick = northMid[0] || anyNorth[0] || perim[0];
  if (pick) {
    const e = exteriorOf(pick[0], pick[1]);
    const out = e.find((d) => d.dz === -1) || e[0];
    doorCell = { x: pick[0], z: pick[1], d: out };
  }
}

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground-floor slab / base course.
  put(x, gr, z, "polished_andesite");
  // Storey floor slabs across the whole footprint.
  put(x, gr + 5, z, "smooth_stone");
  // Roof deck.
  put(x, gr + 10, z, "stone_bricks");
  // Roof plant on a few interior roof cells.
  if (!isPerim(x, z) && x % 4 === 2 && z % 8 === 4) put(x, gr + 11, z, "iron_block");

  const ex = exteriorOf(x, z);
  if (ex.length === 0) continue;

  const d = ex[0];
  const u = uOf(x, z, d);
  const L = lenOf(d);
  const win = u > 0 && u < L && u % 3 !== 0;
  const paneId = win ? "glass" : "white_concrete";

  // Ground storey shopfront and upper storey windows.
  for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, paneId);
  put(x, gr + 5, z, "light_gray_concrete");
  for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, paneId);

  // Cornice and parapet.
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");

  // Warm light just inside some windows.
  if (win && u % 6 === 2) {
    const ix = x - d.dx, iz = z - d.dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      put(ix, gr + 3, iz, "glowstone");
      put(ix, gr + 8, iz, "glowstone");
    }
  }
}

// Entrance: double-height door in the frame, with a lintel canopy above.
if (doorCell) {
  const { x, z, d } = doorCell;
  const gr = ground.get(`${x},${z}`);
  const facing = d.f;
  put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "smooth_stone");
  put(x, gr + 4, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
