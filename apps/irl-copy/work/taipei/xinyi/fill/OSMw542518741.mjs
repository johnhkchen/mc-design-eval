import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, two storeys over a stone base with a parapet cap.
// Read as a late-20th-century Taipei shophouse: white tiled piers, glass bays,
// a stone plinth, a quartz storey band, and a flat roof with skylights and plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542518741";
const W = 23, H = 23, D = 16;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const m = Math.min(...ground.values());   // lowest ground under the footprint
const TOP = m + 11;                       // roof level, exclusive (~11 blocks above lowest ground)

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Door-facing info: front = cells with no north neighbour (street side, low z)
const frontCells = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1) && x % 3 !== 0) frontCells.push([x, z]);
}
frontCells.sort((a, b) => a[0] - b[0]);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gc = G(x, z);

  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const perim = mN || mS || mW || mE;

  // Piers every 3 blocks along each wall; corners always piers.
  let pier;
  if ((mN || mS) && (mW || mE)) pier = true;
  else if (mN || mS) pier = x % 3 === 0;
  else pier = z % 3 === 0;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey and roof slab, air between (no interiors).
    if (m + 5 >= gc) put(x, m + 5, z, "light_gray_concrete");
    if (TOP - 1 >= gc) {
      if (x % 4 === 1 && z % 4 === 1) put(x, TOP - 1, z, "glass");       // skylight
      else put(x, TOP - 1, z, "light_gray_concrete");                     // roof slab
    }
    // Roof plant boxes
    if (x % 6 === 3 && z % 6 === 3) put(x, TOP, z, "smooth_stone");
    continue;
  }

  // Perimeter wall, from its own ground up to the roof cap.
  for (let y = gc; y <= TOP - 1; y++) {
    const d = y - m;
    let b;
    if (d === 0) b = "stone_bricks";                         // base course
    else if (d <= 3) b = pier ? "white_concrete" : "glass_pane";   // ground-floor shopfront bays
    else if (d === 4) b = "white_concrete";                   // ground fascia
    else if (d === 5) b = "smooth_quartz";                    // storey band
    else if (d <= 8) b = pier ? "white_concrete" : "glass_pane";   // upper windows
    else if (d === 9) b = pier ? "white_concrete" : "light_gray_concrete"; // upper sill/lintel
    else b = "smooth_quartz";                                 // parapet cap
    put(x, y, z, b);
  }

  // Warm light behind some upper windows (glowstone in the interior air gap).
  if (!pier && (x + z) % 4 === 0) {
    let ix = x, iz = z;
    if (mN) iz = z + 1; else if (mS) iz = z - 1; else if (mW) ix = x + 1; else if (mE) ix = x - 1;
    const lightY = m + 7;
    if (has(ix, iz) && lightY > G(ix, iz)) put(ix, lightY, iz, "glowstone");
  }
}

// Entrance: door on the street face, replacing the glass bay.
if (doorCell) {
  const [dx, dz] = doorCell;
  const dg = G(dx, dz);
  put(dx, dg, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "glass_pane");
}

g.save(`${DIR}/${ID}.nbt`);
