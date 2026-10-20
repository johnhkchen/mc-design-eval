import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-district commercial block, c. 1990s: granite-trimmed white concrete,
// glazed shopfront at street level, two office storeys above, parapet roof with plant.
const W = 19, H = 23, D = 14;
const ROOF = 11;          // roof deck, from lidar (about 11 blocks above lowest ground)
const STRING = 5;         // storey line between ground storey and second storey
const BASE_GROUND = 0;

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${SRC}/OSMw540888797.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.max(BASE_GROUND, Math.round(gy)));

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FACES = [
  { dx: 0, dz: -1, n: "N" },
  { dx: 0, dz: 1, n: "S" },
  { dx: -1, dz: 0, n: "W" },
  { dx: 1, dz: 0, n: "E" },
];
const exteriorFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = north side (min z) if it has exterior cells, else south.
const northCells = cells.filter(([x, z]) => exteriorFaces(x, z).some((f) => f.dz === -1));
const frontDz = northCells.length ? -1 : 1;
const frontXs = cells
  .filter(([x, z]) => exteriorFaces(x, z).some((f) => f.dz === frontDz))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const frontCentre = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);

// Pass 1: foundations, floors, roof decks, interior air behind the facade.
for (const [x, z] of cells) {
  const gy = gnd(x, z);
  const ex = exteriorFaces(x, z);
  const perimeter = ex.length > 0;

  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    put(x, gy, z, "smooth_stone");          // ground-floor slab
    if (gy < STRING) put(x, STRING, z, "smooth_stone"); // upper floor slab
    put(x, ROOF, z, "smooth_stone");        // roof deck
  }
}

// Pass 2: facade on perimeter cells.
for (const [x, z] of cells) {
  const gy = gnd(x, z);
  const ex = exteriorFaces(x, z);
  if (!ex.length) continue;

  const face = ex.find((f) => f.dz !== 0) ?? ex[0];
  const t = face.dz !== 0 ? x : z;
  const corner = ex.length > 1;
  const pier = corner || t % 3 === 0;
  const inX = x - face.dx, inZ = z - face.dz; // inward neighbour
  const interiorBehind = has(inX, inZ) && exteriorFaces(inX, inZ).length === 0;
  const isEntrance = face.dz === frontDz && face.dx === 0 && Math.abs(x - frontCentre) <= 1;

  for (let yy = gy; yy < ROOF; yy++) {
    if (yy < STRING) {
      // Ground storey: shopfront glazing, stone piers, entrance opening.
      if (yy <= gy + 2) {
        if (isEntrance && yy <= gy + 1) {
          put(x, yy, z, "air");
        } else if (pier) {
          put(x, yy, z, "stone_bricks");
        } else {
          put(x, yy, z, "glass_pane");
        }
      } else {
        put(x, yy, z, "white_concrete");
      }
      // Warm interior lamp behind some shopfront panes.
      if (!pier && !isEntrance && yy === gy && interiorBehind && t % 3 === 1) {
        put(inX, gy + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
      }
    } else if (yy === STRING) {
      put(x, yy, z, "smooth_stone"); // string course
    } else if (yy <= ROOF - 2) {
      // Office storey: window grid with sills and heads.
      if (yy === 6 || yy === 9) {
        put(x, yy, z, "light_gray_concrete");
      } else if (pier) {
        put(x, yy, z, "white_concrete");
      } else {
        put(x, yy, z, "glass_pane");
        // Some windows lit from a glowstone just inside.
        if (interiorBehind && yy === 7 && (t + ROOF) % 4 === 1) {
          put(inX, yy, inZ, "glowstone");
        } else if (interiorBehind && yy === 8 && (t + ROOF) % 4 === 3) {
          put(inX, yy, inZ, "shroomlight");
        }
      }
    } else {
      put(x, yy, z, "white_concrete"); // spandrel band below cornice
    }
  }

  // Cornice at roof level, then parapet and stone cap.
  put(x, ROOF, z, "smooth_stone");
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: roof plant and a short mast on interior roof cells.
const interiorRoof = cells.filter(([x, z]) => exteriorFaces(x, z).length === 0);
for (const [x, z] of interiorRoof) {
  if (x % 5 === 2 && z % 4 === 1) put(x, ROOF + 1, z, "iron_block");
}
const mastCell = interiorRoof.find(([x, z]) => x === frontCentre) ?? interiorRoof[0];
if (mastCell) {
  const [mx, mz] = mastCell;
  put(mx, ROOF + 1, mz, "lightning_rod");
  put(mx, ROOF + 2, mz, "lightning_rod");
}

g.save(`${SRC}/OSMw540888797.nbt`);
