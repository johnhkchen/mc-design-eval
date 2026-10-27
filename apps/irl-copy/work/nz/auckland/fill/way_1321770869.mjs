// Way 1321770869: a 1960s–70s concrete-frame office block on a basalt plinth, nine storeys (36 blocks), with
// ribbon glazing in white-framed bays, a shopfront on the ground storey, lit windows, and rooftop plant.
// Massing follows the lidar roof, snapped to storey tiers (4 blocks) and mode-smoothed over 3x3 neighbours.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770869.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770869.nbt";

const W = 56, H = 50, D = 44;
const WALL = "light_gray_concrete", FRAME = "white_concrete", GLASS = "light_blue_stained_glass";
const PLINTH = "polished_andesite", FOUNDATION = "stone", CORNICE = "smooth_stone", ROOF = "gray_concrete";
const LIT = "shroomlight";
const STOREY = 4;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(key(x, z), { g, r });

// Lidar roof -> storey tiers (multiples of 4, at least 2 storeys), then the most common tier among the 3x3 neighbourhood.
const snap = (r) => Math.max(2 * STOREY, Math.min(9 * STOREY, Math.round(r / STOREY) * STOREY));
const groundStorey = (g) => (Math.floor(g / STOREY) + 1) * STOREY;   // first storey line above the ground
const cell = new Map();
for (const [k, { g }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const counts = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(x + dx, z + dz)); if (!n) continue;
    const t = snap(n.r); counts.set(t, (counts.get(t) || 0) + 1);
  }
  let best = 0, bc = -1;
  for (const [t, c] of counts) if (c > bc || (c === bc && t > best)) { best = t; bc = c; }
  cell.set(k, { g, top: Math.max(best, groundStorey(g)) });
}

const topAt = (x, z) => cell.get(key(x, z))?.top ?? -1;   // -1 outside the footprint: no mass
const solidAt = (x, z, y) => y < topAt(x, z);            // foundation counts as solid for the neighbours
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !solidAt(x + dx, z + dz, y));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);

// Entrance: the exposed ground-storey wall cell on the south-east side nearest the middle of the block.
let door = null;
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const out = exposed(x, z, c.g).filter(([n]) => n === "S" || n === "E");
  if (!out.length) continue;
  const d = Math.abs(x - 36) + Math.abs(z - 30);
  if (!door || d < door.d) door = { x, z, d, face: out[0][0] };
}

for (const [k, { g: ground, top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const gf = groundStorey(ground);
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, FOUNDATION); continue; }
    const ex = exposed(x, z, y);
    if (y === top - 1) { g.set(x, y, z, ex.length ? CORNICE : ROOF); continue; }
    if (!ex.length) {                                   // interior: air gap, one floor slab per storey
      if (y === ground || (y % STOREY === 0 && y > 0)) g.set(x, y, z, WALL);
      continue;
    }
    // exposed wall: bays follow the face (x along north/south faces, z along east/west)
    const face = ex.find(([n]) => n === "N" || n === "S") ?? ex[0];
    const along = face[0] === "N" || face[0] === "S" ? x : z;
    if (y < gf) {                                       // shopfront
      if (door && x === door.x && z === door.z && y <= ground + 1) {
        if (y === ground) g.set(x, y, z, "iron_door", { facing: door.face === "S" ? "south" : "east", half: "lower", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "iron_door", { facing: door.face === "S" ? "south" : "east", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === ground) g.set(x, y, z, PLINTH);
      else if (y === gf - 1) g.set(x, y, z, PLINTH);
      else if (along % 3 === 0) g.set(x, y, z, FRAME);
      else g.set(x, y, z, GLASS);
      continue;
    }
    const band = y % STOREY;                            // 0 storey line, 1-2 glazing, 3 spandrel
    if (band === 0) g.set(x, y, z, FRAME);
    else if (band === 3) g.set(x, y, z, WALL);
    else if (along % 3 === 0) g.set(x, y, z, FRAME);
    else if (hash(x, y, z) % 100 < 5) g.set(x, y, z, LIT);
    else g.set(x, y, z, GLASS);
  }
}

// Rooftop plant on the 36-block tier: a plant house with a cap, and a lift overrun standing on its cap.
const onRoof = (x, z) => topAt(x, z) === 9 * STOREY;
const box = (x0, x1, z0, z1, y0, y1, cap, wallBlock) => {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (!onRoof(x, z)) continue;
    for (let y = y0; y <= y1; y++) {
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      if (y === y1) g.set(x, y, z, cap);
      else if (ring) g.set(x, y, z, y === y0 ? FRAME : wallBlock);
    }
  }
};
box(20, 33, 16, 25, 36, 39, CORNICE, WALL);
box(24, 29, 19, 22, 40, 43, CORNICE, WALL);

const count = g.count();
const { blocks, palette } = g.save(OUT);
console.log(`way_1321770869: ${count} cells, ${blocks} blocks, ${palette} palette entries`);
