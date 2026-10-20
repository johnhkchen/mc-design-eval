import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833562";
const W = 18, H = 23, D = 19;
const ROOF = 11;     // roof deck top, blocks above lowest ground
const BAND = 6;      // storey line between the two storeys (about 5 blocks per storey)

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.round(gr ?? 0));
}
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const outs = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

const keys = [...ground.keys()].map(k => k.split(",").map(Number));
const minX = Math.min(...keys.map(k => k[0])), maxX = Math.max(...keys.map(k => k[0]));
const minZ = Math.min(...keys.map(k => k[1])), maxZ = Math.max(...keys.map(k => k[1]));
const midX = Math.floor((minX + maxX) / 2);
const midZ = Math.floor((minZ + maxZ) / 2);

// ---- voxel helpers ---------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// ---- pass 1: foundation, floors, shell, roof --------------------------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground above the roof line: just cap the cell
  if (gr >= ROOF) { put(x, gr, z, "gray_concrete"); continue; }

  const o = outs(x, z);
  const edge = o.length > 0;
  const corner = o.length >= 2;

  // ground-level floor / base course
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  if (!edge) {
    // interior: second-floor slab and roof deck, air between (no interiors)
    if (BAND > gr) put(x, BAND, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // exterior shell
  const f = o[0];
  const idx = (f === "north" || f === "south") ? x : z;
  for (let y = gr + 1; y < ROOF; y++) {
    let b;
    if (corner) b = "light_gray_concrete";
    else if (y === BAND) b = "smooth_quartz";
    else if (y < BAND) b = idx % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
    else b = idx % 3 === 0 ? "light_gray_concrete"
           : idx % 3 === 1 ? "gray_stained_glass"
           : "white_concrete";
    put(x, y, z, b);
  }

  // cornice, parapet and cap
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- pass 2: entrance, warm lights, roof equipment --------------------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr >= ROOF) continue;
  const o = outs(x, z);
  if (o.length === 0 || o.length >= 2) continue;

  const f = o[0];
  const [ox, oz] = DIRS[f];
  const idx = (f === "north" || f === "south") ? x : z;

  // entrance on the north face, two bays wide at the centre
  if (f === "north" && z === minZ && (x === midX || x === midX + 1) && gr + 2 <= BAND - 1) {
    const hinge = x === midX ? "left" : "right";
    put(x, gr + 1, z, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    for (let y = gr + 3; y < BAND; y++) put(x, y, z, "light_blue_stained_glass");
  }

  // warm lights set behind the glass, inside the shell
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz)) continue;
  if (idx % 6 === 1 && 8 < ROOF) put(ix, 8, iz, "shroomlight");
  const ly = gr + 2;
  if (idx % 6 === 2 && ly <= BAND - 1 && ly > gr) put(ix, ly, iz, "glowstone");
}

// entrance: glowstone above the doors, behind the transom glass
if (has(midX, minZ + 1) && ground.get(`${midX},${minZ}`) + 4 < BAND) {
  put(midX, ground.get(`${midX},${minZ}`) + 4, minZ + 1, "glowstone");
}

// parapet cap handled in pass 1; roof equipment on the interior deck
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr >= ROOF) continue;
  if (outs(x, z).length > 0) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
  }
}
if (has(midX, midZ) && (ground.get(`${midX},${midZ}`) < ROOF)) {
  for (let y = ROOF + 1; y <= ROOF + 3; y++) put(midX, y, midZ, "iron_block");
  put(midX, ROOF + 4, midZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
