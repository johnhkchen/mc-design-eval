import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const id = "NYC1001338";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 12, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// Materials: early-19th-century Federal/Georgian commercial brick block
const BRICK = "bricks";
const TRIM = "stone_bricks";
const BAND = "smooth_stone";
const FLOOR = "oak_planks";
const CAP = "stone";
const LIGHT = "glowstone";

const map = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  const gg = Math.max(0, Math.round(gr));
  map.set(`${x},${z}`, { gr: gg, rf: Math.round(rf) });
  roofs.push(Math.round(rf));
}

// One flat tier for the massing: median lidar roof, clamped to a sane storey count
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
for (const [k, c] of map) {
  c.rf = Math.min(H - 1, Math.max(c.gr + 6, medianRoof));
}

const has = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Foundation: solid from y 0 up to each cell's ground
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, TRIM);
}

const lights = [];

for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);
  const faceZ = !has(x, z - 1) || !has(x, z + 1);
  const faceX = !has(x - 1, z) || !has(x + 1, z);
  const corner = faceZ && faceX;
  const idx = faceZ ? x : z;
  const top = c.rf - 1;

  for (let y = c.gr; y < c.rf; y++) {
    const rel = y - c.gr;

    // Cornice: top course, with a brick course just under it
    if (y === top) {
      g.set(x, y, z, perim ? TRIM : CAP);
      continue;
    }
    if (perim && y === top - 1) {
      g.set(x, y, z, BAND);
      continue;
    }

    // Interior: floor slab per storey, air elsewhere
    if (!perim) {
      if (rel % 2 === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    // Quoins: alternating stone and brick blocks on the corner columns
    if (corner) {
      g.set(x, y, z, (rel % 4 < 2) ? TRIM : BRICK);
      continue;
    }

    if (rel === 0) {
      if (faceZ && z === 0 && x === 5) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, TRIM);
      }
      continue;
    }

    if (rel % 2 === 0) {
      g.set(x, y, z, BAND);
      continue;
    }

    // Entrance upper half
    if (faceZ && z === 0 && x === 5 && rel === 1) {
      g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    let isWindow = false;
    if (rel === 1) {
      // Shopfront glazing on the street front, brick pilasters beside the door
      isWindow = faceZ && z === 0 && idx >= 1 && idx <= 10 && idx !== 4 && idx !== 5 && idx !== 6;
    } else {
      isWindow = idx % 2 === 1;
    }

    if (isWindow) {
      const props = faceZ
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", props);
      if (rel >= 3 && idx % 4 === 1 && (rel % 4) === 3) lights.push([x, y, z, faceZ]);
    } else {
      g.set(x, y, z, BRICK);
    }
  }
}

// Warm light behind selected upper windows, in the interior cell beside the glass
for (const [x, y, z, faceZ] of lights) {
  let nx = x, nz = z;
  if (faceZ) nz = z === 0 ? 1 : z - 1;
  else nx = x === 0 ? 1 : x - 1;
  if (!has(nx, nz) || isPerim(nx, nz)) continue;
  const n = at(nx, nz);
  if (y >= n.gr && y < n.rf - 1) g.set(nx, y, nz, LIGHT);
}

g.save(`${dir}/${id}.nbt`);
