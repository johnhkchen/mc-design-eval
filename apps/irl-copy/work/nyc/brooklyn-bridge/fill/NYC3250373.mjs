import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 75 Poplar Street, Brooklyn Heights: 1910 Multi-Family Elevator Building.
// Red brick walls on a stone base, stone cornice and parapet, 3-block storeys,
// punched window bays, a stone-framed entrance on the north street face,
// warm lights behind some windows, and a flat roof with chimneys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3250373";
const W = 49, H = 31, D = 24;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of raw) {
  const ground = Math.max(0, Math.min(H - 8, Math.round(gr)));
  cellMap.set(key(x, z), { ground, roofRaw: Math.round(rf) });
}
const inF = (x, z) => cellMap.has(key(x, z));

// Smooth lidar roof heights over a 3x3 neighbourhood, then snap to ABSOLUTE
// 3-block tiers so that neighbouring cells share one flat roof level.
const cells = new Map();
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const o = cellMap.get(key(x + dx, z + dz));
      if (o) { sum += o.roofRaw; n++; }
    }
  const avg = sum / n;
  let roof = 3 * Math.round(avg / 3);
  roof = Math.max(c.ground + 6, Math.min(H - 4, roof));
  cells.set(k, { x, z, ground: c.ground, roof });
}

const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const exteriorFaces = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// Entrance: north street face (z minimum), nearest to the centre of the front.
let doorKey = null, bestDist = Infinity;
for (const c of cells.values()) {
  if (!exteriorFaces(c.x, c.z).some(([, dz]) => dz === -1)) continue;
  const d = Math.abs(c.x - Math.floor(W / 2));
  if (d < bestDist) { bestDist = d; doorKey = key(c.x, c.z); }
}
const [doorX, doorZ] = doorKey ? doorKey.split(",").map(Number) : [-99, -99];
const isDoorSurround = (x, z) =>
  z === doorZ && Math.abs(x - doorX) <= 1 && inF(x, z) &&
  exteriorFaces(x, z).some(([, dz]) => dz === -1);

// Pass 1: foundation, body, cornice, parapet, floors, roof deck, chimneys.
for (const c of cells.values()) {
  const { x, z, ground, roof } = c;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs per storey and a roof deck.
    for (let y = ground; y < roof; y++) {
      const rel = y - ground;
      if (y === roof - 1) g.set(x, y, z, "smooth_stone");
      else if (rel > 0 && rel % 3 === 0 && y < roof - 2) g.set(x, y, z, "smooth_stone");
    }
    // Chimneys on the roof deck.
    if (x % 12 === 6 && z % 6 === 3) {
      for (let y = roof; y < roof + 3 && y < H; y++) g.set(x, y, z, "bricks");
    }
    continue;
  }

  const [fdx] = faces[0];
  const isDoorCell = key(x, z) === doorKey;
  const onNorth = faces.some(([, dz]) => dz === -1);

  for (let y = ground; y < roof; y++) {
    const rel = y - ground;
    const w = rel % 3;

    // Cornice band and parapet.
    if (y === roof - 2) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === roof - 1) { g.set(x, y, z, "bricks"); continue; }

    // Stone base course at street level.
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    // Entrance: stone surround beside the door, stone lintel above it.
    if (onNorth && isDoorSurround(x, z) && !isDoorCell && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (onNorth && isDoorSurround(x, z) && rel === 3) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance door, two blocks high, centred on the stone surround.
    if (isDoorCell && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Spandrel belt course between storeys.
    if (w === 0) { g.set(x, y, z, "bricks"); continue; }

    // Window rows: piers on every third position along the facade.
    const t = fdx !== 0 ? z : x;
    if (t % 3 === 0) { g.set(x, y, z, "bricks"); continue; }

    const ew = fdx !== 0; // glass runs along z on east/west faces
    g.set(x, y, z, "glass_pane", ew
      ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" });
  }
}

// Pass 2: warm lights behind some windows (inside the footprint, one cell in).
for (const c of cells.values()) {
  const { x, z, ground, roof } = c;
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;
  const [fdx, fdz] = faces[0];
  const t = fdx !== 0 ? z : x;
  const ix = x - fdx, iz = z - fdz;
  if (!inF(ix, iz) || exteriorFaces(ix, iz).length > 0) continue;

  for (let y = ground; y < roof - 2; y++) {
    const rel = y - ground;
    const stor = Math.floor(rel / 3);
    const w = rel % 3;
    if (w !== 1 || stor === 0) continue;
    if (t % 3 !== 2) continue;
    if ((x * 7 + z * 3 + stor * 5) % 4 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
