import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 18 x 21 footprint, roof ~11 blocks above lowest ground.
// Reading: a 2-storey reinforced-concrete commercial block of the 1970s-80s
// (Xinyi was a low-rise district before the 2000s towers). Cream tiled
// concrete, quartz-grey string courses, a shopfront ground floor with a
// glass-and-pier rhythm, a flat roof with a parapet and a rooftop water tank
// (common on Taipei rooftops).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833618";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), gr);
}
let minG = Infinity;
for (const gr of ground.values()) minG = Math.min(minG, gr);
if (!Number.isFinite(minG)) throw new Error("empty footprint");

// Storey levels, relative to lowest ground (minG)
const L_FLOOR2 = minG + 5;   // second-floor deck / string course
const L_CORNICE = minG + 9;  // roof deck and cornice
const L_PARAPET = minG + 10; // parapet top: roof surface sits 11 above lowest ground
const L_LINTEL = minG + 4;   // ground-floor lintel
const L_SILL = minG + 6;     // upper-floor sill
const L_TANK_TOP = minG + 12;

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const inFp = (x, z) => ground.has(key(x, z));
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outsideCount = (x, z) => NEIGH.filter(([dx, dz]) => !inFp(x + dx, z + dz)).length;
const boundary = (x, z) => inFp(x, z) && outsideCount(x, z) > 0;

// Outward facing vector for a boundary cell (first open side, north first)
function outward(x, z) {
  const opts = [
    ["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0],
  ];
  for (const [f, ox, oz] of opts) {
    if (!inFp(x + ox, z + oz)) return { f, ox, oz };
  }
  return null;
}

// Entrance: on the north-facing boundary, nearest the middle of the width
const northCells = cells
  .filter(([x, z]) => inFp(x, z) && boundary(x, z) && outward(x, z)?.f === "north")
  .map(([x, z]) => [x, z]);
let doorCell = null;
if (northCells.length) {
  const xs = northCells.map(([x]) => x).sort((a, b) => a - b);
  const midX = xs[Math.floor(xs.length / 2)];
  doorCell = northCells.reduce((best, c) =>
    Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

const glassProps = (f) => {
  const ns = f === "north" || f === "south";
  return ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Pass 1: envelope, foundations, floors and decks
for (const [x, z, gr] of cells) {
  if (!inFp(x, z)) continue;
  const bnd = boundary(x, z);
  const out = bnd ? outward(x, z) : null;
  const corner = bnd && outsideCount(x, z) >= 2;
  const t = out && out.ox === 0 ? x : z; // bay coordinate along the wall
  const pillar = bnd && (corner || t % 3 === 0);

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Floor at ground level
  put(x, gr, z, bnd ? "polished_andesite" : "smooth_stone");

  if (!bnd) {
    // Interior: only floor decks, air between them (no interiors)
    if (L_FLOOR2 > gr) put(x, L_FLOOR2, z, "smooth_stone");
    if (L_CORNICE > gr) put(x, L_CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Boundary (facade) column
  for (let y = gr + 1; y <= L_PARAPET; y++) {
    if (y === L_PARAPET) {
      put(x, y, z, corner ? "smooth_quartz" : "white_concrete");
      continue;
    }
    if (y === L_CORNICE || y === L_FLOOR2) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y <= L_LINTEL) {
      // Ground storey: shopfront
      if (isDoor(x, z) && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: out.f,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (pillar) put(x, y, z, "white_concrete");
      else if (y === L_LINTEL) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", glassProps(out.f));
      continue;
    }
    // Upper storey (minG+6 .. minG+8)
    if (pillar) put(x, y, z, "white_concrete");
    else if (y === L_SILL) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "glass_pane", glassProps(out.f));
  }
}

// Pass 2: warm lights in the air gap behind some glass
for (const [x, z, gr] of cells) {
  if (!inFp(x, z) || !boundary(x, z)) continue;
  const out = outward(x, z);
  if (!out) continue;
  const t = out.ox === 0 ? x : z;
  const isPillar = outsideCount(x, z) >= 2 || t % 3 === 0;
  if (isPillar) continue;
  const ix = x - out.ox, iz = z - out.oz;
  if (!inFp(ix, iz) || boundary(ix, iz)) continue;

  // Upper-floor lights, some bays only
  if ((x + z) % 4 === 0) put(ix, minG + 7, iz, "shroomlight");
  // Ground-floor glow behind the shopfront glass
  if (gr + 2 <= L_LINTEL && (x + z) % 5 === 0 && !isDoor(x, z)) {
    put(ix, gr + 2, iz, "glowstone");
  }
}

// Lantern just inside the entrance
if (doorCell) {
  const out = outward(doorCell[0], doorCell[1]);
  const ix = doorCell[0] - out.ox, iz = doorCell[1] - out.oz;
  const gr = ground.get(key(doorCell[0], doorCell[1]));
  if (inFp(ix, iz) && !boundary(ix, iz)) {
    put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop water tank: a 3x3 block on the roof deck, fully interior
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let tankOk = L_TANK_TOP < H;
for (let dx = -1; dx <= 1 && tankOk; dx++) {
  for (let dz = -1; dz <= 1 && tankOk; dz++) {
    if (!inFp(cx + dx, cz + dz) || boundary(cx + dx, cz + dz)) tankOk = false;
  }
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      for (let y = L_PARAPET; y <= L_TANK_TOP - 1; y++) {
        put(x, y, z, "white_concrete");
      }
      put(x, L_TANK_TOP, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
