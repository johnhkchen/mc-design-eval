import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833534.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833534.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 22, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground (rounded)
const G = new Map();
for (const [x, z, gr] of cells) {
  const key = `${x},${z}`;
  if (!G.has(key)) G.set(key, Math.round(gr));
}
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward faces: N = -z, S = +z, W = -x, E = +x
const FACES = {
  N: { dx: 0, dz: -1, axis: "x" },
  S: { dx: 0, dz: 1, axis: "x" },
  W: { dx: -1, dz: 0, axis: "z" },
  E: { dx: 1, dz: 0, axis: "z" },
};

// Pane connection props for a window on a given face
function pane(face) {
  const ew = FACES[face].axis === "x";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
}

// Pass 1: foundations, floor slabs, roof slab, interior base
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const edge = Object.values(FACES).some(f => !has(x + f.dx, z + f.dz));

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / base course
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  // Storey slab at gr+5 (floor of second storey)
  put(x, gr + 5, z, "smooth_stone");
  // Roof slab at gr+10
  put(x, gr + 10, z, "smooth_stone");
}

// Pass 2: perimeter walls, shopfront, upper windows, cornice, parapet
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  for (const [face, f] of Object.entries(FACES)) {
    if (has(x + f.dx, z + f.dz)) continue; // not an exterior face

    const idx = f.axis === "x" ? x : z;
    const paneProps = pane(face);
    const isMainSouth = face === "S" && idx === Math.round(W / 2);
    const isDoorCol = isMainSouth || (face === "S" && idx === Math.round(W / 2) - 1 && false);

    // Wall at this cell (the perimeter voxel itself)
    const wx = x, wz = z;

    // Base course: stone bricks at gr+1 band start handled by shopfront
    // Ground floor (gr+1..gr+4)
    if (isDoorCol) {
      // Entrance: door at gr+1 (lower) and gr+2 (upper), transom glass above
      put(wx, gr + 1, wz, "dark_oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(wx, gr + 2, wz, "dark_oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(wx, gr + 3, wz, "glass_pane", paneProps);
      put(wx, gr + 4, wz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else {
      const pier = idx % 4 === 0 || idx === 0 || idx === (f.axis === "x" ? W - 1 : D - 1);
      for (let y = gr + 1; y <= gr + 3; y++) {
        if (pier) put(wx, y, wz, "white_concrete");
        else put(wx, y, wz, "glass_pane", paneProps);
      }
      // Lintel band
      put(wx, gr + 4, wz, pier ? "white_concrete" : "stone_bricks");
    }

    // Upper storey (gr+6..gr+9)
    const upperPier = idx % 3 === 0 || idx === 0 || idx === (f.axis === "x" ? W - 1 : D - 1);
    put(wx, gr + 6, wz, "light_gray_concrete"); // sill spandrel
    for (let y = gr + 7; y <= gr + 8; y++) {
      if (upperPier) put(wx, y, wz, "white_concrete");
      else put(wx, y, wz, "glass_pane", paneProps);
    }
    put(wx, gr + 9, wz, "light_gray_concrete"); // head spandrel

    // Storey band at gr+5 on the exterior
    put(wx, gr + 5, wz, "smooth_stone");

    // Cornice / parapet
    put(wx, gr + 10, wz, "smooth_stone");
    put(wx, gr + 11, wz, "stone_brick_wall");

    // Warm light behind some upper windows (glowstone in the air gap)
    if (!upperPier && idx % 6 === 2) {
      const ix = wx - f.dx;
      const iz = wz - f.dz;
      if (has(ix, iz) && groundAt(ix, iz) !== undefined) {
        put(ix, gr + 7, iz, "glowstone");
      }
    }
  }
}

// Pass 3: roof equipment (interior cells on the roof slab)
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const edge = Object.values(FACES).some(f => !has(x + f.dx, z + f.dz));
  if (edge) continue;
  // Two plant boxes with a small stair-stepped screen
  if (x % 6 >= 2 && x % 6 <= 3 && z % 8 >= 3 && z % 8 <= 4) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
  if (x % 6 >= 2 && x % 6 <= 3 && z % 8 === 6) {
    put(x, gr + 11, z, "iron_bars");
  }
}

// Interior: keep air behind glass; no furniture. Floor slabs already placed.

g.save(OUT);
