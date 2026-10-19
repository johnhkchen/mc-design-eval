// 201006.0006932, Presidio Tunnel Tops, Main Post frame. Miscellaneous/Mixed-Use, 3550 West Pacific Avenue. Footprint 21 x 17
// (124 cells, 93 on the lowest ground and 31 one block up). Read from the record: a 1930s Moderne stucco block with a shopfront
// on the Pacific Avenue (north-east) frontage and one residential storey above it. Storeys are 2 blocks (4 m); the roof deck is
// at y 4 and the parapet top sits at y 5, five blocks above the lowest ground. A stair bulkhead stands two blocks above the roof.
// Materials: smooth-quartz stucco walls, stone-brick plinth, quoins and parapet, a polished-andesite storey band running round
// the whole block, dark-oak shopfront frames and canopies, glass in shop windows and glass panes in piered bays above.
// Blocks: every footprint cell is solid at y 0 (foundation on the upper cells, floor on the lower), so nothing floats on the slope.
// No interiors: each storey has a floor slab, an air gap sits behind every window, and only lights stand in the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0006932.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [21, 7, 17];
const ROOF = 4;                 // interior roof deck at y 4; parapet on the outer walls at y 4, top face 5
const g = new Voxels(SIZE);
const plan = new Map();         // "x,y,z" -> { block, state }, so panes can read their neighbours before they are placed
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
// Outward normals: north is -z (the street side is north and east, Pacific Avenue), then south (+z), west (-x), east (+x).
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const boundary = (x, z) => inside(x, z) && faces(x, z).length > 0;
const interior = (x, z) => inside(x, z) && !boundary(x, z);
const corner = (x, z) => faces(x, z).length > 1;
// The street frontage: any boundary cell with an exposed north or east face, but not a corner that also faces south or west.
const isStreet = (x, z) => faces(x, z).some(([, dz, name]) => name === "north" || name === "east") && !faces(x, z).some(([, , n]) => n === "south" || n === "west");

// Along-facade position: x on the north and south faces, z on the east and west faces. Piers fall every third block.
const along = (x, z, fs) => (fs[0][0] !== 0 ? z : x);
const isPier = (x, z, fs) => along(x, z, fs) % 3 === 0;

// Shopfront doors: two on the street ground floor (lowest ground) at roughly a third and two thirds along the frontage.
const streetDoorCells = cells.filter(([x, z, h]) => h === 0 && isStreet(x, z) && !corner(x, z)).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
const doorCells = new Set();
if (streetDoorCells.length >= 2) {
  for (const f of [0.3, 0.68]) {
    const [x, z] = streetDoorCells[Math.floor(streetDoorCells.length * f)];
    doorCells.add(`${x},${z}`);
  }
}
const isDoor = (x, z) => doorCells.has(`${x},${z}`);
// A dark-oak canopy runs over each door and one cell either side of it, on the storey band at y 2.
const canopy = new Set();
for (const k of doorCells) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  for (let d = -1; d <= 1; d++) canopy.add(fs[0][0] !== 0 ? `${x},${z + d}` : `${x + d},${z}`);
}

for (const [x, z, ground0] of cells) {
  // Solid from y 0 on every cell: the lower cells' floor and the upper cells' foundation (one block of stone).
  const fs = faces(x, z);
  if (!fs.length) {
    put(x, 0, z, "smooth_stone");                                                  // interior ground floor slab
    put(x, 2, z, "smooth_stone");                                                  // floor slab of the residential storey
    put(x, ROOF, z, "smooth_stone");                                               // roof deck
    continue;
  }

  // Stone plinth on the outer walls (the foundation on the upper cells). The stepped plan gives most boundary cells two exposed
  // faces, so the primary face (north, then south, west, east) sets the bay rhythm and no cell is a quoin.
  put(x, 0, z, "stone_bricks");
  const street = isStreet(x, z);
  const along0 = along(x, z, fs);
  const doorHere = isDoor(x, z);
  const pier = isPier(x, z, fs);
  const canopied = canopy.has(`${x},${z}`);

  if (doorHere) {
    const facing = fs[0][2];
    put(x, 0, z, "dark_oak_door", { facing, half: "lower", hinge: along0 % 2 ? "left" : "right", open: "false", powered: "false" });
    put(x, 1, z, "dark_oak_door", { facing, half: "upper", hinge: along0 % 2 ? "left" : "right", open: "false", powered: "false" });
  } else if (street) {
    put(x, 1, z, pier ? "dark_oak_planks" : "glass");                              // shopfront: glass bays, dark-oak piers
  } else {
    put(x, 1, z, pier ? "smooth_quartz" : "glass_pane");                           // side and back ground floor: quartz piers, glazed bays
  }

  // The storey band runs round the whole block at y 2, with a dark-oak canopy over each shop door.
  put(x, 2, z, canopied ? "dark_oak_slab" : "polished_andesite", canopied ? { type: "bottom", waterlogged: "false" } : undefined);

  // Residential storey: glazed bays with quartz piers.
  put(x, 3, z, pier ? "smooth_quartz" : "glass_pane");

  put(x, ROOF, z, "stone_bricks");                                                 // parapet on the outer walls
}

// Ground-floor canopies and doors are finished; the upper storey's bay glass is set by the pane pass below.

// Interior: lights in the air gaps behind the glass. Each lit cell is the interior cell just inside the wall.
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length) continue;
  const [dx, dz] = fs[0];
  const ix = x - dx, iz = z - dz;                                                  // one cell inward
  if (!interior(ix, iz)) continue;
  const street = isStreet(x, z);
  const bayIndex = along(x, z, fs);
  if (street && !isDoor(x, z) && !isPier(x, z, fs) && bayIndex % 6 === 1) put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (!street && !isPier(x, z, fs) && bayIndex % 6 === 1) put(ix, 3, iz, "glowstone");
  else if (!street && !isPier(x, z, fs) && bayIndex % 6 === 4) put(ix, 3, iz, "shroomlight");
}

// Stair bulkhead: a 3 x 3 interior square nearest the footprint centre, walls to y 5, a roof at y 6, glass on the middle of each side.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null;
for (const [x, z] of cells) {
  const sq = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) sq.push([x + dx, z + dz]);
  if (!sq.every(([a, b]) => interior(a, b))) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = best.x + dx, z = best.z + dz, ring = !(dx === 0 && dz === 0);
    if (ring) {
      const side = (dx === 0) !== (dz === 0);                                       // edge-middle cells carry glass
      put(x, 5, z, side ? "glass_pane" : "smooth_quartz");
    }
    put(x, 6, z, "stone_bricks");
  }
  put(best.x, 5, best.z, "lantern", { hanging: "false", waterlogged: "false" });   // one lantern in the bulkhead
}

// Lanterns on the parapet at the two street corners, one at each end of the frontage.
const streetCorners = cells.filter(([x, z]) => corner(x, z) && isStreet(x, z)).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
if (streetCorners.length >= 2) {
  for (const [x, z] of [streetCorners[0], streetCorners[streetCorners.length - 1]]) put(x, ROOF + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pane connections: a pane joins any block beside it in its plane, so the bays of glass run into their piers.
const dirs = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
for (const [key, entry] of plan) {
  if (entry.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = {};
  for (const [name, dx, dz] of dirs) {
    const n = plan.get(`${x + dx},${y},${z + dz}`);
    st[name] = n && !["lantern", "dark_oak_door", "dark_oak_slab"].includes(n.block) ? "true" : "false";
  }
  st.waterlogged = "false";
  entry.state = st;
}

for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const out = g.save(`${DIR}/201006.0006932.nbt`);
console.log("saved", out);
