import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173685";
const W = 14, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup. Ground rise is clamped to 2 so the shopfront keeps its full height.
const gr = new Map();
for (const [x, z, gy] of cells) {
  gr.set(`${x},${z}`, Math.min(2, Math.max(0, Math.round(gy))));
}
const has = (x, z) => gr.has(`${x},${z}`);
const groundOf = (x, z) => gr.get(`${x},${z}`);
const list = cells.map(([x, z]) => [x, z]);

const put = (x, y, z, id, p) => {
  if (!has(x, z)) return;
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (N = -z, S = +z, W = -x, E = +x).
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// Glass panes connect along the wall they sit in.
const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation and ground floor slab on every footprint cell.
for (const [x, z] of list) {
  const gc = groundOf(x, z);
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");
  put(x, gc, z, "stone_bricks");
}

// 2. Storey slab at y=5 and roof slab at y=10 across the whole footprint.
for (const [x, z] of list) {
  put(x, 5, z, "smooth_stone");
  put(x, 10, z, faces(x, z).length ? "light_gray_concrete" : "smooth_stone");
}

// 3. Interior structural columns (not on the perimeter), so slabs are carried.
for (const [cx, cz] of [[4, 7], [9, 7], [4, 15], [9, 15]]) {
  if (!has(cx, cz) || faces(cx, cz).length) continue;
  for (let y = groundOf(cx, cz) + 1; y <= 10; y++) put(cx, y, cz, "white_concrete");
}

// 4. Perimeter facades: base course, ground shopfront, upper window grid, spandrels, parapet.
const perim = [];
for (const [x, z] of list) {
  const f = faces(x, z);
  if (!f.length) continue;
  perim.push({ x, z, f });
  const gc = groundOf(x, z);
  const face = f[0];
  const corner = f.length >= 2;
  const idx = face === "N" || face === "S" ? x : z;
  const pillar = corner || idx % 3 === 0;
  const pp = paneProps(face);

  put(x, gc, z, "stone_bricks");
  for (let y = gc + 1; y <= 3; y++) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", pp);
  }
  put(x, 4, z, "white_concrete");
  for (let y = 6; y <= 8; y++) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", pp);
  }
  put(x, 9, z, "white_concrete");
  put(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Entrance: prefer the north (z-minimum) face, nearest to x=6.
let door = null;
for (const p of perim) {
  if (!p.f.includes("N")) continue;
  if (!door || Math.abs(p.x - 6) < Math.abs(door.x - 6)) door = p;
}
if (!door) door = perim[0];
let doorFace = null;
let doorIdx = -99;
if (door) {
  const face = door.f.includes("N") ? "N" : door.f[0];
  const gc = groundOf(door.x, door.z);
  doorFace = face;
  doorIdx = face === "N" || face === "S" ? door.x : door.z;
  const base = { facing: FACING[face], hinge: "left", open: "false", powered: "false" };
  put(door.x, gc + 1, door.z, "dark_oak_door", { ...base, half: "lower" });
  put(door.x, gc + 2, door.z, "dark_oak_door", { ...base, half: "upper" });
  put(door.x, gc + 3, door.z, "light_gray_concrete");
}

// 6. Warm lights just inside the glass: lanterns at the shopfront, shroomlights upstairs.
for (const p of perim) {
  const face = p.f[0];
  if (p.f.length >= 2) continue;
  const idx = face === "N" || face === "S" ? p.x : p.z;
  const pillar = idx % 3 === 0;
  if (pillar) continue;
  const [dx, dz] = IN[face];
  const ix = p.x + dx, iz = p.z + dz;
  if (!has(ix, iz) || faces(ix, iz).length) continue;
  const gc = groundOf(p.x, p.z);
  if (idx % 6 === 2 && !(face === doorFace && Math.abs(idx - doorIdx) <= 1)) {
    put(ix, gc + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (idx % 6 === 1) {
    put(ix, 7, iz, "shroomlight");
  }
}

// 7. Roof equipment: a small steel water tank, placed near the back corner if it fits.
let tank = null;
for (let cz = 4; cz <= 17; cz++) {
  for (let cx = 3; cx <= 10; cx++) {
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dz = -1; dz <= 1 && ok; dz++) {
        const x = cx + dx, z = cz + dz;
        if (!has(x, z) || faces(x, z).length) ok = false;
      }
    if (ok && (!tank || Math.abs(cx - 10) + Math.abs(cz - 17) < Math.abs(tank[0] - 10) + Math.abs(tank[1] - 17))) {
      tank = [cx, cz];
    }
  }
}
if (tank) {
  const [cx, cz] = tank;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const corner = Math.abs(dx) === 1 && Math.abs(dz) === 1;
      if (corner) continue;
      for (let y = 11; y <= 13; y++) put(cx + dx, y, cz + dz, "iron_block");
      put(cx + dx, 14, cz + dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
}

g.save(`${DIR}/${ID}.nbt`);
