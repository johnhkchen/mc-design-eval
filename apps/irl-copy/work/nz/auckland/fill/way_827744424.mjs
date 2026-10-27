// A two-storey Edwardian commercial block on Mt Eden's flank (31 x 11 footprint, lidar roof 6 above y 0 at its tall end,
// 3-4 on the lower wing): a basalt plinth, red-brick walls with cream plaster bands and cornice, a shopfront on the
// street (north) face with a recessed timber door under a stone hood, and sash-style glass grids with brick piers above.
// Lidar roofs are tiered: 5-6 read as two storeys (roof at y 8 with a parapet), 3-4 as one storey (roof at y 5). Every
// wall stands on the wall or floor below it; the interior is air between solid floor and ceiling slabs, with a lantern
// hung in some gaps behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_827744424.cells.json`, "utf8"));

const X = 31, Y = 19, Z = 11;
const g = new Voxels([X, Y, Z]);

const TOP_HIGH = 8;      // two storeys of 4 blocks: floor 0, floor 3, upper ceiling 6, roof surface 8 (parapet at 7)
const TOP_LOW = 5;       // one storey of 4 blocks and a cornice at 4, roof surface 5

const N = [0, -1], S = [0, 1], W = [-1, 0], E = [1, 0];
const DIRS = [N, S, W, E];
const NAME = { "0,-1": "N", "0,1": "S", "-1,0": "W", "1,0": "E" };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const k = (x, z) => `${x},${z}`;

// ---- footprint: lidar roof read as flat tiers ---------------------------------------------------------
// roof <= 1 is open ground (a paved forecourt strip); 3-4 is the one-storey wing; 5-6 the two-storey block.
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  const paving = roof <= 1;
  const top = paving ? 1 : roof >= 5 ? TOP_HIGH : TOP_LOW;
  fp.set(k(x, z), { x, z, ground, paving, top });
}
const cell = (x, z) => fp.get(k(x, z));

// A layer of a cell is covered if the footprint cell there has a building (or paving) at that height.
const covers = (x, y, z) => { const c = cell(x, z); return !!c && y < c.top; };
// The sides of a cell at height y that face air (outside the footprint, or a neighbour that stops below y).
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !covers(x + dx, y, z + dz));
const isExposed = (x, y, z) => exposed(x, y, z).length > 0;

// Interior solids: floor 0, floor/ceiling 3, upper ceiling (top - 2) and roof (top - 1). Everything else inside is air.
const interiorSolid = (c, y) => y === 0 || y === 3 || y === c.top - 2 || y === c.top - 1;

// What a footprint cell holds at height y: a wall (exposed side), a slab (interior floor, ceiling or roof, or the
// support of a wall above), or nothing (air). A wall at y+1 needs solid under it, so the layer below is solid too.
function role(x, y, z) {
  const c = cell(x, z);
  if (!c || y < c.ground || y >= c.top) return null;
  if (c.paving) return y === 0 ? { kind: "paving" } : null;
  const ex = exposed(x, y, z);
  if (ex.length) return { kind: "wall", dirs: ex };
  const above = y + 1 < c.top && isExposed(x, y + 1, z);
  if (interiorSolid(c, y) || above) return { kind: "slab", roof: y === c.top - 1 };
  return null;
}

// The street is the north (lowest z) edge of the footprint. Its shopfront has the entrance.
// Door: a ground-floor street-face cell whose glass bay is the middle one, nearest the block's centre.
let door = null;
for (const c of fp.values()) {
  if (c.paving || c.top !== TOP_HIGH && c.top !== TOP_LOW) continue;
  const r = role(c.x, 1, c.z);
  if (!r || r.kind !== "wall" || !r.dirs.some(([dx, dz]) => dx === 0 && dz === -1)) continue;
  if (c.x % 3 !== 1) continue;                     // a glass bay, not a pier
  const score = Math.abs(c.x - 14);
  if (!door || score < door.score) door = { x: c.x, z: c.z, score };
}

// The facade: which material a wall block gets at height y.
function facade(c, y, dirs) {
  const street = dirs.some(([dx, dz]) => dx === 0 && dz === -1);
  const along = dirs[0][0] !== 0 ? c.z : c.x;             // a face along x is barred by z, along z by x
  const corner = dirs.length > 1;
  const pier = corner || along % 3 === 0;
  if (y === 0) return { id: "polished_andesite" };      // basalt plinth
  if (y === c.top - 1) return { id: "smooth_quartz" };   // cornice / parapet
  if (y === 3 || y === c.top - 2) return { id: "smooth_quartz" };  // storey band (and the upper storey's string)
  if (pier) return { id: y <= 2 ? "stone_bricks" : "bricks" };
  if (y <= 2 && street) return { id: "glass" };          // shopfront glazing
  const ew = dirs[0][0] !== 0;                            // pane connects along its wall
  return { id: "glass_pane", state: ew ? { east: "false", west: "false", north: "true", south: "true" }
    : { east: "true", west: "true", north: "false", south: "false" } };
}

// ---- build ------------------------------------------------------------------------------------------
const doorCell = door && { x: door.x, z: door.z };
for (const c of fp.values()) {
  for (let y = 0; y < c.top; y++) {
    const r = role(c.x, y, c.z);
    if (!r) continue;
    if (r.kind === "paving") { g.set(c.x, y, c.z, "smooth_stone"); continue; }
    if (r.kind === "slab") { g.set(c.x, y, c.z, r.roof ? "stone" : "smooth_stone"); continue; }
    const f = facade(c, y, r.dirs);
    if (doorCell && c.x === doorCell.x && c.z === doorCell.z && y <= 2) {
      g.set(c.x, y, c.z, "oak_door", {
        facing: FACING.N, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    g.set(c.x, y, c.z, f.id, f.state);
  }
}
// The hood over the entrance: an upturned stair course on the band, the one canopy the wall can carry.
if (doorCell) g.set(doorCell.x, 3, doorCell.z, "stone_brick_stairs", { facing: FACING.N, half: "top", shape: "straight", waterlogged: "false" });

// Warm lights in some gaps behind the glass: a hanging lantern from each ceiling, next to a wall.
for (const c of fp.values()) {
  if (c.paving) continue;
  const rows = c.top === TOP_HIGH ? [2, 5] : [2];
  for (const y of rows) {
    if (role(c.x, y, c.z)) continue;                         // not air
    const beside = DIRS.some(([dx, dz]) => role(c.x + dx, y, c.z + dz)?.kind === "wall");
    if (beside && (c.x * 7 + c.z * 5 + y) % 4 === 0) g.set(c.x, y, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant on the two-storey roof: two small units set on the roof, clear of the parapet.
for (const c of fp.values()) {
  if (c.paving || c.top !== TOP_HIGH) continue;
  const r = role(c.x, c.top - 1, c.z);
  if (!r || r.kind !== "slab" || !r.roof) continue;
  if (c.x % 7 === 3 && c.z % 3 === 1) g.set(c.x, c.top, c.z, "iron_block");
}

// ---- checks (printed, not fatal): every block stands on a block below it or beside it on the same layer ----
const solid = (x, y, z) => g.get(x, y, z) !== null;
let loose = 0;
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  if (!solid(x, y, z) || y === 0) continue;
  const under = solid(x, y - 1, z);
  const side = DIRS.some(([dx, dz]) => solid(x + dx, y, z + dz));
  if (!under && !side) loose++;
}
g.save(`${DIR}/way_827744424.nbt`);
console.log(`blocks ${g.count()}  palette ${g.palette.length - 1}  loose ${loose}`);
