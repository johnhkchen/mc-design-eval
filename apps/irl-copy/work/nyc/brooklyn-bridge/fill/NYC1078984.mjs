import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 51, H = 23, D = 32;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1078984.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint index
const cm = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c.map((v) => Math.round(v));
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  cm.set(`${x},${z}`, { x, z, ground: Math.max(0, gr), roof });
}
const has = (x, z) => cm.has(`${x},${z}`);
const isExterior = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Massing: roof from lidar, flattened to whole storeys of 2 blocks
const tops = new Map();
for (const c of cm.values()) {
  let top = Math.round(c.roof / 2) * 2;
  top = Math.max(top, c.ground + 4);
  top = Math.min(top, H - 4);
  tops.set(`${c.x},${c.z}`, top);
}

// Entrance on the north (min z) face, centred
let minZ = Infinity;
for (const c of cm.values()) minZ = Math.min(minZ, c.z);
const northXs = [...cm.values()].filter((c) => c.z === minZ).map((c) => c.x).sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

// Pass 1: foundations, floors, interiors
for (const c of cm.values()) {
  const { x, z, ground } = c;
  const top = tops.get(`${x},${z}`);
  const ext = isExterior(x, z);

  for (let y = 0; y < ground; y++) put(x, y, z, "stone");

  if (!ext) {
    put(x, ground, z, "smooth_stone");
    for (let y = ground + 2; y < top - 1; y += 2) put(x, y, z, "smooth_stone");
    put(x, top - 1, z, "gray_concrete");
  }
}

// Pass 2: facades (exterior cells)
for (const c of cm.values()) {
  const { x, z, ground } = c;
  if (!isExterior(x, z)) continue;
  const top = tops.get(`${x},${z}`);
  // Position along the wall: x for north/south faces, z for east/west faces
  const t = (!has(x + 1, z) || !has(x - 1, z)) ? z : x;

  for (let y = ground; y < top; y++) {
    const off = y - ground;
    if (off === 0) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }      // parapet cap
    if (off % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }      // floor line / spandrel
    // window row
    const pier = t % 4 === 0;
    if (pier) { put(x, y, z, "bricks"); continue; }
    const warm = (t % 12 === 2) && off === 3;
    put(x, y, z, warm ? "glowstone" : "gray_stained_glass");
  }
}

// Pass 3: entrance with stone surround, lintel and door
if (doorX >= 0) {
  const gr = cm.get(`${doorX},${minZ}`).ground;
  put(doorX, gr + 1, minZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 2, minZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Surround jambs and lintel
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, minZ)) {
      put(doorX + dx, gr + 1, minZ, "stone_bricks");
      put(doorX + dx, gr + 2, minZ, "stone_bricks");
    }
  }
  put(doorX, gr + 3, minZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
  if (has(doorX - 1, minZ)) put(doorX - 1, gr + 3, minZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
  if (has(doorX + 1, minZ)) put(doorX + 1, gr + 3, minZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // Lantern under the lintel
  put(doorX, gr + 2, minZ - 0 + 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof deck on exterior cells already handled by parapet; penthouse as a solid block
const xs = [...cm.values()].map((c) => c.x);
const zs = [...cm.values()].map((c) => c.z);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);
const px0 = x0 + Math.round((x1 - x0) * 0.3), px1 = x0 + Math.round((x1 - x0) * 0.7);
const pz0 = z0 + Math.round((z1 - z0) * 0.25), pz1 = z0 + Math.round((z1 - z0) * 0.6);

for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const top = tops.get(`${x},${z}`);
    if (top + 3 > H) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = top; y < top + 3; y++) {
      let block = "light_gray_concrete";
      if (y === top + 2) block = "stone_bricks";
      else if (edge && y === top + 1 && (x + z) % 2 === 0) block = "light_gray_stained_glass";
      put(x, y, z, block);
    }
  }
}

g.save(`${DIR}/NYC1078984.nbt`);
