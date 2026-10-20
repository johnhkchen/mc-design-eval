import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690441";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> foundation height (ground), clamped so the building keeps its storey logic.
const gmap = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  gmap.set(`${x},${z}`, Math.max(0, Math.min(7, Math.round(gr))));
}

const inside = (x, z) => gmap.has(`${x},${z}`);
const NB = [
  [1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"],
];

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function missingDirs(x, z) {
  return NB.filter(([dx, dz]) => !inside(x + dx, z + dz));
}

// Pass 1: foundation, floors, facade, roof for every footprint cell.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const missing = missingDirs(x, z);
  const per = missing.length > 0;

  // Foundation: solid from y 0 up to the ground under this cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!per) {
    // Interior: floor slabs per storey and roof deck only; air gaps between.
    put(x, gr, z, "smooth_stone");
    put(x, 5, z, "smooth_stone");
    put(x, 10, z, "smooth_stone");
    put(x, 11, z, "light_gray_concrete");

    // Roof equipment: small plant housings on a regular grid.
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "light_gray_concrete");
      put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Facade orientation: a wall running along x has a missing north/south neighbour.
  const alongX = missing.some(([, dz]) => dz !== 0);
  const along = alongX ? x : z;
  const corner = missing.length > 1;
  const pier = corner || along % 3 === 0;
  const paneProps = alongX
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y === 5 || y === 10) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // storey lines
    } else if (y === 11) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // cornice
    } else if ((y > gr && y <= 4) || (y >= 6 && y <= 9)) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Parapet on the roof edge.
  put(x, 12, z, "white_concrete");
}

// Pass 2: entrance on the z-minimum face, nearest the middle of the frontage.
{
  const frontier = [];
  for (const [key, gr] of gmap) {
    const [x, z] = key.split(",").map(Number);
    if (!inside(x, z - 1)) frontier.push([x, z, gr]);
  }
  if (frontier.length) {
    const xs = frontier.map(c => c[0]).sort((a, b) => a - b);
    const mid = xs[Math.floor(xs.length / 2)];
    frontier.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
    const [dx, dz, gr] = frontier[0];
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    put(dx, gr + 1, dz, "oak_door", doorProps("lower"));
    put(dx, gr + 2, dz, "oak_door", doorProps("upper"));
    // Lintel over the door.
    put(dx, gr + 3, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 3: warm lights behind glass in selected windows (air gap cell just inside the facade).
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const missing = missingDirs(x, z);
  if (!missing.length || missing.length > 1) continue;
  const [ox, oz] = [missing[0][0], missing[0][1]];
  const alongX = oz !== 0;
  const along = alongX ? x : z;
  if (along % 3 === 0) continue; // piers, not windows
  const ix = x - ox, iz = z - oz;
  if (!inside(ix, iz)) continue;
  // Only light cells that are truly interior (not on the facade).
  if (missingDirs(ix, iz).length) continue;

  if (along % 7 === 2) put(ix, 7, iz, "glowstone");
  if (gr + 2 <= 4 && along % 7 === 5) put(ix, gr + 2, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
