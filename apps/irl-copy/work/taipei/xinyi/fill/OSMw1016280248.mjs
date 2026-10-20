import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi block, c. 1980s-90s: white tiled concrete facade, light-grey
// concrete piers, storey spandrels, a stone-brick base and cornice, one shopfront
// storey, three office/residential storeys above it, and a rooftop plant room.
// Roof top sits at 21 blocks above the lowest ground (parapet cap).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280248";
const W = 7, H = 33, D = 20;
const STOREYS = 4;
const STOREY_H = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint --------------------------------------------------------------
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));
}
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const base = (x, z) => ground.get(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// outward faces of a footprint cell: neighbour missing from the footprint
const DIRS = [
  { name: "east",  dx: 1,  dz: 0 },
  { name: "west",  dx: -1, dz: 0 },
  { name: "south", dx: 0,  dz: 1 },
  { name: "north", dx: 0,  dz: -1 },
];
function outwardFaces(x, z) {
  return DIRS.filter((d) => !has(x + d.dx, z + d.dz));
}

// ---- foundation: solid from y 0 up to each cell's ground --------------------
const cells = [...ground.entries()].map(([k, gy]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, b: gy, faces: outwardFaces(x, z) };
});

for (const c of cells) {
  for (let y = 0; y < c.b; y++) put(c.x, y, c.z, "stone_bricks");
}

// ---- storeys ----------------------------------------------------------------
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const GLASS_UP = "light_blue_stained_glass";
const GLASS_SHOP = "glass";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const LIGHT = "shroomlight";

// choose the shopfront entrance on the north face nearest the middle
let doorCell = null;
{
  const northCells = cells.filter((c) => c.faces.some((f) => f.name === "north"));
  const pool = northCells.length ? northCells : cells.filter((c) => c.faces.length);
  pool.sort((a, b) => Math.abs(a.x - 3) - Math.abs(b.x - 3));
  doorCell = pool[0] ?? null;
}
const doorFace = doorCell ? (doorCell.faces.find((f) => f.name === "north") ?? doorCell.faces[0]) : null;

for (let k = 0; k < STOREYS; k++) {
  for (const c of cells) {
    const bk = c.b + k * STOREY_H;
    const perimeter = c.faces.length > 0;

    // floor slab / base course at each storey line
    if (k === 0 && perimeter) put(c.x, bk, c.z, BASE);
    else put(c.x, bk, c.z, FLOOR);

    if (!perimeter) continue;

    const corner = c.faces.length >= 2;
    const face = c.faces[0];
    const along = face && (face.name === "east" || face.name === "west") ? c.z : c.x;
    const isWindow = !corner && along % 2 === 1;
    const glass = k === 0 ? GLASS_SHOP : GLASS_UP;

    for (let dy = 1; dy <= 3; dy++) {
      let id = corner ? PIER : isWindow ? glass : PIER;
      if (!corner && !isWindow) id = WALL;
      put(c.x, bk + dy, c.z, id);
    }

    // spandrel band at the top of each storey
    put(c.x, bk + 4, c.z, PIER);

    // warm lights: a shroomlight just behind some upper windows
    if (k >= 1 && isWindow && face && (along + k) % 3 === 0) {
      const inX = c.x - face.dx, inZ = c.z - face.dz;
      if (has(inX, inZ) && outwardFaces(inX, inZ).length === 0) {
        put(inX, bk + 2, inZ, LIGHT);
      }
    }
  }
}

// entrance on the shopfront storey
if (doorCell && doorFace) {
  const { x, z, b } = doorCell;
  const facing = { north: "south", south: "north", east: "west", west: "east" }[doorFace.name];
  put(x, b + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, b + 3, z, BASE); // lintel
}

// ---- roof, cornice and parapet ----------------------------------------------
for (const c of cells) {
  const roofY = c.b + STOREYS * STOREY_H; // 20 above the lowest ground
  const perimeter = c.faces.length > 0;
  put(c.x, roofY, c.z, perimeter ? BASE : FLOOR);
  if (perimeter) put(c.x, roofY + 1, c.z, WALL); // parapet
  // cap the parapet with a stone course at the very top (21 blocks)
  if (perimeter) put(c.x, roofY + 1, c.z, BASE);
}

// rooftop plant room, interior cells only
for (let x = 2; x <= 4; x++) {
  for (let z = 7; z <= 10; z++) {
    if (!has(x, z)) continue;
    const roofY = base(x, z) + STOREYS * STOREY_H;
    if (outwardFaces(x, z).length) continue;
    put(x, roofY + 1, z, PIER);
    put(x, roofY + 2, z, PIER);
    put(x, roofY + 3, z, BASE);
  }
}

// lightning rod on the plant room
if (has(3, 8)) {
  const roofY = base(3, 8) + STOREYS * STOREY_H;
  put(3, roofY + 4, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
