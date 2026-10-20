import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541456402: no record. Low-rise Xinyi commercial block, c. 1980s.
// Two storeys over a shopfront ground floor, cream-tiled upper floor with
// quartz trim, red/yellow signboard band, parapet and cornice, water tank on roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456402";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 23, D = 14;
const ROOF = 11;            // roof level from lidar record (about 11 blocks above lowest ground)
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the entrance: a street-face cell with the lowest ground, nearest the face middle.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    const missZ = !has(x, z + 1) || !has(x, z - 1);
    const missX = !has(x + 1, z) || !has(x - 1, z);
    if (!(missZ || missX)) continue;
    const coord = missZ ? x : z;
    const mid = missZ ? W / 2 : D / 2;
    const score = Math.max(0, G.get(`${x},${z}`)) * 3 + Math.abs(coord - mid) * 0.5;
    if (score < best) { best = score; doorKey = `${x},${z}`; }
  }
}

const outwardFacing = (x, z) => {
  if (!has(x, z + 1)) return "south";
  if (!has(x, z - 1)) return "north";
  if (!has(x + 1, z)) return "east";
  return "west";
};

for (const [x, z, ground] of cells) {
  const key = `${x},${z}`;
  const top = Math.max(ROOF, ground + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  const missZ = !has(x, z + 1) || !has(x, z - 1);
  const missX = !has(x + 1, z) || !has(x - 1, z);
  const boundary = missZ || missX;

  if (!boundary) {
    // Interior: floor slabs only, air gap otherwise (no interiors).
    if (ground <= 5) set(x, 5, z, "smooth_quartz");
    set(x, top, z, "smooth_quartz");

    // Roof equipment: water tank and AC unit on a grid of interior roof cells.
    if (x % 9 === 4 && z % 6 === 3 && has(x - 2, z) && has(x + 2, z) && has(x, z - 2) && has(x, z + 2)) {
      set(x, top + 1, z, "light_gray_concrete");
      set(x, top + 2, z, "iron_block");
    } else if (x % 9 === 0 && z % 6 === 1 && has(x - 2, z) && has(x + 2, z) && has(x, z - 2) && has(x, z + 2)) {
      set(x, top + 1, z, "iron_block");
    }
    continue;
  }

  // Boundary wall. Coordinate runs along the wall; panes connect along it.
  const coord = missZ ? x : z;
  const runsAlongX = missZ;
  const paneProps = runsAlongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = ground; y < top; y++) {
    if (y <= 3) {
      // Shopfront ground floor.
      if (coord % 3 === 0) set(x, y, z, "smooth_quartz");
      else if (y === 2 && coord % 6 === 4) set(x, y, z, "glowstone");
      else set(x, y, z, "glass");
    } else if (y === 4) {
      // Signboard band, red and yellow alternating.
      set(x, y, z, coord % 2 === 0 ? "red_concrete" : "yellow_concrete");
    } else if (y === 5) {
      // Floor line.
      set(x, y, z, "smooth_quartz");
    } else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9) set(x, y, z, "smooth_quartz");
      else if (coord % 3 === 0) set(x, y, z, "white_concrete");
      else if (coord % 6 === 1) set(x, y, z, "glowstone");          // warm lit window
      else set(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else if (y === 10) {
      // Parapet.
      set(x, y, z, "smooth_quartz");
    }
  }

  // Cornice slab on top of the wall.
  set(x, top, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Entrance door with a dark-oak frame, outward facing.
  if (key === doorKey) {
    const facing = outwardFacing(x, z);
    set(x, ground, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, ground + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
