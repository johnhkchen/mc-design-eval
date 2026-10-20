import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109967";
const W = 21, H = 38, D = 54;

// Record: no OSM tags. Read as a five-storey, late-20th-century Taipei mid-rise
// office block: white tiled concrete frame, tinted glazing bands, shopfront at
// street level, parapet and a central mechanical penthouse. Roof about y=26.
const WALL = "white_concrete";
const LINE = "smooth_quartz";
const FOUND = "stone_bricks";
const GLASS = "gray_stained_glass";
const PH = "light_gray_concrete";
const DECK = "light_gray_concrete";
const TOP = 25;        // roof deck / top storey line
const PARAPET = 26;    // parapet course on exposed edge
const PH_CAP = 30;     // penthouse cap

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(12, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// 1. Foundation, storey lines, floor plates and the exterior shell.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // storey lines / floor slabs at every 5 blocks, standing on what is below
  for (let y = 0; y <= TOP; y += 5) {
    if (y >= gr) put(x, y, z, y === 0 ? FOUND : LINE);
  }

  if (!isEdge(x, z)) continue;

  // facade pattern: piers every 3 blocks along the face
  const t = (!has(x - 1, z) || !has(x + 1, z)) ? z : x;
  const pier = t % 3 === 0;

  for (let y = gr; y <= TOP; y++) {
    const r = y % 5;
    const s = Math.floor(y / 5);
    if (r === 0) continue;                 // storey line already placed
    if (r === 4) { put(x, y, z, WALL); continue; } // spandrel
    // window rows 1..3 (ground floor shopfront uses the same glazing)
    put(x, y, z, pier ? WALL : GLASS);
  }

  // parapet course on the exposed roof edge
  put(x, PARAPET, z, LINE);
}

// 2. Warm lights behind some upper-floor windows (interior cell beside glass).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const t = (!has(x - 1, z) || !has(x + 1, z)) ? z : x;
  if (t % 3 === 0) continue;
  let ix = x, iz = z;
  if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  else if (!has(x, z - 1)) iz = z + 1;
  else iz = z - 1;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  for (let s = 1; s <= 4; s++) {
    if (s % 2 !== 1 || t % 6 !== 1) continue;
    const y = 5 * s + 2;
    if (y >= gnd(ix, iz) && y <= TOP) put(ix, y, iz, "glowstone");
  }
}

// 3. Street entrance on the south face, centred on x=10.
if (has(10, D - 1)) {
  const gr = gnd(10, D - 1);
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(10, gr, D - 1, "dark_oak_door", { ...door, half: "lower" });
  put(10, gr + 1, D - 1, "dark_oak_door", { ...door, half: "upper" });
  // shopfront glazing either side of the door, lintel above
  for (const xx of [8, 9, 11, 12]) {
    if (has(xx, D - 1)) {
      for (let y = gr; y <= 3; y++) put(xx, y, D - 1, (xx % 3 === 0) ? WALL : GLASS);
    }
  }
}

// 4. Roof deck (all footprint cells at the top storey line), parapet already placed.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  put(x, TOP, z, LINE);
}

// 5. Central mechanical penthouse, set back from the parapet.
const PX0 = 6, PX1 = 14, PZ0 = 17, PZ1 = 36;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    // cap over the whole penthouse
    put(x, PH_CAP, z, LINE);
    if (!ring) continue;
    const t = (x === PX0 || x === PX1) ? z : x;
    for (let y = PARAPET; y < PH_CAP; y++) {
      const r = y - PARAPET;
      if ((r === 1 || r === 2) && t % 3 !== 0) put(x, y, z, GLASS);
      else put(x, y, z, PH);
    }
  }
}

// 6. Rooftop accents: warm lanterns on the cap corners, a short antenna.
for (const [x, z] of [[7, 18], [13, 18], [7, 35], [13, 35]]) {
  if (has(x, z)) put(x, PH_CAP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}
if (has(10, 26)) {
  put(10, PH_CAP + 1, 26, "end_rod");
  put(10, PH_CAP + 2, 26, "end_rod");
  put(10, PH_CAP + 3, 26, "end_rod");
}

g.save(`${DIR}/${ID}.nbt`);
