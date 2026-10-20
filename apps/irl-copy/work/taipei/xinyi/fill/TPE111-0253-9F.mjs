import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE111-0253-9F: 2022 mid-rise office/retail block, Xinyi district.
// Four storeys of 5 blocks, white precast frame with light-blue glass curtain wall,
// stone plinth at grade, glass shopfront, a canopied entrance on the north face,
// notched top-storey corners, and a central plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0253-9F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 33, D = 17;
const grid = new Voxels([W, H, D]);

const ROOF_Y = 20;      // roof slab level
const PARAPET_Y = 21;   // top of parapet
const PENT_TOP = 23;    // top of plant penthouse
const SETBACK_Y = 16;   // corners above this are notched back (top storey)

// footprint lookup: "x,z" -> ground height
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

// Which sides of a cell face outside the footprint
function faces(x, z) {
  return {
    n: !has(x, z - 1), // north face (outward is -z)
    s: !has(x, z + 1), // south face (outward is +z)
    w: !has(x - 1, z), // west face
    e: !has(x + 1, z), // east face
  };
}
const isEdge = (x, z) => { const f = faces(x, z); return f.n || f.s || f.w || f.e; };
const isCorner = (x, z) => { const f = faces(x, z); return (f.n || f.s) && (f.w || f.e); };

// Penthouse rectangle (inset from the footprint bounds)
const inPent = (x, z) =>
  x >= minX + 6 && x <= maxX - 6 && z >= minZ + 4 && z <= maxZ - 4;

const WHITE = "white_concrete";
const GLASS_UP = "light_blue_stained_glass";
const GLASS_GF = "glass";
const SLAB = "light_gray_concrete";
const PLINTH = "stone_bricks";

// Entrance cells: the three north-face cells centred on midX
const isEntranceZone = (x, z) => faces(x, z).n && Math.abs(x - midX) <= 1;

// Pass 1: foundations under every footprint cell, y 0 up to its ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) grid.set(x, y, z, PLINTH);
}

// Pass 2: perimeter cells carry the facade
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = isCorner(x, z);
  const onNS = f.n || f.s;
  const t = onNS ? x - minX : z - minZ;          // position along the facade
  const mullion = corner || t % 3 === 0 || (onNS ? x === maxX : z === maxZ);
  const isDoorCell = f.n && x === midX;          // main entrance on the north face
  const inwardDx = f.w ? 1 : f.e ? -1 : 0;
  const inwardDz = f.n ? 1 : f.s ? -1 : 0;

  for (let y = gr; y <= PARAPET_Y; y++) {
    // Top-storey corner notches: leave the corner open above the storey below
    if (corner && y >= SETBACK_Y) continue;

    // Parapet and roof edge
    if (y >= ROOF_Y) {
      grid.set(x, y, z, WHITE);
      continue;
    }

    // Ground-floor plinth row (stone), except at the entrance
    if (y === gr && y < 5 && !isEntranceZone(x, z)) {
      grid.set(x, y, z, PLINTH);
      continue;
    }

    // Storey belt courses every 5 blocks
    if (y % 5 === 0) {
      grid.set(x, y, z, WHITE);
      continue;
    }

    // Pillars at corners and mullions
    if (mullion) {
      grid.set(x, y, z, WHITE);
      continue;
    }

    // Entrance: door at grade, lintel and canopy above it
    if (isEntranceZone(x, z) && y < 5) {
      if (isDoorCell && (y === gr || y === gr + 1)) {
        grid.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === gr + 2) {
        grid.set(x, y, z, WHITE);
        continue;
      }
      if (y === gr + 3) {
        grid.set(x, y, z, SLAB); // canopy over the entrance
        continue;
      }
    }

    // Glazing: shopfront at grade, curtain wall above
    const isGround = y < 5;
    grid.set(x, y, z, isGround ? GLASS_GF : GLASS_UP);

    // Warm light behind some upper-storey windows (inside the air gap)
    if (!isGround && y % 5 === 3) {
      const storey = Math.floor(y / 5);
      if ((x + z + storey) % 5 === 0) {
        const ix = x + inwardDx, iz = z + inwardDz;
        if (has(ix, iz) && !isEdge(ix, iz)) {
          grid.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Pass 3: interior cells are open air with floor slabs at each storey line
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === gr || y % 5 === 0) grid.set(x, y, z, SLAB);
  }
}

// Pass 4: central plant penthouse on the roof
for (const [x, z] of cells) {
  if (!inPent(x, z) || isEdge(x, z)) continue;
  const rimCell = !inPent(x - 1, z) || !inPent(x + 1, z) || !inPent(x, z - 1) || !inPent(x, z + 1);
  for (let y = PARAPET_Y; y <= PENT_TOP; y++) {
    if (y === PENT_TOP) {
      grid.set(x, y, z, "smooth_stone");
    } else if (rimCell && y <= PARAPET_Y + 1) {
      grid.set(x, y, z, GLASS_UP);
    } else {
      grid.set(x, y, z, SLAB);
    }
  }
}

grid.save(`${DIR}/${ID}.nbt`);
