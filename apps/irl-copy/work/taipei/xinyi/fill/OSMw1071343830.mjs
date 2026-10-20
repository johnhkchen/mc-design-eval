import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343830";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

const W = 15, H = 23, D = 28;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...G.values());

// Two storeys of ~5 blocks, cornice and parapet above
const L1 = minG + 5;        // first floor slab / belt course
const L2 = minG + 10;       // second belt course
const roofY = minG + 11;    // roof deck level

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior faces of a cell (sides with no footprint neighbour)
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
}

const inward = (f) => ({
  dx: f === "W" ? 1 : f === "E" ? -1 : 0,
  dz: f === "N" ? 1 : f === "S" ? -1 : 0,
});

// Pick the entrance: the face with the most exposed single-face cells, middle of that run
const faceCount = { W: [], E: [], N: [], S: [] };
for (const [x, z] of cells) {
  const fc = faces(x, z);
  if (fc.length === 1) faceCount[fc[0]].push([x, z]);
}
let entryFace = "S";
for (const f of ["S", "N", "E", "W"]) {
  if (faceCount[f].length > faceCount[entryFace].length) entryFace = f;
}
const entryList = faceCount[entryFace].sort((a, b) => {
  const ua = entryFace === "W" || entryFace === "E" ? a[1] : a[0];
  const ub = entryFace === "W" || entryFace === "E" ? b[1] : b[0];
  return ua - ub;
});
const entry = entryList.length
  ? { x: entryList[Math.floor(entryList.length / 2)][0], z: entryList[Math.floor(entryList.length / 2)][1], f: entryFace }
  : null;

// Pass 1: foundation, floors, walls, windows
for (const [x, z, gr] of cells) {
  // Solid foundation under the cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fc = faces(x, z);
  const edge = fc.length > 0;

  // Ground floor slab
  put(x, gr, z, edge ? "light_gray_concrete" : "smooth_stone");

  if (!edge) {
    // Interior: floor slabs only, air between
    if (L1 > gr) put(x, L1, z, "smooth_stone");
    put(x, roofY, z, "smooth_stone");
    continue;
  }

  // Exterior shell: cream tiled walls from above the base course to below the cornice
  for (let y = gr + 1; y <= roofY - 1; y++) put(x, y, z, "smooth_quartz");

  // Belt courses at storey lines
  if (L1 > gr && L1 < roofY) put(x, L1, z, "light_gray_concrete");
  if (L2 > gr && L2 < roofY) put(x, L2, z, "light_gray_concrete");

  // Cornice, parapet, coping
  put(x, roofY, z, "light_gray_concrete");
  put(x, roofY + 1, z, "smooth_quartz");
  put(x, roofY + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Windows on single-face cells, bays of 2 glass with 2 piers
  if (fc.length === 1) {
    const f = fc[0];
    const u = f === "W" || f === "E" ? z : x;
    const isEntryCell = entry && entry.x === x && entry.z === z;
    const { dx, dz } = inward(f);
    const ix = x + dx, iz = z + dz;
    const panes = f === "W" || f === "E"
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    if (u % 4 === 1 || u % 4 === 2) {
      const ranges = [
        [gr + 1, L1 - 1, gr + 1],   // ground floor shopfront
        [L1 + 1, L2 - 1, L1 + 1],   // upper storey
      ];
      for (const [y0, y1, floorY] of ranges) {
        for (let y = y0; y <= y1; y++) {
          if (y <= gr || y >= roofY) continue;
          if (isEntryCell && y <= gr + 2) continue;
          put(x, y, z, "glass_pane", panes);
          // Warm light just inside some windows, standing on the floor
          if (y === floorY && (u + y) % 3 === 0 && has(ix, iz)) {
            if (floorY === gr + 1) put(ix, floorY, iz, "lantern", { hanging: "false", waterlogged: "false" });
            else put(ix, floorY, iz, "glowstone");
          }
        }
      }
    }
  }
}

// Pass 2: entrance door and lantern beside it (overrides the shopfront)
if (entry) {
  const facing = entry.f === "S" ? "south" : entry.f === "N" ? "north" : entry.f === "E" ? "east" : "west";
  put(entry.x, minG > -1 ? entry.ground ?? G.get(`${entry.x},${entry.z}`) + 1 : 1, entry.z, "oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  const gy = G.get(`${entry.x},${entry.z}`);
  put(entry.x, gy + 1, entry.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(entry.x, gy + 2, entry.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const { dx, dz } = inward(entry.f);
  const ix = entry.x + dx, iz = entry.z + dz;
  if (has(ix, iz)) put(ix, gy + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: roof equipment on the interior deck (a plant room block and a small unit)
for (const [x, z] of cells) {
  const fc = faces(x, z);
  if (fc.length > 0) continue;
  if (x >= 4 && x <= 6 && z >= 9 && z <= 11) put(x, roofY + 1, z, "iron_block");
  if (x === 10 && z === 5) put(x, roofY + 1, z, "light_gray_concrete");
}

g.save(`${BASE}.nbt`);
