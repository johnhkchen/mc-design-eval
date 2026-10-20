import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s concrete commercial block: two storeys over a stone plinth,
// white-concrete frame with light-grey pilasters, shopfront glazing on the ground
// floor, punched glazing above, a quartz cornice and parapet, and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414163";
const W = 19, H = 23, D = 21;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) cells.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => cells.has(`${x},${z}`);
const groundOf = (x, z) => cells.get(`${x},${z}`);

// Outward directions in priority order: street-facing N/S first, then E/W.
const DIRS = [
  { n: "N", dx: 0, dz: -1, facing: "north", alongZ: true },
  { n: "S", dx: 0, dz: 1, facing: "south", alongZ: true },
  { n: "E", dx: 1, dz: 0, facing: "east", alongZ: false },
  { n: "W", dx: -1, dz: 0, facing: "west", alongZ: false },
];

// Faces an footprint cell exposes to the outside.
const exposedFaces = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
const isEdge = (x, z) => exposedFaces(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Base of the building: lowest ground under the footprint.
const base = Math.min(...[...cells.values()]);

// Door: median cell along the north (street) face.
const northCells = [...cells.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => exposedFaces(x, z).some((d) => d.n === "N"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorIdx = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

// Wall material for an edge cell at height y, given its primary face and along-face index.
function wallBlock(y, face, idx, isDoorCell) {
  const rel = y - base;
  if (rel === 0) return ["polished_andesite"];
  if (rel >= 1 && rel <= 3) {
    if (isDoorCell) {
      if (rel === 3) return ["glass"];
      return null; // door handled separately
    }
    return idx % 3 === 0 ? ["light_gray_concrete"] : ["glass"];
  }
  if (rel === 4) return ["white_concrete"];          // ground-floor fascia
  if (rel === 5) return ["smooth_quartz"];           // floor band
  if (rel >= 6 && rel <= 8) return idx % 3 === 0 ? ["light_gray_concrete"] : ["glass"];
  if (rel === 9) return ["white_concrete"];          // sill / spandrel
  if (rel === 10) return ["smooth_quartz"];          // cornice
  if (rel === 11) return ["white_concrete"];         // parapet
  return null;
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Body: walls on exposed cells, floor slabs on interior cells.
const floorLevels = new Set([base, base + 5, base + 10]);
const glowCells = [];

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const edge = faces.length > 0;
  const primary = faces[0];
  const idx = primary ? (primary.alongZ ? x : z) : 0;
  const isDoor = !!primary && primary.n === "N" && idx === doorIdx;

  for (let y = gr; y <= base + 11; y++) {
    if (edge) {
      // Use the primary face's pattern; the parapet and cornice ring every edge cell.
      const blk = wallBlock(y, primary, idx, isDoor);
      if (blk) put(x, y, z, blk[0]);
      if (isDoor && (y === base + 1 || y === base + 2)) {
        put(x, y, z, "oak_door", {
          facing: primary.facing,
          half: y === base + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      }
    } else if (floorLevels.has(y)) {
      put(x, y, z, y === base ? "smooth_stone" : "smooth_quartz");
    }
  }

  // Record window cells that can take a warm light just inside the glass.
  if (edge && primary) {
    const ix = x - primary.dx, iz = z - primary.dz;
    if (inFp(ix, iz) && !isEdge(ix, iz) && !isDoor) {
      if (idx % 6 === 2) glowCells.push([ix, base + 7, iz]);
      if (idx % 6 === 4) glowCells.push([ix, base + 2, iz]);
    }
  }
}

// 3. Warm light behind selected windows.
for (const [x, y, z] of glowCells) {
  if (groundOf(x, z) <= y) put(x, y, z, "glowstone");
}

// 4. Rooftop water tank: 3x3 interior block near the centre, two blocks high.
const keys = [...cells.keys()].map((k) => k.split(",").map(Number));
const cx = Math.round(keys.reduce((s, [x]) => s + x, 0) / keys.length);
const cz = Math.round(keys.reduce((s, [, z]) => s + z, 0) / keys.length);
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (inFp(x, z) && !isEdge(x, z)) {
      put(x, base + 11, z, "light_gray_concrete");
      put(x, base + 12, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
