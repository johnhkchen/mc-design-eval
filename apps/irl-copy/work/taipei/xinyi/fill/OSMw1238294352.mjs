import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1238294352";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 5 x 23 x 6 volume. Two storeys of 5 blocks, a cornice and a parapet give a roof
// about 11 blocks above the lowest ground: a 1970s-80s reinforced-concrete shophouse block.
const W = 5, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const G = Math.max(...cells.map(c => c[2])); // common floor level (podium top)

// Exposed faces of a footprint cell (N = z-1, S = z+1, E = x+1, W = x-1)
function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x - 1, z)) f.push("W");
  return f;
}

// Window positions: N/S faces windowed at x = 1, 3; E/W faces at z = 1, 3.
// Corners and the remaining cells stay solid wall.
const winFace = (x, z, f) => (f === "N" || f === "S") ? (x === 1 || x === 3) : (z === 1 || z === 3);

const FACING = { N: "north", S: "south", E: "east", W: "west" };

// Entrance: on the street (north) face, nearest x = 2
let doorCell = null;
{
  const northCells = cells.filter(([x, z]) => exposed(x, z).includes("N"));
  const pool = northCells.length ? northCells : cells.filter(([x, z]) => exposed(x, z).length);
  pool.sort((a, b) => Math.abs(a[0] - 2) - Math.abs(b[0] - 2) || a[1] - b[1]);
  if (pool.length) doorCell = pool[0];
}
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;
const doorFace = doorCell ? (exposed(doorCell[0], doorCell[1]).includes("N") ? "N" : exposed(doorCell[0], doorCell[1])[0]) : null;

const interior = [];

for (const [x, z, gr] of cells) {
  // Foundation to the cell's own ground, then a plinth up to the common floor level
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");
  for (let y = gr + 1; y <= G; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs (storey lines) and roof deck across the whole footprint
  g.set(x, G + 5, z, "light_gray_concrete");
  g.set(x, G + 10, z, "stone_bricks");

  const f = exposed(x, z);
  if (f.length === 0) {
    interior.push([x, z]);
    continue;
  }

  const win = f.some(fc => winFace(x, z, fc));
  const isDoor = key(x, z) === doorKey;

  // Base course
  g.set(x, G + 1, z, "smooth_stone");
  // Storey 1 windows and lintel band (red shopfront sign band)
  g.set(x, G + 2, z, win ? "glass_pane" : "white_concrete");
  g.set(x, G + 3, z, win ? "glass_pane" : "white_concrete");
  g.set(x, G + 4, z, "red_concrete");
  // Storey 2 sill, windows, lintel
  g.set(x, G + 6, z, "light_gray_concrete");
  g.set(x, G + 7, z, win ? "glass_pane" : "white_concrete");
  g.set(x, G + 8, z, win ? "glass_pane" : "white_concrete");
  g.set(x, G + 9, z, "light_gray_concrete");
  // Cornice and parapet
  g.set(x, G + 10, z, "smooth_stone");
  g.set(x, G + 11, z, "white_concrete");

  if (isDoor) {
    const facing = FACING[doorFace] || "north";
    g.set(x, G + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, G + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, G + 3, z, "glass_pane");
  }
}

// Warm light behind the glass: glowstone in the air gap of each storey
if (interior.length) {
  const [ax, az] = interior[0];
  const [bx, bz] = interior[interior.length - 1];
  g.set(ax, G + 2, az, "glowstone");
  g.set(bx, G + 7, bz, "glowstone");
  // Roof water tank on the interior cell nearest the centre
  const cx = (W - 1) / 2, cz = (D - 1) / 2;
  const tank = interior.reduce((best, c) =>
    (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
  g.set(tank[0], G + 11, tank[1], "iron_block");
  g.set(tank[0], G + 12, tank[1], "iron_block");
}

g.save(`${dir}/${id}.nbt`);
