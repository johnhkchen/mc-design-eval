import { readFileSync, existsSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295625";
const W = 41, D = 33, H = 23;
const ROOF = 10;          // roof deck top at y=10, parapet at y=11 (lidar roof ~11)
const FLOOR2 = 5;         // storey line between the two storeys
const TOP_WALL = 9;       // last wall course below the roof deck

// ---- footprint ----------------------------------------------------------
const cellsPath = `${DIR}/${ID}.cells.json`;
let raw = [];
if (existsSync(cellsPath)) {
  raw = JSON.parse(readFileSync(cellsPath, "utf8"));
} else {
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) raw.push([x, z, 0]);
}

const ground = new Map();
for (const [x, z, g] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP_WALL, Math.round(g ?? 0))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const cellList = [...ground.entries()].map(([k, g]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g };
});

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const { x, z } of cellList) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// outward directions of a footprint cell (sides with no neighbour)
function outwards(x, z) {
  const o = [];
  if (!has(x, z - 1)) o.push("north");
  if (!has(x, z + 1)) o.push("south");
  if (!has(x - 1, z)) o.push("west");
  if (!has(x + 1, z)) o.push("east");
  return o;
}
const DV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// ---- output -------------------------------------------------------------
const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// pick entrance: non-corner edge cell on the north-facing side nearest centre
const edgeNonCorner = cellList.filter(({ x, z }) => {
  const o = outwards(x, z);
  if (o.length === 0) return false;
  const ns = o.includes("north") || o.includes("south");
  const ew = o.includes("east") || o.includes("west");
  return !(ns && ew);
});
let doorCell = null;
{
  const north = edgeNonCorner.filter(c => outwards(c.x, c.z).includes("north"));
  const pool = north.length ? north : edgeNonCorner;
  if (pool.length) {
    pool.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
    doorCell = pool[0];
  }
}
const doorFacing = doorCell ? outwards(doorCell.x, doorCell.z)[0] : null;

for (const { x, z, g: gg } of cellList) {
  const outs = outwards(x, z);
  const edge = outs.length > 0;
  const ns = outs.includes("north") || outs.includes("south");
  const ew = outs.includes("east") || outs.includes("west");
  const corner = ns && ew;
  const primary = outs[0];

  // foundation below ground, then the ground slab (walking surface at gg)
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  put(x, gg, z, "smooth_stone");

  if (!edge) {
    // interior: floor slab at the storey line, air elsewhere
    if (FLOOR2 > gg) put(x, FLOOR2, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // roof rim and parapet on the edge
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "smooth_quartz");

  // along-wall index decides bays: piers every third cell
  const along = (primary === "north" || primary === "south") ? x : z;
  const pier = corner || (((along % 3) + 3) % 3 === 0);

  for (let y = gg + 1; y <= TOP_WALL; y++) {
    const isDoorCell = doorCell && doorCell.x === x && doorCell.z === z;

    // door, lower and upper half
    if (isDoorCell && (y === gg + 1 || y === gg + 2)) {
      const half = y === gg + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    // canopy band over the entrance and its wall neighbours
    if (doorCell && y === gg + 3 && primary === doorFacing &&
        Math.abs((ns ? x : z) - (ns ? doorCell.x : doorCell.z)) <= 1 &&
        outwards(x, z)[0] === doorFacing) {
      put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // ground-storey base course
    if (y === gg + 1 && y < FLOOR2) {
      put(x, y, z, "polished_granite");
      continue;
    }

    // storey belt courses
    if (y === FLOOR2 || y === TOP_WALL) {
      put(x, y, z, pier ? "quartz_pillar" : "smooth_quartz");
      continue;
    }

    const glassRow =
      (y >= gg + 2 && y <= Math.min(gg + 3, FLOOR2 - 1)) ||
      (y >= Math.max(FLOOR2 + 1, gg + 1) && y <= TOP_WALL - 1);

    if (glassRow && !pier && !isDoorCell) {
      const props = ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", props);

      // warm light just inside some windows
      const [dx, dz] = DV[OPP[primary]] ? DV[OPP[primary]] : [0, 0];
      const ix = x + DV[OPP[primary]][0], iz = z + DV[OPP[primary]][1];
      if (has(ix, iz) && ((x * 5 + z * 3 + y) % 4 === 0)) {
        put(ix, y, iz, y < FLOOR2 ? "glowstone" : "shroomlight");
      }
    } else if (pier) {
      put(x, y, z, glassRow ? "quartz_pillar" : "smooth_quartz");
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// ---- roof equipment: a centred penthouse on the roof deck -----------------
const pMinX = minX + 6, pMaxX = maxX - 6, pMinZ = minZ + 6, pMaxZ = maxZ - 6;
for (const { x, z } of cellList) {
  if (x < pMinX || x > pMaxX || z < pMinZ || z > pMaxZ) continue;
  const ring = x === pMinX || x === pMaxX || z === pMinZ || z === pMaxZ;
  for (const y of [ROOF + 1, ROOF + 2]) {
    if (ring) put(x, y, z, "white_concrete");
    else if (y === ROOF + 1 && (x + z) % 4 === 0) put(x, y, z, "iron_bars");
  }
  put(x, ROOF + 3, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
