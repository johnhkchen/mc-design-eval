// DC56991: a limestone Federal-style office block on the Mall (1920s-30s neoclassical, Federal Triangle manner).
// Five 2-block storeys on a stone plinth and a cornice, a flat roof with a stone parapet, and a raised three-storey
// tower (lidar 14) in the middle with a window band and its own parapet. Shell only: a 1-block skin, a floor slab per
// storey, an air gap behind every pane. Warm lights sit in some of the air gaps; the front door is on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56991.cells.json`, "utf8"));

const BASE_TOP = 12;   // lidar roof over the wings, above y 0
const TOWER_TOP = 14;  // lidar roof over the central core
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const inF = (x, z) => ground.has(key(x, z));
// the tower: lidar 13-14 core, a clean rectangle clipped to the footprint (checked below)
const inP = (x, z) => inF(x, z) && x >= 13 && x <= 18 && z >= 4 && z <= 13;
const edge = (inS) => (x, z) => N4.some(([dx, dz]) => !inS(x + dx, z + dz));
const edgeF = edge(inF), edgeP = edge(inP);
// a wall line's position along its face: x on north/south faces, z on east/west faces
const along = (x, z, inS) => (!inS(x, z - 1) || !inS(x, z + 1) ? x : z);
const outward = (x, z, inS) => N4.find(([dx, dz]) => !inS(x + dx, z + dz));

const B = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const doorX = 7, doorZ = 9;   // south face, on the bay between two piers

// the footprint's lidar heights should be the two tiers used here
for (const [x, z, , r] of cells) if (r >= 13 && !inP(x, z)) throw new Error(`lidar ${r} outside the tower at ${x},${z}`);

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), g = ground.get(k);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                 // foundation up to the ground
  const ed = edgeF(x, z), along_ = along(x, z, inF);
  for (let y = g; y < BASE_TOP; y++) {
    if (y === BASE_TOP - 1) {                                                 // roof deck and stone parapet
      if (!ed) put(x, y, z, "smooth_stone");
      else put(x, y, z, along_ % 2 === 0 ? "smooth_quartz" : "calcite");
      continue;
    }
    if (!ed) { if (y % 2 === 0) put(x, y, z, "stone"); continue; }           // floor slabs; air behind the glass
    if (y === 0) put(x, y, z, "stone_bricks");                                // plinth
    else if (y % 2 === 0) put(x, y, z, y === 4 || y === 8 || y === 10 ? "smooth_quartz" : "calcite");   // string courses, spandrels
    else put(x, y, z, along_ % 3 === 0 ? "smooth_quartz" : "glass_pane");   // piers and window panes
  }
}

// the tower above the wings: window band on layer 12, parapet on 13, a floor slab on 11 (already the roof deck)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!inP(x, z)) continue;
  if (edgeP(x, z)) {
    const a = along(x, z, inP);
    put(x, BASE_TOP, z, a % 3 === 0 ? "smooth_quartz" : "glass_pane");
    put(x, TOWER_TOP - 1, z, a % 2 === 0 ? "smooth_quartz" : "calcite");
  } else put(x, TOWER_TOP - 1, z, "smooth_stone");
}

// entrance: a bronze-coloured iron door in the south face, a lintel over it
put(doorX, 1, doorZ, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, 2, doorZ, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = doorX - 1; x <= doorX + 1; x++) put(x, 3, doorZ, "smooth_quartz");   // the hood over the door bay

// roof plant on the wings' deck: two stone chimneys and polished boxes, a few cells in from the parapet
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (inP(x, z) || edgeF(x, z)) continue;
  if ((x === 3 && z === 6) || (x === 3 && z === 13)) { put(x, BASE_TOP, z, "stone_bricks"); put(x, BASE_TOP + 1, z, "stone_brick_wall"); continue; }
  if (x % 6 === 2 && z % 5 === 2) put(x, BASE_TOP, z, "polished_andesite");
}

// warm light in some of the air behind the glass: the cell inside each pane is the room
for (const [k, v] of [...B]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const onTower = y >= BASE_TOP;
  const inS = onTower ? inP : inF;
  const out = outward(x, z, inS); if (!out) continue;
  const ix = x - out[0], iz = z - out[1];
  if (B.has(`${ix},${y},${iz}`)) continue;
  const a = along(x, z, inS);
  if ((a + y) % 8 === 1) put(ix, y, iz, "glowstone");
}

// panes join the walls and each other: a pane connects to any solid or pane neighbour in its plane
for (const [k, v] of B) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const conn = (dx, dz) => { const n = B.get(`${x + dx},${y},${z + dz}`); return n && n.block !== "air" ? "true" : "false"; };
  v.state = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
}

// every wall, window, light and roof box stands on something (a floor slab's span over its room is fine)
let floating = 0;
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (y > 0 && !B.has(`${x},${y - 1},${z}`) && v.block !== "stone") { if (floating < 5) console.log("air below", x, y, z, v.block); floating++; }
}

const g = new Voxels([23, 26, 19]);
for (const [k, v] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/DC56991.nbt`);
console.log("blocks", out.blocks, "palette", out.palette, "unsupported at y>0", floating);
