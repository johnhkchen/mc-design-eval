// DC73736: Department of Housing and Urban Development, 451 7th St SW, DC 20410 (the Robert C. Weaver Federal Building,
// 1968, a modernist office block of pale precast concrete and tinted glass), as a 1.21.1 module. The footprint is a
// dense comb of wings around a core. Lidar roofs are median-smoothed (3x3) and snapped to two massing levels: the
// wings at 18 blocks (4 storeys) and the core at 22 (5 storeys), so the core steps up out of the wings. Every column is
// solid from y 0 up to its roof, so nothing floats. Facades are one cell deep: piers and spandrels in concrete, glass
// panes in the windows with a one-cell air niche behind each pane, and the rest of the mass is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73736.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73736.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell.
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Two massing levels: wings (4 storeys, 18) and core (5 storeys, 22). Storey lines every 4 blocks from y 2.
const top = (h) => (h <= 18 ? 18 : 22);

// Palette
const WALL = "white_concrete";          // pale precast panels and spandrels
const BAND = "light_gray_concrete";     // floor bands, cornice, base
const BASE = "stone_bricks";            // plinth below the ground floor
const SLAB = "smooth_stone";            // floor slabs and roof membrane
const PANE = "gray_stained_glass_pane"; // tinted glazing
const PIER = "polished_andesite";       // entrance piers
const LAMP = "glowstone";
const DOOR = "dark_oak_door";
const LANTERN = "lantern";
const PLANT = "gray_concrete";          // roof equipment

const FLOOR = 2;                        // y of the ground-floor floor band
const H = 26;
const shellDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isShell = (x, z) => shellDirs(x, z).length > 0;

// The block at each cell: null = air. Built here first so panes can look at their neighbours before the write.
const vox = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
// Niches are air unless a feature (a lamp, a lantern, a door) is put there on purpose; features win over the niche.
const air = new Set(), feature = new Set();
const put = (x, y, z, block, state, isFeature = false) => { vox.set(k3(x, y, z), { block, state }); if (isFeature) feature.add(k3(x, y, z)); };
const carve = (x, y, z) => air.add(k3(x, y, z));
const panes = [];

// Pass 1: the mass and the facade pattern. Bays are 3 cells on each face: piers where the index is a multiple of 3, glass otherwise.
for (const c of F.values()) {
  const T = top(smooth.get(key(c.x, c.z)));
  const out = shellDirs(c.x, c.z);
  const shell = out.length > 0;
  const face = out[0];
  const along = face && face[0] === 0 ? c.x : c.z;
  const corner = out.length > 1;
  for (let y = 0; y < T; y++) {
    if (y < FLOOR) { put(c.x, y, c.z, BASE); continue; }   // plinth down to the floor line (also under the one ground-0 cell)
    if (!shell) {
      put(c.x, y, c.z, (y - FLOOR) % 4 === 0 || y === T - 1 ? SLAB : WALL);
      continue;
    }
    if (y === T - 1) { put(c.x, y, c.z, BAND); continue; }   // cornice
    const rel = (y - FLOOR) % 4;
    if (rel === 0) { put(c.x, y, c.z, BAND); continue; }      // floor band
    if (rel === 3) { put(c.x, y, c.z, WALL); continue; }      // spandrel
    const pier = corner || along % 3 === 0;
    if (pier) { put(c.x, y, c.z, WALL); continue; }
    // A window: the pane in the facade and a one-cell air niche behind it, if the cell behind is part of the footprint.
    const [dx, dz] = face;
    if (!inF(c.x - dx, c.z - dz)) { put(c.x, y, c.z, WALL); continue; }
    put(c.x, y, c.z, PANE);
    panes.push([c.x, y, c.z]);
    carve(c.x - dx, y, c.z - dz);
  }
}

// Pass 2: the front. The face with the most shell cells gets the entrances, a door in the middle of its ground floor.
const count = { south: 0, north: 0, east: 0, west: 0 };
for (const c of F.values()) for (const [dx, dz, name] of shellDirs(c.x, c.z)) if (dx !== 0 || dz !== 0) count[name]++;
const frontName = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const [fdx, fdz] = DIRS.find((d) => d[2] === frontName);
const frontCells = [...F.values()].filter((c) => shellDirs(c.x, c.z).some((d) => d[2] === frontName) && (shellDirs(c.x, c.z).length === 1))
  .sort((a, b) => (fdx === 0 ? a.x - b.x : a.z - b.z));
const along = (c) => (fdx === 0 ? c.x : c.z);
const entrances = [];
for (const i of [1, 2]) entrances.push(frontCells[Math.floor((i * frontCells.length) / 3)]);
const facing = frontName;
for (const e of entrances) {
  const ix = e.x - fdx, iz = e.z - fdz;                       // the lobby cell behind the door
  // flanking piers either side of the door, on the same face
  for (const s of [-1, 1]) {
    const fx = fdx === 0 ? e.x + s : e.x, fz = fdx === 0 ? e.z : e.z + s;
    if (inF(fx, fz) && shellDirs(fx, fz).some((d) => d[2] === frontName)) {
      for (const y of [FLOOR + 1, FLOOR + 2, FLOOR + 3]) put(fx, y, fz, PIER);
    }
  }
  put(e.x, FLOOR + 1, e.z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" }, true);
  put(e.x, FLOOR + 2, e.z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" }, true);
  carve(ix, FLOOR + 1, iz);
  carve(ix, FLOOR + 2, iz);
  put(ix, FLOOR + 2, iz, LANTERN, { hanging: "true", waterlogged: "false" }, true);  // lantern under the lintel
  put(e.x, FLOOR + 3, e.z, BAND);                              // canopy band over the door
}

// Pass 3: warm lights in some windows (glowstone set back behind the pane), and roof equipment on the core.
for (const [x, y, z] of panes) {
  const face = shellDirs(x, z)[0];
  if (!face) continue;
  if ((x * 7 + z * 13 + y * 3) % 11 === 0) put(x - face[0], y, z - face[1], LAMP, undefined, true);
}
// One compact plant room on the core, set in from the parapets: a single block course on the roof membrane.
for (let x = 19; x <= 25; x++) for (let z = 29; z <= 35; z++) {
  if (!inF(x, z) || isShell(x, z) || top(smooth.get(key(x, z))) !== 22) continue;
  put(x, 22, z, PLANT);
}

// Pass 4: panes connect to any neighbour that is a block (piers, spandrels, other panes), not to air.
const solidAt = (x, y, z) => { const v = vox.get(k3(x, y, z)); return !!v; };
for (const [x, y, z] of panes) {
  const v = vox.get(k3(x, y, z));
  if (!v) continue;
  v.state = {
    north: String(solidAt(x, y, z - 1)),
    south: String(solidAt(x, y, z + 1)),
    east: String(solidAt(x + 1, y, z)),
    west: String(solidAt(x - 1, y, z)),
  };
}

// Write the volume.
const g = new Voxels([47, H, 75]);
let n = 0;
for (const [kk, v] of vox) {
  if (!v || (air.has(kk) && !feature.has(kk))) continue;
  const [x, y, z] = kk.split(",").map(Number);
  g.set(x, y, z, v.block, v.state); n++;
}
const r = g.save(OUT);
console.log(`DC73736: ${F.size} footprint cells, ${n} blocks placed, ${r.palette} palette entries, front ${frontName}, ${panes.length} panes`);
