import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344827839";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 11;
const ROOF_DECK = 10;   // top of the flat roof deck (absolute y)
const FLOOR_1 = 5;      // storey line between the two storeys
const CORNICE = 9;      // cornice band under the parapet

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward directions of each facade
const faces = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => faces.filter((f) => !inFp(x + f.dx, z + f.dz));

// Entrance: on the north (z-min) face, non-corner cell nearest the footprint's mid x
const northCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => exposed(x, z).length === 1 && exposed(x, z)[0].n === "north");
const midX = cells.reduce((s, [x]) => s + x, 0) / cells.length;
let doorCell = null;
if (northCells.length) {
  doorCell = northCells.reduce((best, c) =>
    Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best
  );
}

// 1. Foundations, floor slabs, roof deck and roof plant
for (const [x, z, gr] of cells) {
  const gz = Math.round(gr);
  for (let y = 0; y < gz; y++) put(x, y, z, "stone_bricks");
  put(x, FLOOR_1, z, "smooth_stone");
  if (exposed(x, z).length === 0) {
    put(x, ROOF_DECK, z, "gray_concrete");
    if (x % 4 === 2 && z % 4 === 2) put(x, ROOF_DECK + 1, z, "light_gray_concrete");
  }
}

// 2. Perimeter walls: base course, storey lines, cornice, parapet, windows, piers
for (const [x, z, gr] of cells) {
  const gz = Math.round(gr);
  const ex = exposed(x, z);
  if (ex.length === 0) continue;

  for (let y = gz; y <= ROOF_DECK; y++) {
    if (y < 0) continue;

    // Base course, storey lines, cornice and coping
    if (y === gz || y === FLOOR_1 || y === CORNICE || y === ROOF_DECK) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Corner cells are solid piers
    if (ex.length >= 2) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    const face = ex[0];
    const along = face.n === "north" || face.n === "south" ? x : z;
    const pier = along % 3 === 0;
    const winBand = (y >= gz + 1 && y <= FLOOR_1 - 1) || (y >= 6 && y <= 8);

    if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (winBand) {
      const ns = face.n === "north" || face.n === "south";
      put(x, y, z, "light_blue_stained_glass_pane", {
        north: ns ? "false" : "true",
        south: ns ? "false" : "true",
        east: ns ? "true" : "false",
        west: ns ? "true" : "false",
        waterlogged: "false",
      });
    } else {
      put(x, y, z, "white_terracotta");
    }
  }
}

// 3. Warm lights behind some upper-storey windows
for (const [x, z, gr] of cells) {
  const gz = Math.round(gr);
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const face = ex[0];
  const along = face.n === "north" || face.n === "south" ? x : z;
  if (along % 3 === 0 || along % 6 !== 1) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!inFp(ix, iz)) continue;
  if (x === doorCell?.[0] && z === doorCell?.[1]) continue;
  if (7 < gz + 1) continue;
  put(ix, 7, iz, "glowstone");
}

// 4. Entrance door on the north face
if (doorCell) {
  const [dx, dz] = doorCell;
  const gz = Math.round(gAt(dx, dz));
  put(dx, gz, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gz + 1, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
