import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded building: 20 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey 1990s Taipei commercial block: white-painted concrete frame,
// quartz belt courses, glazed shopfront on the street face, flat roof with parapet
// and a small penthouse/plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098877";
const W = 20, H = 23, D = 17;

const cellsArr = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cellsArr) {
  ground.set(key(x, z), Math.max(0, Math.min(H - 10, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const exX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const exZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isBorder = (x, z) => exX(x, z) || exZ(x, z);

const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const maxG = Math.max(...cellList.map(([x, z]) => gnd(x, z)));
const minZ = Math.min(...cellList.map(([, z]) => z));
const ROOF = Math.min(17, Math.max(11, maxG + 6)); // roof deck level
const cx = Math.round(cellList.reduce((s, [x]) => s + x, 0) / cellList.length);
const cz = Math.round(cellList.reduce((s, [, z]) => s + z, 0) / cellList.length);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front (street) row: cells on the lowest z of the footprint.
const frontXs = cellList.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;
const pierXs = new Set(frontXs.length ? [frontXs[0], frontXs[frontXs.length - 1]] : []);

for (const [x, z] of cellList) {
  const gr = gnd(x, z);
  const border = isBorder(x, z);
  const ex = exX(x, z), ez = exZ(x, z);
  const front = z === minZ;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Storey lines for this cell.
  const span = ROOF - gr;
  const lines = span >= 8 ? [gr, gr + Math.round(span / 2)] : [gr];
  const bandY = new Set();
  for (const f of lines) for (const y of [f + 1, f + 2, f + 3]) if (y < ROOF - 1) bandY.add(y);

  // Floor slabs at every storey line (solid across the footprint, no interiors).
  for (const f of lines) put(x, f, z, "smooth_stone");

  if (border) {
    const windowOK = (ez && !ex && x % 3 === 1) || (ex && !ez && z % 3 === 1);
    const winProps = ez && !ex
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    for (let y = gr; y < ROOF; y++) {
      if (y === gr) {
        put(x, y, z, "polished_andesite"); // plinth course
      } else if (lines.includes(y) || y === ROOF - 1) {
        put(x, y, z, "quartz_block"); // storey belt and cornice
      } else if (front && y >= gr + 1 && y <= gr + 3 && (y <= ROOF - 2)) {
        // Shopfront
        if (pierXs.has(x)) {
          put(x, y, z, "white_concrete");
        } else if (x === doorX) {
          if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "glass");
        } else {
          put(x, y, z, "glass");
        }
      } else if (bandY.has(y) && windowOK) {
        put(x, y, z, "glass_pane", winProps);
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Warm light: glowstone on the floor just inside some windows.
    if (windowOK && !front) {
      for (const f of lines) {
        if (((x + 2 * z) % 3 === 0) && bandY.has(f + 2)) {
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, nz = z + dz;
            if (has(nx, nz) && !isBorder(nx, nz)) {
              put(nx, f + 1, nz, "glowstone");
              break;
            }
          }
        }
      }
    }
  }

  // Roof deck on interior cells; parapet on the edge.
  if (!border) {
    put(x, ROOF, z, "light_gray_concrete");
  } else {
    put(x, ROOF, z, "white_concrete");
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Penthouse / plant box on the roof, only if its footprint is wholly interior.
const rx0 = cx - 2, rx1 = cx + 2, rz0 = cz - 1, rz1 = cz + 1;
let penthouseOK = true;
for (let x = rx0; x <= rx1; x++) for (let z = rz0; z <= rz1; z++) {
  if (!has(x, z) || isBorder(x, z)) penthouseOK = false;
}
if (penthouseOK) {
  for (let x = rx0; x <= rx1; x++) for (let z = rz0; z <= rz1; z++) {
    const edge = x === rx0 || x === rx1 || z === rz0 || z === rz1;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (edge) put(x, y, z, "white_concrete");
    }
    put(x, ROOF + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  // Small glazed openings on the penthouse faces.
  put(rx0, ROOF + 2, cz, "glass");
  put(rx1, ROOF + 2, cz, "glass");
  put(cx, ROOF + 2, rz0, "glass");
  put(cx, ROOF + 2, rz1, "glass");
}

// A couple of rooftop condenser units on interior roof cells outside the penthouse.
for (const [ux, uz] of [[cx - 5, cz + 3], [cx + 5, cz - 3]]) {
  const inRect = ux >= rx0 && ux <= rx1 && uz >= rz0 && uz <= rz1;
  if (has(ux, uz) && !isBorder(ux, uz) && !inRect) put(ux, ROOF + 1, uz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
