import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Two-storey 1970s reinforced-concrete commercial block:
// white wall tiles, light-grey storey bands, shopfront glazing on the street
// (west) side, aluminium-framed windows above, smooth quartz parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343689";
const W = 28, H = 23, D = 80;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(`${x},${z}`, gr);
const has = (x, z) => cellG.has(`${x},${z}`);
const groundOf = (x, z) => cellG.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));

// Absolute storey lines, measured from the lowest ground (rel = y - minG).
const BASE = minG;          // base course
const SLAB1 = minG + 5;     // first-floor slab / storey band
const ROOFSLAB = minG + 9;  // roof deck / cornice band
const PARAPET = minG + 10;  // top course: roof is 11 blocks above lowest ground

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p === undefined) g.set(x, y, z, id);
  else g.set(x, y, z, id, p);
};

// Outward faces of a footprint cell (a neighbour missing = exterior).
const faces = (x, z) => {
  const o = [];
  if (!has(x, z - 1)) o.push("N");
  if (!has(x, z + 1)) o.push("S");
  if (!has(x - 1, z)) o.push("W");
  if (!has(x + 1, z)) o.push("E");
  return o;
};
const FACE_ORDER = ["W", "E", "N", "S"];
const primaryFace = (outs) => FACE_ORDER.find((f) => outs.includes(f));

// Index along the facade (position of the bay).
const faceIdx = (face, x, z) => (face === "W" || face === "E" ? z : x);

// Inward neighbour (opposite the outward face).
const inward = (face, x, z) => {
  if (face === "W") return [x + 1, z];
  if (face === "E") return [x - 1, z];
  if (face === "N") return [x, z + 1];
  return [x, z - 1];
};

// Street entrance on the west (Xinyi-side) face, at the median bay.
const westCells = cells.filter(([x, z]) => faces(x, z).includes("W")).map(([x, z]) => [x, z]);
const doorFace = westCells.length ? "W" : "N";
const doorPool = cells
  .filter(([x, z]) => primaryFace(faces(x, z)) === doorFace)
  .map(([x, z]) => [x, z])
  .sort((a, b) => faceIdx(doorFace, a[0], a[1]) - faceIdx(doorFace, b[0], b[1]));
const doorCell = doorPool[Math.floor(doorPool.length / 2)];

const doorFacing = { W: "west", E: "east", N: "north", S: "south" };
const hashWarm = (x, z, rel) => (x * 73 + z * 151 + rel * 37) % 7 === 0;

// Pass 1: foundations and interior floor slabs for every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");
  for (const y of [SLAB1, ROOFSLAB]) if (y >= gr) put(x, y, z, "light_gray_concrete");
}

// Pass 2: rooftop plant. A central lift/stair core and small AC units.
for (const [x, z, gr] of cells) {
  if (PARAPET < gr) continue;
  if (x >= 12 && x <= 15 && z >= 34 && z <= 40) {
    put(x, PARAPET, z, "white_concrete");
  } else if (x % 4 === 1 && z % 6 === 2 && faces(x, z).length === 0) {
    put(x, PARAPET, z, "gray_concrete");
  }
}

// Pass 3: facades, body from each cell's ground up to the parapet.
for (const [x, z, gr] of cells) {
  const outs = faces(x, z);
  if (!outs.length) continue;
  const face = primaryFace(outs);
  const idx = faceIdx(face, x, z);
  const m = ((idx % 4) + 4) % 4;
  const alongZ = face === "W" || face === "E";
  const isDoorCell = face === doorFace && doorCell && x === doorCell[0] && z === doorCell[1];

  // Connection props so glass runs continuously across each pair of panes.
  let paneP;
  if (m === 1) paneP = alongZ
    ? { north: "false", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "false", waterlogged: "false" };
  else paneP = alongZ
    ? { north: "true", south: "false", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "false", west: "true", waterlogged: "false" };

  const isGlassBay = m === 1 || m === 2;

  for (let y = Math.max(gr, BASE); y <= PARAPET; y++) {
    const rel = y - minG;
    if (y === PARAPET) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === SLAB1 || y === ROOFSLAB) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === BASE) { put(x, y, z, "stone_bricks"); continue; }

    if (rel <= 4) {
      // Ground floor: shopfront.
      if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; }
      if (isDoorCell && (rel === 1 || rel === 2)) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing[face], half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoorCell && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (!isGlassBay) { put(x, y, z, "gray_concrete"); continue; }
      put(x, y, z, "glass_pane", paneP);
      if (hashWarm(x, z, rel)) {
        const [ix, iz] = inward(face, x, z);
        if (has(ix, iz) && faces(ix, iz).length === 0 && y >= (cellG.get(`${ix},${iz}`) ?? 0)) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else if (rel >= 6 && rel <= 8) {
      // Upper storey: aluminium-framed windows between white wall piers.
      if (isGlassBay) {
        put(x, y, z, "glass_pane", paneP);
        if (rel === 7 && hashWarm(x, z, rel)) {
          const [ix, iz] = inward(face, x, z);
          if (has(ix, iz) && faces(ix, iz).length === 0) put(ix, y, iz, "shroomlight");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
