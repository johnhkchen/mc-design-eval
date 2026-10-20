import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588102585";
const W = 42, H = 43, D = 60;
const ROOF = 31;      // roof line above lowest ground (lidar)
const STOREY = 5;     // blocks per storey
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => set.has(key(x, z));
const set = new Set(cells.map(([x, z]) => key(x, z)));
const rawGround = new Map(cells.map(([x, z, gr]) => [key(x, z), Number(gr) || 0]));
const lowest = Math.min(...rawGround.values());
const groundOf = (x, z) => rawGround.get(key(x, z)) - lowest;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const perimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Bounds and centre of footprint
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2;

// Main entrance: on the street-facing (min z) face, nearest the centre line
const zFace = cells.filter(([x, z]) => !has(x, z - 1));
let entranceX = null;
if (zFace.length) {
  entranceX = zFace.reduce((best, [x]) => (Math.abs(x - cx) < Math.abs(best - cx) ? x : best), zFace[0][0]);
}
const isEntranceFace = (x, z) => entranceX !== null && z === minZ && Math.abs(x - entranceX) <= 1 && !has(x, z - 1);
const isEntrance = (x, z) => entranceX !== null && x === entranceX && z === minZ;

for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const per = perimeter(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Wall/window axis: t runs along the facade
  const xFacing = !has(x - 1, z) || !has(x + 1, z);
  const t = xFacing ? z : x;
  const mullion = t % 3 === 0;

  for (let y = gr; y < ROOF; y++) {
    const k = y - gr;
    const f = k % STOREY;
    const storey = Math.floor(k / STOREY);

    if (f === 0) {
      // storey line: floor slab inside, sill/plinth band on the facade
      if (per) put(x, y, z, storey === 0 ? "polished_granite" : "white_concrete");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!per) continue; // interior: air gap behind glass

    if (f === 4) {
      put(x, y, z, storey === 0 ? "smooth_stone" : "white_concrete");
      continue;
    }

    // f = 1..3: glazing bays or mullions
    if (storey === 0 && isEntranceFace(x, z) && f <= 2) {
      continue; // door placed later
    }
    if (storey === 0 && isEntranceFace(x, z) && f === 3) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (mullion) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const lit = ((t * 5 + storey * 7 + f * 3) % 9) === 0;
    put(x, y, z, lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane");
  }

  // Parapet / cornice on the roof line
  if (ROOF < H) {
    if (per) put(x, ROOF, z, "stone_bricks");
    else put(x, ROOF, z, "light_gray_concrete");
  }
}

// Entrance doors (two blocks high) on the street face
if (entranceX !== null) {
  const gr = groundOf(entranceX, minZ);
  const base = gr;
  put(entranceX, base + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(entranceX, base + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Glazed flanking of the entrance is already placed; keep the door visually framed
  put(entranceX, base + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
}

// Rooftop plant penthouse, set back from the facades
const pxMin = minX + 8, pxMax = maxX - 8;
const pzMin = minZ + 14, pzMax = maxZ - 14;
const inPent = (x, z) => x >= pxMin && x <= pxMax && z >= pzMin && z <= pzMax && has(x, z);
const pentEdge = (x, z) => x === pxMin || x === pxMax || z === pzMin || z === pzMax;

for (const [x, z] of cells) {
  if (!inPent(x, z)) continue;
  const gr = groundOf(x, z);
  if (gr > ROOF) continue;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (pentEdge(x, z)) {
      // louvred plant screen with a warm band
      const louvre = ((x + z + y) % 2 === 0);
      put(x, y, z, louvre ? "light_gray_concrete" : "smooth_quartz");
    }
  }
  put(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Antenna mast on the penthouse centre
const mx = Math.round((minX + maxX) / 2);
const mz = Math.round((minZ + maxZ) / 2);
if (has(mx, mz) && inPent(mx, mz)) {
  for (let y = ROOF + 5; y <= ROOF + 9 && y < H; y++) put(mx, y, mz, "iron_bars");
  put(mx, Math.min(ROOF + 10, H - 1), mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
