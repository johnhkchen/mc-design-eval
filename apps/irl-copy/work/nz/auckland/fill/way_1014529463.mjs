// Way 1014529463, Mt Eden / Eden Terrace side street: a 1930s three-storey brick commercial block with a shopfront at
// street level, plaster-look quartz spandrels and pilasters, a cornice and parapet, and a lift housing on the roof.
// Footprint cells only. Foundation (stone, y 0-1) under every cell so the floors stand level on the slope; the
// lidar roof (14-15 above y 0) is smoothed to one parapet tier at 16, with a 3x3 lift housing to 17.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529463.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529463.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
// the faces of a cell that look out of the footprint
const exposed = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));
const perimeter = (x, z) => inF(x, z) && exposed(x, z).length > 0;

// Levels: the ground floor sits on a two-block foundation (y 0-1); storeys are 4 high; cornice 14; parapet 15.
const BASE = 2;                 // base course (stone) at y 2, the street-level plinth
const SHOP = [3, 4];            // shopfront glazing, ground storey
const FASCIA = 5;               // smooth stone fascia over the shopfront
const FLOORS = [6, 10];         // upper storey floors (quartz spandrels on the outside, slabs inside)
const CORNICE = 14;             // quartz cornice; the roof deck is at this level inside
const PARAPET = 15;             // brick parapet, roof surface 16
const LIFT = { y0: 15, y1: 16, cap: 17 };

// The entrance: the middle of the longest run of street-level faces that look one way.
const runs = {};
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  const ext = exposed(x, z);
  if (ext.length !== 1) continue;                    // corners are pilasters, not doors
  (runs[ext[0].name] ??= []).push({ x, z, f: ext[0] });
}
const faceName = Object.keys(runs).sort((a, b) => runs[b].length - runs[a].length)[0];
const run = runs[faceName].sort((a, b) => (a.f.dz !== 0 ? a.x - b.x : a.z - b.z));
const doorAt = run[Math.floor(run.length / 2)];
const door = { x: doorAt.x, z: doorAt.z, facing: faceName };

// Glass panes connect to the wall beside them, so a row of panes reads as one glazed wall in the world too.
function pane(x, z, f) {
  const side = f.dz !== 0 ? { north: "false", south: "false", east: perimeter(x + 1, z), west: perimeter(x - 1, z) }
    : { east: "false", west: "false", north: perimeter(x, z - 1), south: perimeter(x, z + 1) };
  const st = Object.fromEntries(Object.entries(side).map(([k, v]) => [k, v === true || v === "true" ? "true" : "false"]));
  return { block: "glass_pane", state: { ...st, waterlogged: "false" } };
}

// The wall skin of a perimeter cell at height y: piers every third column, glazing between, brick lintels, quartz bands.
function skin(x, z, y) {
  const ext = exposed(x, z);
  const f = ext[0];
  const t = f.dz !== 0 ? x : z;                       // position along the face
  const pier = ext.length > 1 || t % 3 === 0;         // corners and every third column
  if (y === 0 || y === 1 || y === BASE) return { block: "stone_bricks" };
  if (y === FASCIA) return pier ? { block: "quartz_block" } : { block: "smooth_stone" };
  if (y <= SHOP[1]) {
    if (x === door.x && z === door.z) {
      return { block: "dark_oak_door", state: { facing: door.facing, half: y === SHOP[0] ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    }
    return pier ? { block: "quartz_block" } : pane(x, z, f);
  }
  if (FLOORS.includes(y) || y === CORNICE) return { block: "quartz_block" };
  if (y === PARAPET) return pier ? { block: "quartz_block" } : { block: "bricks" };
  const lintel = y === FLOORS[0] + 3 || y === FLOORS[1] + 3;
  if (lintel) return pier ? { block: "quartz_block" } : { block: "bricks" };
  return pier ? { block: "quartz_block" } : pane(x, z, f);
}

// The lift housing: a 3x3 block of brick on the roof deck, wholly inside the footprint.
const interior3x3 = (cx, cz) => {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!inF(cx + dx, cz + dz) || perimeter(cx + dx, cz + dz)) return false;
  return true;
};
const keys = [...F.keys()].map((k) => k.split(",").map(Number));
const mx = keys.reduce((a, [x]) => a + x, 0) / keys.length, mz = keys.reduce((a, [, z]) => a + z, 0) / keys.length;
let lift = null;
for (const [x, z] of keys) if (interior3x3(x, z) && (!lift || Math.abs(x - mx) + Math.abs(z - mz) < Math.abs(lift[0] - mx) + Math.abs(lift[1] - mz))) lift = [x, z];

const g = new Voxels([11, 28, 11]);

// Foundation and the interior: solid below the floors, slabs at each storey, the roof deck, and a warm glow behind
// some of the glass (the air gap behind each pane is the room).
for (const [x, z] of keys) {
  for (let y = 0; y <= 1; y++) g.set(x, y, z, "stone_bricks");
  if (perimeter(x, z)) continue;
  for (const y of FLOORS) g.set(x, y, z, "smooth_stone");
  g.set(x, CORNICE, z, "smooth_stone");
}
for (const [x, z] of keys) {
  if (!perimeter(x, z)) continue;
  for (let y = BASE; y <= PARAPET; y++) {
    const b = skin(x, z, y);
    g.set(x, y, z, b.block, b.state);
    const lit = (y >= SHOP[0] && y <= SHOP[1]) || (y >= FLOORS[0] + 1 && y <= FLOORS[0] + 2) || (y >= FLOORS[1] + 1 && y <= FLOORS[1] + 2);
    if (lit && b.block === "glass_pane" && (x * 3 + z * 5 + y) % 4 === 0) {
      const f = exposed(x, z)[0];
      const ix = x - f.dx, iz = z - f.dz;
      if (inF(ix, iz) && !perimeter(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// The lift housing and its cap.
if (lift) {
  const [cx, cz] = lift;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    for (let y = LIFT.y0; y <= LIFT.y1; y++) g.set(cx + dx, y, cz + dz, "bricks");
    g.set(cx + dx, LIFT.cap, cz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const info = g.save(OUT);
console.log(JSON.stringify({ door, lift, ...info }));
