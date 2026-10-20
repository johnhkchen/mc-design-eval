import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 25 x 73 footprint, roof ~21 blocks above lowest ground (lidar).
// Reading: a 1980s-90s Xinyi mid-rise: 4 storeys of white tiled concrete, aluminium-framed
// window bands with vertical piers, a glazed shopfront at street level, flat roof with a
// parapet, a steel water tank and a stair/lift overrun.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109975";
const W = 25, H = 33, D = 73;

const ROOF_Y = 21;      // parapet top
const DECK_Y = 20;      // roof slab
const BODY_TOP = 19;    // top of the 4th storey wall
const STOREY = 5;

const FOUND = "stone_bricks";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const DECKM = "gray_concrete";
const GLASS_PANE = "light_blue_stained_glass_pane";
const SHOP_GLASS = "glass";
const FRAME = "dark_oak_planks";
const TANK = "light_gray_concrete";
const TANK_CAP = "iron_block";
const LIFT = "white_concrete";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? [])).map((c) =>
  Array.isArray(c) ? [c[0], c[1], c[2] ?? 0] : [c.x, c.z, c.ground ?? c.g ?? 0]
);

const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, g] of list) {
  gm.set(key(x, z), Math.max(0, Math.min(BODY_TOP, Math.round(g))));
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of list) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const DIRS = [
  [-1, 0, "west"],
  [1, 0, "east"],
  [0, -1, "north"],
  [0, 1, "south"],
];

function outward(x, z) {
  const r = [];
  for (const [dx, dz, f] of DIRS) if (!gm.has(key(x + dx, z + dz))) r.push({ dx, dz, f });
  return r;
}

function paneProps(facing) {
  const alongZ = facing === "east" || facing === "west";
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
}

const g = new Voxels([W, H, D]);

// Entrance: centre of the west (-x) street face.
const westCells = list.filter(([x, z]) => outward(x, z).some((o) => o.f === "west"));
const entZ = westCells.length
  ? westCells.map(([, z]) => z).sort((a, b) => a - b)[Math.floor(westCells.length / 2)]
  : null;

// Pass 1: foundations, interior storey slabs, roof deck.
for (const [x, z] of list) {
  const gc = gm.get(key(x, z));
  for (let y = 0; y < gc; y++) g.set(x, y, z, FOUND);
  for (let y = STOREY; y <= BODY_TOP; y += STOREY) {
    if (y >= gc) g.set(x, y, z, BAND);
  }
  g.set(x, DECK_Y, z, DECKM);
}

// Pass 2: facades, corners, parapet.
for (const [x, z] of list) {
  const gc = gm.get(key(x, z));
  const ds = outward(x, z);
  if (ds.length === 0) continue;

  const corner = ds.length >= 2;
  const face = ds[0];
  const alongX = face.f === "north" || face.f === "south";
  const u = alongX ? x : z;
  const uMin = alongX ? minX : minZ;
  const isPier = ((u - uMin) % 3 + 3) % 3 === 0;

  // Parapet on the perimeter.
  g.set(x, ROOF_Y, z, WALL);

  for (let y = gc; y <= BODY_TOP; y++) {
    const rel = y % STOREY;
    let block = WALL;
    let props;

    if (corner) {
      block = rel === 0 ? BAND : WALL;
    } else if (y < STOREY) {
      // Ground storey: shopfront, piers and entrance.
      if (entZ !== null && face.f === "west" && Math.abs(z - entZ) <= 1) {
        const d = z - entZ;
        if (y === 1 || y === 2) {
          block = d === 0 ? SHOP_GLASS : FRAME;
        } else if (y === 3) {
          block = d === 0 ? "lantern" : FRAME;
          if (d === 0) props = { hanging: "true", waterlogged: "false" };
        } else {
          block = BAND;
        }
      } else if (y === 4) {
        block = BAND;
      } else if (isPier) {
        block = WALL;
      } else {
        block = SHOP_GLASS;
      }
    } else {
      // Upper storeys: band, window row, lintel.
      if (rel === 0) block = BAND;
      else if (rel === 4) block = WALL;
      else if (isPier) block = WALL;
      else {
        block = GLASS_PANE;
        props = paneProps(face.f);
      }
    }

    g.set(x, y, z, block, props);

    // Warm light behind some upper-storey windows, sitting in the air gap.
    if (!corner && y >= STOREY && rel === 2 && !isPier && ((x * 7 + z * 13 + y * 3) % 11 === 0)) {
      const ix = x - face.dx, iz = z - face.dz;
      const gi = gm.get(key(ix, iz));
      if (gi !== undefined && y >= gi) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Roof equipment: water tank and stair/lift overrun on the deck.
function interiorFootprint(cx, cz, r) {
  for (let dx = -r; dx <= r; dx++)
    for (let dz = -r; dz <= r; dz++)
      if (!gm.has(key(cx + dx, cz + dz))) return false;
  // keep one cell clear of the perimeter
  for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
    if (outward(cx + dx, cz + dz).length) return false;
  }
  return true;
}

function findSpot(r, preferZ) {
  let best = null, bestD = Infinity;
  for (let cx = minX + r; cx <= maxX - r; cx++) {
    for (let cz = minZ + r; cz <= maxZ - r; cz++) {
      if (!interiorFootprint(cx, cz, r)) continue;
      const d = Math.abs(cz - preferZ) + Math.abs(cx - (minX + maxX) / 2) * 0.5;
      if (d < bestD) { bestD = d; best = [cx, cz]; }
    }
  }
  return best;
}

// Water tank (3x3), set toward the back of the roof.
const tankSpot = findSpot(1, minZ + Math.round((maxZ - minZ) * 0.3));
if (tankSpot) {
  const [tx, tz] = tankSpot;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let y = ROOF_Y; y <= ROOF_Y + 2; y++) g.set(tx + dx, y, tz + dz, TANK);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) g.set(tx + dx, ROOF_Y + 3, tz + dz, TANK_CAP);
}

// Stair/lift overrun (2x2), set toward the front of the roof.
const liftSpot = findSpot(0, minZ + Math.round((maxZ - minZ) * 0.8));
if (liftSpot) {
  const [lx, lz] = liftSpot;
  for (let dx = 0; dx <= 1; dx++)
    for (let dz = 0; dz <= 1; dz++) {
      for (let y = ROOF_Y; y <= ROOF_Y + 2; y++) g.set(lx + dx, y, lz + dz, LIFT);
      g.set(lx + dx, ROOF_Y + 3, lz + dz, DECKM);
    }
}

g.save(`${DIR}/${ID}.nbt`);
