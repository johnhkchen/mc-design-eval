import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義雅致 (2006): an 11-storey residential-over-retail tower in the Xinyi district.
// White tiled wall with a light-grey floor band, blue-glass curtain-wall bays,
// granite base course, a lobby with a two-leaf door on the street face, and a
// roof penthouse with a lightning-rod mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0030-12F";
const W = 25, H = 71, D = 31;
const STOREYS = 11, STOREY_H = 5;
const ROOF = STOREYS * STOREY_H; // 55: roof deck layer

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// exposed faces of a footprint cell: N = -z side, S = +z, W = -x, E = +x
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// ---- voxel helpers -----------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// entrance: the north (minimum-z) street face, centred on its non-corner cells
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const northCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === minZ && faces(x, z).length === 1);
const mid = northCells.length
  ? Math.round((Math.min(...northCells.map((c) => c[0])) + Math.max(...northCells.map((c) => c[0]))) / 2)
  : -99;

const faceCode = { N: 0, S: 1, E: 2, W: 3 };
const litWindows = [];

// ---- body, per footprint cell ------------------------------------------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gd = gr;
  const ext = faces(x, z);

  // foundation under the cell
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");

  for (let y = gd; y <= 58; y++) {
    if (y === ROOF) {
      put(x, y, z, "light_gray_concrete"); // roof deck
      continue;
    }
    if (y > ROOF) {
      if (ext.length) {
        if (y <= 57) put(x, y, z, "white_concrete");              // parapet
        else put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // coping
      }
      continue;
    }

    const k = Math.floor(y / STOREY_H);
    const o = y % STOREY_H;

    if (!ext.length) {
      // interior: a floor slab at the base of the body and at each storey line
      if (y === gd || o === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (ext.length >= 2) {
      // corner fin
      if (y === gd) put(x, y, z, "polished_granite");
      else put(x, y, z, o === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    const face = ext[0];
    if (y === gd) { put(x, y, z, "polished_granite"); continue; }   // base course
    if (o === 0) { put(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete"); continue; }
    if (o === 4) { put(x, y, z, "white_concrete"); continue; }        // storey line

    const idx = face === "N" || face === "S" ? x : z;
    if (idx % 3 === 0) {
      put(x, y, z, "white_concrete");                                 // mullion
    } else {
      const blk = k % 2 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
      put(x, y, z, blk, paneProps(face));
      // interior cell one step behind the glass (air gap otherwise)
      if (o === 2 && k >= 0 && ((idx * 7 + k * 5 + faceCode[face]) % 4 === 0)) {
        const dx = face === "E" ? -1 : face === "W" ? 1 : 0;
        const dz = face === "N" ? 1 : face === "S" ? -1 : 0;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && gAt(ix, iz) <= y) litWindows.push({ x: ix, y, z: iz, alt: idx % 2 });
      }
    }
  }
}

// warm lights behind selected windows
for (const l of litWindows) {
  put(l.x, l.y, l.z, l.alt ? "shroomlight" : "glowstone");
}

// ---- entrance: two-leaf door, lintel canopy, lobby lanterns -------------------
if (mid > -99) {
  for (const xd of [mid - 1, mid]) {
    if (!has(xd, minZ)) continue;
    const gg = gAt(xd, minZ);
    const hinge = xd === mid - 1 ? "left" : "right";
    const doorBase = { facing: "north", hinge, open: "false", powered: "false" };
    put(xd, gg, minZ, "dark_oak_door", { ...doorBase, half: "lower" });
    put(xd, gg + 1, minZ, "dark_oak_door", { ...doorBase, half: "upper" });
  }
  // canopy lintel across the entrance bay, sitting on the wall above the doors
  for (let xd = mid - 2; xd <= mid + 1; xd++) {
    if (!has(xd, minZ)) continue;
    const gg = gAt(xd, minZ);
    if (gg + 2 <= ROOF - 1) put(xd, gg + 2, minZ, "polished_granite");
  }
  // lobby lanterns just inside the doors
  for (const lx of [mid - 3, mid + 2]) {
    if (!has(lx, minZ + 1)) continue;
    const gg = gAt(lx, minZ + 1);
    put(lx, gg + 1, minZ + 1, "lantern", { hanging: "false" });
  }
}

// ---- roof penthouse and plant ------------------------------------------------
const PX0 = 5, PX1 = W - 6, PZ0 = 5, PZ1 = D - 6;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, 56, z, "light_gray_concrete");                 // penthouse floor on roof deck
    if (wall) {
      put(x, 57, z, "light_gray_concrete");
      put(x, 58, z, "light_gray_concrete");
    }
    put(x, 59, z, "smooth_stone");                        // penthouse roof
  }
}
// condenser units on the open roof deck
for (const [ux, uz] of [[2, 10], [2, 11], [22, 20], [22, 21], [12, 28]]) {
  if (has(ux, uz)) put(ux, 56, uz, "iron_block");
}
// lightning-rod mast on the penthouse roof
if (has(12, 15)) {
  for (let y = 60; y <= 63; y++) put(12, y, 15, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
