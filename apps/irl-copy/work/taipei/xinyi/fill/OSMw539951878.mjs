import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951878";
const W = 15, H = 23, D = 38;

// Footprint: [x, z, ground] per cell. Ground values are absolute grid y.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const grid = new Map();
let minG = Infinity, minX = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  grid.set(key(x, z), gr);
  minG = Math.min(minG, gr);
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}
if (!isFinite(minG)) minG = 0;
if (!isFinite(minX)) minX = 0;
if (!isFinite(minZ)) minZ = 0;

// Roof top sits about 11 blocks above the lowest ground: two 5-block storeys plus a parapet.
const R = Math.min(minG + 11, H - 1);

const has = (x, z) => grid.has(key(x, z));
// Exterior face of a cell: the first side with no neighbouring footprint cell.
function faceOf(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}

// Entrance: the north face if it has cells, otherwise the south face, otherwise any face.
const faceCells = { west: [], east: [], north: [], south: [] };
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (f) faceCells[f].push(along(f, x, z));
}
function along(face, x, z) {
  return (face === "west" || face === "east") ? z - minZ : x - minX;
}
let entranceFace = "north";
if (faceCells.north.length === 0) {
  entranceFace = faceCells.south.length ? "south" : (["west", "east"].find(f => faceCells[f].length) ?? "north");
}
const entAlongs = [...faceCells[entranceFace]].sort((a, b) => a - b);
const entAlong = entAlongs.length ? entAlongs[Math.floor(entAlongs.length / 2)] : -1;

function entranceCell(x, z, face) {
  return face === entranceFace && along(face, x, z) === entAlong;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  for (let y = gr; y <= R; y++) {
    const l = y - minG; // storey level relative to lowest ground

    if (!face) {
      // Interior: floor slabs per storey and a roof slab; the rest is air (no interiors).
      if (l === 0 || l === 5 || l === 10) put(x, y, z, "light_gray_concrete");
      else if (l === 11) put(x, y, z, "gray_concrete");
      continue;
    }

    const a = along(face, x, z);
    const pier = a % 3 === 0;
    const glassWarm = ((x * 7 + z * 3 + l) % 9 === 0);

    if (l === 11) {
      put(x, y, z, "white_concrete"); // parapet
    } else if (l === 10) {
      put(x, y, z, "smooth_quartz"); // cornice
    } else if (l === 0) {
      put(x, y, z, "polished_granite"); // base course
    } else if (l === 5) {
      put(x, y, z, "light_gray_concrete"); // floor line
    } else if (l < 5) {
      // Ground-floor shopfront
      if (l === 4) {
        put(x, y, z, "red_terracotta"); // fascia
      } else if (entranceCell(x, z, face) && (l === 1 || l === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: face,
          half: l === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pier) {
        put(x, y, z, "black_concrete");
      } else if (glassWarm && l === 2) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    } else {
      // Upper storey (levels 6..9)
      if (l === 9) {
        put(x, y, z, "white_concrete"); // spandrel
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else if (glassWarm && (l === 7 || l === 8)) {
        put(x, y, z, "shroomlight");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Roof equipment: small air-handling boxes on some interior roof cells.
  if (!face && R + 1 < H && ((x * 5 + z * 7) % 13 === 0)) {
    put(x, R + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
