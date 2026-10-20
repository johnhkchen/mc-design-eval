import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw1156915581";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 20, H = 23, D = 21;

// Record: ~11 blocks from lowest ground to roof, footprint 20 x 21.
// Read as a two-storey 1980s-2000s Xinyi-style commercial block: white-tiled
// concrete frame, granite base, shopfront with a dark fascia and a central
// entrance, storey bands, a stone cornice and a light parapet, rooftop AC units.

const cellsRaw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr] of cellsRaw) S.set(k(x, z), gr);
const has = (x, z) => S.has(k(x, z));

const maxG = Math.max(...cellsRaw.map((c) => c[2]));
const base = maxG + 1;              // first storey floor, above the highest foundation
const top = base + 11;              // parapet top

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces of a footprint cell: neighbours missing from the footprint.
const faces = (x, z) => {
  const out = [];
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    if (!has(x + dx, z + dz)) out.push({ dx, dz });
  }
  return out;
};

const paneProps = (f) => {
  const ew = f.some((d) => d.dz !== 0);  // wall runs east-west
  const ns = f.some((d) => d.dx !== 0);  // wall runs north-south
  return {
    north: String(ns), south: String(ns),
    east: String(ew), west: String(ew),
    waterlogged: "false",
  };
};

// Entrance: the middle north-facing perimeter cell (street side, lowest z).
const northCells = cellsRaw
  .filter(([x, z]) => faces(x, z).some((d) => d.dx === 0 && d.dz === -1))
  .sort((a, b) => a[0] - b[0]);
const door = northCells.length
  ? northCells[Math.floor(northCells.length / 2)]
  : null;

// 1) Foundation, floors, walls, cornice, parapet.
for (const [x, z, gr] of cellsRaw) {
  // Foundation: solid from y 0 up through the cell's ground and up to the base.
  for (let y = 0; y <= maxG; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const per = f.length > 0;

  // Floor slabs at each storey level, roof deck at the top of the storeys.
  put(x, base, z, per ? "polished_granite" : "smooth_stone");
  put(x, base + 5, z, "smooth_stone");
  put(x, base + 10, z, per ? "stone_bricks" : "light_gray_concrete");

  if (!per) continue;

  const idx = f.some((d) => d.dz !== 0) ? x : z;  // bay index along the wall
  const pillar = idx % 3 === 0;
  const pp = paneProps(f);

  // Storey 1: shopfront glass under a dark fascia.
  for (let y = base + 1; y <= base + 3; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", pp);
  }
  put(x, base + 4, z, "black_concrete");

  // Storey 2: light bands above and below the window row.
  put(x, base + 6, z, "light_gray_concrete");
  put(x, base + 9, z, "light_gray_concrete");
  for (let y = base + 7; y <= base + 8; y++) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", pp);
  }

  // Parapet on the cornice.
  put(x, base + 11, z, "light_gray_concrete");
}

// 2) Warm lights behind some upper-storey windows (inside cells only).
for (const [x, z] of cellsRaw) {
  const f = faces(x, z);
  if (!f.length) continue;
  const bay = f.some((d) => d.dz !== 0) ? x : z;
  if (bay % 3 === 0) continue;
  if ((bay + x + z) % 6 !== 1) continue;
  const d = f[0];
  const ix = x - d.dx, iz = z - d.dz;
  if (has(ix, iz) && faces(ix, iz).length === 0) {
    put(ix, base + 7, iz, "glowstone");
  }
}

// 3) Entrance: double door, canopy on the fascia, hanging lantern.
if (door) {
  const [dx0, dz0] = door;
  put(dx0, base + 1, dz0, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx0, base + 2, dz0, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(dx0, base + 3, dz0, "lantern", { hanging: "true", waterlogged: "false" });
  for (const e of [-1, 1]) {
    const cx = dx0 + e;
    if (has(cx, dz0) && faces(cx, dz0).some((d) => d.dz === -1)) {
      put(cx, base + 4, dz0, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
  put(dx0, base + 4, dz0, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// 4) Rooftop plant: sparse AC units on the roof deck.
for (const [x, z] of cellsRaw) {
  if (faces(x, z).length) continue;
  if ((x * 5 + z * 3) % 13 === 0) put(x, base + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
