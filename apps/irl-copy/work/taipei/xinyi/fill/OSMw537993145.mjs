import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 22 x 16, roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed commercial block (cream tile and quartz
// walls, granite base, red-terracotta storey band, glazed shopfront below and
// framed windows above, parapet and rooftop AC plant), typical of a 1980s-90s
// Taipei shophouse-office in Xinyi. Storeys are 5 blocks tall; roof deck at y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993145";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ROOF_Y = 11;     // roof deck (top of building), absolute
const FLOOR_Y = 6;     // upper floor slab / storey band, absolute
const PARAPET_Y = 12;  // parapet course on the perimeter

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OUT = { north: "north", south: "south", west: "west", east: "east" };

function exposed(x, z) {
  return Object.keys(DIRS).filter(d => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });
}

// Global origin of the footprint for bay alignment
let minX = Infinity, minZ = Infinity;
for (const [x, z] of cells) {
  if (x < minX) minX = x;
  if (z < minZ) minZ = z;
}

// Door: one entrance, centred on the south face (or north if no south face)
const faceAlong = { north: [], south: [] };
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.includes("south")) faceAlong.south.push(x - minX);
  if (ex.includes("north")) faceAlong.north.push(x - minX);
}
let doorFace = faceAlong.south.length ? "south" : "north";
let doorCell = null;
if (faceAlong[doorFace].length) {
  const lo = Math.min(...faceAlong[doorFace]);
  const hi = Math.max(...faceAlong[doorFace]);
  doorCell = { face: doorFace, along: Math.round((lo + hi) / 2) };
}

function isDoorCell(x, z, ex) {
  if (!doorCell) return false;
  if (!ex.includes(doorCell.face)) return false;
  return (x - minX) === doorCell.along && ex.length === 1;
}

function interior(x, z, G) {
  // ground floor slab, upper floor slab, roof deck
  g.set(x, G, z, "smooth_stone");
  if (FLOOR_Y > G) g.set(x, FLOOR_Y, z, "smooth_stone");
  g.set(x, ROOF_Y, z, "light_gray_concrete");
  // rooftop AC plant on a few cells
  if ((x * 7 + z * 3) % 11 === 0) {
    g.set(x, PARAPET_Y, z, "iron_block");
    g.set(x, PARAPET_Y + 1, z, "iron_block");
  }
}

function facade(x, z, G, ex) {
  const corner = ex.length >= 2;
  const face = ex[0];
  const along = (face === "north" || face === "south") ? (x - minX) : (z - minZ);
  const pier = corner || along % 3 === 0;
  const door = isDoorCell(x, z, ex);

  // inward neighbour for interior warm lights
  const inward = face ? [-DIRS[face][0], -DIRS[face][1]] : null;
  const inX = inward ? x + inward[0] : null;
  const inZ = inward ? z + inward[1] : null;
  const inwardInterior = inward && has(inX, inZ) && exposed(inX, inZ).length === 0;

  // base course on the ground row
  g.set(x, G, z, "polished_granite");

  // ground storey: G+1 .. 5
  for (let y = G + 1; y <= 5; y++) {
    if (door && y <= G + 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: OUT[doorCell.face],
        half: y === G + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (pier) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (y === G + 1) {
      g.set(x, y, z, "smooth_stone");                       // sill
    } else if (y === 5) {
      if (along % 3 === 1 && !corner) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "gray_concrete");                     // head frame
      }
    } else {
      g.set(x, y, z, "glass");                               // shopfront glazing
      if (inwardInterior && along % 6 === 4 && y === G + 3) {
        g.set(inX, y, inZ, "glowstone");                     // warm light behind glass
      }
    }
  }

  // storey band at the floor line
  if (FLOOR_Y >= G + 1) g.set(x, FLOOR_Y, z, "red_terracotta");

  // upper storey: 7 .. 10
  for (let y = FLOOR_Y + 1; y <= ROOF_Y - 1; y++) {
    if (y < G + 1) continue;
    if (pier) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (y === FLOOR_Y + 1 || y === ROOF_Y - 1) {
      g.set(x, y, z, "gray_concrete");                       // frame top / sill
    } else {
      g.set(x, y, z, "glass");
      if (inwardInterior && along % 6 === 1 && y === 8) {
        g.set(inX, y, inZ, "glowstone");
      }
    }
  }

  // cornice and parapet
  if (ROOF_Y >= G + 1) g.set(x, ROOF_Y, z, "smooth_stone");
  g.set(x, PARAPET_Y, z, corner ? "quartz_pillar" : "smooth_quartz", corner ? { axis: "y" } : undefined);

  // foundation below the ground row
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
}

for (const [x, z] of cells) {
  const G = ground.get(key(x, z));
  const ex = exposed(x, z);
  if (ex.length === 0) {
    for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
    interior(x, z, G);
  } else {
    facade(x, z, G, ex);
  }
}

g.save(`${DIR}/${ID}.nbt`);
