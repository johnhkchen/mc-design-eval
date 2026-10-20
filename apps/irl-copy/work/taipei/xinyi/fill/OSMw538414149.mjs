import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414149";
const W = 27, H = 23, D = 19;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  const y = Math.round(gr);
  ground.set(`${x},${z}`, y);
  if (y < minG) minG = y;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inF = (x, z) => ground.has(`${x},${z}`);

// Low 2-storey commercial block: roof ~11 blocks above lowest ground.
const ROOF = minG + 11;   // roof level
const TOP = ROOF - 2;     // top of solid body (roof deck); parapet on TOP+1

// Facade faces: the outward neighbour is missing from the footprint.
const FACES = {
  N: { ox: 0, oz: -1, ix: 0, iz: 1,  facing: "north", bay: (x) => x, pane: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } },
  S: { ox: 0, oz: 1,  ix: 0, iz: -1, facing: "south", bay: (x) => x, pane: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } },
  W: { ox: -1, oz: 0, ix: 1, iz: 0,  facing: "west",  bay: (_, z) => z, pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
  E: { ox: 1, oz: 0,  ix: -1, iz: 0, facing: "east",  bay: (_, z) => z, pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
};

function faceOf(x, z) {
  for (const k of ["N", "S", "W", "E"]) {
    const f = FACES[k];
    if (!inF(x + f.ox, z + f.oz)) return k;
  }
  return null;
}

// Entrance: the north-facing facade cell nearest the footprint's centre line.
const cxMid = (minX + maxX) / 2;
let entrance = null, bestD = Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (faceOf(x, z) === "N") {
    const d = Math.abs(x - cxMid);
    if (d < bestD) { bestD = d; entrance = [x, z]; }
  }
}
if (!entrance) {
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (faceOf(x, z)) { entrance = [x, z]; break; }
  }
}

const g = new Voxels([W, H, D]);
const carves = []; // applied after the body fill so inward air isn't overwritten

// Storey pattern (relative to the cell's ground):
//  r0 base course, r1-3 ground-floor glazing, r4-5 storey line,
//  r6-8 upper glazing, r9 cornice (TOP), parapet at TOP+1.
function facade(x, z, gr, face) {
  const F = FACES[face];
  const bay = F.bay(x, z);
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z && face === "N";

  for (let y = gr; y <= TOP; y++) {
    const r = y - gr;
    if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === TOP) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (r === 4 || r === 5) { g.set(x, y, z, "smooth_quartz"); continue; }

    const glazedRow = (r >= 1 && r <= 3) || (r >= 6 && r <= 8);
    if (!glazedRow) { g.set(x, y, z, "white_concrete"); continue; }

    if (isEntrance && (r === 1 || r === 2)) {
      const props = { facing: F.facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      g.set(x, y, z, "dark_oak_door", props);
      carves.push([x + F.ix, y, z + F.iz, "air"]);
      continue;
    }
    if (isEntrance && r === 3) {
      g.set(x, y, z, "glass_pane", F.pane);
      carves.push([x + F.ix, y, z + F.iz, "air"]);
      continue;
    }

    if (bay % 3 === 0) {
      // Piers between bays
      g.set(x, y, z, "light_gray_concrete");
    } else {
      g.set(x, y, z, "glass_pane", F.pane);
      // Air gap behind the glass; warm glowstone in some upper windows
      if (r >= 6 && bay % 4 === 2) carves.push([x + F.ix, y, z + F.iz, "glowstone"]);
      else carves.push([x + F.ix, y, z + F.iz, "air"]);
    }
  }
  // Parapet on the facade
  if (TOP + 1 < H) g.set(x, TOP + 1, z, "smooth_quartz");
}

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  // Foundation up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone");
  if (gr > TOP) continue;

  // Solid body from ground to roof deck
  for (let y = gr; y <= TOP; y++) g.set(x, y, z, "white_concrete");

  const face = faceOf(x, z);
  if (face) facade(x, z, gr, face);
}

// Rooftop planter / garden on the roof deck, kept off the facade
const cxm = Math.round((minX + maxX) / 2);
const czm = Math.round((minZ + maxZ) / 2);
if (TOP + 1 < H) {
  for (const [x, z, grRaw] of cells) {
    const gr = Math.round(grRaw);
    if (gr > TOP || faceOf(x, z)) continue;
    const dx = Math.abs(x - cxm), dz = Math.abs(z - czm);
    if (dx <= 4 && dz <= 3) {
      const ring = dx === 4 || dz === 3;
      g.set(x, TOP + 1, z, ring ? "stone_bricks" : "moss_block");
    }
  }
}

// Apply the air gaps and glowing behind-glass cells
for (const [x, y, z, type] of carves) {
  if (!inF(x, z)) continue;
  if (y < 0 || y >= H) continue;
  g.set(x, y, z, type);
}

g.save(`${DIR}/${ID}.nbt`);
