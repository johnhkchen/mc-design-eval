import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55765.cells.json`, "utf8"));

// 912 17th St NW: c.1960s-70s speculative office block. Pale precast piers,
// smooth-stone bands, bronze-tinted glass, dark stone plinth, stone-framed entrance.
const W = 34, H = 31, D = 21;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const map = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c.map(Math.round);
  map.set(`${x},${z}`, { x, z, gr, rf });
}
const has = (x, z) => map.has(`${x},${z}`);
const cellsArr = [...map.values()];

// Chebyshev inset: largest r such that the (2r+1) square around the cell is all footprint
const insetOf = (x, z) => {
  let r = 0;
  for (let k = 1; k <= 6; k++) {
    let ok = true;
    for (let dx = -k; dx <= k && ok; dx++)
      for (let dz = -k; dz <= k && ok; dz++)
        if (!has(x + dx, z + dz)) ok = false;
    if (ok) r = k; else break;
  }
  return r;
};

const maxRoof = Math.max(...cellsArr.map(c => c.rf));
const minZ = Math.min(...cellsArr.map(c => c.z));

const facesOf = (c) => {
  const f = [];
  if (!has(c.x, c.z - 1)) f.push("n");
  if (!has(c.x, c.z + 1)) f.push("s");
  if (!has(c.x - 1, c.z)) f.push("w");
  if (!has(c.x + 1, c.z)) f.push("e");
  return f;
};

// Street face = min-z face. Entrance bay centred on it.
const northCells = cellsArr
  .filter(c => c.z === minZ && !has(c.x, c.z - 1))
  .sort((a, b) => a.x - b.x);
const entranceX = northCells.length ? northCells[Math.floor(northCells.length / 2)].x : -1;

const penthouse = new Set();

for (const c of cellsArr) {
  const { x, z, gr, rf } = c;
  const faces = facesOf(c);
  const exposed = faces.length > 0;
  const corner = faces.length >= 2;
  const along = faces.includes("n") || faces.includes("s") ? x : z;

  // Foundation: stone plinth, darker at the base for a shadow line
  for (let y = 0; y < gr; y++) put(x, y, z, y < gr - 1 ? "stone_bricks" : "polished_andesite");
  put(x, gr, z, "smooth_stone");

  // Storeys
  for (let y = gr + 1; y <= rf - 1; y++) {
    const rel = (y - gr) % 4;
    const storey = Math.floor((y - gr) / 4);
    if (!exposed) {
      if (y === rf - 1) put(x, y, z, "gray_concrete");          // roof deck
      else if (rel === 0) put(x, y, z, "smooth_stone");        // storey slab
      continue;                                                  // air behind glass
    }
    if (y === rf - 1) { put(x, y, z, "smooth_stone"); continue; } // cornice
    if (rel === 0) { put(x, y, z, "smooth_stone"); continue; }   // floor band
    if (rel === 3) {
      // alternating spandrel for shadow rhythm
      put(x, y, z, (along + storey) % 2 === 0 ? "light_gray_concrete" : "stone_bricks");
      continue;
    }
    if (corner || along % 3 === 0) {
      // piers: pale precast, with a bronze-grey capital band on the storey line
      put(x, y, z, rel === 1 ? "white_concrete" : "quartz_block");
      continue;
    }
    // sparse warm light, deterministic, a few per storey
    const lit = (x * 7 + z * 3 + y) % 29 === 0 && storey >= 1;
    put(x, y, z, lit ? "shroomlight" : "light_blue_stained_glass");
  }

  // Parapet on exposed cells
  if (exposed) put(x, rf, z, "white_concrete");

  // Penthouse on the tallest interior cells, with a stepped setback
  if (inset(x, z) >= 3 && rf >= maxRoof - 1) {
    penthouse.add(`${x},${z}`);
    for (let y = rf; y <= rf + 2; y++) {
      const b = y === rf + 2 ? "smooth_stone" : y === rf ? "light_gray_concrete" : "gray_stained_glass";
      put(x, y, z, b);
    }
  }
}

function inset(x, z) { return insetOf(x, z); }

// Rooftop mechanical units: two blocks tall, sparse
for (const c of cellsArr) {
  if (inset(c.x, c.z) < 2 || penthouse.has(`${c.x},${c.z}`)) continue;
  if ((c.x * 3 + c.z * 5) % 11 === 0) {
    put(c.x, c.rf, c.z, "iron_block");
    put(c.x, c.rf + 1, c.z, "light_gray_concrete");
  }
}

// Entrance bay: stone jambs flanking a recessed dark-oak door, glass storefront,
// and a stone-slab canopy across the bay at the lintel line
for (const c of northCells) {
  const dx = c.x - entranceX;
  if (Math.abs(dx) > 2) continue;
  // jambs at the bay edges
  if (Math.abs(dx) === 2) {
    put(c.x, c.gr + 1, c.z, "polished_andesite");
    put(c.x, c.gr + 2, c.z, "polished_andesite");
  } else if (dx === 0) {
    put(c.x, c.gr + 1, c.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(c.x, c.gr + 2, c.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(c.x, c.gr + 1, c.z, "light_blue_stained_glass");
    put(c.x, c.gr + 2, c.z, "light_blue_stained_glass");
  }
  // canopy: stone-brick slab on the lintel line, with a lantern under it at the centre
  put(c.x, c.gr + 3, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}
// hanging lantern under the canopy at the centre bay
if (entranceX >= 0 && has(entranceX, minZ)) {
  put(entranceX, cellsArr.find(c => c.x === entranceX && c.z === minZ).gr + 2, minZ + 1 < D ? minZ : minZ,
      "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/DC55765.nbt`);
