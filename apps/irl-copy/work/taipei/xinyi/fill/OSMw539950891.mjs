import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950891";
const W = 23, H = 23, L = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, L]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

// Single shared datum: the highest ground under the footprint, so the roof stays level
// and downhill cells carry their extra storeys as solid podium.
const maxG = Math.max(...cells.map((c) => c[2]));
const D = Math.min(maxG, H - 13);

// Writes only inside the volume.
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= L) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Directions and the outward normal of each face.
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];

// Front (entrance) faces the minimum-z edge; door sits at the middle of that row.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells
  .filter(([x, z]) => z === minZ && !inside(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : cells[0][0];

// 1. Foundation, plinth and ground-floor slab under every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < D; y++) {
    put(x, y, z, y <= gr ? "stone_bricks" : "smooth_stone");
  }
  put(x, D, z, "smooth_stone"); // ground-floor slab / base course
}

// 2. Upper floor slab and roof slab across the whole footprint.
for (const [x, z] of cells) {
  put(x, D + 5, z, "light_gray_concrete");
  put(x, D + 10, z, "light_gray_concrete");
}

// 3. Walls, windows, piers, storey lines, door, canopy, interior light.
for (const [x, z] of cells) {
  const faces = DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
  if (faces.length === 0) continue;

  const corner = faces.length > 1;
  const f = faces[0];
  const alongX = f.dx === 0; // north/south face: wall runs along x
  const u = alongX ? x : z;
  const pier = corner || u % 3 === 0;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Inward neighbour for the window light (interior air cell behind the glass).
  const inX = x - f.dx;
  const inZ = z - f.dz;
  const inwardOpen = inside(inX, inZ) &&
    !DIRS.some((d) => !inside(inX + d.dx, inZ + d.dz));

  for (let s = 0; s < 2; s++) {
    const b = D + 5 * s;
    const isDoor = s === 0 && x === doorX && z === minZ && f.n === "north";

    // Rows b+1..b+4 form one storey: spandrels at top and bottom, glazing between.
    for (let r = 1; r <= 4; r++) {
      const y = b + r;
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (r === 1 || r === 4) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    }

    // Warm light in a few windows, placed in the air gap behind the glass.
    if (!pier && u % 6 === 1 && inwardOpen) {
      put(inX, b + 2, inZ, "glowstone");
      if (s === 0) put(inX, b + 3, inZ, "glowstone");
    }

    if (isDoor) {
      put(x, b + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }

  // Parapet on the roof edge.
  put(x, D + 11, z, corner ? "white_concrete" : "light_gray_concrete");
}

// 4. Entrance canopy over the door on the front row (ground storey, row b+3).
for (let x = doorX - 2; x <= doorX + 2; x++) {
  for (const z of [minZ, minZ + 1]) {
    if (inside(x, z)) put(x, D + 3, z, "smooth_stone");
  }
}

// 5. Roof equipment: two plant boxes on interior cells.
const plant = (x0, x1, z0, z1, h) => {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inside(x, z)) continue;
      const edge = DIRS.some((d) => !inside(x + d.dx, z + d.dz));
      if (edge) continue;
      put(x, D + 11, z, "light_gray_concrete");
      if (h > 1) put(x, D + 12, z, "smooth_stone");
    }
  }
};
plant(5, 6, 5, 6, 2);
plant(14, 15, 11, 12, 1);

g.save(`${DIR}/${ID}.nbt`);
