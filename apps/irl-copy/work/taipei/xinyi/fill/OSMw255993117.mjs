import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 三興合署大樓 (OSMw255993117): 1980s Taipei government office, two storeys on a
// stone plinth, cream-white tiled walls, light grey storey bands, glazed bays,
// a centred entrance on the footprint's largest exposed face, a flat roof with
// parapet and roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw255993117";
const W = 38, H = 23, D = 33;

const BAND = 5;    // storey line / second floor slab
const DECK = 10;   // roof deck and cornice course
const ROOF = 11;   // parapet top: roof about 11 blocks above lowest ground

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const FACE_NAME = { N: "north", S: "south", W: "west", E: "east" };

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minRaw = Math.min(...raw.map((c) => c[2]));

// footprint: "x,z" -> ground level relative to lowest ground
const G = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.min(9, Math.max(0, Math.round(gr - minRaw))));
}

const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const keys = [...G.keys()].map((k) => k.split(",").map(Number));

// which outer faces of a footprint cell are exposed: N = -z, S = +z, W = -x, E = +x
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// cell coordinate running along a face (x for N/S faces, z for W/E faces)
const alongOf = (x, z, face) => (face === "N" || face === "S" ? x : z);
const inwardOf = (x, z, face) =>
  face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];

// entrance face: the exposed direction with the most cells
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of keys) for (const d of faces(x, z)) faceCount[d]++;
const ENT_FACE = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];

// entrance cells on that face, sorted along it; door sits on the middle one
const entCells = keys
  .filter(([x, z]) => faces(x, z).length === 1 && faces(x, z).includes(ENT_FACE))
  .sort((a, b) => alongOf(a[0], a[1], ENT_FACE) - alongOf(b[0], b[1], ENT_FACE));
const entMid = entCells.length ? alongOf(...entCells[Math.floor(entCells.length / 2)], ENT_FACE) : -999;
const entSet = new Set(
  entCells
    .filter(([x, z]) => Math.abs(alongOf(x, z, ENT_FACE) - entMid) <= 2)
    .map(([x, z]) => `${x},${z}`)
);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// ---- main shell, cell by cell ----
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const f = faces(x, z);
  const perim = f.length > 0;
  const corner = f.length > 1;

  // foundation below the ground surface
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (gr >= 4) {
    // ground is high here: solid podium up to the deck, then the parapet
    for (let y = gr; y <= DECK; y++) put(x, y, z, "stone_bricks");
    if (perim) put(x, ROOF, z, "smooth_quartz");
    continue;
  }

  // ground slab, storey floor, roof deck
  put(x, gr, z, "smooth_quartz");
  put(x, BAND, z, "smooth_quartz");
  put(x, DECK, z, "light_gray_concrete");

  if (!perim) continue;

  const face = f[0];
  const along = !corner && (face === "N" || face === "S" || f.includes("N") || f.includes("S"));
  const idx = alongOf(x, z, corner ? (f.includes("N") || f.includes("S") ? "N" : "W") : face);
  const pe = (f.includes("N") || f.includes("S")) ? PANE_EW : PANE_NS;
  const isEnt = !corner && entSet.has(k) && face === ENT_FACE;
  const isDoor = isEnt && alongOf(x, z, ENT_FACE) === entMid;
  const bay = !corner && idx % 3 !== 0;
  const inward = inwardOf(x, z, corner ? (f.includes("N") ? "N" : f.includes("S") ? "S" : f.includes("W") ? "W" : "E") : face);
  const [ix, iz] = inward;
  const interiorOk = has(ix, iz) && faces(ix, iz).length === 0;

  // base course
  put(x, gr + 1, z, "stone_bricks");

  // storey 1 (rows gr+2 .. 4)
  for (let y = gr + 2; y <= BAND - 1; y++) {
    if (isEnt) {
      if (isDoor && y === gr + 2) {
        put(x, y, z, "iron_door", {
          facing: FACE_NAME[ENT_FACE], half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoor) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", pe);
        if (y === gr + 2 && interiorOk) put(ix, y, iz, "glowstone");
      }
    } else if (bay) {
      put(x, y, z, "light_blue_stained_glass_pane", pe);
      if (y === 3 && gr < 3 && idx % 6 === 4 && interiorOk) put(ix, y, iz, "glowstone");
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
  if (isDoor) {
    put(x, gr + 1, z, "iron_door", {
      facing: FACE_NAME[ENT_FACE], half: "lower", hinge: "left", open: "false", powered: "false",
    });
  }
  // entrance canopy: upside-down stairs across the entrance bay
  if (isEnt) {
    put(x, BAND - 1, z, "stone_brick_stairs", {
      facing: FACE_NAME[ENT_FACE], half: "top", shape: "straight", waterlogged: "false",
    });
  }

  // storey line
  put(x, BAND, z, "light_gray_concrete");

  // storey 2 (rows 6 .. 9)
  put(x, 6, z, bay && !isEnt ? "light_gray_concrete" : "smooth_quartz");
  for (let y = 7; y <= 9; y++) {
    if (bay) put(x, y, z, "light_blue_stained_glass_pane", pe);
    else put(x, y, z, "smooth_quartz");
  }
  // warm lamps behind some storey 2 windows
  if (bay && !isEnt && idx % 6 === 1 && interiorOk) put(ix, 8, iz, "glowstone");

  // cornice and parapet
  put(x, DECK, z, "stone_bricks");
  put(x, ROOF, z, "smooth_quartz");
}

// ---- roof plant on the low (structural) part of the roof ----
const x0 = Math.min(...keys.map((k) => k[0]));
const x1 = Math.max(...keys.map((k) => k[0]));
const z0 = Math.min(...keys.map((k) => k[1]));
const z1 = Math.max(...keys.map((k) => k[1]));
const boxes = [
  [0.20, 0.35, 0.15, 0.30],
  [0.55, 0.70, 0.30, 0.45],
  [0.35, 0.55, 0.65, 0.80],
];
for (let x = x0; x <= x1; x++) {
  for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || gnd(x, z) >= 4 || faces(x, z).length > 0) continue;
    const fx = (x - x0) / Math.max(1, x1 - x0);
    const fz = (z - z0) / Math.max(1, z1 - z0);
    const inBox = boxes.some(([ax, bx, az, bz]) => fx >= ax && fx <= bx && fz >= az && fz <= bz);
    if (!inBox) continue;
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
