import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298921";
const W = 14, H = 23, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Bounds-checked setter; props optional
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions: N = -z (street-facing front), S = +z, W = -x, E = +x
const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const exposedDirs = (x, z) =>
  Object.entries(DIRS).filter(([, d]) => !has(x + d.dx, z + d.dz)).map(([k]) => k);

// Front face = northmost (min z) row; entrance at middle of that row
const zmin = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === zmin).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];

// 1. Foundation: solid from y0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Storeys: floor slabs, walls, shopfronts, windows, roof
for (const [x, z, gr] of cells) {
  const exp = exposedDirs(x, z);
  const corner = exp.length >= 2;

  // Floor slabs (ground, 2nd floor, roof deck)
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  if (exp.length === 0) {
    // Interior: roof equipment (AC units) on the roof deck
    if ((x * 3 + z) % 7 === 0) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // Perimeter: base course, shopfront, storey lines, upper windows, parapet
  put(x, gr + 1, z, "stone_bricks");
  put(x, gr + 4, z, "white_concrete");   // ground-floor lintel / canopy band
  put(x, gr + 6, z, "white_concrete");   // upper sill band
  put(x, gr + 9, z, "light_gray_concrete"); // upper lintel band
  put(x, gr + 11, z, "smooth_stone");    // parapet cap

  for (const k of exp) {
    const d = DIRS[k];
    const idx = (k === "N" || k === "S") ? x : z;
    const isFront = k === "N";
    const isEntranceCol = isFront && x === entranceX && z === zmin;

    // Ground floor shopfront (glass bays on odd indices, piers on even)
    if (!corner) {
      const shopGlass = idx % 2 === 1;
      if (isEntranceCol) {
        put(x, gr + 2, z, "oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 1, z, "oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gr + 3, z, "glass");
      } else {
        put(x, gr + 2, z, shopGlass ? "glass" : "white_concrete");
        put(x, gr + 3, z, shopGlass ? "glass" : "white_concrete");
      }
    } else {
      put(x, gr + 2, z, "white_concrete");
      put(x, gr + 3, z, "white_concrete");
    }

    // Upper storey (2nd floor): windows with frames, piers between
    if (!corner) {
      const win = idx % 2 === 1;
      put(x, gr + 7, z, win ? "glass_pane" : "white_concrete");
      put(x, gr + 8, z, win ? "glass_pane" : "white_concrete");

      // Warm light behind some upper windows (glowstone in the air gap)
      if (win && idx % 4 === 1) {
        const ix = x - d.dx, iz = z - d.dz;
        if (has(ix, iz)) put(ix, gAt(ix, iz) + 7, iz, "glowstone");
      }
    } else {
      put(x, gr + 7, z, "white_concrete");
      put(x, gr + 8, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
