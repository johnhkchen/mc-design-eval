// Auckland way 1095570510, Mt Eden / Eden Terrace side: a two-storey interwar shop-top block (red brick, cream render
// bands and quoins, a stone base) with a three-storey stair tower on its west side (the lidar's 11 blocks), a shopfront
// at street level, a dark-oak door on the north face, flat roofs behind parapets, air behind every window, a floor slab
// per storey. Storey lines sit at y 0, 4, 8; the roof deck is the top of each tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570510.cells.json`, "utf8"));

// roof height above y 0 per footprint cell; a lone 10 beside the 11-block tower is the same tier (lidar noise)
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
for (const [k, r] of roof) if (r === 10) roof.set(k, 11);

const inF = (x, z) => roof.has(`${x},${z}`);
const top = (x, z) => roof.get(`${x},${z}`) - 1;          // the wall's top course = the roof deck
const OUT = [[0, -1], [1, 0], [0, 1], [-1, 0]];           // outward normals N E S W
const exposed = (x, z) => OUT.filter(([dx, dz]) => !inF(x + dx, z + dz));
const onRun = (x, z, [dx, dz]) => inF(x, z) && !inF(x + dx, z + dz);

// position along a run of cells exposed to the same face, and whether the cell is the run's end
function runInfo(x, z, n) {
  const t = n[0] === 0 ? [1, 0] : [0, 1];
  let p = 0, cx = x, cz = z;
  while (onRun(cx - t[0], cz - t[1], n)) { cx -= t[0]; cz -= t[1]; p++; }
  const end = !onRun(x - t[0], z - t[1], n) || !onRun(x + t[0], z + t[1], n);
  return { p, end, t };
}

// the street door: north face, the 3-cell tower corner beside it is the quoin
const DOOR = { x: 3, z: 0 };
const isDoor = (x, z) => x === DOOR.x && z === DOOR.z;

const placed = new Map();   // "x,y,z" -> { block, state, n? }
const put = (x, y, z, block, state, extra) => placed.set(`${x},${y},${z}`, { block, state, ...extra });

const BASE = "stone_bricks", BRICK = "bricks", QUARTZ = "smooth_quartz", RISER = "dark_oak_planks";
const DECK = "gray_concrete", FLOOR = "smooth_stone", GLASS = "glass_pane", CAP = "smooth_quartz_slab";
const GLAZED_ROWS = new Set([2, 5, 6, 9, 10]);            // shopfront glass at 2, two rows per upper storey
const PANE = { waterlogged: "false" };

for (const [x, z] of [...roof.keys()].map((k) => k.split(",").map(Number))) {
  const h = roof.get(`${x},${z}`), t = top(x, z), ex = exposed(x, z);
  if (ex.length === 0) {                                  // interior: floor slabs, then the deck
    for (let y = 0; y <= t; y++) {
      if (y === t) put(x, y, z, DECK);
      else if (y === 0 || y === 4 || y === 8) put(x, y, z, FLOOR);
    }
    continue;
  }
  const corner = ex.length >= 2;
  for (const n of ex) {
    if (corner && n !== ex[0]) continue;                   // a corner is one block; the first face owns it
    const { p, t: tan } = runInfo(x, z, n);
    // shopfront glass on every plain ground-floor cell; upper windows alternate with brick piers so panes don't join into a sheet
    const shop = !corner && !isDoor(x, z), upper = shop && p % 2 === 1;
    for (let y = 0; y <= t; y++) {
      if (isDoor(x, z) && (y === 1 || y === 2)) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === 0) put(x, y, z, BASE);
      else if (y === t) put(x, y, z, BRICK);               // brick frieze under the cream cap
      else if (y === 4 || y === 8) put(x, y, z, QUARTZ);   // storey bands
      else if (corner) put(x, y, z, y % 4 === 1 ? QUARTZ : BRICK);   // quoins: a cream block every storey, brick between
      else if (shop && y === 1) put(x, y, z, RISER);       // stall board under the shop glass
      else if ((shop && y === 2) || (upper && GLAZED_ROWS.has(y))) {
        put(x, y, z, GLASS, null, { n, tan });
        // a warm light behind some upper windows: sits on the floor slab in the air gap
        const bx = x - n[0], bz = z - n[1];
        if (y === 5 && (x + z) % 3 === 0 && inF(bx, bz)) put(bx, y, bz, "glowstone");
      } else put(x, y, z, BRICK);
    }
    if (isDoor(x, z)) put(x, 3, z, BRICK);
    // parapet cap on the top of the wall
    put(x, t + 1, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// roof plant: an air-conditioning pair on the wing's deck, a stair housing on the tower's deck
for (const [x, z] of [[5, 4], [6, 4]]) put(x, 7, z, "light_gray_concrete");
for (const [x, z] of [[1, 3], [1, 4]]) { put(x, 11, z, QUARTZ); put(x, 12, z, QUARTZ); }

// glass panes connect along the wall they sit in, to any block beside them (brick piers, quoins, other panes)
for (const [k, v] of placed) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number), [tx, tz] = v.tan;
  const state = { east: "false", north: "false", south: "false", west: "false", ...PANE };
  const side = (dx, dz) => placed.has(`${x + dx},${y},${z + dz}`);
  if (tx) { if (side(1, 0)) state.east = "true"; if (side(-1, 0)) state.west = "true"; }
  else { if (side(0, 1)) state.south = "true"; if (side(0, -1)) state.north = "true"; }
  v.state = state;
}

const g = new Voxels([11, 24, 9]);
for (const [k, v] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state ?? undefined);
}
const stats = g.save(`${DIR}/way_1095570510.nbt`);
console.log(JSON.stringify(stats));
