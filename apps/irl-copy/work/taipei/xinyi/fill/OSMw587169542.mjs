import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-district office block, c. 1990s: four storeys of white
// concrete piers and tinted glass over a stone-clad base, with a grey
// cornice, a roof deck, a plant penthouse and a canopied entrance on the
// north (Xinyi Road-side) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169542";
const W = 23, H = 33, D = 13;

const ROOF = 21;   // parapet top, measured from the lowest ground
const FLOOR = 5;   // blocks per storey (1.4 blocks/m scale, ~3.5 m storeys)

const BASE = "stone_bricks";
const WALL = "white_concrete";
const LINE = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const list = cells.map(([x, z]) => [x, z]);
const minX = Math.min(...list.map(c => c[0]));
const maxX = Math.max(...list.map(c => c[0]));
const minZ = Math.min(...list.map(c => c[1]));

// Entrance: middle of the north (minZ) face.
const northXs = list.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const entX = northXs[Math.floor(northXs.length / 2)];

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const lights = [];

// ---- Shell, storeys, base, cornice, parapet --------------------------------
for (const [cx, cz] of list) {
  const g0 = ground.get(key(cx, cz));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) set(cx, y, cz, BASE);

  const N = !has(cx, cz - 1), S = !has(cx, cz + 1);
  const Wf = !has(cx - 1, cz), E = !has(cx + 1, cz);
  const edge = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);

  if (!edge) {
    // Interior: ground slab, floor slabs at each storey line, air between.
    set(cx, g0, cz, LINE);
    for (let k = 1; k <= 4; k++) {
      const y = FLOOR * k;
      if (y > g0) set(cx, y, cz, LINE);
    }
    continue;
  }

  const isEntrance = N && cz === minZ && cx === entX;
  const onNorth = N && cz === minZ;

  for (let y = g0; y <= ROOF; y++) {
    // Canopy over the entrance, spanning the cells either side of the door.
    if (onNorth && Math.abs(cx - entX) <= 1 && y === g0 + 3) {
      set(cx, y, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (isEntrance && y <= g0 + 2) {
      if (y === g0) { set(cx, y, cz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === g0 + 1) { set(cx, y, cz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      set(cx, y, cz, GLASS, paneEW); // transom
      continue;
    }

    if (y === g0) { set(cx, y, cz, BASE); continue; }
    if (y === ROOF) { set(cx, y, cz, WALL); continue; }          // parapet
    if (y === ROOF - 1) { set(cx, y, cz, LINE); continue; }      // cornice / roof deck line
    const r = y % 5;
    if (r === 0) { set(cx, y, cz, LINE); continue; }             // storey line
    if (r === 4) { set(cx, y, cz, WALL); continue; }             // spandrel
    if (corner) { set(cx, y, cz, WALL); continue; }              // corner column

    // Window zone: piers every third bay, glass between.
    const idx = (N || S) ? cx - minX : cz - minZ;
    if (idx % 3 === 0) { set(cx, y, cz, WALL); continue; }
    set(cx, y, cz, GLASS, (N || S) ? paneEW : paneNS);

    // Warm light behind some windows, in the room just inside the glass.
    if (r === 2 && (cx * 7 + cz * 3 + y) % 4 === 0) {
      let dx = 0, dz = 0;
      if (N) dz = 1; else if (S) dz = -1; else if (Wf) dx = 1; else if (E) dx = -1;
      const ix = cx + dx, iz = cz + dz;
      if (has(ix, iz) && ground.get(key(ix, iz)) < y) lights.push([ix, y, iz]);
    }
  }
}

for (const [x, y, z] of lights) set(x, y, z, LIGHT);

// ---- Roof plant penthouse ---------------------------------------------------
const xc = Math.round((minX + maxX) / 2);
const zc = Math.round(list.reduce((s, c) => s + c[1], 0) / list.length);
const inPent = (x, z) => x >= xc - 4 && x <= xc + 4 && z >= zc - 2 && z <= zc + 2;
for (const [x, z] of list) {
  if (!inPent(x, z)) continue;
  const rim = x === xc - 4 || x === xc + 4 || z === zc - 2 || z === zc + 2;
  const corner = (x === xc - 4 || x === xc + 4) && (z === zc - 2 || z === zc + 2);
  set(x, 24, z, LINE); // cap
  if (!rim) continue;
  set(x, 21, z, WALL);
  set(x, 23, z, WALL);
  if (corner) { set(x, 22, z, WALL); continue; }
  const onX = x === xc - 4 || x === xc + 4;
  set(x, 22, z, GLASS, onX ? paneNS : paneEW);
}
set(xc, 25, zc, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
set(xc, 26, zc, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
