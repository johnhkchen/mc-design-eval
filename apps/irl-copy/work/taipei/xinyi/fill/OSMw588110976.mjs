import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588110976";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));

// 1960s-70s Taipei mid-rise: 5 storeys of 5 blocks, white tiled concrete frame,
// tinted glazing, stone base, quartz storey bands, rooftop plant room.
const W = 22, H = 34, D = 13;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, Math.max(0, Math.floor(gr)));
const has = (x, z) => G.has(x + "," + z);
const ground = (x, z) => G.get(x + "," + z);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const ROOF = 20;      // absolute y of roof slab
const PARAPET = 21;   // parapet course
const CAP = 22;       // parapet cap
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// minimum ground defines the roof datum; roof stays at absolute height
const minZ = Math.min(...[...G.keys()].map(k => +k.split(",")[1]));
const entranceCands = cells.filter(([x, z]) => z === minZ);
const midX = W / 2;
const [ex, ez] = entranceCands.reduce((best, c) =>
  Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
const entranceX = ex, entranceZ = ez;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.floor(gr0));
  const isPerim = perim(x, z);

  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // interior floor slabs at storey lines and ground floor
  if (!isPerim) {
    put(x, gr, z, "smooth_stone");
    for (const fy of [5, 10, 15]) if (fy >= gr) put(x, fy, z, "smooth_stone");
    if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");
  }

  if (isPerim) {
    // facade: storey bands, glazing with white piers
    const p = (!has(x, z - 1) || !has(x, z + 1)) ? x : z; // index along face
    for (let y = gr; y <= ROOF; y++) {
      const r = y % 5;
      const s = Math.floor(y / 5);
      if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }
      if (r === 0) {
        put(x, y, z, s === 0 ? "stone_bricks" : "smooth_quartz");
      } else if (r === 4) {
        put(x, y, z, s === 0 ? "smooth_quartz" : "light_gray_concrete");
      } else {
        const pier = p % 3 === 0;
        if (pier) put(x, y, z, "white_concrete");
        else put(x, y, z, s === 0 ? "glass" : "light_blue_stained_glass");
      }
    }
    // parapet and cap
    put(x, PARAPET, z, "white_concrete");
    put(x, CAP, z, "smooth_quartz");
  }
}

// entrance door on the street-side (min z) face, ground storey
for (const [x, z, gr0] of cells) {
  if (x === entranceX && z === entranceZ) {
    const gr = Math.max(0, Math.floor(gr0));
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// warm lights standing on the floor just behind selected upper-storey windows
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.floor(gr0));
  if (!perim(x, z)) continue;
  const p = (!has(x, z - 1) || !has(x, z + 1)) ? x : z;
  const dx = !has(x - 1, z) ? 1 : (!has(x + 1, z) ? -1 : 0);
  const dz = !has(x, z - 1) ? 1 : (!has(x, z + 1) ? -1 : 0);
  for (let s = 1; s <= 3; s++) {
    const y = 5 * s + 1;
    if (y <= gr || y > ROOF) continue;
    if (p % 3 !== 1 || (p + s) % 2 !== 0) continue;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !perim(ix, iz) && ground(ix, iz) < y) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// rooftop plant room and parapet-level mechanical box
for (const [x, z, gr0] of cells) {
  if (perim(x, z)) continue;
  if (x >= 7 && x <= 14 && z >= 4 && z <= 8) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, CAP, z, "light_gray_concrete");
  }
}
put(10, CAP + 1, 6, "lightning_rod");

g.save(base + ".nbt");
