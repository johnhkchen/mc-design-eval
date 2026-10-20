import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 22 x 20, roof ~35 above lowest ground.
// Read as a 1990s Xinyi office block: 7 storeys of ~5 blocks on a granite plinth,
// quartz piers, light-grey spandrels, blue-tinted curtain glazing, a shopfront
// ground storey with a recessed entrance, a quartz cornice and parapet, and a
// roof plant room with a short mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402985";
const W = 22, H = 47, D = 20;
const ROOF = 35;          // roof slab level (absolute y)
const PLANT_TOP = 39;     // plant room top block
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const GR = new Map();
for (const [x, z, gr] of cells) {
  GR.set(`${x},${z}`, Math.max(0, Math.min(30, Math.round(gr))));
}
const has = (x, z) => GR.has(`${x},${z}`);
const gnd = (x, z) => GR.get(`${x},${z}`);
const exposed = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isPerim = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };
const isPier = (x, z) => {
  const e = exposed(x, z);
  if ((e.N || e.S) && x % 3 === 0) return true;
  if ((e.W || e.E) && z % 3 === 0) return true;
  return false;
};

// Entrance: north-facing exposed cell nearest the mean x of that face.
let entrance = null;
{
  const north = cells.filter(([x, z]) => exposed(x, z).N).map(([x, z]) => [x, z]);
  if (north.length) {
    const mx = north.reduce((s, [x]) => s + x, 0) / north.length;
    north.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx) || a[0] - b[0]);
    entrance = `${north[0][0]},${north[0][1]}`;
  }
}

// Warm lamps behind some window glass (interior cell one step inward).
const lamps = new Set();
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || isPier(x, z)) continue;
  const e = exposed(x, z);
  let ix = x, iz = z;
  if (e.N) iz = z + 1; else if (e.S) iz = z - 1; else if (e.W) ix = x + 1; else if (e.E) ix = x - 1;
  if (!has(ix, iz)) continue;
  for (let rel = 7; rel < ROOF - gr; rel += 5) {
    if (((x * 13 + z * 7 + rel) % 5) !== 0) continue;
    if (entrance === `${x},${z}`) continue;
    lamps.add(`${ix},${gr + rel},${iz}`);
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const perim = isPerim(x, z);
  const pier = perim && isPier(x, z);
  const isEntrance = entrance === `${x},${z}`;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys from this cell's ground up to the roof slab.
  for (let y = gr; y < ROOF; y++) {
    const rel = y - gr;
    const m = rel % 5;
    if (rel === 0) {
      put(x, y, z, perim ? "granite" : "light_gray_concrete");
      continue;
    }
    if (!perim) {
      if (m === 0) put(x, y, z, "light_gray_concrete");
      else if (lamps.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
      continue;
    }
    if (isEntrance && (rel === 1 || rel === 2)) {
      const facing = "north";
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrance && rel === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (m === 0 || m === 4) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
    }
  }

  // Roof slab (y 35) and parapet (y 36 on the edge).
  put(x, ROOF, z, perim ? "smooth_quartz" : "light_gray_concrete");
  if (perim) put(x, ROOF + 1, z, "smooth_quartz");
}

// Roof plant room: a block of concrete on the roof, with louvred glazing on its edge.
const PX0 = 7, PX1 = 14, PZ0 = 6, PZ1 = 13;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = ROOF + 1; y <= PLANT_TOP; y++) {
      if (y === PLANT_TOP) { put(x, y, z, "smooth_quartz"); continue; }
      if (edge && y === ROOF + 2 && (x + z) % 2 === 0) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// Short mast on the plant room.
const mx = 10, mz = 9;
if (has(mx, mz)) {
  for (let y = PLANT_TOP + 1; y <= PLANT_TOP + 4; y++) put(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
