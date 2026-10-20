import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119869";
const W = 10, H = 23, D = 18;

// Storey plan (absolute heights above the lowest ground):
// foundation to ground, base course at each cell's ground,
// ground-floor shopfront up to y=4, storey line y=5, upper windows y=6..8,
// spandrel y=9, cornice slab y=10, parapet y=11. Roof equipment sits above.
const LINE = 5, SPAN = 9, CORN = 10, PARA = 11, SHOP_TOP = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
let minG = Infinity;
for (const c of cells) minG = Math.min(minG, c[2]);

const fp = new Map();
for (const [x, z, gy] of cells) {
  fp.set(key(x, z), Math.max(0, Math.min(LINE + 4, gy - minG)));
}
const has = (x, z) => fp.has(key(x, z));

// Exterior faces of a footprint cell: cells whose neighbour is outside the footprint.
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Glass pane connection state: connect along the face's in-plane axis.
const paneProps = (alongX) => ({
  north: "false",
  south: "false",
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  waterlogged: "false",
});

const cellList = [...fp.keys()].map((k) => k.split(",").map(Number));

// Interior cells: foundation, floor slabs, roof slab.
function doInterior(x, z, gr) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");
  if (gr < LINE) g.set(x, LINE, z, "smooth_stone");
  g.set(x, CORN, z, "smooth_stone");
}

// Wall cells: facade, shopfront, windows, cornice and parapet.
function doWall(x, z, gr, f) {
  const corner = f.length >= 2;
  const primary = f[0];
  const alongX = primary === "N" || primary === "S";
  const idx = alongX ? x : z;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= SPAN; y++) {
    if (y === gr) {
      g.set(x, y, z, "polished_granite");
    } else if (corner) {
      g.set(x, y, z, "white_terracotta");
    } else if (y === LINE) {
      g.set(x, y, z, "polished_andesite");
    } else if (y === SPAN) {
      g.set(x, y, z, "white_terracotta");
    } else if (y <= SHOP_TOP) {
      // Ground-floor shopfront. Door is written after the loop.
      if (idx % 3 === 0) {
        g.set(x, y, z, "dark_oak_planks");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
        // Warm light behind some shop glass.
        if (y === gr + 2 && idx % 6 === 4) {
          const [dx, dz] = inward[primary];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && faces(ix, iz).length === 0) {
            g.set(ix, y, iz, "glowstone");
          }
        }
      }
    } else {
      // Upper storey, y = 6..8.
      if (idx % 3 === 0) {
        g.set(x, y, z, "polished_andesite");
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", paneProps(alongX));
        // Warm light behind some upper windows.
        if (y === 7 && idx % 6 === 1) {
          const [dx, dz] = inward[primary];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && faces(ix, iz).length === 0) {
            g.set(ix, y, iz, "shroomlight");
          }
        }
      }
    }
  }

  // Cornice slab and parapet on the perimeter.
  g.set(x, CORN, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, PARA, z, "white_terracotta");
}

const wallCells = [];
for (const [x, z] of cellList) {
  const gr = fp.get(key(x, z));
  const f = faces(x, z);
  if (f.length === 0) {
    doInterior(x, z, gr);
  } else {
    wallCells.push({ x, z, gr, f });
    doWall(x, z, gr, f);
  }
}

// Entrance: centre of the north (front) face, if its ground floor has room for a door.
const northCells = wallCells
  .filter((c) => c.f.includes("N") && c.f.length === 1)
  .sort((a, b) => a.x - b.x);
if (northCells.length > 0) {
  const e = northCells[Math.floor(northCells.length / 2)];
  if (e.gr + 2 <= SHOP_TOP) {
    g.set(e.x, e.gr + 1, e.z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(e.x, e.gr + 2, e.z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Canopy-style lintel line above the door, inside the shopfront band.
    if (e.gr + 3 <= SHOP_TOP) {
      g.set(e.x, e.gr + 3, e.z, "dark_oak_planks");
    }
  }
}

// Roof equipment: a light-grey condenser block on the roof slab, inside the parapet.
for (const [x, z] of cellList) {
  if (faces(x, z).length !== 0) continue;
  if (x >= 3 && x <= 4 && z >= 6 && z <= 7) {
    g.set(x, PARA, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
