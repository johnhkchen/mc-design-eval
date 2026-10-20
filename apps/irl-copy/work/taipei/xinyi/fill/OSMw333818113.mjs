import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333818113";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 46;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Roof sits 11 blocks above the lowest ground under the footprint
const gmin = Math.min(...cells.map(c => c[2]));
const R = gmin + 11;

const OFF = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

function outward(x, z) {
  return Object.keys(OFF).filter(d => !has(x + OFF[d][0], z + OFF[d][1]));
}
const isPerim = (x, z) => outward(x, z).length > 0;
const alongIdx = (x, z, d) => (d === "N" || d === "S" ? x : z);

// Entrance: the outward face with the most single-facing perimeter cells
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (o.length === 1) faceCount[o[0]]++;
}
let doorDir = "S", best = -1;
for (const d of Object.keys(faceCount)) {
  if (faceCount[d] > best) { best = faceCount[d]; doorDir = d; }
}
const faceIdxs = cells
  .filter(([x, z]) => { const o = outward(x, z); return o.length === 1 && o[0] === doorDir; })
  .map(([x, z]) => alongIdx(x, z, doorDir))
  .sort((a, b) => a - b);
const doorIdx = faceIdxs.length ? faceIdxs[Math.floor(faceIdxs.length / 2)] : -1;

// Entrance bay: door cell plus the cells one step either side on the same face
const doorKey = new Set();   // door cell
const entryKey = new Set();  // whole entrance bay (door +/-1 along the face)
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (o.length !== 1 || o[0] !== doorDir) continue;
  const idx = alongIdx(x, z, doorDir);
  if (Math.abs(idx - doorIdx) <= 1) entryKey.add(`${x},${z}`);
  if (idx === doorIdx) doorKey.add(`${x},${z}`);
}

// Foundations, interior floor slabs and roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!isPerim(x, z)) {
    const F = gr + 5;
    if (F > gr && F < R) g.set(x, F, z, "smooth_stone");   // storey floor slab
    g.set(x, R, z, "gray_concrete");                        // roof deck
  }
}

// Perimeter facades
for (const [x, z, gr] of cells) {
  const dirs = outward(x, z);
  if (dirs.length === 0) continue;

  const F = gr + 5;
  const single = dirs.length === 1 ? dirs[0] : null;
  const idx = single ? alongIdx(x, z, single) : -1;
  const key = `${x},${z}`;
  const isDoor = doorKey.has(key);
  const inEntry = entryKey.has(key);

  // Corners and piers are solid; entrance bay is an opening
  const corner = !single;
  const m = idx >= 0 ? idx % 4 : 0;
  const pier = !inEntry && (corner || m === 0 || m === 3);

  // Inward neighbour, for lights behind the glass
  let ix = null, iz = null;
  if (single) {
    const [ox, oz] = OFF[OPP[single]];
    ix = x + ox; iz = z + oz;
  }
  const inwardOk = single && has(ix, iz) && !isPerim(ix, iz);

  for (let y = gr; y <= R + 1; y++) {
    let b = null;

    if (y === gr) {
      b = "stone_bricks";                                   // base course
    } else if (y >= R) {
      b = "light_gray_concrete";                            // roof edge and parapet
    } else if (y === R - 1) {
      b = "light_gray_concrete";                            // cornice band
    } else if (y === F) {
      b = "light_gray_concrete";                            // storey line
    } else if (y < F) {
      // Ground floor shopfront: dark stone piers, glass bays, dark fascia
      if (y === F - 1) {
        b = inEntry ? "dark_oak_planks" : "dark_oak_planks";  // fascia / entrance header
      } else if (pier) {
        b = "polished_andesite";
      } else {
        b = "glass";
      }
    } else {
      // Upper storey: white piers, framed window bays
      if (pier) b = "white_concrete";
      else if (y === F + 1 || y === R - 2) b = "light_gray_concrete";  // sill / head
      else b = "glass";
    }

    // Entrance: door, frame jambs and a lantern over the door
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: FACING[single],
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (inEntry && !isDoor && y >= gr + 1 && y <= gr + 2 && !pier) {
      // Entrance flanks: glass shopfront beside the door
      b = "glass";
    }

    if (b) g.set(x, y, z, b);

    // Warm light behind selected glass (air gap inside, lit block in the room)
    if (b === "glass" && inwardOk) {
      if (y === gr + 2 && idx % 3 === 0) {
        g.set(ix, y, iz, "shroomlight");
      } else if (y === F + 2 && (idx + y) % 5 === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Roof plant: a walled mechanical room with a capped roof near the middle
const plantCells = [];
for (let x = 12; x <= 20; x++) {
  for (let z = 16; z <= 24; z++) {
    if (has(x, z) && !isPerim(x, z)) plantCells.push([x, z]);
  }
}
const plantSet = new Set(plantCells.map(([x, z]) => `${x},${z}`));
for (const [x, z] of plantCells) {
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !plantSet.has(`${x + dx},${z + dz}`));
  if (edge) g.set(x, R + 1, z, "light_gray_concrete");   // walls
  g.set(x, R + 2, z, "iron_block");                       // cap
}

g.save(`${DIR}/${ID}.nbt`);
