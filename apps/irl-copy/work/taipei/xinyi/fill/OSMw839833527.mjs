import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833527";
const W = 24, H = 52, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);

// Exposed faces make a cell part of the outer shell.
const boundary = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey plan: 8 storeys of 5 blocks, roof slab at y=40, parapet to 42, coping 43.
const ROOF_Y = 40;
const PARAPET_TOP = 42;
const COPING_Y = 43;

// Entrance: north face (lowest z), at the median x of that edge.
const zMin = Math.min(...cells.map(([, z]) => z));
const northXs = cells.filter(([, z]) => z === zMin).map(([x]) => x).sort((a, b) => a - b);
const entX = northXs[Math.floor(northXs.length / 2)];
const entZ = zMin;

// Penthouse / mechanical box, centred on the footprint.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const inBox = (x, z) => x >= cx - 5 && x <= cx + 4 && z >= cz - 6 && z <= cz + 5;

// Pass 1: foundations, floor slabs, interior.
for (const [x, z, gr] of cells) {
  // Plinth at y=0 and solid fill up to this cell's ground.
  for (let y = 0; y < Math.max(1, gr); y++) put(x, y, z, "stone_bricks");

  // Floor slabs per storey (air gap between them), roof slab at top.
  for (let k = 0; k <= 8; k++) {
    const y = 5 * k;
    if (y === 0) continue;
    put(x, y, z, k === 8 ? "smooth_stone" : "white_concrete");
  }

  // Roof-level mechanical penthouse.
  if (inBox(x, z)) {
    for (let y = ROOF_Y + 1; y <= 43; y++) put(x, y, z, "light_gray_concrete");
    // Louvre band on the outer edge of the box.
    const edge = x === cx - 5 || x === cx + 4 || z === cz - 6 || z === cz + 5;
    for (let y = 42; y <= 42; y++) {
      if (edge) {
        const idx = x === cx - 5 || x === cx + 4 ? z : x;
        put(x, y, z, idx % 2 === 0 ? "iron_bars" : "light_gray_concrete");
      }
    }
    put(x, 44, z, "stone");
  }
}

// Pass 2: outer shell with glazing grid, storey lines and parapet.
for (const [x, z] of cells) {
  if (!boundary(x, z)) continue;

  // Pillar index runs along the exposed face (N/S faces use x, E/W use z).
  const onNS = !has(x, z - 1) || !has(x, z + 1);
  const idx = onNS ? x : z;

  for (let y = 0; y <= PARAPET_TOP; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    let id;
    if (y === 0) id = "stone_bricks";
    else if (r === 0) id = "smooth_quartz";
    else if (r === 4) id = "white_concrete";
    else id = idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
    if (y >= ROOF_Y) id = y === ROOF_Y ? "smooth_quartz" : "white_concrete";
    put(x, y, z, id);
  }
  put(x, COPING_Y, z, "smooth_quartz");
  // Ground floor base course: stone bricks up to the shopfront glass.
  for (let y = 1; y <= 4; y++) {
    if (y === 4) put(x, y, z, "stone_bricks");
  }
}

// Glowstone behind some windows (inside the air gap).
for (const [x, z] of cells) {
  if (!boundary(x, z)) continue;
  const onNS = !has(x, z - 1) || !has(x, z + 1);
  const idx = onNS ? x : z;
  if (idx % 3 === 0) continue;
  // Inward direction from the exposed face.
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || boundary(ix, iz)) continue;
  for (const k of [1, 3, 5, 7]) {
    if ((idx + k) % 4 === 0) put(ix, 5 * k + 2, iz, "glowstone");
  }
}

// Entrance: door on the north face, lintel above, warm lantern inside.
put(entX, 1, entZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(entX, 2, entZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(entX, 3, entZ, "smooth_quartz");
if (has(entX, entZ + 1)) put(entX, 1, entZ + 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof: penthouse top, aviation mast and warning light.
if (has(cx, cz)) {
  for (let y = 45; y <= 47; y++)
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(cx, 48, cz, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
