import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Office block, c. 1990s-2000s Xinyi: six storeys on a granite and white-concrete
// frame, blue glass curtain-wall bays with concrete piers, a cornice and parapet,
// a central mechanical penthouse with a mast, and a dark-framed entrance on the south face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1148179694";
const W = 18, H = 43, D = 20;
const ROOF = 31;      // parapet top, about 31 blocks above lowest ground
const STOREY = 5;     // blocks per storey; slabs at y = 0, 5, 10, 15, 20, 25
const ROOF_DECK = 30; // roof slab / cornice row

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => groundOf.has(`${x},${z}`);
const gnd = (x, z) => Math.max(0, Math.min(groundOf.get(`${x},${z}`) ?? 0, ROOF - 1));

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward-facing sides of a footprint cell: [dx, dz, name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const outFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const PIER_UPPER = "white_concrete";
const PIER_BASE = "polished_granite";
const GLASS = "light_blue_stained_glass";
const SLAB = "light_gray_concrete";
const FOUNDATION = "stone_bricks";

// 1. Foundation, floors, facades, cornice and parapet
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gnd(x, z);
  const faces = outFaces(x, z);
  const isP = faces.length > 0;
  const corner = faces.length > 1;

  // pier decision for perimeter cells
  let pier = false;
  if (isP) {
    if (corner) pier = true;
    else {
      const [dx] = faces[0];
      const idx = dx !== 0 ? z : x;
      const len = dx !== 0 ? D : W;
      pier = idx % 3 === 0 || idx === len - 1;
    }
  }

  // foundation fill up to the cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, FOUNDATION);

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      if (isP) set(x, y, z, PIER_UPPER); // parapet
      continue;
    }
    if (y === ROOF_DECK) {
      set(x, y, z, SLAB); // cornice / roof deck
      continue;
    }
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;
    if (r === 0) {
      set(x, y, z, SLAB); // floor slab, solid across the footprint
      continue;
    }
    if (!isP) continue; // interior air gap
    if (r === 1) {
      set(x, y, z, SLAB); // sill / spandrel
      continue;
    }
    if (pier) set(x, y, z, k === 0 ? PIER_BASE : PIER_UPPER);
    else set(x, y, z, GLASS);
  }

  // warm lanterns in the air gap behind some windows (upper storeys, odd k)
  if (isP && !pier) {
    const [dx, dz] = faces[0];
    const idx = dx !== 0 ? z : x;
    if (idx % 3 === 1) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && outFaces(ix, iz).length === 0) {
        for (let k = 0; k < 6; k++) {
          if (k % 2 !== 1) continue;
          const y = k * STOREY + 1;
          if (y < gnd(ix, iz)) continue;
          set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }
}

// 2. Central mechanical penthouse on the roof deck, with louvred glass bands
for (let x = 5; x <= 12; x++) {
  for (let z = 5; z <= 14; z++) {
    if (!has(x, z)) continue;
    const ring = x === 5 || x === 12 || z === 5 || z === 14;
    for (let y = ROOF; y <= 34; y++) {
      if (ring) {
        if ((y === 32 || y === 33) && (x + z) % 3 !== 0) set(x, y, z, GLASS);
        else set(x, y, z, SLAB);
      }
    }
    set(x, 35, z, PIER_UPPER); // roof cap
  }
}

// 3. Rooftop mast on the penthouse centre
if (has(9, 10)) {
  for (let y = 36; y <= 39; y++) {
    set(9, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// 4. Entrance on the south face, near the centre
let entrance = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!outFaces(x, z).some(([dx, dz]) => dx === 0 && dz === 1)) continue;
  if (!entrance || Math.abs(x - 9) < Math.abs(entrance[0] - 9)) entrance = [x, z];
}
if (entrance) {
  const [ex, ez] = entrance;
  const base = Math.max(gnd(ex, ez), 1);
  set(ex, base, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(ex, base + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(ex, base + 2, ez, SLAB); // lintel over the door
}

g.save(`${DIR}/${ID}.nbt`);
