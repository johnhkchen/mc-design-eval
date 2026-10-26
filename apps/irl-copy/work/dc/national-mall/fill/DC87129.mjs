import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC87129: 607 14th St NW, Commercial-Office-Large. Mid-century Downtown office block:
// light precast bands, white concrete piers, blue-tinted glazing, polished granite base,
// stepped parapet, a single grouped mechanical penthouse on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const OUT = `${DIR}/DC87129.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/DC87129.cells.json`, "utf8"));

const W = 7, H = 31, D = 15, S = 3;
const g = new Voxels([W, H, D]);

// ---- index footprint -------------------------------------------------------
const map = new Map();
for (const [x, z, gr0, rf0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  let rf = Math.min(H - 6, Math.round(rf0));
  rf = Math.max(rf, gr + S);
  map.set(`${x},${z}`, { x, z, gr, rf });
}
const cellsArr = [...map.values()];
const has = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);
const maxRf = Math.max(...cellsArr.map((c) => c.rf));

const DIRS = [
  { dx: -1, dz: 0, face: "west" },
  { dx: 1, dz: 0, face: "east" },
  { dx: 0, dz: -1, face: "north" },
  { dx: 0, dz: 1, face: "south" },
];
const exteriorFaces = (c) => DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));
const isExterior = (c) => exteriorFaces(c).length > 0;

// ---- entrance: north-facing exterior cell at the lowest z, middle of its run --
let entrance = null;
{
  const northCells = cellsArr.filter((c) => !has(c.x, c.z - 1));
  if (northCells.length) {
    const minZ = Math.min(...northCells.map((c) => c.z));
    const row = northCells.filter((c) => c.z === minZ).sort((a, b) => a.x - b.x);
    entrance = row[Math.floor(row.length / 2)];
  }
}

// ---- wall logic for exterior cells ------------------------------------------
function wallBlock(c, yy, u) {
  const rel = yy - c.gr;
  const k = Math.floor(rel / S);
  const w = rel % S;
  if (yy >= c.rf - 2) return yy === c.rf - 1 ? "smooth_stone" : "light_gray_concrete"; // parapet
  if (k === 0 && w === 0) return "polished_granite";                                     // base course
  if (w === 0) return "smooth_stone";                                                    // storey line
  if (u % 2 === 0) return "white_concrete";                                              // piers
  return "light_blue_stained_glass";                                                     // glazing
}

// ---- 1. foundations and bodies ----------------------------------------------
for (const c of cellsArr) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");

  const ext = exteriorFaces(c);
  if (ext.length === 0) {
    for (let yy = c.gr; yy < c.rf; yy++) {
      const rel = yy - c.gr;
      if (yy === c.rf - 1) g.set(c.x, yy, c.z, "gray_concrete");
      else if (rel % S === 0) g.set(c.x, yy, c.z, "smooth_stone");
    }
  } else {
    for (const f of ext) {
      const u = f.dx !== 0 ? c.z : c.x;
      for (let yy = c.gr; yy < c.rf; yy++) {
        g.set(c.x, yy, c.z, wallBlock(c, yy, u));
      }
    }
  }
}

// ---- 2. entrance: granite pilasters, lintel, projecting canopy --------------
if (entrance) {
  const { x, z, gr } = entrance;
  // pilasters flanking the door, full ground storey height
  for (const px of [x - 1, x + 1]) {
    if (has(px, z) && isExterior(at(px, z))) {
      for (let yy = gr; yy < gr + 3; yy++) g.set(px, yy, z, "polished_granite");
    }
  }
  // lintel band across the entrance bay
  for (const lx of [x - 1, x, x + 1]) {
    if (has(lx, z)) g.set(lx, gr + 2, z, "smooth_stone");
  }
  // canopy slab on top of the lintel, spanning the bay
  for (const cx of [x - 1, x, x + 1]) {
    if (has(cx, z) && gr + 3 < H) {
      g.set(cx, gr + 3, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
  // double-height door
  g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- 3. warm lights behind glazing -------------------------------------------
for (const c of cellsArr) {
  for (const f of exteriorFaces(c)) {
    const u = f.dx !== 0 ? c.z : c.x;
    const ix = c.x - f.dx, iz = c.z - f.dz;
    if (!has(ix, iz)) continue;
    const inner = at(ix, iz);
    if (isExterior(inner)) continue;
    for (let yy = c.gr; yy < c.rf - 2; yy++) {
      const rel = yy - c.gr;
      const k = Math.floor(rel / S);
      const w = rel % S;
      if (w !== 1 || k === 0 || u % 2 !== 1) continue;
      if ((u + k) % 4 === 1 && yy < inner.rf - 1) {
        g.set(ix, yy, iz, "glowstone");
      }
    }
  }
}

// ---- 4. grouped mechanical penthouse on the tallest interior roof ----------
// A solid, clean box two blocks high with a stone cap, instead of scattered cubes.
for (const c of cellsArr) {
  if (isExterior(c)) continue;
  if (c.rf < maxRf - 1) continue;
  if (c.x < 2 || c.x > 4 || c.z < 4 || c.z > 10) continue;
  const top = c.rf + 2;
  if (top >= H) continue;
  for (let yy = c.rf; yy < c.rf + 2; yy++) {
    g.set(c.x, yy, c.z, "light_gray_concrete");
  }
  g.set(c.x, c.rf + 2, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
