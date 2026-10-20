import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw543058345";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 20, H = 23, D = 17;

// Record: 20 x 17 footprint, roof about 11 blocks above lowest ground.
// Read as a 1980s-era, two-storey cream-tile commercial block with a shopfront
// ground floor, a smooth-quartz storey line and cornice, a stone parapet, and a
// rooftop water tank, typical of Taipei's low-rise street frontage.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map(c => c[2]));
const R = minG + 10;          // roof slab level; roof surface sits at minG + 11
const PARAPET = R + 1;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const dirs = [
  [0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"],
];
const outwardOf = (x, z) =>
  dirs.filter(([dx, dz]) => !inFp(x + dx, z + dz)).map(([dx, dz, name]) => ({ dx, dz, name }));

const edgeCells = cells.filter(([x, z]) => outwardOf(x, z).length > 0);
const edgeSet = new Set(edgeCells.map(([x, z]) => key(x, z)));

// Front face: first direction that has edge cells, in order south, north, east, west.
let front = null;
for (const [dx, dz, name] of dirs) {
  const list = edgeCells.filter(([x, z]) => outwardOf(x, z).some(o => o.name === name));
  if (list.length) { front = { dx, dz, name, list }; break; }
}
let doorKey = null;
if (front) {
  const sorted = [...front.list].sort((a, b) => (front.dx !== 0 ? a[0] - b[0] : a[1] - b[1]));
  const d = sorted[Math.floor(sorted.length / 2)];
  doorKey = key(d[0], d[1]);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  // Roof slab across the whole footprint.
  if (gr < R) put(x, R, z, "light_gray_concrete");

  const out = outwardOf(x, z);
  const isEdge = out.length > 0;

  if (!isEdge) {
    // Interior: air with floor slabs per storey only.
    if (gr < R) put(x, gr, z, "smooth_stone");
    if (gr + 5 < R) put(x, gr + 5, z, "smooth_stone");
    continue;
  }

  const f = out[0];
  const idx = f.dx !== 0 ? z : x;         // position along the facade
  const isDoorCell = doorKey === key(x, z) && f.name === front.name;

  for (let y = gr; y < R; y++) {
    const ly = y - gr;
    let id = "white_terracotta";
    let props;

    if (ly === 0 || ly === 1 || ly === 2 || ly === 3) {
      // Shopfront glazing with stone piers.
      id = idx % 4 === 0 ? "stone_bricks" : "glass_pane";
      if (isDoorCell) {
        if (ly <= 1) {
          id = "dark_oak_door";
          props = { facing: front.name, half: ly === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (ly === 2) {
          id = "smooth_quartz";
        }
      }
    } else if (ly === 4) {
      id = "smooth_quartz";                 // ground-floor lintel
    } else if (ly === 5) {
      id = "smooth_quartz";                 // floor line
    } else if (ly >= 6 && ly <= 8) {
      id = idx % 3 === 0 ? "white_terracotta" : "gray_stained_glass_pane";
    } else if (ly === 9) {
      id = "smooth_quartz";                 // cornice course
    }
    if (y === R - 1) id = "smooth_quartz";  // top course

    put(x, y, z, id, props);

    // Warm light behind some upper-floor windows.
    if (ly === 7 && id === "gray_stained_glass_pane" && (idx + 2 * ly) % 9 === 4) {
      const ix = x - f.dx, iz = z - f.dz;
      if (inFp(ix, iz) && !edgeSet.has(key(ix, iz))) put(ix, y, iz, "shroomlight");
    }
    if (ly === 1 && id === "glass_pane" && (idx % 4) === 2) {
      const ix = x - f.dx, iz = z - f.dz;
      if (inFp(ix, iz) && !edgeSet.has(key(ix, iz))) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet on the perimeter.
  if (PARAPET < H) put(x, PARAPET, z, "smooth_quartz");
}

// Floor slab for the second storey inside: already placed for interior cells.

// Rooftop water tank near the centre of the footprint.
const tankX = Math.round(W / 2) - 2, tankZ = Math.round(D / 2) - 1;
for (const [x, z, gr] of cells) {
  if (edgeSet.has(key(x, z))) continue;
  const dxT = x - tankX, dzT = z - tankZ;
  if (dxT * dxT + dzT * dzT <= 3.2 && gr < R) {
    for (let y = R + 1; y <= R + 3; y++) put(x, y, z, "smooth_stone");
    if (R + 4 < H) put(x, R + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
