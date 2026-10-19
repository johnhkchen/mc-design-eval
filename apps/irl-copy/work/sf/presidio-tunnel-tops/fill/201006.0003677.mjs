// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: the lidar roof sits about 3 blocks (6 m) above the lowest ground, so this is a single storey of
// about 2 blocks plus a 1-block parapet, not a stack of storeys. Era: 1930s stucco mixed-use (Spanish Colonial Revival):
// cream stucco walls on a stone plinth, a cornice course, a red-tile flat roof, a street front of dark wood shopfronts
// with glass and two door bays under red awnings, sash windows on the other faces, a corner HVAC pair and a small
// roof bulkhead. Warm light: glowstone behind some sash windows, shroomlight behind some shopfront glass.
// Storey lines: the 2-block storey is plinth (y 0) over glazing (y 1), the cornice course sits on y 2 with the roof.
// No interiors: each wall cell's inner neighbour is air behind the glass, with a floor slab at y 0 only.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0003677.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [21, 6, 21];
const PLINTH = 0;      // base course / bulkhead row (floor slab inside)
const GLAZE = 1;       // the one storey of windows and shopfront glass
const CORNICE = 2;     // cornice course on the walls, red-tile roof deck inside
const HVAC_Y = 3;      // roof equipment stands on the roof deck
const PIER_EVERY = 3;  // two glass bays, then a pier

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRS = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const STREET = new Set(["-1,0", "0,1"]);            // the long south-west edge faces the street
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// A shell cell's facade: the street edge wins at a corner; the along-coordinate runs with the wall.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const n = fs.find(([dx, dz]) => STREET.has(key(dx, dz))) ?? fs[0];
  const street = STREET.has(key(n[0], n[1]));
  const along = street ? x - z : (n[0] !== 0 ? z : x);
  return { n, street, along };
}

// Rhythm: per facade run (street as one run), index along the run; the pier falls every PIER_EVERY cells.
const runs = new Map();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const f = facadeOf(x, z);
  const k = f.street ? "street" : key(f.n[0], f.n[1]);
  if (!runs.has(k)) runs.set(k, []);
  runs.get(k).push({ x, z, ...f });
}
const index = new Map();   // "x,z" -> { idx, count }
for (const list of runs.values()) {
  list.sort((a, b) => a.along - b.along || a.x - b.x || a.z - b.z);
  list.forEach((c, i) => index.set(key(c.x, c.z), { idx: i, count: list.length }));
}

// Two doors on the street run, a quarter and three quarters along; the awning spans the door and one cell each side.
const streetRun = runs.get("street") ?? [];
const doorKeys = new Map();   // "x,z" -> awning flag
const doorIdx = [Math.floor(streetRun.length * 0.25), Math.floor(streetRun.length * 0.75)];
for (const i of doorIdx) {
  const c = streetRun[i];
  if (!c) continue;
  doorKeys.set(key(c.x, c.z), "door");
  for (const d of [-1, 1]) {
    const a = streetRun[i + d];
    if (a) doorKeys.set(key(a.x, a.z), doorKeys.get(key(a.x, a.z)) ?? "awning");
  }
}

const glassState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels(SIZE);
const counts = { walls: 0, glass: 0, doors: 0, awnings: 0 };

