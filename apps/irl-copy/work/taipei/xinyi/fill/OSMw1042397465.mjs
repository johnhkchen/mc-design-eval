import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397465";
const W = 18, H = 38, D = 17;

// Record: 5-storey commercial/office block, roof ~26 blocks above lowest ground.
// Era: late-20th-century Xinyi mid-rise. Materials: white concrete facade, quartz
// pilasters and storey lines, stained-glass-tinted panes, granite base, granite-grey roof plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const missingFaces = (x, z) =>
  Object.keys(FACES).filter(f => !has(x + FACES[f][0], z + FACES[f][1]));
const isNS = f => f === "north" || f === "south";

// Collect single-face exterior cells per face, to pick entrances
const faceCells = { north: [], south: [], east: [], west: [] };
for (const [x, z] of cells) {
  const m = missingFaces(x, z);
  if (m.length === 1) faceCells[m[0]].push([x, z]);
}
for (const f of Object.keys(faceCells)) {
  faceCells[f].sort((a, b) => (isNS(f) ? a[0] - b[0] : a[1] - b[1]));
}
const entrances = new Map(); // "x,z" -> face
for (const f of ["south", "north", "east", "west"]) {
  const list = faceCells[f];
  if (list.length >= 3) {
    const [ex, ez] = list[Math.floor(list.length / 2)];
    entrances.set(`${ex},${ez}`, f);
    break;
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const miss = missingFaces(x, z);

  // Interior cell: air, with floor slabs per storey and a roof deck
  if (miss.length === 0) {
    put(x, gr, z, "light_gray_concrete");
    for (let s = 1; s <= 4; s++) {
      if (5 * s >= gr) put(x, 5 * s, z, "light_gray_concrete");
    }
    put(x, 25, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall cell
  const corner = miss.length >= 2;
  const face = corner ? null : miss[0];
  const key = `${x},${z}`;
  const isEnt = !corner && entrances.get(key) === face && gr + 2 <= 4;

  // Base course
  put(x, gr, z, "polished_granite");

  for (let y = gr + 1; y <= 24; y++) {
    const r = y % 5;
    const s = Math.floor(y / 5);

    if (corner) { put(x, y, z, "smooth_quartz"); continue; }
    if (r === 0) { put(x, y, z, "smooth_quartz"); continue; }   // storey line
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }  // spandrel

    // Window band rows r = 1..3
    const u = isNS(face) ? x : z;
    if (isEnt && s === 0 && (y === gr + 1 || y === gr + 2)) {
      const facing = OPPOSITE[face];
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "iron_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEnt && s === 0 && y === gr + 3) { put(x, y, z, "smooth_quartz"); continue; } // lintel
    if (u % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }                     // mullion
    if (s === 0) { put(x, y, z, "glass"); continue; }                                 // shopfront
    put(x, y, z, "light_blue_stained_glass_pane", isNS(face) ? PANE_NS : PANE_EW);
  }

  // Cornice and parapet
  put(x, 25, z, "smooth_quartz");
  put(x, 26, z, corner ? "smooth_quartz" : "white_concrete");
}

// Warm lights behind some upper-window panes (interior cells, standing on a floor)
for (const [x, z] of cells) {
  const miss = missingFaces(x, z);
  if (miss.length !== 1) continue;
  const face = miss[0];
  const [dx, dz] = FACES[face];
  const u = isNS(face) ? x : z;
  if (u % 3 === 0) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || missingFaces(ix, iz).length !== 0) continue;
  for (let s = 0; s <= 4; s++) {
    const wy = 5 * s + 2;
    if (wy <= G(x, z)) continue;
    if (entrances.get(`${x},${z}`) === face && s === 0) continue;
    if ((x * 5 + z * 3 + s * 7) % 4 !== 0) continue;
    const floorY = Math.max(G(ix, iz), 5 * s);
    const lampY = floorY + 1;
    if (lampY > 5 * s + 3) continue;
    put(ix, lampY, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant room on the deck, with a lightning-rod mast
const R = { x0: 5, x1: 12, z0: 5, z1: 11 };
for (const [x, z] of cells) {
  if (missingFaces(x, z).length !== 0) continue;
  const inside = x >= R.x0 && x <= R.x1 && z >= R.z0 && z <= R.z1;
  if (!inside) continue;
  const perim = x === R.x0 || x === R.x1 || z === R.z0 || z === R.z1;
  if (perim) {
    for (let y = 26; y <= 28; y++) put(x, y, z, "light_gray_concrete");
  }
  put(x, 29, z, "smooth_quartz");
}
if (has(9, 8) && missingFaces(9, 8).length === 0) {
  for (let y = 30; y <= 34; y++) {
    put(9, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
