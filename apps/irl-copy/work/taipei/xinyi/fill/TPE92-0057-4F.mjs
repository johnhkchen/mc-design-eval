import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0057-4F: Xinyi mixed-use office/retail block, c.2003.
// Four 5-block storeys over a granite base, quartz storey lines and cornice,
// white-concrete piers with transoms, tinted glass bays, a glazed lobby with
// a canopy on the main (south) face, pier caps above the parapet for rhythm,
// and a mechanical penthouse on the roof. Roof at ground + 21.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0057-4F";
const W = 175, H = 33, D = 72;

const ROOF = 20;      // roof deck / cornice level (relative to cell ground)
const PARAPET = 21;   // parapet top (relative)
const PIER_CAP = 22;  // pier caps stand one block above the parapet
const PENT_TOP = 25;  // penthouse roof (relative), only if it fits the volume

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(([, , g]) => g));

const gmap = new Map();
for (const [x, z, g] of raw) gmap.set(`${x},${z}`, Math.round(g - minG));
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const S = (x, y, z, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

// Exterior: any 4-neighbour outside the footprint.
const isExterior = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Facade assignment: north/south first (long faces), index runs along the face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", idx: x, inward: [0, 1] };
  if (!has(x, z + 1)) return { face: "S", idx: x, inward: [0, -1] };
  if (!has(x - 1, z)) return { face: "W", idx: z, inward: [1, 0] };
  return { face: "E", idx: z, inward: [-1, 0] };
}

const isPier = (idx) => idx % 4 === 0;
// Main lobby: centred on the south face, wider than a window bay.
const isLobby = (face, idx) => face === "S" && idx >= 80 && idx <= 94;
// Lobby edges read as heavier piers flanking the doors.
const isLobbyEdge = (face, idx) => face === "S" && (idx === 79 || idx === 95);

// Block for an exterior ring cell at height offset dy above its ground.
// Returns null where nothing should be placed.
function facadeBlock(face, idx, dy) {
  if (dy === 0) return "polished_granite";                         // base course

  if (dy <= 3) {                                                    // shopfront / lobby doors
    if (isLobby(face, idx)) return "light_blue_stained_glass";
    if (isLobbyEdge(face, idx) || isPier(idx)) return "white_concrete";
    return "light_blue_stained_glass";
  }
  if (dy === 4) {                                                   // shopfront head / canopy
    if (isLobby(face, idx)) return "gray_concrete";
    return isPier(idx) ? "white_concrete" : "smooth_quartz";
  }
  if (dy === 5 || dy === 10 || dy === 15) return "smooth_quartz";   // storey lines
  if (dy === ROOF) return "smooth_quartz";                          // cornice

  if (dy === PARAPET) return "white_concrete";                      // parapet
  if (dy === PIER_CAP) return isPier(idx) ? "white_concrete" : null; // pier caps only

  // Transoms: a spandrel band in the middle of each upper storey.
  if (dy === 8 || dy === 13 || dy === 18) return "light_gray_concrete";

  // Upper window bays: piers and glass.
  return isPier(idx) ? "white_concrete" : "light_blue_stained_glass";
}

// 1. Foundations and superstructure, cell by cell.
for (const key of gmap.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = groundOf(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (isExterior(x, z)) {
    const { face, idx, inward } = faceOf(x, z);
    for (let dy = 0; dy <= PIER_CAP; dy++) {
      const y = gr + dy;
      if (y >= H) break;
      const id = facadeBlock(face, idx, dy);
      if (id) S(x, y, z, id);

      // warm light: glowstone in the air gap just inside a window
      const inX = x + inward[0], inZ = z + inward[1];
      const isWindowBay = dy >= 6 && dy <= 19 && dy !== 8 && dy !== 13 && dy !== 18
        && dy !== 10 && dy !== 15 && !isPier(idx);
      if (isWindowBay && dy % 5 === 2 && idx % 12 === 6 && has(inX, inZ)) {
        S(inX, y, inZ, "glowstone");
      }
    }
  } else {
    // interior: floor slabs per storey and the roof deck, air between
    for (const dy of [0, 5, 10, 15, ROOF]) {
      if (gr + dy < H) S(x, gr + dy, z, "light_gray_concrete");
    }
  }
}

// 2. Mechanical penthouse, central and set back from the parapet.
const PX0 = 62, PX1 = 112, PZ0 = 26, PZ1 = 45;
for (let z = PZ0; z <= PZ1; z++) {
  for (let x = PX0; x <= PX1; x++) {
    if (!has(x, z) || isExterior(x, z)) continue;
    const gr = groundOf(x, z);
    if (gr + PENT_TOP >= H) continue; // does not fit this volume
    const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (wall) {
      for (let dy = PARAPET; dy < PENT_TOP; dy++) {
        const band = dy === 22 || dy === 23;
        const glassy = band && !(x === PX0 || x === PX1) && (x + z) % 3 !== 0;
        S(x, gr + dy, z, glassy ? "light_blue_stained_glass" : "white_concrete");
      }
    }
    S(x, gr + PENT_TOP, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
