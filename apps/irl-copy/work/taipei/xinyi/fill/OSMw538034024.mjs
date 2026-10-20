import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey, flat-roofed 1980s-style commercial block (about 11 blocks to the parapet
// above the lowest ground). Pale cast-concrete walls with a stone-brick base and
// pilasters, a red sign band over a glass shopfront, pane windows with a glowstone
// glow in some bays, a smooth-stone storey line and cornice, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034024";
const W = 10, H = 23, D = 25;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Shift grounds so the lowest footprint ground is y 0.
const minG = Math.min(...raw.map(([, , gr]) => Math.round(gr)));
const fp = new Map();
for (const [x, z, gr] of raw) fp.set(`${x},${z}`, Math.round(gr) - minG);

const has = (x, z) => fp.has(`${x},${z}`);
const groundAt = (x, z) => fp.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey levels (y relative to the lowest ground, which is y 0).
const FLOOR2 = 5;     // first-floor slab and storey line
const ROOF = 10;      // roof deck
const PARAPET = 11;   // parapet / top course; roof about 11 blocks above lowest ground
if (PARAPET >= H) throw new Error("footprint too tall for grid");

// Outward-facing sides of a footprint cell.
const outward = (x, z) => {
  const o = [];
  if (!has(x, z - 1)) o.push([0, -1]); // north (front, street side)
  if (!has(x, z + 1)) o.push([0, 1]);  // south
  if (!has(x - 1, z)) o.push([-1, 0]); // west
  if (!has(x + 1, z)) o.push([1, 0]);  // east
  return o;
};

// Choose a front door on the -z face, nearest the middle of the frontage.
let doorCell = null;
{
  let best = Infinity;
  for (const [key] of fp) {
    const [x, z] = key.split(",").map(Number);
    const o = outward(x, z);
    if (o.length === 1 && o[0][0] === 0 && o[0][1] === -1) {
      const d = Math.abs(x - Math.floor(W / 2));
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

const paneProps = (axis) =>
  axis === "z"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);

  // 1. Foundation: solid from y 0 up to this cell's ground (stone-brick plinth).
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // 2. Floor slab and roof deck across the whole footprint.
  put(x, FLOOR2, z, "light_gray_concrete");
  put(x, ROOF, z, "light_gray_concrete");

  const out = outward(x, z);
  if (out.length === 0) continue; // interior cell: air behind the glass

  const corner = out.length >= 2;
  const front = out.some(([dx, dz]) => dx === 0 && dz === -1);
  const axis = out.some(([dx]) => dx !== 0) ? "x" : "z";
  // Along-face index: the coordinate that runs along the wall.
  const along = axis === "z" ? x : z;

  // Inward neighbour, for placing light behind glass.
  const [odx, odz] = out[0];
  const ix = x - odx, iz = z - odz;

  // 3. Walls, base course, storey line, lintels, pilasters, windows.
  for (let y = gr; y <= ROOF - 1; y++) {
    if (y === FLOOR2) {
      put(x, y, z, corner ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (corner) { put(x, y, z, "stone_bricks"); continue; }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }

    const storey1 = y <= 4;
    const storey2 = y >= 6 && y <= 9;
    const isWindowBay = along % 2 === 1;

    if (front && storey1) {
      if (y === 4) { put(x, y, z, "red_concrete"); continue; } // sign band
      // Shopfront glass, except the door bay.
      const isDoorBay = doorCell && doorCell[0] === x && doorCell[1] === z;
      if (isDoorBay) {
        put(x, y, z, y >= gr + 2 ? "white_concrete" : "white_concrete");
      } else {
        put(x, y, z, y >= gr + 1 && y <= 3 ? "glass" : "white_concrete");
      }
      continue;
    }

    if (isWindowBay && storey1 && y >= gr + 1 && y <= 3) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(axis));
      continue;
    }
    if (isWindowBay && storey2 && (y === 7 || y === 8)) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(axis));
      continue;
    }
    // Window head and sill courses.
    if (isWindowBay && (y === 6 || y === 9 || y === gr + 1 && storey1)) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // Warm light behind some upper-floor windows.
  if (!corner && along % 2 === 1 && (x + z) % 3 === 0 && has(ix, iz)) {
    put(ix, 7, iz, "glowstone");
  }

  // 4. Parapet and roof edge.
  put(x, ROOF, z, "smooth_stone"); // cornice band on the roof edge
  put(x, PARAPET, z, corner ? "stone_bricks" : "white_concrete");
}

// 5. Front door: dark oak, two blocks high, in the chosen bay.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = groundAt(dx, dz);
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr, dz, "dark_oak_door", doorProps("lower"));
  put(dx, gr + 1, dz, "dark_oak_door", doorProps("upper"));
  // Lantern over the entrance, just inside the canopy line.
  put(dx, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 6. Rooftop plant: a few air-conditioning housings on the interior of the roof.
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z).length === 0 && x % 4 === 2 && z % 6 === 3) {
    put(x, PARAPET, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
