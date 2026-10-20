import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690420";
const W = 21, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

const base = Math.min(...cells.map(c => c[2]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const cx = minX + Math.floor((maxX - minX) / 2);
const cz = minZ + Math.floor((maxZ - minZ) / 2);

// Outward normals for each face
const NORM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DIRNAME = { N: "north", S: "south", W: "west", E: "east" };

const missingFaces = (x, z) =>
  Object.keys(NORM).filter(f => {
    const [dx, dz] = NORM[f];
    return !has(x + dx, z + dz);
  });
const isPerim = (x, z) => missingFaces(x, z).length > 0;

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Main entrance: prefer a single-face cell on the south (front) face nearest the middle
const doorCands = cells
  .filter(([x, z]) => {
    const m = missingFaces(x, z);
    return m.length === 1 && m[0] === "S";
  })
  .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
let door = null;
if (doorCands.length) {
  door = { x: doorCands[0][0], z: doorCands[0][1] };
} else {
  const any = cells
    .filter(([x, z]) => missingFaces(x, z).length === 1)
    .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  if (any.length) door = { x: any[0][0], z: any[0][1] };
}

// Warm light placed in the interior cell just behind a facade cell
function placeLight(x, z, f, y) {
  const [nx, nz] = NORM[f];
  const ix = x - nx, iz = z - nz;
  if (has(ix, iz) && !isPerim(ix, iz) && y >= groundAt(ix, iz)) {
    put(ix, y, iz, "glowstone");
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const miss = missingFaces(x, z);
  const roofY = Math.max(base + 10, gr);
  const topY = Math.max(base + 11, gr);

  if (miss.length === 0) {
    // Interior cell: no interior, just a storey floor and roof slab
    if (base + 5 >= gr && base + 5 < roofY) put(x, base + 5, z, "smooth_stone");
    put(x, roofY, z, "gray_concrete");
    if (roofY === base + 10) {
      if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
        put(x, roofY + 1, z, "light_gray_concrete");
        put(x, roofY + 2, z, "smooth_stone");
      }
      if (x === cx && z === cz) put(x, roofY + 3, z, "lightning_rod");
    }
    continue;
  }

  // Perimeter cell: facade
  const corner = miss.length >= 2;
  const f = miss[0];
  const t = (f === "N" || f === "S") ? x - minX : z - minZ;
  const isDoor = !!door && x === door.x && z === door.z && !corner;
  const pier = corner || t % 3 === 0;

  for (let y = gr; y <= topY; y++) {
    const yr = y - base;
    if (yr === 0) {
      put(x, y, z, "stone_bricks");
    } else if (yr >= 1 && yr <= 3) {
      if (isDoor) {
        if (yr === 1) put(x, y, z, "dark_oak_door", { facing: DIRNAME[f], half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (yr === 2) put(x, y, z, "dark_oak_door", { facing: DIRNAME[f], half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "light_gray_concrete");
      } else if (pier || yr === 3) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else if (yr === 4 || yr === 5) {
      put(x, y, z, "light_gray_concrete");
    } else if (yr >= 6 && yr <= 9) {
      if (pier) put(x, y, z, "white_concrete");
      else if (yr === 6 || yr === 9) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    } else if (yr === 10) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "gray_concrete"); // parapet cap
    }
  }

  // Lit rooms behind some windows
  if (!pier && !isDoor) {
    if (t % 3 === 2 && gr <= base + 2) placeLight(x, z, f, base + 2);
    if (t % 4 === 1) placeLight(x, z, f, base + 7);
  }
}

g.save(`${DIR}/${ID}.nbt`);
