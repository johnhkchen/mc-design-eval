import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no tags. Footprint 21 x 37, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-1980s Taipei commercial block: stone-clad plinth,
// cream terracotta piers, tinted glass bays, smooth quartz cornice and parapet,
// rooftop plant box. Five-block storeys: slabs at ground, +5, +10.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892911";
const W = 21, H = 23, D = 37;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));
const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inb(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces: missing neighbour direction.
const FACES = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const outwardFace = (x, z) => {
  for (const [f, [dx, dz]] of Object.entries(FACES)) {
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
};
const isInterior = (x, z) => has(x, z) && !isPerim(x, z);

// Collect perimeter facade cells with along-wall coordinate u.
const perim = [];
for (const [x, z, gg] of cells) {
  if (!isPerim(x, z)) continue;
  const face = outwardFace(x, z);
  if (!face) continue;
  const u = face === "north" || face === "south" ? x : z;
  perim.push({ x, z, gg, face, u });
}

// Main street face: the face with the most perimeter cells gets the entrance.
const counts = {};
for (const p of perim) counts[p.face] = (counts[p.face] || 0) + 1;
let mainFace = null;
for (const f of Object.keys(counts)) {
  if (!mainFace || counts[f] > counts[mainFace]) mainFace = f;
}
const mainUs = perim.filter((p) => p.face === mainFace).map((p) => p.u).sort((a, b) => a - b);
const doorU = mainUs.length ? mainUs[Math.floor(mainUs.length / 2)] : null;

const MAT = {
  found: "stone_bricks",
  slab: "smooth_quartz",
  wall: "white_terracotta",
  pier: "smooth_quartz",
  glass: "light_blue_stained_glass",
  roofBox: "light_gray_concrete",
  light: "glowstone",
};

// 1. Foundation, floor slabs, roof.
for (const [x, z, gg] of cells) {
  for (let y = 0; y < gg; y++) put(x, y, z, MAT.found);
  put(x, gg, z, MAT.slab);       // ground floor slab
  put(x, gg + 5, z, MAT.slab);   // first floor slab
  put(x, gg + 10, z, MAT.slab);  // roof slab / cornice level
}

// 2. Facade: ground-floor shopfronts, upper bays, entrance.
for (const p of perim) {
  const { x, z, gg, face, u } = p;
  const [dx, dz] = FACES[face];

  // Ground floor (gg+1 .. gg+4).
  if (u === doorU && face === mainFace) {
    put(x, gg + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false" });
    put(x, gg + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false" });
    put(x, gg + 3, z, MAT.glass);   // transom
    put(x, gg + 4, z, MAT.slab);    // lintel
  } else if (u % 3 === 0) {
    for (let y = gg + 1; y <= gg + 4; y++) put(x, y, z, MAT.pier);
  } else {
    for (let y = gg + 1; y <= gg + 3; y++) put(x, y, z, MAT.glass);
    put(x, gg + 4, z, MAT.slab);    // shopfront fascia
  }

  // Upper floor (gg+6 .. gg+9).
  if (u % 3 === 0) {
    for (let y = gg + 6; y <= gg + 9; y++) put(x, y, z, MAT.pier);
  } else {
    put(x, gg + 6, z, MAT.slab);    // sill
    for (let y = gg + 7; y <= gg + 8; y++) put(x, y, z, MAT.glass);
    put(x, gg + 9, z, MAT.slab);    // head
  }

  // Parapet cap on the perimeter.
  put(x, gg + 11, z, MAT.slab);

  // Warm light behind some upper windows, in the interior air gap.
  if (u % 6 === 2 && u % 3 !== 0) {
    const ix = x - dx, iz = z - dz;
    if (isInterior(ix, iz)) put(ix, gg + 7, iz, MAT.light);
  }
}

// 3. Rooftop plant box near the centre of the plan.
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);
for (const [x, z, gg] of cells) {
  if (!isInterior(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 4) {
    put(x, gg + 11, z, MAT.roofBox);
    put(x, gg + 12, z, MAT.roofBox);
  }
}

g.save(`${DIR}/${ID}.nbt`);
