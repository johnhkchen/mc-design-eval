import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0236-18F-5: 2003 mid-rise office/residential tower, Xinyi district.
// 20 x 24 footprint, roof about 88 blocks above lowest ground, 17 storeys of
// 5 blocks plus a roof deck, a solid penthouse massing and a parapet.
// Materials: white spandrels and mullions, blue-green glass curtain wall,
// grey roof deck, warm glowstone behind selected windows and in the lobby.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0236-18F-5.cells.json", "utf8"));

const W = 20, H = 100, D = 24;
const TOP = 88;          // top of parapet cap (roof about 88 above lowest ground)
const ROOF = 85;         // roof deck course
const MAX_GROUND = 84;   // keep ground below the first storey band of the roof

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);

const has = (x, z) => gmap.has(key(x, z));
const groundOf = (x, z) => {
  const gr = gmap.get(key(x, z));
  return Math.max(0, Math.min(MAX_GROUND, Math.round(gr)));
};

// Outward directions for edge cells
const DIRS = [
  { dx: 1, dz: 0, name: "x" },
  { dx: -1, dz: 0, name: "x" },
  { dx: 0, dz: 1, name: "z" },
  { dx: 0, dz: -1, name: "z" },
];

const outwardOf = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => outwardOf(x, z).length > 0;

const isCorner = (x, z) => {
  const out = outwardOf(x, z);
  return out.some(d => d.name === "x") && out.some(d => d.name === "z");
};

// Mullion positions every 4 blocks along each face, plus corners
const isMullion = (x, z) => {
  if (isCorner(x, z)) return true;
  const out = outwardOf(x, z);
  if (out.length === 0) return false;
  const d = out[0];
  return d.name === "z" ? (x % 4 === 0) : (z % 4 === 0);
};

// Core penthouse footprint (interior cells only)
const isCore = (x, z) => !isEdge(x, z) && x >= 5 && x <= 14 && z >= 7 && z <= 16;

// Entrance on the z = 0 face (x 9 and 10)
const isEntranceCell = (x, z) => z === 0 && (x === 9 || x === 10);

// Foundations and body of each footprint cell
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = groundOf(x, z);
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys: floor slabs at every 5th block, glass between, spandrel lines on the facade
  for (let y = gr; y <= TOP; y++) {
    // Roof deck and penthouse
    if (y >= ROOF) {
      if (y === ROOF) {
        put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
        continue;
      }
      if (edge) {
        // Parapet with a cap course
        put(x, y, z, y === TOP ? "smooth_quartz" : "white_concrete");
      } else if (isCore(x, z)) {
        // Penthouse massing
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // Floor slab (interior) at storey lines
    if (y % 5 === 0) {
      if (edge) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Storey band between slabs: glass curtain wall with mullions
    if (edge) {
      if (y === gr && y < 5 && !isEntranceCell(x, z)) {
        // Granite base course at the lowest storey on the facade
        put(x, y, z, "granite");
        continue;
      }
      if (isEntranceCell(x, z) && (y === 1 || y === 2)) {
        // Door cells are written after the loop
        continue;
      }
      if (isMullion(x, z)) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
    // Interior cells above the slab stay air (no interiors)
  }

  // Roof-level corner lanterns on top of the parapet
  if (edge && isCorner(x, z)) {
    put(x, TOP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Entrance: flanking quartz pillars, double doors, transom, warm lobby light
for (const x of [8, 11]) {
  if (!has(x, 0)) continue;
  const gr = groundOf(x, 0);
  for (let y = Math.max(gr, 1); y <= 3; y++) put(x, y, 0, "smooth_quartz");
}
for (const x of [9, 10]) {
  if (!has(x, 0)) continue;
  const gr = groundOf(x, 0);
  // ensure ground floor is clear at the entrance
  const hinge = x === 9 ? "left" : "right";
  put(x, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  // Glass transom above the door
  put(x, 3, 0, "light_blue_stained_glass");
  put(x, 4, 0, "white_concrete");
  // the cell itself must stand on its foundation
  for (let y = gr; y < 1; y++) put(x, y, 0, "stone_bricks");
  // Lobby light just inside the doors
  if (has(x, 1) && !isEdge(x, 1) && groundOf(x, 1) <= 2) {
    put(x, 2, 1, "glowstone");
  }
}

// Warm lights behind glass: glowstone in the air gap just inside selected windows
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!isEdge(x, z) || isCorner(x, z) || isMullion(x, z)) continue;
  const out = outwardOf(x, z);
  if (out.length === 0) continue;
  const d = out[0];
  const ix = x - d.dx, iz = z - d.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const innerGround = groundOf(ix, iz);
  for (let k = 0; k <= 16; k++) {
    const y = 5 * k + 2;
    if (y < innerGround || y >= ROOF) continue;
    if (isEntranceCell(x, z)) continue;
    if ((x + z + k) % 3 === 0) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Penthouse lightning rod on the roof centre
put(9, TOP + 1, 11, "lightning_rod", { facing: "up" });
put(9, TOP + 2, 11, "lightning_rod", { facing: "up" });
put(9, TOP + 3, 11, "lightning_rod", { facing: "up" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0236-18F-5.nbt");
