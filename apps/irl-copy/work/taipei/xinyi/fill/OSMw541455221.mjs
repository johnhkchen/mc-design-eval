import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455221.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455221.nbt";

// Record: no name. Footprint 10 x 6, roof ~11 blocks above lowest ground.
// Read as a two-storey, mid-century concrete commercial block (c. 1970s-80s
// Taipei): stone-faced base, light-grey concrete piers, white spandrels and
// a parapet, glass shopfront below and glass strip windows above, a flat roof
// with a small plant box. Storey = 5 blocks (floor slab + 4 air/glass rows).

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Outward faces of a footprint cell (neighbour missing)
const faces = (x, z) => {
  const f = [];
  if (!G.has(key(x, z - 1))) f.push("N");
  if (!G.has(key(x, z + 1))) f.push("S");
  if (!G.has(key(x - 1, z))) f.push("W");
  if (!G.has(key(x + 1, z))) f.push("E");
  return f;
};

// Piers: every second bay along each face, plus the ends
const isPier = (x, z, f) => {
  let p = false;
  if (f.includes("N") || f.includes("S")) {
    if ((x - minX) % 2 === 0 || x === maxX) p = true;
  }
  if (f.includes("W") || f.includes("E")) {
    if ((z - minZ) % 2 === 0 || z === maxZ) p = true;
  }
  return p;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the north (street) face, nearest the centre
let door = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!faces(x, z).includes("N")) continue;
  const d = Math.abs(x - (minX + maxX) / 2);
  if (!door || d < door.d) door = { x, z, d };
}

for (const [x, z, gr] of cells) {
  const gy = Math.round(gr);
  const f = faces(x, z);
  const bnd = f.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  for (let rel = 0; rel <= 11; rel++) {
    const y = gy + rel;
    let id = null;

    if (rel === 0) {
      id = "smooth_stone"; // ground floor slab
    } else if (rel === 5) {
      id = bnd ? "white_concrete" : "smooth_stone"; // first floor slab / storey line
    } else if (rel === 10) {
      id = bnd ? "light_gray_concrete" : "smooth_stone"; // roof slab / cornice
    } else if (rel === 11) {
      id = bnd ? "white_concrete" : null; // parapet
    } else if (bnd) {
      const pier = isPier(x, z, f);
      if (rel === 1) id = "stone_bricks";              // base course
      else if (rel === 4) id = "light_gray_concrete";  // shopfront lintel
      else if (rel === 6 || rel === 9) id = pier ? "light_gray_concrete" : "white_concrete"; // spandrels
      else if (pier) id = "light_gray_concrete";
      else id = "glass";                               // window glass (rel 2,3,7,8)
    }

    // Entrance door and transom
    if (door && x === door.x && z === door.z && bnd) {
      if (rel === 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (rel === 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (rel === 3) id = "white_concrete";
    }

    // Warm lights behind the glass (interior row z = minZ + 1)
    if (!bnd && z === minZ + 1 && (x - minX) % 3 === 2) {
      if (rel === 2) id = "glowstone";
      if (rel === 7) id = "shroomlight";
    }

    // Roof plant box on the interior of the roof
    if (!bnd && rel === 11 && x >= 6 && x <= 7 && z >= 2 && z <= 3) {
      id = "smooth_stone";
    }

    if (id) put(x, y, z, id);
  }
}

g.save(OUT);
