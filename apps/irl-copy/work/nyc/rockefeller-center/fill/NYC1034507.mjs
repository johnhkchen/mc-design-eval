// 604 5th Avenue, 1925, Midtown mixed use: an eight-storey block. A granite plinth and base course, a shopfront
// on the ground floor, cream terracotta piers between steel-sash windows, sandstone string courses, a cornice,
// a parapet over the main body and a rear wing two blocks lower (the lidar's 24 and 22). Walls are one block
// thick; interiors are air behind the glass with a floor slab per storey, and a few lamps stand behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 27, D = 9, H = 36;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034507.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const roofAt = new Map();
for (const [x, z, , roof] of cells) roofAt.set(k(x, z), roof);
const inFP = (x, z) => roofAt.has(k(x, z));

// Lidar roof: 0 and 1 are missed returns, so they take the median of their valid neighbours; then each cell's roof
// is the median of its 3x3 and snapped to one of two tiers: 24 (seven storeys and a parapet course) or 22 (the rear
// wing: seven storeys, no attic).
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const T = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofAt.get(k(x + dx, z + dz));
    if (r !== undefined && r > 1) vals.push(r);
  }
  vals.sort((a, b) => a - b);
  const med = vals.length ? vals[Math.floor(vals.length / 2)] : 24;
  T.set(k(x, z), med >= 23 ? 24 : 22);
}
const top = (x, z) => T.get(k(x, z));

// Outward faces at (x, y, z): a neighbour outside the footprint, or one whose tier stops below this row.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || y >= top(nx, nz);
});

// Street entrances on the two long faces (facing = the way the door's front looks, outward).
const DOORS = [{ x: 13, z: 8, facing: "north" }, { x: 5, z: 0, facing: "south" }];
const FLOORS = new Set([3, 6, 9, 12, 15, 18, 21]);   // floor-slab rows: string courses on the facade

function facade(x, y, z, t, out) {
  const onX = out.some(([dx]) => dx !== 0), onZ = out.some(([, dz]) => dz !== 0);
  const corner = onX && onZ;
  const u = onX ? z : x;                                // position along the face: the bay rhythm
  if (y === t - 1) return ["smooth_sandstone"];         // cornice / parapet course
  if (y === 0) return ["polished_granite"];             // plinth
  const door = DOORS.find((d) => d.x === x && d.z === z);
  if (door && (y === 1 || y === 2)) return ["dark_oak_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (y === 3 && DOORS.some((d) => d.z === z && Math.abs(x - d.x) <= 1)) return ["black_concrete"];   // entrance canopy
  if (y % 3 === 0) return ["smooth_sandstone"];         // floor string courses (rows 3, 6 .. 21)
  if (y === 1) return ["polished_granite"];             // base course
  const pier = corner || u % 3 === 0;
  if (y === 2) return [pier ? "polished_granite" : "glass"];                       // shopfront
  return [pier ? "white_terracotta" : "light_blue_stained_glass_pane"];            // upper windows
}

const blockAt = new Map();
const at = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => blockAt.set(at(x, y, z), { block, state });

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const out = exposed(x, y, z);
    if (out.length) {
      const [block, state] = facade(x, y, z, t, out);
      put(x, y, z, block, state);
    } else if (y === 0) put(x, y, z, "polished_granite");
    else if (y === t - 1 || FLOORS.has(y)) put(x, y, z, "smooth_stone");     // floor slabs and roof deck
  }
}

// Warm lights behind some glass: lanterns standing on the floor behind upper windows (storeys 1, 3, 5), and
// hanging from the slab behind the shopfront glass. Only on the interior cell directly behind the pane.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  for (const y of [2, 4, 10, 16]) {
    if (y >= top(x, z) - 1) continue;
    const out = exposed(x, y, z);
    if (out.length !== 1) continue;
    const [dx, dz] = out[0];
    const u = dx !== 0 ? z : x;
    const bx = x - dx, bz = z - dz;
    if (!inFP(bx, bz) || exposed(bx, y, bz).length || blockAt.has(at(bx, y, bz))) continue;
    const pane = blockAt.get(at(x, y, z))?.block;
    if (y === 2 && pane === "glass" && u % 6 === 4) put(bx, y, bz, "lantern", { hanging: "true" });
    if (y !== 2 && pane === "light_blue_stained_glass_pane" && u % 6 === 1) put(bx, y, bz, "lantern", { hanging: "false" });
  }
}

// Roof equipment: a wooden water tank on the main body's roof deck (rows 24 to 26).
for (const [x, z] of [[17, 3], [18, 3], [17, 4], [18, 4]]) {
  put(x, 24, z, "oak_planks");
  put(x, 25, z, "oak_planks");
  put(x, 26, z, "oak_slab", { type: "bottom" });
}

// Glass panes join their neighbours: east and west to a pane or wall, north and south likewise.
for (const [key, v] of blockAt) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const joins = (dx, dz) => {
    const n = blockAt.get(at(x + dx, y, z + dz));
    return !!n && !/door|lantern/.test(n.block);
  };
  v.state = { north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)) };
}

const g = new Voxels([W, H, D]);
for (const [key, v] of blockAt) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/NYC1034507.nbt`);
const tiers = [...T.values()].reduce((a, t) => ((a[t] = (a[t] ?? 0) + 1), a), {});
console.log({ ...out, tiers });
