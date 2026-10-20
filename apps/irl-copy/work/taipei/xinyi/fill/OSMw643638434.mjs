import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643638434";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 44 x 18 footprint, roof ~26 above lowest ground, about five storeys of ~5 blocks.
// Read as a late-1990s/2000s Xinyi-style commercial block: white concrete frame,
// stone-clad ground storey with shopfront glazing, and a stepped roof with plant.
const W = 44, H = 38, D = 18;
const ROOF = 26;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const exposedN = (x, z) => !has(x, z - 1);
const exposedS = (x, z) => !has(x, z + 1);
const exposedW = (x, z) => !has(x - 1, z);
const exposedE = (x, z) => !has(x + 1, z);
const isExposed = (x, z) => has(x, z) && (exposedN(x, z) || exposedS(x, z) || exposedW(x, z) || exposedE(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, walls, windows, parapet
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const eN = exposedN(x, z), eS = exposedS(x, z), eW = exposedW(x, z), eE = exposedE(x, z);
  const exposed = eN || eS || eW || eE;
  const corner = (eN || eS) && (eW || eE);
  const facadeAlongX = eN || eS; // wall runs east-west, index by x

  // Foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
  put(x, gr, z, "smooth_stone");

  // Body from just above ground to roof
  for (let y = gr + 1; y <= ROOF; y++) {
    const s = Math.floor(y / 5);
    const r = y % 5;

    if (y === ROOF) {
      put(x, y, z, exposed ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (r === 0) {
      // storey line slab
      put(x, y, z, exposed ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!exposed) continue; // interior air behind the facade

    const idx = facadeAlongX ? x : z;
    const pillar = corner || idx % 3 === 0;

    if (s === 0) {
      // Ground storey: stone base, shopfront glazing on pillar grid, stone lintel
      if (r === 4) { put(x, y, z, "stone_bricks"); continue; }
      if (pillar) { put(x, y, z, "polished_andesite"); continue; }
      put(x, y, z, "glass_pane", facadeAlongX ? PANE_EW : PANE_NS);
      continue;
    }
    // Upper storeys: white concrete spandrel band, window grid with frames
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }
    if (pillar) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "glass_pane", facadeAlongX ? PANE_EW : PANE_NS);
  }

  // Parapet and cornice on the roof edge
  if (exposed) {
    put(x, ROOF + 1, z, "stone_bricks");
  }
}

// Pass 2: warm lights behind some upper-storey windows (in the air gap inside)
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isExposed(x, z)) continue;
  const eN = exposedN(x, z), eS = exposedS(x, z), eW = exposedW(x, z), eE = exposedE(x, z);
  const corner = (eN || eS) && (eW || eE);
  if (corner) continue;
  const facadeAlongX = eN || eS;
  const idx = facadeAlongX ? x : z;
  if (idx % 3 === 0) continue;
  let ix = x, iz = z;
  if (eN) iz = z + 1; else if (eS) iz = z - 1; else if (eW) ix = x + 1; else if (eE) ix = x - 1;
  if (!has(ix, iz) || isExposed(ix, iz)) continue;
  for (let s = 1; s <= 4; s++) {
    const y = s * 5 + 2;
    if (y > ROOF - 1) continue;
    if (y <= gAt(ix, iz)) continue;
    if (((x * 7 + z * 3 + s * 5) % 5) === 0) {
      put(ix, y, iz, (x + z + s) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// Pass 3: entrance on the south face (z = D-1), two-leaf door with transom
for (const x of [21, 22]) {
  const z = D - 1;
  if (!has(x, z) || !exposedS(x, z)) continue;
  const hinge = x === 21 ? "left" : "right";
  put(x, 1, z, "oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, z, "oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 3, z, "glass");
}

// Pass 4: roof plant boxes on interior roof cells
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isExposed(x, z)) continue;
  if (x % 8 === 3 && z % 6 === 2) {
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  }
}

// Pass 5: central stepped penthouse (core x 14..29, z 6..11), on the roof slab
const PX0 = 14, PX1 = 29, PZ0 = 6, PZ1 = 11;
let penthouseOk = true;
for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++) if (!has(x, z)) penthouseOk = false;
if (penthouseOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const rim = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      for (let y = ROOF + 1; y <= ROOF + 3; y++) {
        if (rim) {
          if (y === ROOF + 2 && (x + z) % 4 === 0) put(x, y, z, "glass_pane", PANE_EW);
          else put(x, y, z, "white_concrete");
        }
      }
      put(x, ROOF + 4, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
