import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE95-0551-14F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE95-0551-14F.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 80, H = 81, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const isIn = (x, z) => ground.has(`${x},${z}`);
// Perimeter = any footprint cell with a missing 4-neighbour
const isEdge = (x, z) => !(isIn(x - 1, z) && isIn(x + 1, z) && isIn(x, z - 1) && isIn(x, z + 1));

// Roof record: about 69 blocks above lowest ground; ~14 storeys of 5 blocks
const ROOF = 69;          // roof slab y
const PARAPET = ROOF + 1; // parapet course on perimeter
const STOREY = 5;

const zMin = Math.min(...cells.map(c => c[1]));
const zMax = Math.max(...cells.map(c => c[1]));
const xc = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const zc = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);

const set = (x, y, z, b) => { if (y >= 0 && y < H) g.set(x, y, z, b); };

// Pass 1: foundation, facade, interior floors, roof cap
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (edge) {
    const zFace = z === zMin || z === zMax;
    const dx = Math.abs(x - xc);
    const pilaster = x % 12 === 0;

    for (let y = gr; y < ROOF; y++) {
      const L = y - gr;
      const band = L % STOREY;
      let b;

      if (L === 0) {
        b = "stone_bricks";                                  // base course
      } else if (band === 0) {
        b = "light_gray_concrete";                           // storey line
      } else if (band === 4) {
        b = "white_concrete";                                // spandrel
      } else {
        // window zone: vertical pilasters every 12 blocks, mullions, glass
        if (pilaster) b = "light_gray_concrete";
        else b = (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
      }

      // Entrances on both long faces: quartz surround, open 5-wide doorway
      if (zFace) {
        if (dx <= 2 && L <= 2) continue;                     // doorway, air
        if (dx <= 2 && L === 3) b = "smooth_quartz";         // lintel
        if (dx === 3 && L <= 3) b = "smooth_quartz";         // jamb
      }

      set(x, y, z, b);
    }
    // Wall top and parapet ring
    set(x, ROOF - 1, z, "smooth_quartz");
    set(x, PARAPET, z, "smooth_quartz");
  } else {
    // Interior: floor slab at each storey line, otherwise air
    for (let y = gr; y < ROOF; y++) {
      const L = y - gr;
      if (L % STOREY === 0) set(x, y, z, "light_gray_concrete");
    }
  }

  // Roof slab over every footprint cell
  set(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: warm lights in interior cells just behind the glass
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  const nearEdge = isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);
  if (!nearEdge) continue;
  for (let y = gr; y < ROOF; y++) {
    const L = y - gr;
    if (L % STOREY !== 2 || L === 0) continue;
    const pick = (x * 7 + z * 3 + Math.floor(L / STOREY)) % 4;
    if (pick === 0) set(x, y, z, "glowstone");
    else if (pick === 2) set(x, y, z, "shroomlight");
  }
}

// Pass 3: roof crown - stepped quartz plinth, then mast with lightning rod
if (isIn(xc, zc)) {
  set(xc, ROOF + 1, zc, "smooth_quartz");
  set(xc, ROOF + 2, zc, "smooth_quartz");
  for (let y = ROOF + 3; y <= 78; y++) set(xc, y, zc, "light_gray_concrete");
  set(xc, 79, zc, "lightning_rod");
}

g.save(OUT);
