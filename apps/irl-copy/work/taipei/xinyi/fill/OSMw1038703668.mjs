import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703668";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

// Outward directions (north = -z)
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const faces = (x, z) =>
  Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
const isBoundary = (x, z) => faces(x, z).length > 0;

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Along-facade coordinate for a face
const along = (f, x, z) => (f === "north" || f === "south" ? x : z);

// Count exterior cells per face to find the street front
const faceCount = {};
for (const [x, z] of cells) {
  for (const f of faces(x, z)) faceCount[f] = (faceCount[f] || 0) + 1;
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Entrance: middle cell of the front face
const frontCells = cells
  .filter(([x, z]) => faces(x, z).includes(front))
  .sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const doorCell = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

const glassProps = f => {
  const ns = f === "north" || f === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
};

// Window vs pier: piers every third bay; front ground floor glazes all bays but piers
const isWindow = (f, x, z, floorLevel) => {
  const a = along(f, x, z);
  if (floorLevel === "ground" && f === front) return a % 3 !== 0 || a % 6 === 0;
  return a % 3 !== 0;
};

for (const [x, z, gc] of cells) {
  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const boundary = fs.length > 0;

  if (boundary) {
    const f0 = fs[0];
    const [dx, dz] = DIRS[f0];
    const inward = [x - dx, z - dz];
    const canGlow = has(inward[0], inward[1]) && !isBoundary(inward[0], inward[1]);
    const isDoor = `${x},${z}` === doorKey && f0 === front;

    // Base course and plinth
    put(x, gc, z, "polished_andesite");
    put(x, gc + 1, z, "stone_bricks");

    // Ground storey (shopfront), y gc+2..gc+4
    for (let k = 2; k <= 4; k++) {
      if (isDoor) {
        if (k === 2) {
          put(x, gc + 2, z, "oak_door", { facing: front, half: "lower", hinge: "left", open: "false", powered: "false" });
          put(x, gc + 3, z, "oak_door", { facing: front, half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        // k=4 handled below with lantern
        continue;
      }
      if (k === 4 && isDoor) continue;
      if (isWindow(f0, x, z, "ground")) {
        put(x, gc + k, z, "glass_pane", glassProps(f0));
      } else {
        put(x, gc + k, z, "white_concrete");
      }
    }
    if (isDoor) {
      put(x, gc + 3, z, "glass_pane", glassProps(f0));
      put(x, gc + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Fascia / storey line
    put(x, gc + 5, z, "light_gray_concrete");
    put(x, gc + 6, z, "light_gray_concrete");

    // Upper storey, y gc+7..gc+9
    for (let k = 7; k <= 9; k++) {
      if (isWindow(f0, x, z, "upper")) {
        put(x, gc + k, z, "glass_pane", glassProps(f0));
      } else {
        put(x, gc + k, z, "white_concrete");
      }
    }

    // Cornice and parapet
    put(x, gc + 10, z, "light_gray_concrete");
    put(x, gc + 11, z, "white_concrete");

    // Warm lights behind glass: inward cell in the air gap
    if (canGlow && isWindow(f0, x, z, "ground") && (x + z) % 4 === 0 && !isDoor) {
      put(inward[0], gc + 3, inward[1], "glowstone");
    }
    if (canGlow && isWindow(f0, x, z, "upper") && (x + z) % 2 === 0) {
      put(inward[0], gc + 8, inward[1], "shroomlight");
    }
  } else {
    // Interior: floor slabs and roof deck only (no interiors)
    put(x, gc, z, "smooth_stone");
    put(x, gc + 6, z, "smooth_stone");
    put(x, gc + 10, z, "gray_concrete");
  }
}

// Rooftop water tank: 3x3 of interior cells centred on the footprint
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
const tankCells = [];
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (has(x, z) && !isBoundary(x, z)) tankCells.push([x, z, ground(x, z)]);
  }
if (tankCells.length === 9) {
  for (const [x, z, gc] of tankCells) {
    put(x, gc + 11, z, "white_concrete");
    put(x, gc + 12, z, "white_concrete");
  }
  // Tank lid and a pair of AC units on the deck
  put(cx, ground(cx, cz) + 13, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z, gc] of cells) {
  if (!isBoundary(x, z) && (x + 2 * z) % 9 === 0 && !(x === cx && z === cz)) {
    put(x, gc + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
