import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 筑丰美硯 (2007), Xinyi district, Taipei. 18 x 26 footprint, roof about 35 blocks up.
// Seven storeys of 5 blocks: white concrete spandrels, quartz piers every third bay,
// light-blue glass bands, a stone-base entrance, a parapet with cap, a lower south
// wing as a setback, and a light roof penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE96-0235-7F.cells.json`, "utf8"));

const W = 18, H = 47, D = 26;
const ROOF = 35;        // main roof surface height above lowest ground
const WING_ROOF = 30;   // setback wing roof surface height
const STOREY = 5;

// ---- footprint bookkeeping -------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  E: !has(x + 1, z),
  W: !has(x - 1, z),
});
const isPerim = (x, z) => Object.values(exposed(x, z)).some(Boolean);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// South wing: the southern third of the footprint stops at the setback height.
const isWing = (x, z) => z >= maxZ - 7;
const topOf = (x, z) => (isWing(x, z) ? WING_ROOF : ROOF);

// ---- block map (two-pass so glass panes can compute connections) -----------
const blocks = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  blocks.set(`${x},${y},${z}`, { x, y, z, id, props });
};
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// 1) foundation, floors, facade, parapet
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const ex = exposed(x, z);
  const faces = Object.values(ex).filter(Boolean).length;
  const corner = faces >= 2;
  const idx = (ex.N || ex.S) ? x : z;
  const pier = corner || idx % 3 === 0;
  const top = topOf(x, z);

  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // floor slabs, facade, roof
  for (let y = g; y <= top; y++) {
    const rel = y % STOREY;
    if (rel === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!perim) continue;
    if (rel === 4) {
      put(x, y, z, "white_concrete");                 // spandrel
    } else if (pier) {
      put(x, y, z, "smooth_quartz");                  // pier, lighter than spandrel
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");  // window
    }
  }

  // parapet and cornice cap at each roof level
  if (perim) {
    put(x, top + 1, z, "white_concrete");
    put(x, top + 2, z, "white_concrete");
    put(x, top + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2) entrance on the north (street-side, minimum z) face
const northCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => exposed(x, z).N);
const frontZ = Math.min(...northCells.map(([, z]) => z));
const frontXs = northCells.filter(([, z]) => z === frontZ).map(([x]) => x).sort((a, b) => a - b);
const dx = frontXs[Math.floor(frontXs.length / 2)];
const dz = frontZ;
const gd = gAt(dx, dz);

// stone surround: flanking piers and a lintel over the door
for (const ox of [-1, 1]) {
  for (let y = gd; y <= gd + 3; y++) put(dx + ox, y, dz, "stone_bricks");
}
for (let ox = -1; ox <= 1; ox++) put(dx + ox, gd + 3, dz, "stone_bricks");
// door
put(dx, gd, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, gd + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// shopfront glass beside the door
for (const ox of [-3, -2, 2, 3]) {
  if (has(dx + ox, dz)) {
    put(dx + ox, gd + 1, dz, "light_blue_stained_glass_pane");
    put(dx + ox, gd + 2, dz, "light_blue_stained_glass_pane");
  }
}

// 3) warm lights behind some windows (interior cell just inside the glass)
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const ex = exposed(x, z);
  const faces = Object.values(ex).filter(Boolean).length;
  if (faces >= 2) continue;
  const idx = (ex.N || ex.S) ? x : z;
  if (idx % 3 === 0) continue;                    // piers, no window
  let ix = x, iz = z;
  if (ex.N) iz = z + 1;
  else if (ex.S) iz = z - 1;
  else if (ex.E) ix = x - 1;
  else if (ex.W) ix = x + 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const top = topOf(ix, iz);
  for (let k = 0; k * STOREY < top; k++) {
    const yb = k * STOREY;
    if ((k + idx) % 2 !== 0) continue;             // stagger across storeys
    if (idx % 6 !== 1) continue;                    // sparse
    if (yb < gAt(ix, iz) || yb + 1 >= top) continue;
    put(ix, yb + 1, iz, "glowstone");
  }
}

// 4) roof penthouse on the main roof, light stone so it does not read as a dark block
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z) || isWing(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "smooth_quartz");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
put(cx, ROOF + 5, cz, "lightning_rod");

// ---- emit ------------------------------------------------------------------
// glass panes: connect to any neighbouring block in the same row
const dirs = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const b of blocks.values()) {
  if (!b.id.endsWith("glass_pane")) continue;
  const props = { waterlogged: "false" };
  for (const [name, [ox, oz]] of Object.entries(dirs)) {
    const n = at(b.x + ox, b.y, b.z + oz);
    props[name] = n && n.id !== "glowstone" && n.id !== "lightning_rod" ? "true" : "false";
  }
  b.props = props;
}

const g = new Voxels([W, H, D]);
for (const b of blocks.values()) {
  if (b.props) g.set(b.x, b.y, b.z, b.id, b.props);
  else g.set(b.x, b.y, b.z, b.id);
}
g.save(`${DIR}/TPE96-0235-7F.nbt`);