// Walls and foundations, cell by cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");     // foundation fill: nothing floats on a slope
  if (!shell(x, z)) {
    // Interior: a floor slab, air behind the glass, and the red-tile roof deck with courses across the roof.
    g.set(x, PLINTH, z, "smooth_stone");
    g.set(x, CORNICE, z, z % 2 === 0 ? "red_terracotta" : "terracotta");
    continue;
  }
  const { n, street } = facadeOf(x, z);
  const { idx } = index.get(key(x, z));
  const pier = idx % PIER_EVERY === 0;
  const door = doorKeys.get(key(x, z));
  const dir = DIRS[key(n[0], n[1])];

  // Plinth / bulkhead (street front: dark wood under the glass; elsewhere a stone base course).
  if (door === "door") {
    g.set(x, PLINTH, z, "dark_oak_door", { facing: dir, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, GLAZE, z, "dark_oak_door", { facing: dir, half: "upper", hinge: "left", open: "false", powered: "false" });
    counts.doors++;
  } else {
    g.set(x, PLINTH, z, "stone_bricks");                                    // base course on every face
    // Glazing row: stucco piers between the bays; shopfront glass on the street, sash windows elsewhere.
    if (pier) {
      g.set(x, GLAZE, z, "quartz_block");
    } else if (street) {
      g.set(x, GLAZE, z, "glass_pane", glassState(n));
      counts.glass++;
    } else {
      g.set(x, GLAZE, z, "gray_stained_glass_pane", glassState(n));
      counts.glass++;
    }
  }
  if (door) { g.set(x, CORNICE, z, "red_wool"); counts.awnings++; }        // awning over the door bay
  else g.set(x, CORNICE, z, "smooth_quartz");                                // cornice course
}

// Warm light: glowstone behind some sash windows, shroomlight behind some shopfront glass (in the air gap inside).
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const { n, street } = facadeOf(x, z);
  const ix = x - n[0], iz = z - n[1];
  if (!inside(ix, iz) || shell(ix, iz)) continue;
  const { idx } = index.get(key(x, z));
  if (idx % PIER_EVERY === 0 || doorKeys.has(key(x, z))) continue;
  const h = (x * 31 + z * 17) % 7;
  if (street && h < 3) g.set(ix, GLAZE, iz, "shroomlight");
  else if (!street && h === 0) g.set(ix, GLAZE, iz, "glowstone");
}

// Roof equipment: two HVAC boxes and a small bulkhead, all on the interior roof and clear of the parapet edge.
const interior3x3 = (x0, z0) => { for (let x = x0; x < x0 + 3; x++) for (let z = z0; z < z0 + 3; z++) if (!inside(x, z) || shell(x, z)) return false; return true; };
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
let bulk = null;
for (let x0 = 0; x0 + 2 < SIZE[0]; x0++) for (let z0 = 0; z0 + 2 < SIZE[2]; z0++) {
  if (!interior3x3(x0, z0)) continue;
  const d = Math.hypot(x0 + 1 - cx, z0 + 1 - cz);
  if (!bulk || d < bulk.d) bulk = { x0, z0, d };
}
if (bulk) {
  const { x0, z0 } = bulk;
  // A 3 x 3 box, two blocks high: quartz walls round a hollow middle, a top slab over all nine cells.
  for (let x = x0; x < x0 + 3; x++) for (let z = z0; z < z0 + 3; z++) {
    const edge = x === x0 || x === x0 + 2 || z === z0 || z === z0 + 2;
    if (edge) for (let y = HVAC_Y; y <= HVAC_Y + 1; y++) g.set(x, y, z, "quartz_block");
    g.set(x, HVAC_Y + 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}
let placed = 0;
for (let x = 0; x + 1 < SIZE[0] && placed < 2; x++) for (let z = 0; z + 1 < SIZE[2] && placed < 2; z++) {
  const all = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && !shell(x + dx, z + dz));
  const clear = bulk ? !(x + 1 >= bulk.x0 - 1 && x <= bulk.x0 + 3 && z + 1 >= bulk.z0 - 1 && z <= bulk.z0 + 3) : true;
  if (!all || !clear || (placed === 1 && x < 14)) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, HVAC_Y, z + dz, "light_gray_concrete");
  placed++;
}

const out = g.save(`${DIR}/201006.0003677.nbt`);
console.log(JSON.stringify({ ...counts, shell: cells.filter(([x, z]) => shell(x, z)).length, street: streetRun.length, bulkhead: bulk, hvac: placed, doorBays: doorIdx, ...out }));
