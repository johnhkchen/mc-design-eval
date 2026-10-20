import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/residential block, c. 1980s:
// white-tiled concrete frame, pale quartz pillars, tinted glass ribbon windows,
// shopfront ground floor with a central entrance, cornice and parapet,
// rooftop water tanks (a Taipei staple), warm glowstone behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw589862421";
const W = 17, H = 34, D = 68;

const ROOF = 22;        // roof slab top, ~22 blocks above lowest ground
const PARAPET = 23;     // parapet course on the perimeter
const SLAB_LEVELS = [5, 10, 15, 20];
const SLABS = new Set([...SLAB_LEVELS, ROOF]);

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint lookup: "x,z" -> ground (clamped so the building keeps its storeys)
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), 18));
}
const key2 = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const has = (x, z) => G.has(key2(x, z));
const groundOf = (x, z) => G.get(key2(x, z));

// outward faces: a cell is on the perimeter where a neighbour is missing
const FACES = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const outFaces = (x, z) => FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));

function storeyBase(y) {
  for (const s of [20, 15, 10, 5]) if (y >= s) return s;
  return 0;
}

// entrance: middle of the west (street) frontage
const wZ = cells
  .filter(([x, z]) => !has(x - 1, z))
  .map(([, z]) => z)
  .sort((a, b) => a - b);
const ENTR_Z = wZ.length ? wZ[Math.floor(wZ.length / 2)] : -1;

// warm lights: interior cell behind selected upper-floor windows
const LIGHTS = new Set();
for (const [k, g] of G) {
  const [x, z] = k.split(",").map(Number);
  const f = outFaces(x, z);
  if (!f.length) continue;
  const [face, dx, dz] = f[0];
  const along = face === "W" || face === "E" ? z : x;
  for (const sb of [5, 10, 15]) {
    const y = sb + 2;
    const idx = sb / 5;
    if (along % 8 === 3 && idx % 2 === 1 && y >= g && y < ROOF) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) LIGHTS.add(key3(ix, y, iz));
    }
  }
}

function blockFor(x, y, z, g) {
  const faces = outFaces(x, z);
  const perim = faces.length > 0;

  if (y < g) return "stone_bricks";
  if (y === ROOF) return perim ? "smooth_quartz" : "light_gray_concrete";
  if (y === PARAPET) return perim ? "smooth_quartz" : null;
  if (SLABS.has(y)) return "light_gray_concrete";

  if (!perim) {
    return LIGHTS.has(key3(x, y, z)) ? "glowstone" : null;
  }

  const [face] = faces[0];
  const isEW = face === "W" || face === "E";
  const along = isEW ? z : x;
  const pane = isEW
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  const sb = storeyBase(y);
  const rel = y - sb;

  if (y === g) return "stone_bricks"; // plinth course

  if (sb === 0) {
    // ground floor: shopfront with central entrance
    if (face === "W" && z === ENTR_Z && (y === g + 1 || y === g + 2)) {
      return {
        id: "dark_oak_door",
        props: {
          facing: "east",
          half: y === g + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      };
    }
    if (face === "W" && z === ENTR_Z && y === g + 3) return "smooth_quartz";
    if (along % 4 === 0) return "smooth_quartz";
    return "gray_stained_glass";
  }

  // upper storeys: pillars run full height; ribbon windows between spandrels
  if (along % 4 === 0) return "smooth_quartz";
  const isWindow = rel === 2 || rel === 3 || (sb === 20 && rel === 1);
  if (isWindow) return { id: "gray_stained_glass_pane", props: pane };
  return "white_concrete";
}

const out = new Voxels([W, H, D]);

function put(x, y, z, v) {
  if (v == null) return;
  if (typeof v === "string") out.set(x, y, z, v);
  else out.set(x, y, z, v.id, v.props);
}

// main volume: foundation up to each cell's ground, then the building column
for (const [k, g] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (let y = g; y <= PARAPET; y++) put(x, y, z, blockFor(x, y, z, g));
}

// rooftop water tanks on interior roof cells (2x2 each), standing on the roof slab
const TANK_SPOTS = [[4, 8], [11, 56], [4, 56]];
for (const [tx, tz] of TANK_SPOTS) {
  let ok = true;
  for (let dx = 0; dx < 2; dx++)
    for (let dz = 0; dz < 2; dz++) {
      const x = tx + dx, z = tz + dz;
      if (!has(x, z) || outFaces(x, z).length || groundOf(x, z) >= ROOF) ok = false;
    }
  if (!ok) continue;
  for (let dx = 0; dx < 2; dx++)
    for (let dz = 0; dz < 2; dz++)
      for (let y = PARAPET; y <= PARAPET + 2; y++) {
        out.set(tx + dx, y, tz + dz, y === PARAPET + 2 ? "smooth_stone" : "light_gray_concrete");
      }
}

out.save(`${DIR}/${ID}.nbt`);
