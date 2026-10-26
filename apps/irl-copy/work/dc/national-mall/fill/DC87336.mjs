import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC87336.cells.json`, "utf8"));

const W = 19, H = 32, D = 17;
const vox = new Voxels([W, H, D]);

// ---- cell model -----------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), { g: Math.max(0, Math.round(gr)), r: Math.round(rf) });
}
const has = (x, z) => raw.has(key(x, z));
const get = (x, z) => raw.get(key(x, z));

// Smooth lidar roof noise: 3x3 median over present neighbours, then clamp.
const list = [];
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const rs = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (has(x + dx, z + dz)) rs.push(get(x + dx, z + dz).r);
  rs.sort((a, b) => a - b);
  const med = rs[Math.floor(rs.length / 2)];
  const rr = Math.min(26, Math.max(c.g + 6, med));
  list.push({ x, z, g: c.g, rr });
}

const minX = Math.min(...list.map((c) => c.x));
const maxX = Math.max(...list.map((c) => c.x));
const minZ = Math.min(...list.map((c) => c.z));
const maxZ = Math.max(...list.map((c) => c.z));
const xMid = (minX + maxX) / 2;

// Entrance: perimeter cell on the minimum-z face nearest the middle x.
const faceCells = list.filter((c) => c.z === minZ).sort((a, b) => Math.abs(a.x - xMid) - Math.abs(b.x - xMid));
const door = faceCells[0] || null;

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

// ---- 1. foundations (solid from y0 up to each cell's ground) ---------------
for (const c of list) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
}

// ---- 2. floor slabs per storey (3-block storeys) across the footprint ------
for (const c of list) {
  for (let y = c.g + 3; y < c.rr - 1; y += 3) put(c.x, y, c.z, "smooth_stone");
}

// ---- 3. perimeter facade ---------------------------------------------------
// Piers follow the bay grid of each face (x-bays on N/S faces, z-bays on E/W
// faces), with full corner piers. This avoids the diagonal checker look.
for (const c of list) {
  const { x, z, g: gr, rr } = c;
  const N = has(x, z - 1), S = has(x, z + 1), Wd = has(x - 1, z), E = has(x + 1, z);
  if (N && S && Wd && E) continue;
  const exposedZ = !N || !S;   // on a north/south face
  const exposedX = !Wd || !E;  // on an east/west face
  const corner = exposedZ && exposedX;
  let pier;
  if (corner) pier = true;
  else if (exposedZ) pier = (x - minX) % 3 === 0 || x === maxX;
  else pier = (z - minZ) % 3 === 0 || z === maxZ;

  for (let y = gr; y < rr; y++) {
    const k = y - gr;
    let id;
    if (k === 0) {
      id = "polished_andesite";                       // plinth
    } else if (y === rr - 1) {
      id = "smooth_stone";                            // cornice cap
    } else if (y === rr - 2) {
      id = "stone_bricks";                            // cornice band
    } else if (k % 3 === 0) {
      id = "calcite";                                 // storey line
    } else if (pier) {
      id = "calcite";                                 // pier
    } else if (k % 3 === 1 && (k === 1)) {
      id = "glass_pane";                              // ground-floor window
    } else {
      // upper windows: glass, with rare warm glowstone behind the glass
      id = ((x * 5 + z * 11 + y) % 23 === 0) ? "glowstone" : "glass_pane";
    }
    put(x, y, z, id);
  }

  // parapet on the roof edge
  put(x, rr, z, "calcite");
  if (rr + 1 < H) put(x, rr + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- 4. entrance -----------------------------------------------------------
if (door) {
  const { x, z, g: gr } = door;
  // door opening
  put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // flanking piers in stone to frame the door
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      put(x + dx, gr, z, "stone_bricks");
      put(x + dx, gr + 1, z, "stone_bricks");
    }
  }
  // stone canopy over the door, lit by hanging lanterns
  put(x, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) put(x + dx, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  // warm lamp flanking the entrance, on the pier
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) put(x + dx, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- 5. roof deck ----------------------------------------------------------
for (const c of list) put(c.x, c.rr - 1, c.z, "smooth_stone");

// ---- 6. roof equipment: penthouse on each cell's own roof level ------------
const pent = list.filter((c) => c.x >= 6 && c.x <= 12 && c.z >= 6 && c.z <= 10);
for (const c of pent) {
  const edge = c.x === 6 || c.x === 12 || c.z === 6 || c.z === 10;
  // penthouse floor sits on this cell's own roof deck
  put(c.x, c.rr, c.z, "smooth_stone");
  if (edge) {
    for (let y = c.rr + 1; y <= c.rr + 2; y++) {
      const win = y === c.rr + 1 && (c.x + c.z) % 2 === 0;
      put(c.x, y, c.z, win ? "glass_pane" : "calcite");
    }
  }
  // roof slab over the penthouse
  put(c.x, c.rr + 3, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

vox.save(`${dir}/DC87336.nbt`);
