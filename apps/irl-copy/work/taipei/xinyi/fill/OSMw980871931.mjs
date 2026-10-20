import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block, c. 1975-1990: two storeys over a shopfront
// base, white tiled concrete walls, light-grey pilasters, tinted glass in aluminium
// frames, a stone parapet and a roof with stair housing and a water tank.
// Roof surface sits at y = 11 (top block layer y = 10).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871931";
const ROOF = 10;      // roof deck / parapet layer
const FLOOR1 = 5;     // floor slab between storeys
const CORNICE = 9;    // top of upper walls
const LINTEL = 4;     // top of ground storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([14, 23, 28]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => gmap.has(`${x},${z}`);
const xmin = Math.min(...cells.map((c) => c[0]));
const xmax = Math.max(...cells.map((c) => c[0]));
const zmin = Math.min(...cells.map((c) => c[1]));
const zmax = Math.max(...cells.map((c) => c[1]));
const doorX = xmin + Math.floor((xmax - xmin) / 2);

const put = (x, y, z, id, p) => {
  if (y < 0 || y > 22 || x < 0 || x > 13 || z < 0 || z > 27) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exposed = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};

const paneProps = (face) =>
  face === "n" || face === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const glass = (x, y, z, face, tint = false) =>
  put(x, y, z, tint ? "light_blue_stained_glass_pane" : "glass_pane", paneProps(face));

const pillar = (x, y, z) => put(x, y, z, "light_gray_concrete");

const innerCell = (x, z, face) => {
  if (face === "n") return [x, z + 1];
  if (face === "s") return [x, z - 1];
  if (face === "w") return [x + 1, z];
  return [x - 1, z];
};

// 1. Foundation, floor slabs, roof deck
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gy = gmap.get(`${x},${z}`);
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, FLOOR1, z, "smooth_stone");
  const perim = exposed(x, z).length > 0;
  put(x, ROOF, z, perim ? "stone_bricks" : "smooth_stone");
}

// 2. Perimeter walls, shopfront, windows, lights
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;
  const gy = gmap.get(`${x},${z}`);
  const corner = ex.length >= 2;
  const face = ex[0];
  const idx = face === "n" || face === "s" ? x - xmin : z - zmin;
  const lightCell = !corner && idx % 6 === 2;

  for (let y = gy; y <= CORNICE; y++) {
    if (y === FLOOR1) continue; // slab already placed
    if (corner) {
      pillar(x, y, z);
      continue;
    }
    if (y === gy) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (y === CORNICE) {
      put(x, y, z, "smooth_stone"); // cornice
      continue;
    }
    if (y === LINTEL) {
      const canopy = face === "n" && x >= doorX - 2 && x <= doorX + 3;
      if (canopy) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "white_concrete");
      continue;
    }
    if (y === 6) {
      put(x, y, z, "white_concrete"); // sill band
      continue;
    }
    const groundBand = y >= gy + 1 && y <= 3;
    const upperBand = y === 7 || y === 8;

    if (groundBand && face === "n") {
      const isDoor = x === doorX && y <= gy + 2 && gy + 2 <= 3;
      if (isDoor) {
        const half = y === gy + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (idx % 3 === 0) {
        pillar(x, y, z);
      } else {
        glass(x, y, z, face);
      }
      continue;
    }

    if (groundBand || upperBand) {
      if (idx % 3 === 0) {
        pillar(x, y, z);
      } else {
        glass(x, y, z, face, upperBand);
        if (upperBand && y === 7 && lightCell) {
          const [ix, iz] = innerCell(x, z, face);
          if (has(ix, iz) && exposed(ix, iz).length === 0) {
            put(ix, y, iz, "glowstone");
          }
        }
      }
      continue;
    }

    put(x, y, z, "white_concrete");
  }
}

// 3. Entrance door: upper half, hinge set above
// (door cells are placed above; nothing further required)

// 4. Roof equipment: stair housing and water tank
const housing = { x0: 2, x1: 4, z0: 21, z1: 23 };
for (let x = housing.x0; x <= housing.x1; x++) {
  for (let z = housing.z0; z <= housing.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === housing.x0 || x === housing.x1 || z === housing.z0 || z === housing.z1;
    if (edge) {
      for (let y = ROOF + 1; y <= ROOF + 3; y++) pillar(x, y, z);
    }
    put(x, ROOF + 4, z, "smooth_stone");
  }
}
if (has(3, housing.z0)) {
  put(3, ROOF + 1, housing.z0, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(3, ROOF + 2, housing.z0, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

const tank = { x0: 9, x1: 11, z0: 3, z1: 5 };
for (let x = tank.x0; x <= tank.x1; x++) {
  for (let z = tank.z0; z <= tank.z1; z++) {
    if (!has(x, z)) continue;
    const corner = (x === tank.x0 || x === tank.x1) && (z === tank.z0 || z === tank.z1);
    if (corner) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "white_concrete");
    put(x, ROOF + 4, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
