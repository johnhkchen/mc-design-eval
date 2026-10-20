import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109972";
const W = 23, H = 33, D = 53;
const ROOF = 21;          // roof deck sits at y 20, coping at y 21 (lidar: ~21 above lowest ground)
const BAY = 3;            // mullion every 3 cells along each facade

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  g.set(x, y, z, b);
};

// Wall detection: a footprint cell with any 4-neighbour outside the footprint.
const DIRS = [
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
];
const faceOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isWall = (x, z) => faceOf(x, z).length > 0;

// Entrance: on the street-side (max z) wall, the cell nearest the median x.
const maxZ = Math.max(...cells.map((c) => c[1]));
const southXs = cells.filter((c) => c[1] === maxZ).map((c) => c[0]).sort((a, b) => a - b);
const entranceX = southXs[Math.floor(southXs.length / 2)];
const entranceKey = `${entranceX},${maxZ}`;

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Body: walls, shopfronts, floor slabs, warm lights.
for (const [x, z, gr] of cells) {
  const faces = faceOf(x, z);
  const wall = faces.length > 0;
  const face = faces[0];
  const corner = faces.length > 1;
  const idx = face && (face.dx !== 0 ? z : x);
  const isEntrance = `${x},${z}` === entranceKey;

  for (let y = gr; y < ROOF; y++) {
    const rel = y - gr;

    if (!wall) {
      // Interior: air gap, floor slab per storey, roof deck at y 20 (set below).
      if (rel % 5 === 0 && y < ROOF - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    // Facade
    if (rel === 0) {
      put(x, y, z, "polished_andesite");                  // base course
    } else if (rel % 5 === 0) {
      put(x, y, z, "smooth_stone");                       // storey line
    } else if (rel % 5 === 4) {
      put(x, y, z, "white_concrete");                     // spandrel
    } else {
      // window zone (rel%5 in 1..3)
      const mullion = corner || idx % BAY === 0;
      if (isEntrance && face.name === "S" && (rel === 1 || rel === 2)) {
        put(x, y, z, "air");                              // entrance opening
      } else if (isEntrance && face.name === "S" && rel === 3) {
        put(x, y, z, "white_concrete");                   // entrance lintel
      } else if (mullion) {
        put(x, y, z, "light_gray_concrete");              // frame
      } else {
        put(x, y, z, "cyan_stained_glass");              // glazing
        // warm light just inside some panes
        if ((idx + y) % 9 === 0 && y < ROOF - 1) {
          const ix = x - face.dx, iz = z - face.dz;
          if (has(ix, iz) && !isWall(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Lantern marking the entrance under the lintel, inside the opening.
  if (isEntrance) {
    const ix = x - face.dx, iz = z - face.dz;
    if (has(ix, iz) && !isWall(ix, iz)) put(ix, gr + 1, iz, "lantern");
  }
}

// 3. Roof: coping on the parapet, deck on interior cells at y 20.
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  if (isWall(x, z)) {
    put(x, ROOF, z, "smooth_stone");                      // parapet coping
  } else {
    put(x, ROOF - 1, z, "light_gray_concrete");           // roof deck
  }
}

// 4. Rooftop plant room and mast, on footprint cells only.
const PX0 = 7, PX1 = 15, PZ0 = 20, PZ1 = 32;
const inPlant = (x, z) => x >= PX0 && x <= PX1 && z >= PZ0 && z <= PZ1 && has(x, z);
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!inPlant(x, z)) continue;
    const perim = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      if (perim) {
        // Louvred plant walls with a few warm openings.
        const warm = (x + z + y) % 5 === 0;
        put(x, y, z, warm ? "glowstone" : "light_gray_concrete");
      }
    }
    put(x, ROOF + 3, z, "smooth_stone");                  // plant room roof
  }
}
const mx = Math.round((PX0 + PX1) / 2), mz = Math.round((PZ0 + PZ1) / 2);
if (has(mx, mz)) {
  for (let y = ROOF + 4; y <= ROOF + 7; y++) put(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
