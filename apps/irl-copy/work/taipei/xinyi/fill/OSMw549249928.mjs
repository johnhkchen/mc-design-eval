import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 24 x 19 footprint, roof ~31 blocks above lowest ground, 1990s-2000s Xinyi
// commercial mid-rise: six storeys of 5 blocks, white and quartz facade with
// light-blue glass curtain bays, polished granite base, a parapet cornice,
// a central core setback with a small upper tower and a lightning-rod mast.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549249928.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw549249928.nbt";

const W = 24, H = 43, D = 19;
const ROOF = 30;      // roof slab level (top of storey 6)
const PARAPET = 31;   // parapet course, roof surface about 31 blocks above lowest ground

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { n: "north", dx: 0, dz: -1, axis: "x" },
  { n: "south", dx: 0, dz: 1, axis: "x" },
  { n: "west",  dx: -1, dz: 0, axis: "z" },
  { n: "east",  dx: 1, dz: 0, axis: "z" },
];
const outFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const interiorAt = (x, z) => has(x, z) && outFaces(x, z).length === 0;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance face: the outward face shared by the most cells.
const count = {};
for (const [x, z] of cells) for (const d of outFaces(x, z)) count[d.n] = (count[d.n] ?? 0) + 1;
const ENT = Object.keys(count).sort((p, q) => count[q] - count[p])[0] ?? "south";
const ENT_DIR = DIRS.find((d) => d.n === ENT) ?? DIRS[1];
const entCells = cells
  .filter(([x, z]) => outFaces(x, z).some((d) => d.n === ENT))
  .map(([x, z, gr]) => ({ x, z, gr: Math.round(gr), a: ENT_DIR.axis === "x" ? x : z }))
  .sort((p, q) => p.a - q.a);
const doorCell = entCells[Math.floor(entCells.length / 2)];
const doorA = doorCell ? doorCell.a : -99;
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : "";

function patFace(x, z) {
  const fs = outFaces(x, z);
  if (!fs.length) return null;
  return fs.find((d) => d.n === ENT) ?? fs[0];
}

// Main shell: foundation, floors, storey bands, glazing, door, canopy, lights.
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = patFace(x, z);
  const perim = f !== null;
  const a = f ? (f.axis === "x" ? x : z) : 0;

  for (let y = gr; y <= ROOF; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;

    if (y === ROOF) {
      put(x, y, z, "light_gray_concrete");   // roof slab on every cell
      continue;
    }

    if (!perim) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gr || r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade.
    if (y === gr) {
      put(x, y, z, "polished_granite");       // base course
      continue;
    }
    if (r === 0) {
      put(x, y, z, "smooth_quartz");          // floor line / spandrel
      continue;
    }
    if (r === 4) {
      put(x, y, z, y === 29 ? "smooth_quartz" : "light_gray_concrete"); // head band, cornice at 29
      continue;
    }

    // Window band r = 1..3: piers every third bay, glass panes between.
    const isPier = a % 3 === 0;
    if (isPier) {
      put(x, y, z, "white_concrete");
    } else {
      const along = f.axis === "x"
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", { ...along, waterlogged: "false" });

      // Warm light in the room behind some glazed bays.
      if (r === 2 && ((x * 7 + z * 3 + k) % 4 === 0)) {
        const ix = x - f.dx, iz = z - f.dz;
        if (interiorAt(ix, iz) && gAt(ix, iz) <= y) put(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet course above the roof slab on the perimeter.
  if (perim) put(x, PARAPET, z, "smooth_quartz");
}

// Entrance: double doors on the middle bay of the entrance face, with a canopy above.
for (const c of entCells) {
  if (Math.abs(c.a - doorA) <= 1 && c.gr + 2 <= 4) {
    put(c.x, c.gr + 2, c.z, "light_gray_concrete");   // canopy / lintel
  }
}
if (doorCell && doorCell.gr <= 3) {
  const { x, z, gr } = doorCell;
  put(x, gr, z, "dark_oak_door", { facing: ENT, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing: ENT, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Central core setback on the roof, interior cells only.
const inCore = (x, z) => x >= 7 && x <= 16 && z >= 5 && z <= 13;
for (const [x, z] of cells) {
  if (!inCore(x, z) || !interiorAt(x, z)) continue;
  const edge = x === 7 || x === 16 || z === 5 || z === 13;
  put(x, 31, z, "smooth_stone");                 // core floor on the roof slab
  for (let y = 32; y <= 34; y++) {
    if (!edge) continue;
    if (y === 34 || (x + z) % 3 === 0) put(x, y, z, "white_concrete");
    else {
      const axisX = edge && (z === 5 || z === 13);
      put(x, y, z, "light_blue_stained_glass_pane", axisX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
  }
  put(x, 35, z, "light_gray_concrete");          // core roof
}

// Upper tower on the core.
const inTop = (x, z) => x >= 10 && x <= 13 && z >= 8 && z <= 11;
for (const [x, z] of cells) {
  if (!inTop(x, z) || !interiorAt(x, z)) continue;
  const edge = x === 10 || x === 13 || z === 8 || z === 11;
  put(x, 36, z, "smooth_stone");
  for (let y = 37; y <= 38; y++) {
    if (!edge) continue;
    if ((x + z + y) % 2 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane",
      z === 8 || z === 11
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
  put(x, 39, z, "light_gray_concrete");          // top roof
}

// Mast on the upper tower.
if (interiorAt(11, 9)) {
  for (let y = 40; y <= 42; y++) put(11, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Roof plant boxes on interior roof cells.
const plant = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!interiorAt(x, z)) continue;
    put(x, 31, z, "stone_bricks");
    put(x, 32, z, "stone_bricks");
  }
};
plant(2, 4, 2, 3);
plant(19, 21, 14, 15);

g.save(OUT);
