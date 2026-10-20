import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 35 x 54 footprint, roof ~69 blocks above lowest ground.
// Read as a 1980s-90s Taipei office/residential mid-rise: 13 storeys of 5 blocks,
// cream-tiled concrete piers, tinted glass bands, spandrels, a parapet, and a
// rooftop water tank with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145094";
const W = 35, H = 81, D = 54;

const ROOF = 65;   // roof deck layer (13 storeys of 5 blocks: 0..64)
const TOP = 68;    // parapet cap layer (roof top surface at 69)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Piers: corners always; on east/west faces every 3rd z; on north/south faces every 3rd x.
function isPillar(x, z) {
  const ex = !has(x - 1, z) || !has(x + 1, z);
  const ez = !has(x, z - 1) || !has(x, z + 1);
  if (ex && ez) return true;
  if (ex) return ((z % 3) + 3) % 3 === 0;
  if (ez) return ((x % 3) + 3) % 3 === 0;
  return false;
}

// Window band: storey local rows 1..3 (row 0 is the ledge, row 4 the spandrel).
const inWindowBand = (y) => y % 5 >= 1 && y % 5 <= 3 && y < ROOF;

function isPane(x, z, y) {
  if (!has(x, z) || !edge(x, z)) return false;
  if (gnd(x, z) > y) return false;
  return inWindowBand(y) && !isPillar(x, z);
}

// Entrance on the north (min z) face: two non-pier cells near the middle of that run.
const minZ = Math.min(...cells.map(c => c[1]));
const northRow = cells.filter(([, z]) => z === minZ)
  .map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
const northOpen = northRow.filter(([x, z]) => !isPillar(x, z));
let doorCells = [];
if (northOpen.length >= 2) {
  const mid = Math.floor(northOpen.length / 2) - 1;
  // Pick an adjacent pair of open cells around the middle of the face.
  for (let i = Math.max(0, mid); i < northOpen.length - 1; i++) {
    const [ax, az] = northOpen[i], [bx, bz] = northOpen[i + 1];
    if (bx === ax + 1 && bz === az) { doorCells = [northOpen[i], northOpen[i + 1]]; break; }
  }
}
if (doorCells.length === 0 && northOpen.length) {
  doorCells = [northOpen[Math.floor(northOpen.length / 2)]];
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Pass 1: foundation, base course, facade, interior floors, roof deck.
for (const [x, z] of cells) {
  const gg = gnd(x, z);
  // Foundation: solid from 0 up to the cell's ground.
  for (let y = 0; y < gg; y++) set(x, y, z, "gray_concrete");

  const e = edge(x, z);
  for (let y = gg; y < ROOF; y++) {
    if (!e) {
      // Interior: floor slab per storey, otherwise air.
      if (y === gg || y % 5 === 0) set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === gg) { set(x, y, z, "stone_bricks"); continue; }            // base course
    if (y < 5 && y % 5 === 4) { set(x, y, z, "stone_bricks"); continue; } // ground storey lintel band
    if (y % 5 === 0) { set(x, y, z, "smooth_quartz"); continue; }        // storey ledge
    if (y % 5 === 4) { set(x, y, z, "light_gray_concrete"); continue; }  // spandrel
    if (isPillar(x, z)) { set(x, y, z, "white_concrete"); continue; }    // tiled pier
    // Glass pane with connections to neighbouring panes.
    const c = (dx, dz) => (isPane(x + dx, z + dz, y) ? "true" : "false");
    set(x, y, z, "light_blue_stained_glass_pane", {
      north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false",
    });
  }

  // Roof deck at ROOF, parapet and cap on the edge.
  set(x, ROOF, z, "light_gray_concrete");
  if (e) {
    for (let y = ROOF + 1; y < TOP; y++) set(x, y, z, "white_concrete");
    set(x, TOP, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

// Pass 2: entrance on the north face: two doors, stone jambs either side, lintel and canopy band.
if (doorCells.length) {
  const dgs = doorCells.map(([x, z]) => gnd(x, z));
  const dg = Math.max(...dgs);
  for (const [x, z] of doorCells) {
    const base = gnd(x, z);
    // Clear the ground-storey glass so the doors read against the stone surround.
    for (let y = base + 1; y <= base + 3; y++) set(x, y, z, "air");
    set(x, base + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, base + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, base + 3, z, "light_gray_concrete");
  }
  // Jambs and lintel across the entrance width.
  const [fx, fz] = doorCells[0];
  const [lx, lz] = doorCells[doorCells.length - 1];
  for (let x = fx - 1; x <= lx + 1; x++) {
    const jamb = x < fx || x > lx;
    if (!has(x, fz)) continue;
    for (let y = dg + 1; y <= dg + 3; y++) {
      if (jamb) set(x, y, fz, "stone_bricks");
    }
    set(x, dg + 4, fz, "stone_bricks");
  }
}

// Pass 3: warm light behind some glass (inner cell is the air gap behind the pane).
for (const [x, z] of cells) {
  if (!has(x, z) || !edge(x, z)) continue;
  for (let y = gnd(x, z); y < ROOF; y++) {
    if (!isPane(x, z, y) || y % 5 !== 2) continue;
    if ((x * 7 + y * 3 + z) % 4 !== 0) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !edge(ix, iz) && gnd(ix, iz) <= y) {
        set(ix, y, iz, "glowstone");
        break;
      }
    }
  }
}

// Pass 4: rooftop water tank (3x3 interior) with cap, and a mast on top.
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  if (!has(cx + dx, cz + dz) || edge(cx + dx, cz + dz)) tankOk = false;
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = ROOF + 1; y <= ROOF + 6; y++) set(cx + dx, y, cz + dz, "white_concrete");
    set(cx + dx, ROOF + 7, cz + dz, "light_gray_concrete");
  }
  for (let y = ROOF + 8; y <= ROOF + 12; y++) {
    set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
