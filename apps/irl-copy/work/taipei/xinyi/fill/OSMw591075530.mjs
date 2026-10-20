import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075530";
const W = 43, H = 33, D = 19;
const SH = 5;            // storey height in blocks
const NST = 4;           // four storeys: a 1980s-90s commercial mid-rise with tiled-look concrete bands

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());
const L = k => minG + SH * k;   // absolute floor levels
const ROOF = L(NST);            // roof deck level, about 21 above lowest ground
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const zMin = Math.min(...zs), zMax = Math.max(...zs);
const xc = Math.round((xMin + xMax) / 2);
const zc = Math.round((zMin + zMax) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// wall classification
const missZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const missX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const edge = (x, z) => missX(x, z) || missZ(x, z);

const glassProps = (alongX, base) => alongX
  ? { ...base, east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { ...base, north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ed = edge(x, z);
  const mz = missZ(x, z), mx = missX(x, z);
  const corner = mz && mx;
  const alongX = mz && !mx;             // wall runs along x
  const alongZ = mx && !mz;             // wall runs along z
  const pIdx = alongX ? x : z;
  const frontZ = mz && z === zMin;      // street-facing wall
  // inward offset for lights behind glass
  const dx = alongZ ? (x === xMin ? 1 : -1) : 0;
  const dz = alongX ? (z === zMin ? 1 : -1) : 0;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    const k = Math.min(NST - 1, Math.floor((y - minG) / SH));
    const r = y - L(k);

    if (r === 0) {                       // floor slab / storey line
      put(x, y, z, ed ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!ed) continue;                   // interior air

    if (r === 4) {                       // spandrel band
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // window zone r = 1..3
    const pier = corner || pIdx % 3 === 0;
    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (k === 0 && frontZ && x === xc) {
      // entrance door, two blocks high, facing the street (north)
      const half = r === 1 ? "lower" : "upper";
      if (r <= 2) {
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "glass_pane", glassProps(alongX, {}));
      }
      continue;
    }
    if (k === 0) {
      put(x, y, z, "glass_pane", glassProps(alongX, {}));
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", glassProps(alongX, {}));
    }
    // warm light behind some glass on upper storeys, plus a lantern in the entrance hall
    if (r === 2 && (alongX || alongZ) && has(x + dx, z + dz)) {
      if (k === 0 && frontZ && x === xc + 1) {
        // no extra light here
      } else if ((x + z + k) % 4 === 0) {
        put(x + dx, y, z + dz, "shroomlight");
      }
    }
  }

  // entrance lantern inside the lobby, standing on the ground-floor slab
  if (frontZ && x === xc && has(x, z + 1)) {
    put(x, L(0) + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // parapet and cornice cap on the roof edge
  if (ed) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // roof equipment: central penthouse core and mechanical boxes
  if (!ed && Math.abs(x - xc) <= 4 && Math.abs(z - zc) <= 3) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (!ed && x % 7 === 2 && z % 5 === 1) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

// mast on the penthouse, with a lightning rod crown
for (let y = ROOF + 1; y <= ROOF + 4; y++) {
  put(xc, y, zc, y === ROOF + 4 ? "lightning_rod" : "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
