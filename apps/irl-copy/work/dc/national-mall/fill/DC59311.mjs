// DC59311: 375 E St SW, a 1970s Commercial-Office-Large. Seven storeys of 2-block floors on a 17-block body, with a
// 19-block core (the lidar's tall middle) rising two more. Buff-pale precast piers, light-grey spandrels, blue-glass
// ribbon windows recessed one block into the skin, a stone base, a cornice on every roofline, a lobby with doors and a
// lintel canopy on the longest face, and a few glowstone-lit windows. Interior is solid massing; no rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC59311.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const N = 27, YMAX = 31;

// ---- footprint, ground and roof -------------------------------------------------------------------------------------
const ground = Array.from({ length: N }, () => Array(N).fill(-1));
const lidar = Array.from({ length: N }, () => Array(N).fill(-1));
for (const [x, z, g, r] of cells) { ground[z][x] = g; lidar[z][x] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < N && z < N && lidar[z][x] >= 0;

// Lidar noise: 18s are the body; 19s become the core only where most of their 3x3 neighbourhood is 19 (no stray spikes).
// Roofs under 5 are a low annex on the corner, kept as is.
const top = Array.from({ length: N }, () => Array(N).fill(-1));
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!inFP(x, z)) continue;
  const r = lidar[z][x];
  if (r <= 4) { top[z][x] = 2; continue; }
  let tall = 0, tot = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFP(x + dx, z + dz) || lidar[z + dz][x + dx] <= 4) continue;
    tot++; if (lidar[z + dz][x + dx] >= 19) tall++;
  }
  top[z][x] = tall / tot >= 0.5 ? 19 : 17;
}

const solid = (x, y, z) => inFP(x, z) && y < top[z][x];

// ---- palette --------------------------------------------------------------------------------------------------------
const BASE = "stone_bricks", PIER = "smooth_quartz", SPANDREL = "light_gray_concrete", CORE = "light_gray_concrete";
const CORNICE = "smooth_quartz", ROOF = "gray_concrete", GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone";
const DOOR = "iron_door";

// The grid of what gets placed: "x,y,z" -> { block, state }.
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Outward normals of a solid cell at height y: the sides that open onto air.
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// Window rows: ground (y1), then every even row up from 4 in the body; the core (above 16) uses its odd rows.
const isWindowRow = (y) => (y >= 17 ? y % 2 === 1 : y === 1 || (y >= 4 && y % 2 === 0));

// Entrance: the face with the most ground-floor exposure; the middle of it, a door with a pilaster on each side.
const faceCount = {};
const faceCells = {};
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!solid(x, 1, z) || top[z][x] < 10) continue;
  const o = outward(x, 1, z);
  if (o.length !== 1) continue;
  const key = o[0].join(",");
  faceCount[key] = (faceCount[key] || 0) + 1;
  (faceCells[key] ??= []).push([x, z]);
}
const entranceKey = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const [edx] = entranceKey.split(",").map(Number);
const alongOf = ([x, z]) => (edx !== 0 ? z : x);   // the coordinate that runs along the face
const entranceCells = faceCells[entranceKey].sort((a, b) => alongOf(a) - alongOf(b));
const [ex, ez] = entranceCells[Math.floor(entranceCells.length / 2)];
const entranceSet = new Set();
for (const s of [-1, 0, 1]) entranceSet.add(edx !== 0 ? `${ex},${ez + s}` : `${ex + s},${ez}`);
const entranceCentre = `${ex},${ez}`;
const doorFacing = FACE[entranceKey];

// ---- massing and articulation ---------------------------------------------------------------------------------------
const recessed = [];   // [x, y, z, inwardX, inwardZ] for windows: the air gap behind each pane
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!inFP(x, z)) continue;
  const T = top[z][x];
  for (let y = 0; y < T; y++) {
    const o = outward(x, y, z);
    if (y < ground[z][x]) { put(x, y, z, BASE); continue; }   // foundation to the lowest ground (none here: 0)
    if (y === T - 1) {                                        // the top course: cornice on the edge, roof inside
      put(x, y, z, o.length ? CORNICE : ROOF);
      continue;
    }
    if (o.length === 0) { put(x, y, z, CORE); continue; }     // solid interior
    if (o.length >= 2 || y === 0) { put(x, y, z, o.length >= 2 ? PIER : BASE); continue; }
    const [dx, dz] = o[0];
    const along = dx !== 0 ? z : x;
    if (!isWindowRow(y)) { put(x, y, z, SPANDREL); continue; }
    if (y === 1 && entranceSet.has(`${x},${z}`) && o[0].join(",") === entranceKey) {
      if (`${x},${z}` === entranceCentre) {
        put(x, 1, z, DOOR, { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, 2, z, DOOR, { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, 1, z, GLASS); put(x, 2, z, PIER);
      }
      continue;
    }
    if (along % 3 === 0) { put(x, y, z, PIER); continue; }    // a pier every third bay
    put(x, y, z, GLASS);
    recessed.push([x, y, z, x - dx, z - dz, along]);
  }
}

// Canopy: a lintel over the entrance bay, sitting on the door and the pilasters.
for (const k of entranceSet) {
  const [x, z] = k.split(",").map(Number);
  put(x, 3, z, PIER);
}

// Recess each window one block: the air gap behind the pane, lit now and then.
for (const [x, y, z, ix, iz, along] of recessed) {
  if (!solid(ix, y, iz)) continue;
  const k = `${ix},${y},${iz}`;
  if (entranceSet.has(`${x},${z}`)) continue;
  B.delete(k);
  if ((along + y) % 9 === 0) put(ix, y, iz, LIGHT);
}

// Rooftop plant: two 3 x 3 boxes on the body roof, screens of pale concrete with a cap.
const roofBoxes = [];
for (let z = 1; z < N - 1 && roofBoxes.length < 2; z++) for (let x = 1; x < N - 1 && roofBoxes.length < 2; x++) {
  let ok = true;
  for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++)
    if (!inFP(x + dx, z + dz) || top[z + dz][x + dx] !== 17) ok = false;
  if (!ok) continue;
  if (roofBoxes.some(([bx, bz]) => Math.abs(bx - x) < 6 && Math.abs(bz - z) < 6)) continue;
  roofBoxes.push([x, z]);
}
for (const [cx, cz] of roofBoxes) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const edge = Math.abs(dx) + Math.abs(dz) > 0;
    put(cx + dx, 17, cz + dz, edge ? SPANDREL : CORE);
    put(cx + dx, 18, cz + dz, edge ? SPANDREL : CORNICE);
  }
}

// Glass panes connect to their neighbours (panes and solid blocks), so the ribbons read as continuous bands.
const connects = (k) => {
  const e = B.get(k);
  return e && (e.block === GLASS || (e.block !== DOOR && e.block !== LIGHT));
};
for (const [k, e] of B) {
  if (e.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  e.state = {
    north: String(connects(`${x},${y},${z - 1}`)),
    south: String(connects(`${x},${y},${z + 1}`)),
    east: String(connects(`${x + 1},${y},${z}`)),
    west: String(connects(`${x - 1},${y},${z}`)),
  };
}

// ---- write ----------------------------------------------------------------------------------------------------------
const g = new Voxels([N, YMAX, N]);
for (const [k, e] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, e.block, e.state);
}
g.save(`${dir}/DC59311.nbt`);
